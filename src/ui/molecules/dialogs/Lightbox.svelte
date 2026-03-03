<script>
    import { closeLightbox, lightbox } from "@state/lightbox.svelte.js"
    import Modal from "@ui/molecules/dialogs/Modal.svelte"
</script>

{#if lightbox.active}
    <Modal variant="preview" onclose={closeLightbox}>
        <div class="preview-stage">
            <img src={lightbox.src} alt={lightbox.caption || "Preview"} />
            {#if lightbox.caption}
                <div class="caption">{lightbox.caption}</div>
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
            border-radius: var(--border-radius-s);
            box-shadow: var(--shadow-xxl);
            pointer-events: auto;
            object-fit: contain;
        }

        .caption {
            margin-top: var(--spacing-m);
            color: var(--app-color);
            background: rgba(var(--pure-black-rgb), var(--opacity-m));
            padding: var(--spacing-s) var(--spacing-m);
            border-radius: var(--border-radius-s);
            font-size: var(--font-size-m);
        }
    }
</style>
