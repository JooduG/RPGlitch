<script>
  let { text, is_thinking, on_delete, on_edit } = $props();
</script>

{#if is_thinking}
  <div data-testid="mock-message-thinking">Thinking...</div>
{:else}
  <div data-testid="mock-message">
    {text}
    <button data-testid="mock-delete" onclick={on_delete}>Delete</button>
    <button data-testid="mock-edit" onclick={on_edit}>Edit</button>
  </div>
{/if}
