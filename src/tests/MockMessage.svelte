<script>
  import { Button } from "@atoms";
  let {
    text,
    busy,
    on_delete,
    on_edit,
    is_editing = false,
    on_save = undefined,
    on_cancel = undefined,
  } = $props();

  let local_text = $state("");

  $effect(() => {
    if (is_editing) {
      local_text = text || "";
    }
  });
</script>

<div data-testid="mock-message" data-editing={is_editing}>
  {#if busy && !text}
    <div data-testid="mock-message-thinking">Thinking...</div>
  {/if}
  {#if is_editing}
    <input data-testid="mock-edit-input" bind:value={local_text} />
    <Button
      data-testid="mock-save"
      variant="invisible"
      size="small"
      onclick={() => on_save?.(local_text)}>Save</Button
    >
    <Button data-testid="mock-cancel" variant="invisible" size="small" onclick={on_cancel}
      >Cancel</Button
    >
  {:else}
    {#if text}
      <div>{text}</div>
    {/if}
    <Button data-testid="mock-delete" variant="invisible" size="small" onclick={on_delete}
      >Delete</Button
    >
    <Button data-testid="mock-edit" variant="invisible" size="small" onclick={on_edit}>Edit</Button>
  {/if}
</div>
