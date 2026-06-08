<script module>
  /**
   * 🖼️ ImagePreview - State-driven Lightbox Kernel
   * Managed via Svelte 5 Global Module State.
   */

  /** @type {{ active: boolean, src: string | null, caption: string }} */
  let state = $state({
    active: false,
    src: null,
    caption: "",
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
    get caption() {
      return state.caption;
    },
  };

  /**
   * Trigger Lightbox
   * @param {string} src - Image Source
   * @param {string} caption - Optional metadata
   */
  export const openImagePreview = (src, caption = "") => {
    state.active = true;
    state.src = src;
    state.caption = caption;
  };

  /** Close Lightbox */
  export const closeImagePreview = () => (state.active = false);
</script>

<script>
  import { Modal } from "@atoms";
</script>

{#if state.active}
  <Modal
    variant="preview"
    on_close={closeImagePreview}
    class="
      flex
      max-h-[95vh]
      w-auto
      max-w-[95vw]
      flex-col
      items-center
      justify-center
      gap-4
      overflow-visible
      border-none
      bg-transparent
      p-4
      shadow-none
    "
  >
    <img
      class="
        pointer-events-auto
        max-h-[85vh]
        max-w-[90vw]
        rounded
        object-contain
        shadow-[0_4px_16px_rgba(0,0,0,0.3)]
      "
      src={state.src}
      alt={state.caption || "Preview"}
    />

    {#if state.caption}
      <div
        class="
        z-50
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
  </Modal>
{/if}
