<script>
  import Modal from "../../artificer/Modal.svelte";
  import { app } from "../../gamemaster/state.svelte.js";
</script>

{#if app.lightbox.active}
  <Modal variant="preview" onclose={() => app.closeLightbox()}>
    <div class="preview-stage">
      <img src={app.lightbox.src} alt={app.lightbox.caption || "Preview"} />
      {#if app.lightbox.caption}
        <div class="caption">{app.lightbox.caption}</div>
      {/if}
    </div>
  </Modal>
{/if}

<style lang="scss">
  .preview-stage {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;

    img {
      max-width: 90vw;
      max-height: 85vh;
      border-radius: 4px;
      box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
      pointer-events: auto;
      object-fit: contain;
    }

    .caption {
      margin-top: 1rem;
      color: #e4e4e7;
      background: rgba(0, 0, 0, 0.5);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
  }
</style>
