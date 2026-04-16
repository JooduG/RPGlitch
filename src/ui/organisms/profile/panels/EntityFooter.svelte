<script>
  /**
   * @file src/ui/organisms/profile/panels/EntityFooter.svelte
   * 🛠️ THE COMMAND CENTER
   * Houses the primary Save, Delete, and Edit actions.
   */
  import Button from "@ui/atoms/Button.svelte";
  let { 
    is_editing, 
    is_saving, 
    onclick_edit, 
    onclick_save, 
    onclick_delete 
  } = $props();
</script>

<footer data-testid="entity-footer">
  {#if is_editing}
    <div class="footer-actions">
      <Button
        variant="danger"
        fullWidth={true}
        className="profile-button"
        onclick={onclick_delete}
        disabled={is_saving}
        data-testid="delete-button">Delete</Button
      >
      <Button
        variant="signature"
        fullWidth={true}
        className="profile-button"
        onclick={onclick_save}
        disabled={is_saving}
        data-testid="save-button"
      >
        {is_saving ? "Saving..." : "Save"}
      </Button>
    </div>
  {:else}
    <div class="footer-actions">
      <div class="footer-spacer"></div>
      <Button
        variant="signature"
        fullWidth={true}
        className="profile-button"
        onclick={onclick_edit}
        data-testid="edit-button"
      >
        Edit
      </Button>
    </div>
  {/if}
</footer>

<style>
  footer {
    margin-top: auto;
    display: grid;
    grid-template-columns: var(--spacing-xxxxl) 1fr;
    gap: var(--spacing-s);
    background: color-mix(in srgb, var(--color-gunmetal), var(--signature-color) var(--opacity-xs));
    border-top: 0;
    z-index: var(--z-index-m);
    transition: all var(--motion-fast);
  }

  .footer-actions {
    grid-column: 2;
    display: flex;
    gap: var(--spacing-m);
    width: 100%;
  }

  .footer-spacer {
    flex: 1;
  }

  :global(.profile-button.button) {
    flex: 1;
  }
</style>
