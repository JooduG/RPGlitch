<script>
  import Button from "@ui/atoms/Button.svelte";
  import TextField from "@ui/atoms/TextField.svelte";
  let {
    vector,
    is_editing,
    on_update,
    on_delete,
    signature_color,
    unit_label = "Vector",
  } = $props();
  // Create a stable local state for editing
  let local_text = $state("");
  // Sync from props only when not in active edit mode or on mount
  $effect(() => {
    const text = vector?.text || vector?.summary || (typeof vector === "string" ? vector : "");
    local_text = text;
  });
  function handle_input(e) {
    local_text = e.target.value;
    on_update(local_text);
  }
</script>

<div class="vector-card" class:editing={is_editing} style="--accent-color: {signature_color}">
    <div class="textfield">
      <TextField
        is_edit={is_editing}
        value={local_text}
        oninput={handle_input}
        placeholder="Enter {unit_label.toLowerCase()} detail..."
      />
      {#if is_editing}
        <div class="actions">
          <Button
            variant="danger"
            square={true}
            size="sm"
            onclick={on_delete}
            title="Remove {unit_label}"
          >
            <span class="icon">×</span>
          </Button>
        </div>
      {/if}
    </div>
</div>

<style>
  .vector-card {
    position: relative;
    width: 100%;
    transition: transform var(--motion-fast) var(--motion-elastic);
    overflow: hidden;
  }

  .vector-card.editing:hover {
    transform: none;
  }

  .textfield {
    display: flex;
    gap: var(--spacing-s);
    align-items: stretch;
  }

  .actions {
    display: flex;
    align-items: center;
  }

  .icon {
    font-size: var(--font-size-xxl);
    line-height: 1;
    font-weight: var(--font-weight-xl);
    margin-bottom: 2px;
  }


</style>
