<script>
  import Modal from "@atoms/Modal.svelte";
  const { on_close, variant } = $props();
</script>

<Modal {on_close} {variant}>
  <div
    data-testid="modal-content"
    style="width: calc(var(--spacing-unit) * 8); height: calc(var(--spacing-unit) * 8); background: var(--crimson-red);"
  >
    Test Content
  </div>
</Modal>
