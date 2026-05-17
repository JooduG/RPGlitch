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
  :global(.base.preview) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 95vw;
    max-height: 95vh;
    width: auto;
    padding: var(--padding-standard);
    gap: var(--gap-loose); /* Parity with original margin-top */
    background: transparent;
    border: none;
    box-shadow: none;
    overflow: visible;
  }

  .visual {
    max-width: 90vw;
    max-height: 85vh;
    border-radius: var(--radius-sharp);
    box-shadow: var(--shadow-heavy);
    object-fit: contain;
    pointer-events: auto;
  }

  .label {
    color: var(--font-color-base);
    background: rgb(from var(--void-black) r g b / var(--opacity-muted));
    padding: var(--padding-moderate) var(--padding-standard);
    border-radius: var(--radius-sharp);
    font-size: var(--font-size-base);
    text-align: center;
    max-width: 80%;
    z-index: var(--mid-z-index);
    box-shadow: var(--shadow-heavy);
  }
</style>
