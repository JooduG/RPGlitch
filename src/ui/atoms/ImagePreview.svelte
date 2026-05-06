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
  import Modal from "@atoms/Modal.svelte";
</script>

{#if state.active}
  <Modal variant="preview" on_close={closeImagePreview}>
    <img class="visual" src={state.src} alt={state.caption || "Preview"} />

    {#if state.caption}
      <div class="label">{state.caption}</div>
    {/if}
  </Modal>
{/if}

<style>
  /**
   * 📐 DOM Flattening & Nomenclature Harmonization
   * We target the Modal's content container directly to eliminate redundant layers.
   * Generic, semantic class names: .visual, .label.
   */
  :global(.modal-content.preview) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 95vw;
    max-height: 95vh;
    width: auto;
    padding: var(--spacing-m);
    gap: var(--spacing-m); /* Parity with original margin-top */
    background: transparent;
    border: none;
    box-shadow: none;
    overflow: visible;
  }

  .visual {
    max-width: 90vw;
    max-height: 85vh;
    border-radius: var(--border-radius-s);
    box-shadow: var(--shadow-xxl);
    object-fit: contain;
    pointer-events: auto;
  }

  .label {
    color: var(--font-color-m);
    background: rgb(var(--color-black-rgb) / var(--opacity-m));
    padding: var(--spacing-s) var(--spacing-m);
    border-radius: var(--border-radius-s);
    font-size: var(--font-size-m);
    text-align: center;
    max-width: 80%;
    z-index: 1;
    box-shadow: var(--shadow-l);
  }
</style>
