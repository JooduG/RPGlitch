<script>
  /**
   * @file src/ui/message/Attachments.svelte
   * 🖼️ MESSAGE ATTACHMENTS GALLERY
   * Renders the attachment strip with the four regenerate-flow states:
   * error / candidates-ready ("Click to select") / regenerating / preview.
   */
  import { Button } from "@primitives";
  import { image_picker, open_picker } from "@image";
  import { get_resolution } from "@media";
  import { app } from "@state";

  let {
    /** @type {any[]} */
    attachments = [],
    id = "",
    signature_color = "",
    is_fractal = false,
    has_display_text = false,
    busy = false,
    should_use_typewriter = false,
  } = $props();

  /**
   * Resolves exact aspect ratio and dimensions for an attachment or loading placeholder.
   * @param {any} attachment
   * @param {string} regenerate_key
   * @returns {{ width: number, height: number }}
   */
  function get_attachment_resolution(attachment, regenerate_key) {
    const meta_res = typeof attachment === "object" && attachment?.metadata?.resolution;
    if (meta_res && typeof meta_res === "string" && meta_res.includes("x")) {
      const [w, h] = meta_res.split("x").map(Number);
      if (w && h) return { width: w, height: h };
    }
    let mode = typeof attachment === "object" && (attachment?.metadata?.mode || attachment?.mode);
    if (!mode && image_picker.regenerating_key === regenerate_key && image_picker.last_mode) {
      mode = image_picker.last_mode;
    }
    if (!mode) {
      mode = is_fractal ? "landscape" : "character";
    }
    return get_resolution(mode);
  }
</script>

{#if attachments.length > 0}
  <div class="flex justify-center {has_display_text || (should_use_typewriter && (has_display_text || busy)) ? 'mt-4' : ''}">
    {#each attachments as attachment, attach_idx (typeof attachment === "string" ? attachment : attachment.src || attachment.imageUrl || attachment.url)}
      {@const src = typeof attachment === "string" ? attachment : attachment.src || attachment.imageUrl || attachment.url}
      {@const regenerate_key = `${id}:${attach_idx}`}
      {@const res = get_attachment_resolution(attachment, regenerate_key)}
      {@const box_h = 480}
      {@const box_w = Math.round((box_h * res.width) / res.height)}
      {@const container_style = `height: ${box_h}px; width: ${box_w}px; max-width: 100%; max-height: 60vh; aspect-ratio: ${res.width} / ${res.height};`}
      {#if image_picker.hasError(regenerate_key)}
        <div class="flex flex-col items-center justify-center gap-2 rounded-lg bg-red-900/20 p-4" style={container_style}>
          <p class="text-center text-sm text-red-400">{image_picker.error}</p>
        </div>
      {:else if image_picker.isReady(regenerate_key)}
        <Button
          variant="bare"
          class="group relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border border-(--signature-color,slate-600)/30 bg-neutral-900/50 shadow-md transition-all duration-300 hover:border-(--signature-color,slate-300)/80 hover:bg-neutral-800/80 hover:shadow-[0_0_24px_color-mix(in_srgb,var(--signature-color,white)_25%,transparent)]"
          style={container_style}
          onclick={() => open_picker()}
          aria-label="Select image from candidates"
        >
          <!-- Mini 3-card spread with dynamic mouseover animation -->
          <div class="relative h-16 w-24 transition-transform duration-300 group-hover:scale-110">
            <div
              class="absolute bottom-0 left-1/2 h-12 w-8 rounded-sm border-2 border-(--signature-color,slate-400)/35 bg-(--signature-color,slate-600)/10 shadow-sm transition-all duration-300 group-hover:-translate-x-7 group-hover:rotate-[-25deg] group-hover:border-(--signature-color,slate-300)/60 group-hover:bg-(--signature-color,slate-400)/25"
              style="transform: translateX(-50%) rotate(-18deg); transform-origin: bottom center;"
            ></div>
            <div
              class="absolute bottom-0 left-1/2 h-12 w-8 rounded-sm border-2 border-(--signature-color,slate-400)/60 bg-(--signature-color,slate-600)/20 shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-(--signature-color,slate-200)/80 group-hover:bg-(--signature-color,slate-400)/35"
              style="transform: translateX(-50%) rotate(0deg); transform-origin: bottom center; z-index: 1;"
            ></div>
            <div
              class="absolute bottom-0 left-1/2 h-12 w-8 rounded-sm border-2 border-(--signature-color,slate-400)/35 bg-(--signature-color,slate-600)/10 shadow-sm transition-all duration-300 group-hover:translate-x-3 group-hover:rotate-25 group-hover:border-(--signature-color,slate-300)/60 group-hover:bg-(--signature-color,slate-400)/25"
              style="transform: translateX(-50%) rotate(18deg); transform-origin: bottom center;"
            ></div>
          </div>
          <div class="flex items-center gap-2 transition-transform duration-200 group-hover:scale-105">
            <span
              class="font-mono text-xs font-bold tracking-widest text-(--signature-color,slate-300) uppercase transition-colors duration-200 group-hover:text-white"
            >
              Click to select
            </span>
            <svg
              viewBox="0 0 24 24"
              class="h-3.5 w-3.5 fill-none stroke-current stroke-2 text-(--signature-color,slate-300) transition-all duration-200 [stroke-linecap:round] [stroke-linejoin:round] group-hover:translate-x-0.5 group-hover:text-white"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Button>
      {:else if image_picker.isRegenerating(regenerate_key)}
        <div
          class="relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-lg border border-(--signature-color,slate-600)/30 bg-neutral-900/50"
          style={container_style}
        >
          <div class="flex gap-1.5">
            <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 0ms"></div>
            <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 150ms"></div>
            <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 300ms"></div>
          </div>
        </div>
      {:else if src}
        <Button
          variant="bare"
          class="
            mx-auto
            block
            w-fit
            overflow-hidden
            rounded-lg
            border
            border-(--signature-color,slate-600)/30
            bg-neutral-900/50
            transition-[filter]
            duration-200
            hover:brightness-110
          "
          onclick={() => {
            const preview_options = typeof attachment === "string" ? { src: attachment, metadata: {} } : { ...attachment };
            if (!preview_options.metadata) preview_options.metadata = {};
            preview_options.signature_color = signature_color;
            if (preview_options.metadata?.prompt && id && app.regenerate_image_handler) {
              preview_options.on_regenerate = () => {
                app.regenerate_image_handler({
                  prompt: preview_options.metadata.prompt,
                  negative_prompt: preview_options.metadata.negative_prompt,
                  mode: preview_options.metadata.mode || "character",
                  log_id: id,
                  attach_idx,
                  signature_color,
                  regenerate_count: preview_options.metadata.regenerate_count || 0,
                });
              };
            }
            app.open_image_preview(preview_options);
          }}
          aria-label="View Attachment"
        >
          <img
            {src}
            alt="Attachment {attach_idx + 1}"
            class="
              mx-auto
              max-h-120
              w-auto
              max-w-full
              cursor-zoom-in
              rounded-lg
              object-contain
            "
          />
        </Button>
      {:else}
        <div
          class="relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-lg border border-(--signature-color,slate-600)/30 bg-neutral-900/50"
          style={container_style}
        >
          <div class="flex gap-1.5">
            <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 0ms"></div>
            <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 150ms"></div>
            <div class="h-2 w-2 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 300ms"></div>
          </div>
        </div>
      {/if}
    {/each}
  </div>
{/if}
