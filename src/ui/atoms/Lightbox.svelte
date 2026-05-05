<script context="module">
  /**
   * 🖼️ Lightbox Store - Polish Visual Module
   * Consolidated state and component logic.
   */

  /** @type {{active: boolean, src: string|null, caption: string}} */
  let lightboxState = $state({
    active: false,
    src: null,
    caption: "",
  });

  /**
   * Reactive lightbox state (read-only export)
   */
  export const lightbox = {
    get active() {
      return lightboxState.active;
    },
    get src() {
      return lightboxState.src;
    },
    get caption() {
      return lightboxState.caption;
    },
  };

  /**
   * Opens the lightbox with an image
   * @param {string} src - Image source URL
   * @param {string} caption - Optional caption
   */
  export function openLightbox(src, caption = "") {
    lightboxState.active = true;
    lightboxState.src = src;
    lightboxState.caption = caption;
  }

  /**
   * Closes the lightbox
   */
  export function closeLightbox() {
    lightboxState.active = false;
    lightboxState.src = null;
    lightboxState.caption = "";
  }
</script>

<script>
  import Modal from "@atoms/Modal.svelte";
</script>

{#if lightboxState.active}
  <Modal variant="preview" on_close={closeLightbox}>
    <div class="preview-stage">
      <img src={lightboxState.src} alt={lightboxState.caption || "Preview"} />
      {#if lightboxState.caption}
        <div class="caption">{lightboxState.caption}</div>
      {/if}
    </div>
  </Modal>
{/if}

<style>
  .preview-stage {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .preview-stage img {
    max-width: 90vw;
    max-height: 85vh;
    border-radius: var(--border-radius-s);
    box-shadow: var(--shadow-xxl);
    pointer-events: auto;
    object-fit: contain;
  }

  .preview-stage .caption {
    margin-top: var(--spacing-m);
    color: var(--font-color-m);
    background: rgb(var(--color-black-rgb) / var(--opacity-m));
    padding: var(--spacing-s) var(--spacing-m);
    border-radius: var(--border-radius-s);
    font-size: var(--font-size-m);
  }
</style>
