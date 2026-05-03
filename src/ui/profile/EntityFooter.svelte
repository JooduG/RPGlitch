<script>
  /**
   * @file src/ui/EntityFooter.svelte
   * THE COMMAND CENTER
   * Houses the primary Save, Delete, and Edit actions.
   */
  import Button from "@atoms/Button.svelte";
  let { is_editing, is_saving, onclick_edit, onclick_save, onclick_delete } = $props();
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
        variant="secondary"
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
        variant="secondary"
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
    position: relative;
    margin: auto calc(-1 * var(--spacing-m)) calc(-1 * var(--spacing-m));
    padding: var(--spacing-m) var(--spacing-m) var(--spacing-m) 0;
    display: grid;
    grid-template-columns: var(--spacing-xxxxl) 1fr;
    gap: var(--spacing-m);
    background: color-mix(
      in srgb,
      rgb(from var(--color-gunmetal) r g b / 25%),
      var(--signature-color) 15%
    );
    backdrop-filter: var(--blur-m);
    border-top: var(--border-s);
    z-index: var(--z-index-xl);
    transition: all var(--motion-l);
    border-radius: 0 0 var(--border-radius-l) 0;
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

  @media (width <= 768px) {
    footer {
      grid-template-columns: 1fr;
      padding: var(--spacing-s);
    }

    .footer-actions {
      grid-column: 1;
    }
  }

  :global(.profile-button.button) {
    flex: 1;
  }
</style>
