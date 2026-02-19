<script>
    let { text, isThinking, onDelete, onEdit } = $props()
</script>

{#if isThinking}
    <div data-testid="mock-message-thinking">Thinking...</div>
{:else}
    <div data-testid="mock-message">
        {text}
        <button data-testid="mock-delete" onclick={onDelete}>Delete</button>
        <button data-testid="mock-edit" onclick={onEdit}>Edit</button>
    </div>
{/if}
