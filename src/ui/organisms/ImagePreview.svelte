<script>
  /**
   * @file src/ui/organisms/ImagePreview.svelte
   * Unified Lightbox inspector and 3-card Polaroid candidate picker modal.
   */
  import { Button, Icon, Shimmer, tooltip } from "@atoms";
  import { motion } from "@media";
  import { Dropdown, Modal, TextField } from "@molecules";
  import { resolve_image_resolution } from "@simulation";
  import { session } from "@state";
  import { fade } from "svelte/transition";
  import {
    close_image_preview,
    close_regenerate,
    image_picker,
    image_preview as preview_state,
    run_image_regeneration,
    select_candidate,
  } from "./ImagePreview.svelte.js";

  const has_metadata = $derived(
    Boolean(preview_state.metadata && (preview_state.metadata.prompt || preview_state.metadata.negative_prompt || preview_state.metadata.seed != null)),
  );

  const profile_targets = $derived({
    ai: session.display_entities?.AI || null,
    user: session.display_entities?.USER || null,
    fractal: session.display_entities?.FRACTAL || null,
  });

  const profile_options = $derived([
    { value: "ai", label: profile_targets.ai?.name?.trim() || "AI Character", disabled: !profile_targets.ai },
    { value: "user", label: profile_targets.user?.name?.trim() || "User Persona", disabled: !profile_targets.user },
    { value: "fractal", label: profile_targets.fractal?.name?.trim() || "Fractal", disabled: !profile_targets.fractal },
  ]);

  const copy_canvas = (node, source_canvas) => {
    const draw = (src) => {
      if (!src) return;
      const canvas = document.createElement("canvas");
      canvas.width = src.width;
      canvas.height = src.height;
      canvas.getContext("2d")?.drawImage(src, 0, 0);
      canvas.className = node.className;
      node.replaceChildren(canvas);
    };
    draw(source_canvas);
    return { update: draw };
  };

  function handle_download() {
    const href = preview_state.canvas ? preview_state.canvas.toDataURL() : preview_state.src;
    if (!href) return;
    const link = document.createElement("a");
    link.download = `image_${preview_state.metadata?.seed || Date.now()}.png`;
    link.href = href;
    link.click();
  }

  async function copy_text(value) {
    if (value == null || value === "") return;
    try {
      await navigator.clipboard.writeText(String(value));
    } catch (err) {
      console.error("[ImagePreview] Failed to copy text:", err);
    }
  }

  function handle_regenerate() {
    preview_state.on_regenerate?.();
    close_image_preview();
  }

  async function handle_use_as_profile(slot) {
    const target = profile_targets[slot];
    const src = preview_state.canvas ? preview_state.canvas.toDataURL() : preview_state.src;
    if (!target?.id || !src) return;
    const clean_url = String(src).trim();
    try {
      await session.update_entity(slot === "fractal" ? "fractal" : "character", String(target.id), { profile_picture: clean_url, image: clean_url });
    } catch (err) {
      console.error("[ImagePreview] Failed to set profile picture:", err);
    }
  }

  async function handle_picker_regenerate() {
    if (!image_picker.candidates_ready && !image_picker.error) return;
    await run_image_regeneration({ in_picker: true });
  }
</script>

{#snippet PromptField(label, text, extra_class = "")}
  <TextField value={text.trim()} is_edit={false} signature_color="var(--color-frozen)" class={extra_class}>
    {#snippet status()}
      <span class="type-uppercase-label text-frisk">{label}</span>
    {/snippet}
    {#snippet header_actions()}
      <Button
        variant="invisible"
        size="small"
        square={true}
        aria-label={`Copy ${label}`}
        actions={[tooltip]}
        class="h-full! py-0! opacity-80 hover:opacity-100"
        onclick={() => copy_text(text)}>
        <Icon name="copy" class="size-4" />
      </Button>
    {/snippet}
  </TextField>
{/snippet}

<!-- 1. LIGHTBOX PREVIEW MODAL -->
<Modal
  open={preview_state.active}
  layer="image"
  on_close={close_image_preview}
  class="flex max-h-[95dvh] flex-col items-stretch justify-center gap-standard overflow-hidden border-none bg-transparent shadow-none md:flex-row md:gap-column-unit">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden" onclick={(e) => e.stopPropagation()}>
    {#if preview_state.canvas}
      <div
        role="img"
        aria-label="Generated canvas render preview"
        class="pointer-events-auto max-h-[85dvh] max-w-full rounded object-contain shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
        use:copy_canvas={preview_state.canvas}>
      </div>
    {:else if preview_state.src}
      <img
        class="pointer-events-auto max-h-[85dvh] max-w-full rounded object-contain shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
        src={preview_state.src}
        alt={preview_state.caption || "Preview"} />
    {/if}

    {#if preview_state.caption && !preview_state.metadata}
      <p class="z-10 mt-standard max-w-[80%] rounded bg-black/30 px-standard py-tight text-center type-body text-frisk shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        {preview_state.caption}
      </p>
    {/if}
  </div>

  {#if has_metadata}
    <div
      class="pointer-events-auto flex h-fit max-h-[95dvh] w-full shrink-0 scrollbar-none flex-col gap-standard self-center overflow-y-auto rounded-standard bg-glass-elevated p-standard [backdrop-filter:var(--blur-mist)] md:max-h-[85dvh] md:w-[calc(var(--spacing-column-unit)*3)] [&::-webkit-scrollbar]:hidden"
      onclick={(e) => e.stopPropagation()}>
      {#if preview_state.metadata.prompt}
        {@render PromptField("Positive Prompt", preview_state.metadata.prompt)}
      {/if}

      {#if preview_state.metadata.negative_prompt}
        {@render PromptField("Negative Prompt", preview_state.metadata.negative_prompt, "max-h-40")}
      {/if}

      <div class="mt-auto grid shrink-0 grid-cols-2 gap-standard">
        {#if preview_state.metadata.seed != null}
          <button
            type="button"
            use:tooltip={"Click to copy seed"}
            aria-label="Click to copy seed"
            onclick={() => copy_text(preview_state.metadata.seed)}
            class="glass-input h-12 w-full cursor-pointer text-center font-mono text-lg text-inherit outline-none">
            {preview_state.metadata.seed}
          </button>
        {/if}

        {#if preview_state.on_regenerate}
          <Button variant="secondary" class="h-12! w-full!" onclick={handle_regenerate}>
            <Icon name="refresh" class="size-4 stroke-[1.5]" />
            Regenerate
          </Button>
        {/if}

        <Button variant="secondary" class="h-12! w-full!" onclick={handle_download}>
          <Icon name="download" class="size-4" />
          Download
        </Button>

        {#if preview_state.on_delete}
          <Button
            variant="danger"
            class="h-12! w-full!"
            onclick={() => {
              const fn = preview_state.on_delete;
              close_image_preview();
              fn();
            }}>
            <Icon name="trash" class="size-4" />
            Delete
          </Button>
        {/if}

        <Dropdown
          items={profile_options}
          label="Use as Profile Picture"
          matchWidth
          disabled={profile_options.every((o) => o.disabled)}
          onchange={handle_use_as_profile}
          class="col-span-2 h-12! w-full!">
          {#snippet trigger_content()}
            <span class="flex w-full items-center justify-center gap-tight truncate type-interact">
              <Icon name="character" class="size-4 shrink-0" />
              <span class="truncate">Use as Profile Picture</span>
              <Icon name="chevron_down" class="size-4 shrink-0 opacity-60" />
            </span>
          {/snippet}
        </Dropdown>
      </div>
    </div>
  {/if}
</Modal>

<!-- 2. THREE-CARD REGENERATE PICKER MODAL -->
<Modal
  open={image_picker.picker_open}
  layer="image"
  dismissible={false}
  class="relative flex min-h-[60dvh] w-[clamp(20rem,95vw,96rem)] flex-col items-center justify-center gap-8 px-tight py-6">
  {#if image_picker.error}
    <div class="flex flex-col items-center gap-standard" in:fade={{ duration: motion.is_reduced ? 0 : 200 }}>
      <p class="text-lg text-red-400">{image_picker.error}</p>
      <Button variant="bare" class="rounded-lg bg-white/10 px-6 py-tight font-bold text-white transition-colors hover:bg-white/20" onclick={close_regenerate}>
        Close
      </Button>
    </div>
  {:else if image_picker.candidates.length < 2}
    <div class="relative h-64 w-48 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/50" in:fade={{ duration: motion.is_reduced ? 0 : 200 }}>
      <Shimmer />
    </div>
  {:else}
    <div class="flex max-w-full flex-wrap items-end justify-center gap-6 p-standard md:gap-8 lg:gap-10" in:fade={{ duration: motion.is_reduced ? 0 : 300 }}>
      {#each image_picker.candidates as candidate, i (i)}
        {@const letter = String.fromCharCode(65 + i)}
        {@const { width: cW, height: cH } = resolve_image_resolution(candidate, image_picker.last_mode || "character")}
        {@const ratio = cW && cH ? cW / cH : 2 / 3}
        {@const rot =
          i === 0 ? -4
          : i === 2 ? 4
          : 0}
        {@const card_width_class =
          ratio > 1.15 ? "w-72 sm:w-80 md:w-[26rem] lg:w-[28rem]"
          : ratio >= 0.85 ? "w-64 sm:w-72 md:w-80 lg:w-84"
          : "w-60 sm:w-64 md:w-72 lg:w-76"}
        <Button
          variant="bare"
          class={[
            "group relative shrink-0 origin-bottom rounded-(--radius-sharp) bg-[#f5f0e6] pt-tight pb-10 shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition duration-300 ease-out",
            card_width_class,
            image_picker.selected_index === i ? "scale-105 cursor-default ring-2 ring-emerald-400/60"
            : image_picker.selected_index !== null ? "scale-95 cursor-default opacity-40"
            : "cursor-pointer hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)]",
          ]}
          style={`rotate: ${rot}deg;`}
          onclick={() => select_candidate(i)}
          aria-label={`Select candidate ${letter}`}>
          <div class="relative overflow-hidden bg-neutral-200" style:aspect-ratio={`${cW} / ${cH}`}>
            <img src={candidate.url} alt={`Candidate ${letter}`} class="h-full w-full object-cover" />
            {#if image_picker.selected_index === i}
              <div class="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
                <div class="rounded-full bg-emerald-400 p-standard text-white shadow-lg">
                  <Icon name="check" class="size-6 stroke-3" />
                </div>
              </div>
            {/if}
          </div>
          <span class="absolute right-0 bottom-0 left-0 flex h-10 items-center justify-center type-uppercase-label text-neutral-800">{letter}</span>
        </Button>
      {/each}
    </div>

    {#if image_picker.selected_index === null}
      <div class="flex flex-wrap items-center justify-center gap-tight" in:fade={{ duration: motion.is_reduced ? 0 : 300 }}>
        <span class="type-uppercase-label text-slate-400">Choose One or</span>
        <Button
          variant="bare"
          class="flex items-center gap-tight rounded-lg bg-white/10 px-standard py-tight font-bold text-pure-white transition-colors duration-200 hover:bg-white/20"
          onclick={handle_picker_regenerate}>
          <Icon name="refresh" class="size-4 stroke-[1.5]" />
          <span class="type-uppercase-label">Discard & Regenerate</span>
        </Button>
      </div>
    {/if}
  {/if}
</Modal>
