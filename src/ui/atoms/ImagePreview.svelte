<script module>
  /**
   * 🖼️ ImagePreview Store - Polish Visual Module
   * Consolidated state and component logic.
   */

  /** @type {{active: boolean, src: string|null, caption: string}} */
  let imagePreviewState = $state({
    active: false,
    src: null,
    caption: "",
  });

  /**
   * Reactive image preview state (read-only export)
   */
  export const imagePreview = {
    get active() {
      return imagePreviewState.active;
    },
    get src() {
      return imagePreviewState.src;
    },
    get caption() {
      return imagePreviewState.caption;
    },
  };

  /**
   * Opens the image preview with an image
   * @param {string} src - Image source URL
   * @param {string} caption - Optional caption
   */
  export function openImagePreview(src, caption = "") {
    imagePreviewState.active = true;
    imagePreviewState.src = src;
    imagePreviewState.caption = caption;
  }

  /**
   * Closes the image preview
   */
  export function closeImagePreview() {
    imagePreviewState.active = false;
    imagePreviewState.src = null;
    imagePreviewState.caption = "";
  }
</script>

<script>
  import Modal from "@atoms/Modal.svelte";
</script>

{#if imagePreviewState.active}
  <Modal variant="preview" on_close={closeImagePreview}>
    <div class="preview-stage">
      <img src={imagePreviewState.src} alt={imagePreviewState.caption || "Preview"} />
      {#if imagePreviewState.caption}
        <div class="caption">{imagePreviewState.caption}</div>
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
