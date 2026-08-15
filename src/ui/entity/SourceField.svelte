<script>
  /**
   * @file SourceField.svelte
   * ⬇️ UNIFIED INGESTION SURFACE
   * One field that accepts every entity source: dropped files (.json / .png cards,
   * images), pasted URLs, and raw prose — no tabs, no modes. Auto-detection decides
   * the path; everything funnels into `value` (the text) + `image_data` (the avatar).
   */
  import { Button, TextField } from "@primitives";
  import { fetch_web, validate_image } from "@platform";

  let {
    value = $bindable(""),
    image_data = $bindable(null),
    type = "character",
    disabled = false,
    placeholder = "Paste a URL, drop a .json / .png card or image, or type source text...",
    on_source = () => {},
  } = $props();

  let is_fetching = $state(false);
  let is_dragging = $state(false);
  let fetched_from = $state("");
  let fetched_text = $state("");

  const is_url = $derived(/^https?:\/\//i.test(value.trim()));
  const is_image_url = $derived(/\.(png|jpe?g|webp|gif|avif|svg)([?#].*)?$/i.test(value.trim()));

  $effect(() => {
    if (value !== fetched_text) fetched_from = "";
  });

  /**
   * Fetches the URL currently in the field. Image URLs become the avatar (data
   * URL); everything else is replaced with clean readable text for the sorter.
   */
  async function fetch_url() {
    const url = value.trim();
    if (!url || is_fetching) return;
    is_fetching = true;
    try {
      if (is_image_url) {
        const { data_url } = await fetch_web(url, { as_image: true });
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
   * Routes a dropped/selected file: .json cards load as text, .png chara cards extract
   * their embedded prompt AND their image, plain images attach as the avatar.
   * @param {File} file
   */
  async function process_file(file) {
    if (!file) return;
    try {
      if (file.name.toLowerCase().endsWith(".json")) {
        value = await file.text();
        fetched_text = value;
        on_source({ kind: "file", name: file.name, chars: value.length });
        return;
      }

      await validate_image(file);

      const data_url = await new Promise((resolve, reject) => {
        const reader = new globalThis.FileReader();
        reader.onload = (event) => resolve(event.target?.result || null);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
      image_data = data_url;

      if (file.name.toLowerCase().endsWith(".png")) {
        const array_buffer = await file.arrayBuffer();
        const buffer = new Uint8Array(array_buffer);
        let offset = 8;
        let found_text = false;
        while (offset < buffer.length) {
          const length = new DataView(buffer.buffer).getUint32(offset, false);
          const type_str = String.fromCharCode(...buffer.slice(offset + 4, offset + 8));

          if (type_str === "tEXt") {
            const chunk_data = buffer.slice(offset + 8, offset + 8 + length);
            const null_idx = chunk_data.indexOf(0);
            if (null_idx !== -1) {
              const keyword = String.fromCharCode(...chunk_data.slice(0, null_idx));
              if (keyword === "chara") {
                const base64_data = String.fromCharCode(...chunk_data.slice(null_idx + 1));
                const text = atob(base64_data);
                fetched_text = text;
                value = text;
                found_text = true;
                break;
              }
            }
          }
          offset += 12 + length;
        }
        if (!found_text) {
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
   * into an empty field fetches immediately (one paste = one import source).
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
    if (pasted && /^https?:\/\//i.test(pasted) && !value.trim()) {
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
    input.accept = ".json,.png,.jpg,.jpeg,.webp,.txt";
    input.onchange = (e) => {
      const file = /** @type {HTMLInputElement} */ (e.target).files?.[0];
      if (file) process_file(file);
      e.target.value = "";
    };
    input.click();
  }
</script>

<div
  role="group"
  aria-label="Import source area — drop a file here"
  class="
    flex
    flex-col
    gap-2
    rounded-xl
    border
    border-dashed
    border-white/20
    bg-white/5
    p-2.5
    transition-all
    duration-200
    {is_dragging
    ? 'scale-[1.01] border-(--signature-color)/70 bg-(--signature-color)/10'
    : 'hover:border-(--signature-color)/60 hover:bg-(--signature-color)/10'}
    {is_fetching || disabled ? 'pointer-events-none opacity-60' : ''}
  "
  ondragover={(e) => {
    e.preventDefault();
    is_dragging = true;
  }}
  ondragleave={() => (is_dragging = false)}
  ondrop={(e) => {
    e.preventDefault();
    is_dragging = false;
    handle_drop(e);
  }}
>
  <div class="flex items-center justify-between gap-2">
    <div class="flex min-w-0 items-center gap-1.5">
      <svg
        viewBox="0 0 24 24"
        class="size-3.5 shrink-0 fill-none stroke-current stroke-2 text-slate-400"
        style="stroke-linecap: round; stroke-linejoin: round;"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span class="truncate text-[10px] text-slate-400 italic">Drop a file anywhere, paste a URL, or type source text</span>
    </div>
    <Button variant="secondary" size="small" onclick={trigger_browse} disabled={disabled || is_fetching}>Browse</Button>
  </div>

  <TextField
    is_edit={true}
    size="md"
    bind:value
    {placeholder}
    disabled={is_fetching || disabled}
    busy={is_fetching}
    class="min-h-52"
    onpaste={handle_paste}
  />

  <div class="flex items-center justify-between gap-2">
    <div class="flex min-w-0 items-center gap-2">
      {#if image_data}
        <img src={image_data} alt="Import Avatar" class="h-7 w-7 shrink-0 rounded-md border border-white/10 object-cover shadow-md" />
        <span class="shrink-0 text-[10px] font-bold tracking-widest text-slate-300 uppercase">Avatar</span>
      {/if}
      {#if fetched_from}
        <span class="truncate font-mono text-[10px] text-(--signature-color)">{fetched_from}</span>
      {/if}
      {#if value && value.trim()}
        <span class="shrink-0 font-mono text-[10px] text-slate-500">{value.length.toLocaleString()} chars</span>
      {/if}
    </div>

    {#if is_url}
      <Button variant="secondary" size="small" onclick={fetch_url} disabled={is_fetching || disabled}>
        {#if is_fetching}
          <span class="animate-pulse text-[11px] font-bold tracking-widest uppercase">Fetching...</span>
        {:else}
          <svg viewBox="0 0 24 24" class="size-3.5 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M2 12h8" />
            <path d="M18 4l4 4-4 4" />
            <path d="M22 8h-8" />
          </svg>
          <span class="text-[11px] font-bold tracking-widest uppercase">{is_image_url ? "Load Image" : "Fetch Page"}</span>
        {/if}
      </Button>
    {/if}
  </div>
</div>
