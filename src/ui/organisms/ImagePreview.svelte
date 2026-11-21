<script>
  /**
   * @file src/ui/organisms/ImagePreview.svelte
   * Unified Lightbox inspector and 3-card Polaroid candidate picker modal.
   */
  import { session } from "@state";
  import { resolve_image_resolution } from "@simulation";
  import { refine_image_prompt } from "@engine";
  import { motion } from "@media";
  import { Button, Icon, Shimmer, tooltip } from "@atoms";
  import { Dropdown, Modal, TextField } from "@molecules";
  import {
    image_preview as preview_state,
    image_picker,
    close_image_preview,
    close_regenerate,
    run_image_regeneration,
    select_candidate,
  } from "./ImagePreview.svelte.js";
  import { fade } from "svelte/transition";

  // --- CANDIDATE PICKER STATE & LOGIC ---
  function resolve_candidate_resolution(candidate) {
    return resolve_image_resolution(candidate, image_picker.last_mode || "character");
  }

  async function handle_picker_regenerate() {
    if (!image_picker.candidates_ready && !image_picker.error) return;
    await run_image_regeneration({ in_picker: true, refine_prompt: refine_image_prompt });
  }

  // --- LIGHTBOX CANVAS & ACTIONS ---
  const copy_canvas = (node, sourceCanvas) => {
    const draw = (src) => {
      if (!src) return;
      const new_canvas = document.createElement("canvas");
      new_canvas.width = src.width;
      new_canvas.height = src.height;
      new_canvas.getContext("2d").drawImage(src, 0, 0);
      new_canvas.className = node.className;
      node.replaceChildren(new_canvas);
    };
    draw(sourceCanvas);
    return { update: draw };
  };

  const handle_download = () => {
    if (preview_state.canvas) {
      const link = document.createElement("a");
      link.download = `image_${preview_state.metadata?.seed || Date.now()}.png`;
      link.href = preview_state.canvas.toDataURL();
      link.click();
    } else if (preview_state.src) {
      const link = document.createElement("a");
      link.download = `image_${preview_state.metadata?.seed || Date.now()}.png`;
      link.href = preview_state.src;
      link.click();
    }
  };

  const copy_text = async (value) => {
    if (value == null || value === "") return;
    try {
      await navigator.clipboard.writeText(String(value));
    } catch (err) {
      console.error("[ImagePreview] Failed to copy text:", err);
    }
  };

  const handle_keydown_stub = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
    }
  };

  const handle_regenerate = () => {
    if (typeof preview_state.on_regenerate === "function") {
      preview_state.on_regenerate();
    }
    close_image_preview();
  };

  /**
   * Resolves the live entity for a profile-picture slot ('ai' | 'user' | 'fractal').
   * @param {'ai' | 'user' | 'fractal'} slot
   */
  const get_profile_target = (slot) => {
    const entities = session.display_entities;
    if (slot === "ai") return entities?.AI || null;
    if (slot === "user") return entities?.USER || null;
    if (slot === "fractal") return entities?.FRACTAL || null;
    return null;
  };

  /** Dropdown options - labeled with each entity's actual name. */
  const profile_options = $derived([
    { value: "ai", label: get_profile_target("ai")?.name?.trim() || "AI Character", disabled: !get_profile_target("ai") },
    { value: "user", label: get_profile_target("user")?.name?.trim() || "User Persona", disabled: !get_profile_target("user") },
    { value: "fractal", label: get_profile_target("fractal")?.name?.trim() || "Fractal", disabled: !get_profile_target("fractal") },
  ]);

  /**
   * Promotes the previewed image to an entity's profile picture.
   * @param {'ai' | 'user' | 'fractal'} slot
   */
  const handle_use_as_profile = async (slot) => {
    const target = get_profile_target(slot);
    if (!target || !target.id) return;
    const src = preview_state.canvas ? preview_state.canvas.toDataURL() : preview_state.src;
    if (!src) return;
    const clean_url = String(src).trim();
    const type = slot === "fractal" ? "fractal" : "character";
    try {
      await session.update_entity(type, String(target.id), { profile_picture: clean_url, image: clean_url });
    } catch (err) {
      console.error("[ImagePreview] Failed to set profile picture:", err);
    }
  };
</script>

<!-- ========================================================================= -->
<!-- 1. LIGHTBOX PREVIEW MODAL                                                 -->
<!-- ========================================================================= -->
<Modal
  open={preview_state.active}
  variant="bare"
  layer="image"
  on_close={close_image_preview}
  class="flex max-h-[95dvh] flex-col items-stretch justify-center gap-standard overflow-hidden border-none bg-transparent shadow-none md:flex-row md:gap-[calc(var(--spacing-column-unit))]">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden" onclick={(e) => e.stopPropagation()}>
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
      <div
        class="z-10 mt-standard max-w-[80%] rounded bg-black/30 text-center text-[clamp(0.9rem,0.8vw+0.8rem,1.1rem)] text-frisk shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        {preview_state.caption}
      </div>
    {/if}
  </div>

  {#if preview_state.metadata && (preview_state.metadata.prompt || preview_state.metadata.negative_prompt || preview_state.metadata.seed != null)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="pointer-events-auto flex h-fit max-h-[95dvh] w-full shrink-0 flex-col gap-standard self-center overflow-hidden rounded-standard bg-glass-elevated p-standard [backdrop-filter:var(--blur-mist)] md:max-h-[85dvh] md:w-[calc(var(--spacing-column-unit)*3)]"
      onclick={(e) => e.stopPropagation()}>
      <div class="flex scrollbar-none flex-col gap-standard overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {#if preview_state.metadata.prompt}
          <div class="flex flex-col gap-tight text-left">
            <TextField value={preview_state.metadata.prompt.trim()} is_edit={false} always_expanded={false} signature_color="var(--color-frozen)">
              {#snippet status()}
                <span class="font-mono text-[0.625rem] tracking-widest text-slate-50 uppercase">Positive Prompt</span>
              {/snippet}
              {#snippet header_actions()}
                <Button
                  variant="invisible"
                  size="small"
                  square={true}
                  aria-label="Copy Prompt"
                  actions={[tooltip]}
                  class="h-full! py-0! opacity-80 hover:opacity-100"
                  onclick={() => copy_text(preview_state.metadata.prompt)}>
                  <Icon name="copy" class="size-4" />
                </Button>
              {/snippet}
            </TextField>
          </div>
        {/if}

        {#if preview_state.metadata.negative_prompt}
          <div class="flex flex-col gap-tight text-left">
            <TextField
              value={preview_state.metadata.negative_prompt.trim()}
              is_edit={false}
              always_expanded={false}
              signature_color="var(--color-frozen)"
              class="max-h-40">
              {#snippet status()}
                <span class="font-mono text-[0.625rem] tracking-widest text-slate-50 uppercase">Negative Prompt</span>
              {/snippet}
              {#snippet header_actions()}
                <Button
                  variant="invisible"
                  size="small"
                  square={true}
                  aria-label="Copy Negative Prompt"
                  actions={[tooltip]}
                  class="h-full! py-0! opacity-80 hover:opacity-100"
                  onclick={() => copy_text(preview_state.metadata.negative_prompt)}>
                  <Icon name="copy" class="size-4" />
                </Button>
              {/snippet}
            </TextField>
          </div>
        {/if}

        <div class="mt-auto grid shrink-0 grid-cols-2 gap-standard">
          <!-- Row 1: Seed & Regenerate -->
          {#if preview_state.metadata.seed !== undefined && preview_state.metadata.seed !== null}
            <input
              type="number"
              value={preview_state.metadata.seed}
              placeholder="Seed"
              readonly
              use:tooltip={"Click to copy seed"}
              aria-label="Click to copy seed"
              onclick={() => copy_text(preview_state.metadata.seed)}
              onkeydown={handle_keydown_stub}
              class="glass-input col-start-1 row-start-1 h-12! w-full cursor-pointer [appearance:textfield] text-center font-mono text-lg [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          {/if}

          {#if preview_state.on_regenerate}
            <Button variant="secondary" class="col-start-2 row-start-1 h-12! w-full!" onclick={handle_regenerate}>
              <Icon name="refresh" class="mr-0 size-4 stroke-[1.5]" />
              Regenerate
            </Button>
          {/if}

          <!-- Row 2: Download & Delete -->
          <Button variant="secondary" class="col-start-1 row-start-2 h-12! w-full!" onclick={handle_download}>
            <Icon name="download" class="mr-0 size-4" />
            Download
          </Button>

          {#if preview_state.on_delete}
            <Button
              variant="danger"
              class="col-start-2 row-start-2 h-12! w-full!"
              onclick={() => {
                const fn = preview_state.on_delete;
                close_image_preview();
                fn();
              }}>
              <Icon name="trash" class="mr-tight size-4" />
              Delete
            </Button>
          {/if}

          <!-- Row 3: Use as Profile Picture -->
          <Dropdown
            items={profile_options}
            label="Use as Profile Picture"
            uppercase={false}
            matchWidth
            disabled={profile_options.every((o) => o.disabled)}
            onchange={handle_use_as_profile}
            class="col-span-2 row-start-3 h-12! w-full!">
            {#snippet trigger_content()}
              <span class="flex w-full items-center justify-center gap-tight truncate text-[0.8125rem] font-semibold">
                <Icon name="character" class="size-4 shrink-0" />
                <span class="truncate">Use as Profile Picture</span>
                <Icon name="chevron_down" class="size-4 shrink-0 opacity-60" />
              </span>
            {/snippet}
          </Dropdown>
        </div>
      </div>
    </div>
  {/if}
</Modal>

<!-- ========================================================================= -->
<!-- 2. THREE-CARD REGENERATE PICKER MODAL                                     -->
<!-- ========================================================================= -->
<Modal
  open={image_picker.picker_open}
  variant="bare"
  layer="image"
  dismissible={false}
  class="relative flex min-h-[60dvh] w-[clamp(20rem,95vw,96rem)] flex-col items-center justify-center gap-8 px-tight py-6">
  {#if image_picker.error}
    <div class="flex flex-col items-center gap-standard" in:fade={{ duration: motion.is_reduced ? 0 : 200 }}>
      <p class="text-lg text-red-400">{image_picker.error}</p>
      <div class="flex gap-standard">
        <Button
          variant="bare"
          class="rounded-lg bg-white/10 px-6 py-tight font-bold text-white transition-colors hover:bg-white/20"
          onclick={() => {
            close_regenerate();
          }}>
          Close
        </Button>
      </div>
    </div>
  {:else if image_picker.candidates.length < 2}
    <div class="relative h-64 w-48 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/50" in:fade={{ duration: motion.is_reduced ? 0 : 200 }}>
      <Shimmer />
    </div>
  {:else if image_picker.candidates.length >= 2}
    <!-- POLAROID CARD GRID -->
    <div class="flex max-w-full flex-wrap items-end justify-center gap-6 p-standard md:gap-8 lg:gap-10" in:fade={{ duration: motion.is_reduced ? 0 : 300 }}>
      {#each image_picker.candidates as candidate, i (i)}
        {@const letter = String.fromCharCode(65 + i)}
        {@const { width: cW, height: cH } = resolve_candidate_resolution(candidate)}
        {@const ratio = cW && cH ? cW / cH : 2 / 3}
        {@const ar = `${cW} / ${cH}`}
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
            "group relative shrink-0 pt-tight pb-10 shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition duration-300 ease-out",
            card_width_class,
            image_picker.selected_index === i ? "scale-105 cursor-default ring-2 ring-emerald-400/60"
            : image_picker.selected_index !== null ? "scale-95 cursor-default opacity-40"
            : "cursor-pointer hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)]",
          ]}
          style="background: #f5f0e6; border-radius: var(--radius-sharp); transform-origin: bottom center; transform: rotate({rot}deg);"
          onclick={() => select_candidate(i)}
          aria-label="Select candidate {letter}">
          <div class="relative overflow-hidden bg-neutral-200" style="aspect-ratio: {ar};">
            <img src={candidate.url} alt="Candidate {letter}" class="h-full w-full object-cover" />
            {#if image_picker.selected_index === i}
              <div class="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
                <div class="rounded-full bg-emerald-400 p-standard text-white shadow-lg">
                  <Icon name="check" class="size-6 stroke-3" />
                </div>
              </div>
            {/if}
          </div>
          <!-- Polaroid label area -->
          <div class="absolute right-0 bottom-0 left-0 flex h-10 items-center justify-center">
            <span class="font-mono text-xl font-bold tracking-widest text-neutral-800 uppercase">{letter}</span>
          </div>
        </Button>
      {/each}
    </div>

    {#if image_picker.selected_index === null}
      <div class="flex flex-wrap items-center justify-center gap-tight" in:fade={{ duration: motion.is_reduced ? 0 : 300 }}>
        <span class="font-mono text-sm tracking-widest text-slate-400 uppercase">Choose One or</span>
        <Button
          variant="bare"
          class="flex items-center gap-tight rounded-lg bg-white/10 px-standard py-tight font-bold text-white transition-colors duration-200 hover:bg-white/20"
          onclick={handle_picker_regenerate}>
          <Icon name="refresh" class="size-4 stroke-[1.5]" />
          <span class="font-mono text-xs tracking-widest uppercase">Discard & Regenerate</span>
        </Button>
      </div>
    {/if}
  {:else}
    <div class="flex flex-col items-center gap-standard" in:fade={{ duration: motion.is_reduced ? 0 : 200 }}>
      <p class="font-mono text-sm tracking-widest text-slate-500 uppercase">No pictures available</p>
      <Button variant="bare" class="rounded-lg bg-white/10 px-6 py-tight font-bold text-white transition-colors hover:bg-white/20" onclick={close_regenerate}>
        Close
      </Button>
    </div>
  {/if}
</Modal>
