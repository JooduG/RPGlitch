<script module>
  /**
   * 🖼️ ImagePreview - State-driven Lightbox Kernel
   * Managed via Svelte 5 Global Module State.
   */

  /** @type {{ active: boolean, src: string | null, canvas: HTMLCanvasElement | null, caption: string, metadata: any, on_reroll: Function | null, signature_color: string | null }} */
  let state = $state({
    active: false,
    src: null,
    canvas: null,
    caption: "",
    metadata: null,
    on_reroll: null,
    signature_color: null,
  });

  /**
   * Reactive state interface (Read-only)
   */
  export const imagePreview = {
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
    get on_reroll() {
      return state.on_reroll;
    },
    get signature_color() {
      return state.signature_color;
    },
  };

  /**
   * Trigger Lightbox
   * @param {Object|string} options - Image Source or options object
   * @param {string} [caption=""] - Optional metadata (legacy support)
   */
  export const openImagePreview = (options, caption = "") => {
    state.active = true;
    if (typeof options === "string") {
      state.src = options;
      state.caption = caption;
      state.canvas = null;
      state.metadata = null;
      state.on_reroll = null;
      state.signature_color = null;
    } else if (options) {
      state.src = options.src || null;
      state.canvas = options.canvas || null;
      state.caption = options.caption || caption || "";
      state.metadata = options.metadata || null;
      state.on_reroll = typeof options.on_reroll === "function" ? options.on_reroll : null;
      state.signature_color = options.signature_color || null;
    }
  };

  /** Close Lightbox */
  export const closeImagePreview = () => (state.active = false);
</script>

<script>
  import { Modal, Button, TextField, tooltip } from "@atoms";

  const copyCanvas = (node, sourceCanvas) => {
    const draw = (src) => {
      if (!src) return;
      const newCanvas = document.createElement("canvas");
      newCanvas.width = src.width;
      newCanvas.height = src.height;
      // Copy content
      newCanvas.getContext("2d").drawImage(src, 0, 0);
      newCanvas.className = node.className;
      node.replaceChildren(newCanvas);
    };
    draw(sourceCanvas);
    return { update: draw };
  };

  const handleDownload = () => {
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

  const handleCopyPrompt = async () => {
    if (state.metadata?.prompt) {
      try {
        await navigator.clipboard.writeText(state.metadata.prompt);
      } catch (err) {
        console.error("Failed to copy prompt:", err);
      }
    }
  };

  const handleCopyNegativePrompt = async () => {
    if (state.metadata?.negativePrompt) {
      try {
        await navigator.clipboard.writeText(state.metadata.negativePrompt);
      } catch (err) {
        console.error("Failed to copy negative prompt:", err);
      }
    }
  };

  const handleCopySeed = async () => {
    if (state.metadata?.seed) {
      try {
        await navigator.clipboard.writeText(String(state.metadata.seed));
      } catch (err) {
        console.error("Failed to copy seed:", err);
      }
    }
  };

  const handleReroll = () => {
    if (typeof state.on_reroll === "function") {
      state.on_reroll();
      closeImagePreview();
    }
  };
</script>

{#if state.active}
  <Modal
    variant="lightbox"
    on_close={closeImagePreview}
    class="
      flex
      max-h-[95vh]
      flex-col
      items-stretch
      justify-center
      gap-4
      overflow-hidden
      border-none
      bg-transparent
      p-4
      shadow-none
      md:flex-row
    "
  >
    <!-- Visual Pane -->
    <div class="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center">
      {#if state.canvas}
        <div
          class="
            pointer-events-auto
            max-h-[85vh]
            max-w-full
            rounded
            object-contain
            shadow-[0_4px_16px_rgba(0,0,0,0.3)]
          "
          use:copyCanvas={state.canvas}
        ></div>
      {:else if state.src}
        <img
          class="
            pointer-events-auto
            max-h-[85vh]
            max-w-full
            rounded
            object-contain
            shadow-[0_4px_16px_rgba(0,0,0,0.3)]
          "
          src={state.src}
          alt={state.caption || "Preview"}
        />
      {/if}

      {#if state.caption && !state.metadata}
        <div
          class="
            z-50
            mt-4
            max-w-[80%]
            rounded
            bg-black/30
            p-4
            text-center
            text-[clamp(0.9rem,0.8vw+0.8rem,1.1rem)]
            text-[#f2f7fa]
            shadow-[0_4px_16px_rgba(0,0,0,0.3)]
          "
        >
          {state.caption}
        </div>
      {/if}
    </div>

    <!-- Details Pane -->
    {#if state.metadata}
      <div
        class="
        pointer-events-auto
        flex
        w-full
        shrink-0
        flex-col
        gap-gap-standard
        overflow-y-auto
        rounded-standard
        bg-glass-elevated
        p-padding-standard
        [backdrop-filter:var(--blur-mist)]
        md:w-lg
      "
      >
        {#if state.metadata.prompt}
          <div class="flex flex-col gap-2 text-left">
            <TextField value={state.metadata.prompt?.trim() || ""} is_edit={false} always_expanded={false} signature_color="var(--color-frozen)">
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
                  onclick={handleCopyPrompt}
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

        {#if state.metadata.negativePrompt}
          <div class="flex flex-col gap-2 text-left">
            <TextField
              value={state.metadata.negativePrompt?.trim() || ""}
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
                  onclick={handleCopyNegativePrompt}
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

        <div class="flex gap-4">
          {#if state.metadata.seed !== undefined && state.metadata.seed !== null}
            <div class="flex flex-1 flex-col gap-2">
              <TextField
                value={String(state.metadata.seed).trim()}
                is_edit={false}
                always_expanded={false}
                syncId="image-preview-meta"
                signature_color="var(--color-frozen)"
                class="font-mono text-lg **:data-[mode='readonly']:text-center!"
              >
                {#snippet status()}
                  <span class="font-mono text-[0.625rem] tracking-widest text-slate-50 uppercase">Seed</span>
                {/snippet}
                {#snippet header_actions()}
                  <Button
                    variant="invisible"
                    size="small"
                    square={true}
                    aria-label="Copy Seed"
                    actions={[tooltip]}
                    class="h-full! py-0! opacity-80 hover:opacity-100"
                    onclick={handleCopySeed}
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
          {#if state.metadata.resolution}
            <div class="flex flex-1 flex-col gap-2">
              <TextField
                value={state.metadata.resolution?.trim() || ""}
                is_edit={false}
                always_expanded={false}
                syncId="image-preview-meta"
                signature_color="var(--color-frozen)"
                class="font-mono text-lg **:data-[mode='readonly']:text-center!"
              >
                {#snippet status()}
                  <span class="font-mono text-[0.625rem] tracking-widest text-slate-50 uppercase">Resolution</span>
                {/snippet}
              </TextField>
            </div>
          {/if}
        </div>

        <div class="mt-auto flex flex-row gap-4">
          {#if state.on_reroll}
            <Button
              variant="primary"
              onclick={handleReroll}
              class="flex-1 bg-emerald-500! py-3 font-bold tracking-widest text-white! uppercase hover:bg-emerald-600!"
            >
              <svg viewBox="0 0 24 24" class="mr-2 h-4 w-4 fill-none stroke-current">
                <polyline points="23 4 23 10 17 10" stroke="currentColor" stroke-width="2"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" stroke-width="2"></path>
              </svg>
              Reroll Image
            </Button>
          {/if}
          <Button variant="secondary" class="flex-1" onclick={handleDownload}>
            <svg viewBox="0 0 24 24" class="mr-2 h-4 w-4 fill-none stroke-current">
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
        </div>
      </div>
    {/if}
  </Modal>
{/if}
