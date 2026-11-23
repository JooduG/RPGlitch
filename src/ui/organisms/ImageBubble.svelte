<script>
  /**
   * @file src/ui/organisms/ImageBubble.svelte
   * Standalone feed image row rendering zoomable images, loading Shimmer,
   * failed Retry/Remove controls, and the mini 3-card candidate picker trigger.
   */
  import { Button, Icon, Shimmer } from "@atoms";
  import { resolve_image_resolution } from "@simulation";
  import { session } from "@state";
  import { get_signature_color } from "@utils";
  import { image_picker, open_image_preview, open_picker, regenerate_image } from "./ImagePreview.svelte.js";

  let { id = "", sender = "ai", character_name = "", attachments = [] } = $props();

  const is_fractal = $derived(sender === "fractal");

  const entity = $derived(session.resolve_feed_entity(sender, character_name));

  const signature_color = $derived(get_signature_color(entity, sender === "system" ? "var(--color-slate-600)" : "var(--color-slate-700)"));

  const get_src = (att) => (typeof att === "string" ? att : att?.src || att?.imageUrl || att?.url || "");

  function get_container_style(attachment, regenerate_key) {
    const fallback_mode = (image_picker.regenerating_key === regenerate_key && image_picker.last_mode) || (is_fractal ? "landscape" : "character");
    const { width, height } = resolve_image_resolution(attachment, fallback_mode);
    const box_h = 480;
    const box_w = Math.round((box_h * width) / height);
    return `height: ${box_h}px; width: ${box_w}px; max-width: 100%; max-height: 60dvh; aspect-ratio: ${width} / ${height};`;
  }

  function build_preview_options(attachment, attach_idx) {
    const opts = typeof attachment === "string" ? { src: attachment, metadata: {} } : { ...attachment, metadata: attachment.metadata || {} };
    opts.signature_color = signature_color;
    if (id) {
      opts.on_delete = () => session.delete_attachment(String(id), attach_idx);
      opts.on_regenerate = () =>
        regenerate_image({
          prompt: opts.metadata.prompt || "A cinematic scene portrait",
          negative_prompt: opts.metadata.negative_prompt,
          mode: opts.metadata.mode || (is_fractal ? "landscape" : "character"),
          log_id: id,
          attach_idx,
          signature_color,
          regenerate_count: opts.metadata.regenerate_count || 0,
        });
    }
    return opts;
  }
</script>

{#if attachments.length > 0}
  <div class="relative flex w-full justify-center p-standard" style:--signature-color={signature_color} data-testid="image-bubble">
    {#each attachments as attachment, attach_idx (get_src(attachment) || attach_idx)}
      {@const src = get_src(attachment)}
      {@const regenerate_key = `${id}:${attach_idx}`}
      {@const container_style = get_container_style(attachment, regenerate_key)}
      {@const preview_options = build_preview_options(attachment, attach_idx)}
      {@const is_failed = typeof attachment === "object" && Boolean(attachment?.metadata?.failed)}

      {#if image_picker.hasError(regenerate_key)}
        <div class="flex flex-col items-center justify-center gap-tight rounded-xl bg-red-900/20 p-standard" style={container_style}>
          <p class="text-center text-sm text-red-400">{image_picker.error}</p>
        </div>
      {:else if image_picker.isReady(regenerate_key)}
        <Button
          variant="bare"
          class="group relative flex cursor-pointer flex-col items-center justify-center gap-standard overflow-hidden rounded-xl border border-(--signature-color,slate-600)/30 bg-neutral-900/50 shadow-md transition-colors duration-standard hover:border-(--signature-color,slate-300)/80 hover:bg-neutral-800/80 hover:shadow-[0_0_24px_color-mix(in_srgb,var(--signature-color,white)_25%,transparent)]"
          style={container_style}
          onclick={() => open_picker()}
          aria-label="Select image from candidates">
          <div class="relative h-16 w-24 transition-transform duration-standard group-hover:scale-pulse">
            <div
              class="absolute bottom-0 left-1/2 h-12 w-8 origin-bottom -translate-x-1/2 -rotate-18 rounded-sm border-2 border-(--signature-color,slate-400)/35 bg-(--signature-color,slate-600)/10 shadow-sm transition duration-standard group-hover:-translate-x-7 group-hover:-rotate-25 group-hover:border-(--signature-color,slate-300)/60 group-hover:bg-(--signature-color,slate-400)/25">
            </div>
            <div
              class="absolute bottom-0 left-1/2 z-1 h-12 w-8 origin-bottom -translate-x-1/2 rotate-0 rounded-sm border-2 border-(--signature-color,slate-400)/60 bg-(--signature-color,slate-600)/20 shadow-md transition duration-standard group-hover:-translate-y-1 group-hover:scale-pulse group-hover:border-(--signature-color,slate-200)/80 group-hover:bg-(--signature-color,slate-400)/35">
            </div>
            <div
              class="absolute bottom-0 left-1/2 h-12 w-8 origin-bottom -translate-x-1/2 rotate-18 rounded-sm border-2 border-(--signature-color,slate-400)/35 bg-(--signature-color,slate-600)/10 shadow-sm transition duration-standard group-hover:translate-x-3 group-hover:rotate-25 group-hover:border-(--signature-color,slate-300)/60 group-hover:bg-(--signature-color,slate-400)/25">
            </div>
          </div>
          <div class="flex items-center gap-tight transition-transform duration-fast group-hover:scale-lift">
            <span class="type-uppercase-label text-(--signature-color,slate-300) transition-colors duration-fast group-hover:text-pure-white">
              Click to select
            </span>
            <Icon
              name="chevron_right"
              class="size-3.5 text-(--signature-color,slate-300) transition duration-fast group-hover:translate-x-0.5 group-hover:text-pure-white" />
          </div>
        </Button>
      {:else if is_failed}
        <div
          class="relative flex flex-col items-center justify-center gap-tight overflow-hidden rounded-xl border border-red-900/50 bg-red-950/25 p-standard"
          style={container_style}>
          <Icon name="octagon" class="size-8 text-red-400/80" />
          <p class="text-center text-xs font-medium text-red-300">Image generation failed</p>
          <p class="text-center type-data text-red-400/70">The image service timed out. Retry or remove.</p>
          <div class="flex items-center gap-tight">
            {#if preview_options.on_regenerate}
              <Button
                variant="bare"
                onclick={preview_options.on_regenerate}
                class="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-1 type-interact text-red-200 transition-colors hover:border-red-300/70 hover:text-white">
                Retry
              </Button>
            {/if}
            {#if id}
              <Button
                variant="bare"
                onclick={() => session.delete_attachment(String(id), attach_idx)}
                class="rounded-md border border-red-400/30 px-3 py-1 text-[11px] font-medium text-red-200/70 transition-colors hover:border-red-300/60 hover:text-white">
                Remove
              </Button>
            {/if}
          </div>
        </div>
      {:else if src && !image_picker.isRegenerating(regenerate_key)}
        <Button
          variant="bare"
          class="mx-auto block w-fit overflow-hidden rounded-xl border border-(--signature-color,slate-600)/30 bg-neutral-900/50 transition-[filter] duration-200 hover:brightness-110"
          onclick={() => open_image_preview(preview_options)}
          aria-label="View Attachment">
          <img {src} alt="Attachment {attach_idx + 1}" class="mx-auto max-h-120 w-auto max-w-full cursor-zoom-in rounded-xl object-contain" />
        </Button>
      {:else}
        <div
          class="relative flex flex-col items-center justify-center gap-standard overflow-hidden rounded-xl border border-(--signature-color,slate-600)/30 bg-neutral-900/50"
          style={container_style}>
          <Shimmer color="var(--signature-color,var(--color-electric-cyan))" />
        </div>
      {/if}
    {/each}
  </div>
{/if}
