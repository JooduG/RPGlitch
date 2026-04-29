<script>
  let { text, busy, on_delete, on_edit } = $props();
</script>

<div data-testid="mock-message">
  {#if busy && !text}
    <div data-testid="mock-message-thinking">Thinking...</div>
  {/if}
  {#if text}
    <div class="text-content">{text}</div>
  {/if}
  <button data-testid="mock-delete" onclick={on_delete}>Delete</button>
  <button data-testid="mock-edit" onclick={on_edit}>Edit</button>
</div>
