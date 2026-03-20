<script>
    import Modal from "./Modal.svelte"
    const { on_close, variant } = $props()
</script>

<Modal {on_close} {variant}>
    <div data-testid="modal-content" style="width: 100px; height: 100px; background: red;">
        Test Content
    </div>
</Modal>
