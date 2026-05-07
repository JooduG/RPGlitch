<script>
  import Modal from "@atoms/Modal.svelte";
  const { on_close, variant } = $props();
</script>

<Modal {on_close} {variant}>
  <div
    data-testid="modal-content"
    style="width: var(--spacing-xl); height: var(--spacing-xl); background: var(--color-red);"
  >
    Test Content
  </div>
</Modal>
