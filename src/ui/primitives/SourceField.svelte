<script>
  /**
   * @file SourceField.svelte
   * ⬇️ UNIFIED INGESTION FIELD
   * One field that accepts every entity source: dropped files (.json / .png cards,
   * images), pasted URLs, and raw prose — no tabs, no modes. Auto-detection decides
   * the path; everything funnels into `value` (the text) + `image_data` (the avatar).
   *
   * `mode="image"` narrows it to portraits: every source is treated as an image
   * (drop, paste, browse, URL fetch) and the result is reported via
   * `on_source({kind:"image", data_url})`.
   *
   * The heavy lifting is delegated: URLs go through @platform web-fetch, PNG
   * card decoding through @data/cards.js, file/image reading through the shared
   * @platform blob_to_data_url. This component only routes sources.
   */
  import { Button, TextField, tooltip } from "@primitives";
  import { blob_to_data_url, fetch_web, validate_image } from "@platform";
  import { extract_card_from_png } from "@data";

  let {
    value = $bindable(""),
    image_data = $bindable(null),
    type = "character",
    mode = "import", // "import" | "image"
    disabled = false,
    busy = false,
    is_edit = true,
    placeholder = "Paste a URL, drop a .json / .png card or image, or type source text...",
    size = "md",
    field_class = "min-h-52",
    signature_color = "#475569",
    header_actions = null,
    status = null,
    oninput = undefined,
    onfocus = undefined,
    on_source = () => {},
    ...rest
  } = $props();

  let is_fetching = $state(false);
  let fetched_from = $state("");
  let fetched_text = $state("");

  /** Drag-over highlight for the field's drop surface. */
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
   * Validates an image file and reads it into a data URL.
   * @param {File} file
   * @returns {Promise<string | null>}
   */
  async function image_file_to_data_url(file) {
    await validate_image(file);
    return blob_to_data_url(file);
  }

  /**
   * Fetches an image URL through fetch_web (superFetch-backed, CORS-free) as a data URL.
   * @param {string} url
   * @returns {Promise<string>}
   */
  async function image_url_to_data_url(url) {
    const { data_url } = await fetch_web(url, { as_image: true });
    return data_url;
  }

  /**
   * Fetches the URL currently in the field. In image mode every URL is a portrait
   * fetch; in import mode image URLs become the avatar and everything else is
   * replaced with clean readable text for the sorter.
   */
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

  /**
   * Routes a dropped/selected file. Image mode: any image becomes the portrait.
   * Import mode: .json cards load as text, .png chara cards extract their embedded
   * prompt AND their image, plain images attach as the avatar.
   * @param {File} file
   */
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

      if (file.name.toLowerCase().endsWith(".png")) {
        const text = extract_card_from_png(await file.arrayBuffer());
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

  /**
   * Intercepts pastes: clipboard files are routed to process_file, and a URL pasted
   * into an empty field fetches immediately (one paste = one import source). In
   * image mode any pasted URL fetches immediately.
   * @param {ClipboardEvent} e
   */
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
      const file = /** @type {HTMLInputElement} */ (e.target).files?.[0];
      if (file) process_file(file);
      e.target.value = "";
    };
    input.click();
  }
</script>

{#snippet merged_header_actions()}
  <div class="flex items-center gap-2">
    <Button
      variant="invisible"
      size="small"
      square
      aria-label={is_image_mode ? "Upload an image" : "Upload a file"}
      actions={[tooltip]}
      onclick={trigger_browse}
      disabled={dropzone_disabled}
    >
      <svg viewBox="0 0 24 24" class="size-icon-small" fill="none">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor"></path>
        <polyline points="17 8 12 3 7 8" stroke="currentColor"></polyline>
        <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor"></line>
      </svg>
    </Button>
    {#if header_actions}
      {@render header_actions()}
    {/if}
  </div>
{/snippet}

<div class="flex flex-col {has_footer ? 'gap-2' : ''}">
  <div
    role="group"
    aria-label={is_image_mode ? "Drop an image to set the portrait" : "Drop a file here"}
    class="
      rounded-xl
      transition-all
      duration-200
      {is_dragging ? 'ring-2 ring-(--signature-color)/70' : ''}
      {dropzone_disabled ? 'pointer-events-none opacity-60' : ''}
    "
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
    }}
  >
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
      {...rest}
    ></TextField>
  </div>

  {#if has_footer}
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        {#if image_data}
          <img
            src={image_data}
            alt={is_image_mode ? "Portrait" : "Import Avatar"}
            class="h-7 w-7 shrink-0 rounded-md border border-white/10 object-cover shadow-md"
          />
          <span class="shrink-0 text-[10px] font-bold tracking-widest text-slate-300 uppercase">
            {is_image_mode ? "Portrait" : "Avatar"}
          </span>
        {/if}
        {#if !is_image_mode && fetched_from}
          <span class="truncate font-mono text-[10px] text-(--signature-color)">{fetched_from}</span>
        {/if}
        {#if !is_image_mode && value && value.trim()}
          <span class="shrink-0 font-mono text-[10px] text-slate-500">{value.length.toLocaleString()} chars</span>
        {/if}
      </div>

      {#if is_url}
        <Button variant="secondary" size="small" onclick={fetch_url} disabled={dropzone_disabled}>
          {#if is_fetching}
            <span class="animate-pulse text-[11px] font-bold tracking-widest uppercase">Fetching...</span>
          {:else}
            <svg viewBox="0 0 24 24" class="size-3.5 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M2 12h8" />
              <path d="M18 4l4 4-4 4" />
              <path d="M22 8h-8" />
            </svg>
            <span class="text-[11px] font-bold tracking-widest uppercase">
              {is_image_mode || is_image_url ? "Load Image" : "Fetch Page"}
            </span>
          {/if}
        </Button>
      {/if}
    </div>
  {/if}
</div>
