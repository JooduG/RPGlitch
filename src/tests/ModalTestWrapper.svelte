<script>
  import Modal from "@atoms/Modal.svelte";
  const { on_close, variant } = $props();
</script>

<Modal {on_close} {variant}>
  <div
    data-testid="modal-content"
    style="width: var(--spacing-8); height: var(--spacing-8); background: var(--color-red);"
  >
    Test Content
  </div>
</Modal>
