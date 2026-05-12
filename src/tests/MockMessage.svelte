<script>
  import Button from "@atoms/Button.svelte";
  let { text, busy, on_delete, on_edit } = $props();
</script>

<div data-testid="mock-message">
  {#if busy && !text}
    <div data-testid="mock-message-thinking">Thinking...</div>
  {/if}
  {#if text}
    <div class="text-content">{text}</div>
  {/if}
  <Button data-testid="mock-delete" variant="invisible" size="small" onclick={on_delete}
    >Delete</Button
  >
  <Button data-testid="mock-edit" variant="invisible" size="small" onclick={on_edit}>Edit</Button>
</div>
