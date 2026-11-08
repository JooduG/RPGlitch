<script module>
  /**
   * @file src/ui/image/ImagePreview.svelte
   * 🖼️ UNIFIED IMAGE LIGHTBOX & CANDIDATE PICKER
   * Consolidates:
   * 1. Single image lightbox inspection (zoom, metadata, seed, prompt, download, profile promotion).
   * 2. Three-candidate Polaroid regenerate picker (choose A/B/C or discard & re-generate).
   * Managed via Svelte 5 Global Module State.
   */

  /** @type {{ active: boolean, src: string | null, canvas: HTMLCanvasElement | null, caption: string, metadata: any, on_regenerate: Function | null, on_delete: Function | null, signature_color: string | null }} */
  let state = $state({
    active: false,
    src: null,
    canvas: null,
    caption: "",
    metadata: null,
    on_regenerate: null,
    on_delete: null,
    signature_color: null,
  });

  export const image_preview = {
    get active() {
      return state.active;
    },
    get src() {
      return state.src;
    },
    get canvas() {
      return state.canvas;
    },
    get caption() {
      return state.caption;
    },
    get metadata() {
      return state.metadata;
    },
    get on_regenerate() {
      return state.on_regenerate;
    },
    get on_delete() {
      return state.on_delete;
    },
    get signature_color() {
      return state.signature_color;
    },
  };

  export const open_image_preview = (options, caption = "") => {
    state.active = true;
    if (typeof options === "string") {
      state.src = options;
      state.caption = caption;
      state.canvas = null;
      state.metadata = null;
      state.on_regenerate = null;
      state.on_delete = null;
      state.signature_color = null;
    } else if (options) {
      state.src = options.src || null;
      state.canvas = options.canvas || null;
      state.caption = options.caption || caption || "";
      state.metadata = options.metadata || null;
      state.on_regenerate = options.on_regenerate || null;
      state.on_delete = options.on_delete || null;
      state.signature_color = options.signature_color || null;
    }
  };

  export const close_image_preview = () => (state.active = false);
</script>

<script>
  import { Modal, Button, TextField, NumberField, Dropdown, Shimmer, Backdrop, tooltip } from "@primitives";
  import { app, runtime } from "@state";
  import { get_resolution } from "@media";
  import { Dialog } from "bits-ui";
  import { fade } from "svelte/transition";
  import { image_picker, select_candidate, close_regenerate, run_image_regeneration } from "./ImagePicker.svelte.js";

  // --- CANDIDATE PICKER STATE & LOGIC ---
  let is_picker_regenerating = $state(false);

  function resolve_candidate_resolution(candidate) {
    const meta_res = candidate?.metadata?.resolution;
    if (meta_res && typeof meta_res === "string" && meta_res.includes("x")) {
      const [w, h] = meta_res.split("x").map(Number);
      if (w && h) return { width: w, height: h };
    }
    const mode = candidate?.metadata?.mode || image_picker.last_mode || "character";
    return get_resolution(mode);
  }

  async function handle_picker_regenerate() {
    if (is_picker_regenerating) return;
    is_picker_regenerating = true;
    try {
      await run_image_regeneration({ in_picker: true });
    } finally {
      is_picker_regenerating = false;
    }
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
    if (state.canvas) {
      const link = document.createElement("a");
      link.download = `image_${state.metadata?.seed || Date.now()}.png`;
      link.href = state.canvas.toDataURL();
      link.click();
    } else if (state.src) {
      const link = document.createElement("a");
      link.download = `image_${state.metadata?.seed || Date.now()}.png`;
      link.href = state.src;
      link.click();
    }
  };

  const handle_copy_prompt = async () => {
    if (state.metadata?.prompt) {
      try {
        await navigator.clipboard.writeText(state.metadata.prompt);
      } catch (err) {
        console.error("Failed to copy prompt:", err);
      }
    }
  };

  const handle_copy_negative_prompt = async () => {
    if (state.metadata?.negative_prompt) {
      try {
        await navigator.clipboard.writeText(state.metadata.negative_prompt);
      } catch (err) {
        console.error("Failed to copy negative prompt:", err);
      }
    }
  };

  const handle_copy_seed = async () => {
    if (state.metadata?.seed) {
      try {
        await navigator.clipboard.writeText(String(state.metadata.seed));
      } catch (err) {
        console.error("Failed to copy seed:", err);
      }
    }
  };

  const handle_keydown_stub = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
    }
  };

  const handle_regenerate = () => {
    if (typeof state.on_regenerate === "function") {
      state.on_regenerate();
    }
    close_image_preview();
  };

  /**
   * Resolves the live entity for a profile-picture slot ('ai' | 'user' | 'fractal').
   * @param {'ai' | 'user' | 'fractal'} slot
   */
  const get_profile_target = (slot) => {
    if (slot === "ai") return runtime.active_ai || app.selected_ai || null;
    if (slot === "user") return runtime.active_user || app.selected_user || null;
    if (slot === "fractal") {
      const live = runtime.active_fractal;
      const has_live = live && live.id && String(live.id) !== "active_fractal";
      return has_live ? live : app.selected_fractal || null;
    }
    return null;
  };

  /** Dropdown options — labeled with each entity's actual name. */
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
    const src = state.canvas ? state.canvas.toDataURL() : state.src;
    if (!src) return;
    const clean_url = String(src).trim();
    const type = slot === "fractal" ? "fractal" : "character";
    try {
      await runtime.update_entity(type, String(target.id), { profile_picture: clean_url, image: clean_url });
    } catch (err) {
      console.error("[ImagePreview] Failed to set profile picture:", err);
    }
  };

  let modal_open = $state(false);
  $effect(() => {
    if (state.active !== modal_open) modal_open = state.active;
  });
</script>

<!-- ========================================================================= -->
<!-- 1. LIGHTBOX PREVIEW MODAL                                                 -->
<!-- ========================================================================= -->
<Modal
  bind:open={modal_open}
  variant="bare"
  z_index="500"
  on_close={close_image_preview}
  class="flex max-h-[95vh] flex-col items-stretch justify-center gap-4 overflow-hidden border-none bg-transparent shadow-none md:flex-row md:gap-[calc(var(--spacing-column-unit))]"
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden" onclick={(e) => e.stopPropagation()}>
    {#if state.canvas}
      <div
        role="img"
        aria-label="Generated canvas render preview"
        class="pointer-events-auto max-h-[85vh] max-w-full rounded object-contain shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
        use:copy_canvas={state.canvas}
      ></div>
    {:else if state.src}
      <img
        class="pointer-events-auto max-h-[85vh] max-w-full rounded object-contain shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
        src={state.src}
        alt={state.caption || "Preview"}
      />
    {/if}

    {#if state.caption && !state.metadata}
      <div
        class="z-50 mt-4 max-w-[80%] rounded bg-black/30 text-center text-[clamp(0.9rem,0.8vw+0.8rem,1.1rem)] text-[#f2f7fa] shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
      >
        {state.caption}
      </div>
    {/if}
  </div>

  {#if state.metadata && (state.metadata.prompt || state.metadata.negative_prompt || state.metadata.seed != null)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="pointer-events-auto flex h-fit max-h-[95vh] w-full shrink-0 flex-col gap-gap-standard self-center overflow-hidden rounded-standard bg-glass-elevated p-padding-standard [backdrop-filter:var(--blur-mist)] md:max-h-[85vh] md:w-[calc(var(--spacing-column-unit)*3)]"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex scrollbar-none flex-col gap-gap-standard overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {#if state.metadata.prompt}
          <div class="flex flex-col gap-2 text-left">
            <TextField value={state.metadata.prompt.trim()} is_edit={false} always_expanded={false} signature_color="var(--color-frozen)">
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
                  onclick={handle_copy_prompt}
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"></path>
                  </svg>
                </Button>
              {/snippet}
            </TextField>
          </div>
        {/if}

        {#if state.metadata.negative_prompt}
          <div class="flex flex-col gap-2 text-left">
            <TextField
              value={state.metadata.negative_prompt.trim()}
              is_edit={false}
              always_expanded={false}
              signature_color="var(--color-frozen)"
              class="max-h-40"
            >
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
                  onclick={handle_copy_negative_prompt}
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"></path>
                  </svg>
                </Button>
              {/snippet}
            </TextField>
          </div>
        {/if}

        <div class="mt-auto grid shrink-0 grid-cols-2 gap-4">
          <!-- Row 1: Seed & Regenerate -->
          {#if state.metadata.seed !== undefined && state.metadata.seed !== null}
            <NumberField
              value={state.metadata.seed}
              placeholder="Seed"
              readonly={true}
              actions={[tooltip]}
              aria-label="Click to copy seed"
              onclick={handle_copy_seed}
              onkeydown={handle_keydown_stub}
              class="col-start-1 row-start-1 h-12! w-full text-lg"
            />
          {/if}

          {#if state.on_regenerate}
            <Button variant="secondary" class="col-start-2 row-start-1 h-12! w-full!" onclick={handle_regenerate}>
              <svg viewBox="0 0 24 24" class="mr-0 h-4 w-4 fill-none stroke-current">
                <path
                  d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path d="M21 3v5h-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Regenerate
            </Button>
          {/if}

          <!-- Row 2: Download & Delete -->
          <Button variant="secondary" class="col-start-1 row-start-2 h-12! w-full!" onclick={handle_download}>
            <svg viewBox="0 0 24 24" class="mr-0 h-4 w-4 fill-none stroke-current">
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line>
            </svg>
            Download
          </Button>

          {#if state.on_delete}
            <Button
              variant="danger"
              class="col-start-2 row-start-2 h-12! w-full!"
              onclick={() => {
                const fn = state.on_delete;
                close_image_preview();
                fn();
              }}
            >
              <svg viewBox="0 0 24 24" class="mr-1.5 h-4 w-4 fill-none stroke-current">
                <path
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
              </svg>
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
            class="col-span-2 row-start-3 h-12! w-full!"
          >
            {#snippet trigger_content()}
              <span class="flex w-full items-center justify-center gap-2 truncate text-[0.8125rem] font-semibold">
                <svg viewBox="0 0 24 24" class="size-4 shrink-0 fill-none stroke-current">
                  <path
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
                </svg>
                <span class="truncate">Use as Profile Picture</span>
                <svg viewBox="0 0 24 24" class="size-4 shrink-0 opacity-60">
                  <path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
                </svg>
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
{#if image_picker.picker_open}
  <Dialog.Root open={true} preventScroll={false}>
    <Dialog.Portal>
      <Dialog.Overlay forceMount>
        {#snippet child({ props: overlayProps })}
          <Backdrop {...overlayProps} layer="image">
            <Dialog.Content forceMount onInteractOutside={(e) => e.preventDefault()} onOpenAutoFocus={(e) => e.preventDefault()}>
              {#snippet child({ props: contentProps })}
                <div
                  {...contentProps}
                  class="relative flex min-h-[60vh] w-[clamp(20rem,95vw,96rem)] flex-col items-center justify-center gap-8 px-2 py-6"
                  onclick={(e) => e.stopPropagation()}
                >
                  {#if image_picker.error}
                    <div class="flex flex-col items-center gap-4" in:fade={{ duration: 200 }}>
                      <p class="text-lg text-red-400">{image_picker.error}</p>
                      <div class="flex gap-4">
                        <Button
                          variant="bare"
                          class="rounded-lg bg-white/10 px-6 py-2 font-bold text-white transition-colors hover:bg-white/20"
                          onclick={() => {
                            close_regenerate();
                          }}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  {:else if image_picker.candidates.length < 2}
                    <div class="relative h-64 w-48 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/50" in:fade={{ duration: 200 }}>
                      <Shimmer />
                    </div>
                  {:else if image_picker.candidates.length >= 2}
                    <!-- POLAROID CARD GRID -->
                    <div class="flex max-w-full flex-wrap items-end justify-center gap-6 p-4 md:gap-8 lg:gap-10" in:fade={{ duration: 300 }}>
                      {#each image_picker.candidates as candidate, i (i)}
                        {@const letter = String.fromCharCode(65 + i)}
                        {@const { width: cW, height: cH } = resolve_candidate_resolution(candidate)}
                        {@const ratio = cW && cH ? cW / cH : 2 / 3}
                        {@const ar = `${cW} / ${cH}`}
                        {@const rot = i === 0 ? -4 : i === 2 ? 4 : 0}
                        {@const card_width_class =
                          ratio > 1.15
                            ? "w-72 sm:w-80 md:w-[26rem] lg:w-[28rem]"
                            : ratio >= 0.85
                              ? "w-64 sm:w-72 md:w-80 lg:w-84"
                              : "w-60 sm:w-64 md:w-72 lg:w-76"}
                        <Button
                          variant="bare"
                          class="group relative {card_width_class} shrink-0 pt-2 pb-10 shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out {image_picker.selected_index ===
                          i
                            ? 'scale-105 cursor-default ring-2 ring-emerald-400/60'
                            : image_picker.selected_index !== null
                              ? 'scale-95 cursor-default opacity-40'
                              : 'cursor-pointer hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)]'}"
                          style="background: #f5f0e6; border-radius: var(--radius-sharp); transform-origin: bottom center; transform: rotate({rot}deg);"
                          onclick={() => select_candidate(i)}
                          aria-label="Select candidate {letter}"
                        >
                          <div class="relative overflow-hidden bg-neutral-200" style="aspect-ratio: {ar};">
                            <img src={candidate.url} alt="Candidate {letter}" class="h-full w-full object-cover" />
                            {#if image_picker.selected_index === i}
                              <div class="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
                                <div class="rounded-full bg-emerald-400 p-3 text-white shadow-lg">
                                  <svg
                                    viewBox="0 0 24 24"
                                    class="h-6 w-6 fill-none stroke-current stroke-3 [stroke-linecap:round] [stroke-linejoin:round]"
                                  >
                                    <polyline
                                      points="20 6 9 17 4 12"
                                      stroke="currentColor"
                                      stroke-width="3"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    />
                                  </svg>
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
                      <div class="flex flex-wrap items-center justify-center gap-2" in:fade={{ duration: 300 }}>
                        <span class="font-mono text-sm tracking-widest text-slate-400 uppercase">Choose One or</span>
                        <Button
                          variant="bare"
                          class="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-bold text-white transition-all duration-200 hover:bg-white/20"
                          onclick={handle_picker_regenerate}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            class="h-4 w-4 fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]"
                          >
                            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                          </svg>
                          <span class="font-mono text-xs tracking-widest uppercase">Discard & Regenerate</span>
                        </Button>
                      </div>
                    {/if}
                  {:else}
                    <div class="flex flex-col items-center gap-4" in:fade={{ duration: 200 }}>
                      <p class="font-mono text-sm tracking-widest text-slate-500 uppercase">No pictures available</p>
                      <Button
                        variant="bare"
                        class="rounded-lg bg-white/10 px-6 py-2 font-bold text-white transition-colors hover:bg-white/20"
                        onclick={close_regenerate}
                      >
                        Close
                      </Button>
                    </div>
                  {/if}
                </div>
              {/snippet}
            </Dialog.Content>
          </Backdrop>
        {/snippet}
      </Dialog.Overlay>
    </Dialog.Portal>
  </Dialog.Root>
{/if}
