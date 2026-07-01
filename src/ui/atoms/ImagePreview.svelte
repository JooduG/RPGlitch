<script module>
  /**
   * 🖼️ ImagePreview - State-driven Lightbox Kernel
   * Managed via Svelte 5 Global Module State.
   */

  /** @type {{ active: boolean, src: string | null, canvas: HTMLCanvasElement | null, caption: string, metadata: any, on_reroll: Function | null }} */
  let state = $state({
    active: false,
    src: null,
    canvas: null,
    caption: "",
    metadata: null,
    on_reroll: null,
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
    } else if (options) {
      state.src = options.src || null;
      state.canvas = options.canvas || null;
      state.caption = options.caption || caption || "";
      state.metadata = options.metadata || null;
      state.on_reroll = typeof options.on_reroll === "function" ? options.on_reroll : null;
    }
  };

  /** Close Lightbox */
  export const closeImagePreview = () => (state.active = false);
</script>

<script>
  import { Modal, Button } from "@atoms";

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
        gap-4
        overflow-y-auto
        rounded-xl
        border
        bg-glass-elevated
        p-4
        shadow-xl
        md:w-80
      "
      >
        <h2 class="font-heading text-lg font-bold">Image Details</h2>

        {#if state.metadata.prompt}
          <div class="flex flex-col gap-1">
            <span class="font-heading text-sm opacity-70">Prompt</span>
            <div class="text-sm">{state.metadata.prompt}</div>
          </div>
        {/if}

        {#if state.metadata.negativePrompt}
          <div class="flex flex-col gap-1">
            <span class="font-heading text-sm text-red-400 opacity-70">Negative Prompt</span>
            <div class="text-sm italic opacity-70">{state.metadata.negativePrompt}</div>
          </div>
        {/if}

        <div class="flex justify-between gap-4">
          {#if state.metadata.seed}
            <div class="flex flex-col gap-1">
              <span class="font-heading text-sm opacity-70">Seed</span>
              <div class="font-mono text-sm">{state.metadata.seed}</div>
            </div>
          {/if}
          {#if state.metadata.resolution}
            <div class="flex flex-col gap-1">
              <span class="font-heading text-sm opacity-70">Resolution</span>
              <div class="font-mono text-sm">{state.metadata.resolution}</div>
            </div>
          {/if}
        </div>

        <div class="mt-auto flex flex-col gap-2 pt-4">
          {#if state.on_reroll}
            <Button variant="primary" onclick={handleReroll}>Reroll Image</Button>
          {/if}
          <Button variant="secondary" onclick={handleCopyPrompt}>Copy Prompt</Button>
          <Button variant="secondary" onclick={handleCopySeed}>Copy Seed</Button>
          <Button variant="secondary" onclick={handleDownload}>Download</Button>
        </div>
      </div>
    {/if}
  </Modal>
{/if}
