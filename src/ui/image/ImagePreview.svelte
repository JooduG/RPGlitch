<script module>
  /**
   * 🖼️ ImagePreview - State-driven Lightbox Kernel
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
      state.on_regenerate = typeof options.on_regenerate === "function" ? options.on_regenerate : null;
      state.on_delete = typeof options.on_delete === "function" ? options.on_delete : null;
      state.signature_color = options.signature_color || null;
    }
  };

  export const close_image_preview = () => (state.active = false);
</script>

<script>
  import { Modal, Button, TextField, NumberField, Dropdown, tooltip } from "@primitives";
  import { app, runtime } from "@state";

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

  // Safe dummy keydown handler to appease compiler rules when capturing generic clicks
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
   * Prefers the runtime's active entity, falling back to the storyboard selection.
   * The runtime's fractal slot defaults to a placeholder ("active_fractal") that must be ignored.
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
   * Mirrors ProfileState.setImage: live mutation + persistence via runtime.update_entity.
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

  // The Modal stays mounted and drives its own enter/exit transitions; the
  // module-level state singleton remains the single source of truth for open.
  let modal_open = $state(false);
  $effect(() => {
    if (state.active !== modal_open) modal_open = state.active;
  });
</script>

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
