<script>
  /**
   * @file src/ui/molecules/SourceField.svelte
   * Multi-source ingestion molecule accepting dropped files, pasted URLs, and raw prose.
   */
  import { Button, Icon, tooltip } from "@atoms";
  import TextField from "./TextField.svelte";
  import { blob_to_data_url, fetch_web, validate_image } from "@utils";

  let {
    value = $bindable(""),
    image_data = $bindable(null),
    type = "character",
    mode = "import",
    disabled = false,
    busy = false,
    is_edit = true,
    placeholder = "Paste a URL, drop a .json / .png card or image, or type source text...",
    size = "md",
    field_class = "min-h-52",
    signature_color = "#475569",
    header_actions = null,
    status = null,
    decode_png_card = null,
    oninput = undefined,
    onfocus = undefined,
    on_source = () => {},
    ...rest
  } = $props();

  let is_fetching = $state(false);
  let fetched_from = $state("");
  let fetched_text = $state("");
  let is_dragging = $state(false);

  const dropzone_disabled = $derived(is_fetching || disabled);
  const is_image_mode = $derived(mode === "image");
  const is_url = $derived(/^https?:\/\//i.test(value.trim()));
  const is_image_url = $derived(/\.(png|jpe?g|webp|gif|avif|svg)([?#].*)?$/i.test(value.trim()));
  const has_footer = $derived(
    is_edit && (Boolean(image_data) || (!is_image_mode && Boolean(fetched_from)) || (!is_image_mode && Boolean(value && value.trim())) || is_url),
  );

  $effect(() => {
    if (value !== fetched_text) fetched_from = "";
  });

  /**
   * @param {File} file
   * @returns {Promise<string | null>}
   */
  async function image_file_to_data_url(file) {
    await validate_image(file);
    return blob_to_data_url(file);
  }

  /**
   * @param {string} url
   * @returns {Promise<string>}
   */
  async function image_url_to_data_url(url) {
    const { data_url } = await fetch_web(url, { as_image: true });
    return data_url;
  }

  async function fetch_url() {
    const url = value.trim();
    if (!url || is_fetching) return;
    is_fetching = true;
    try {
      if (is_image_mode) {
        const data_url = await image_url_to_data_url(url);
        image_data = data_url;
        on_source({ kind: "image", data_url, url });
        return;
      }
      if (is_image_url) {
        const data_url = await image_url_to_data_url(url);
        image_data = data_url;
        fetched_from = url;
        fetched_text = "";
        value = "";
        on_source({ kind: "image", url, name: url.split("/").pop()?.split("?")[0] || url });
        return;
      }
      const { text } = await fetch_web(url, { type });
      fetched_text = text;
      value = text;
      fetched_from = url;
      on_source({ kind: "url", url, chars: text.length });
    } catch (err) {
      console.error(err);
      on_source({ kind: "error", message: err.message || "Failed to fetch the page." });
    } finally {
      is_fetching = false;
    }
  }

  /** @param {File} file */
  async function process_file(file) {
    if (!file) return;
    try {
      if (is_image_mode) {
        const data_url = await image_file_to_data_url(file);
        image_data = data_url;
        on_source({ kind: "image", data_url, name: file.name });
        return;
      }

      if (file.name.toLowerCase().endsWith(".json")) {
        value = await file.text();
        fetched_text = value;
        on_source({ kind: "file", name: file.name, chars: value.length });
        return;
      }

      const data_url = await image_file_to_data_url(file);
      image_data = data_url;

      if (file.name.toLowerCase().endsWith(".png") && decode_png_card) {
        const text = decode_png_card(await file.arrayBuffer());
        if (text) {
          fetched_text = text;
          value = text;
        } else {
          on_source({ kind: "error", message: "No character data found inside PNG. The image was loaded, but you must manually paste the prompt." });
        }
      }

      on_source({ kind: "file", name: file.name });
    } catch (err) {
      console.error(err);
      on_source({ kind: "error", message: err.message || "Failed to process file." });
    }
  }

  /** @param {ClipboardEvent} e */
  function handle_paste(e) {
    const file = e.clipboardData?.files?.[0];
    if (file) {
      e.preventDefault();
      process_file(file);
      return;
    }
    const pasted = e.clipboardData?.getData("text")?.trim() || "";
    if (pasted && /^https?:\/\//i.test(pasted) && (is_image_mode || !value.trim())) {
      e.preventDefault();
      value = pasted;
      fetch_url();
    }
  }

  /** @param {DragEvent} e */
  async function handle_drop(e) {
    const file = e.dataTransfer?.files?.[0];
    if (file) await process_file(file);
  }

  function trigger_browse() {
    if (disabled || is_fetching) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = is_image_mode ? "image/png,image/jpeg,image/webp,image/gif,image/avif" : ".json,.png,.jpg,.jpeg,.webp,.txt";
    input.onchange = (e) => {
      const target = /** @type {HTMLInputElement} */ (e.target);
      const file = target.files?.[0];
      if (file) process_file(file);
      target.value = "";
    };
    input.click();
  }
</script>

{#snippet merged_header_actions()}
  <div class="flex items-center gap-tight">
    <Button
      variant="invisible"
      size="small"
      square
      aria-label={is_image_mode ? "Upload an image" : "Upload a file"}
      actions={[tooltip]}
      onclick={trigger_browse}
      disabled={dropzone_disabled}>
      <Icon name="upload" class="size-icon-small" />
    </Button>
    {#if header_actions}
      {@render header_actions()}
    {/if}
  </div>
{/snippet}

<div class={["flex flex-col", has_footer && "gap-tight"]}>
  <div
    role="group"
    aria-label={is_image_mode ? "Drop an image to set the portrait" : "Drop a file here"}
    class={["rounded-xl transition duration-200", is_dragging && "ring-2 ring-(--signature-color)/70", dropzone_disabled && "pointer-events-none opacity-60"]}
    ondragover={(e) => {
      if (dropzone_disabled) return;
      e.preventDefault();
      is_dragging = true;
    }}
    ondragleave={() => (is_dragging = false)}
    ondrop={(e) => {
      if (dropzone_disabled) return;
      e.preventDefault();
      is_dragging = false;
      handle_drop(e);
    }}>
    <TextField
      {is_edit}
      {size}
      bind:value
      {placeholder}
      {signature_color}
      disabled={dropzone_disabled}
      busy={busy || is_fetching}
      class={field_class}
      {oninput}
      {onfocus}
      onpaste={handle_paste}
      {status}
      header_actions={merged_header_actions}
      {...rest}></TextField>
  </div>

  {#if has_footer}
    <div class="flex items-center justify-between gap-tight">
      <div class="flex min-w-0 items-center gap-tight">
        {#if image_data}
          <img
            src={image_data}
            alt={is_image_mode ? "Portrait" : "Import Avatar"}
            class="h-7 w-7 shrink-0 rounded-md border border-white/10 object-cover shadow-md" />
          <span class="shrink-0 type-uppercase-label text-slate-300">
            {is_image_mode ? "Portrait" : "Avatar"}
          </span>
        {/if}
        {#if !is_image_mode && fetched_from}
          <span class="truncate type-data text-(--signature-color)">{fetched_from}</span>
        {/if}
        {#if !is_image_mode && value && value.trim()}
          <span class="shrink-0 type-data text-slate-500">{value.length.toLocaleString()} chars</span>
        {/if}
      </div>

      {#if is_url}
        <Button variant="secondary" size="small" onclick={fetch_url} disabled={dropzone_disabled}>
          {#if is_fetching}
            <span class="animate-pulse type-uppercase-label">Fetching...</span>
          {:else}
            <Icon name="fetch_url" class="size-3.5" />
            <span class="type-uppercase-label">
              {is_image_mode || is_image_url ? "Load Image" : "Fetch Page"}
            </span>
          {/if}
        </Button>
      {/if}
    </div>
  {/if}
</div>
