<script>
  import Button from "@ui/atoms/Button.svelte";
  let { is_editing = $bindable(), is_saving, handle_save, handle_delete } = $props();
</script>

<footer data-testid="profile-footer">
  {#if is_editing}
    <div class="footer-actions">
      <Button
        variant="danger"
        className="profile-button"
        onclick={handle_delete}
        disabled={is_saving}
        data-testid="delete-button">Delete</Button
      >
      <Button
        variant="edit"
        className="profile-button"
        onclick={handle_save}
        disabled={is_saving}
        data-testid="save-button"
      >
        {is_saving ? "Saving..." : "Save"}
      </Button>
    </div>
  {:else}
    <Button
      variant="edit"
      className="profile-button"
      onclick={() => {
        is_editing = true;
      }}
      data-testid="edit-button"
    >
      Edit
    </Button>
  {/if}
</footer>

<style>
  footer {
    margin-top: auto;
    display: grid;
    grid-template-columns: var(--spacing-xxxl) 1fr;
    gap: var(--spacing-s);
    background: color-mix(in srgb, var(--color-gunmetal), var(--signature-color) var(--opacity-xs));
    border-top: 0;
    z-index: var(--z-index-m);
    padding-top: var(--spacing-m);
  }

  footer :global(.profile-button.button) {
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-xl);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-m);
    padding: var(--spacing-s) var(--spacing-xl);
    transition: all var(--motion-fast) var(--motion-elastic);
    width: 50%;
  }

  footer .footer-actions {
    grid-column: 2;
    display: flex;
    gap: var(--spacing-m);
    width: 100%;
  }

  footer .footer-actions :global(.button) {
    flex: 1;
    width: 100%;
  }

  /* Readonly "Edit" Button - Target direct child of footer */
  footer > :global(.button-edit) {
    grid-column: 2;

    /* Calculate 50% width minus half the gap, to match one of the two buttons */
    width: calc(50% - (var(--spacing-m) / 2));
    justify-self: end;
    background: var(--signature-color);
    color: var(--color-white);
    box-shadow: var(--shadow-s);
  }

  footer > :global(.button-edit):hover {
    filter: brightness(1.1);
    transform: translateY(var(--motion-button-hover-y));
    box-shadow: var(--shadow-m);
  }

  /* Edit Button inside .footer-actions (Save) needs to just inherit flex */
  footer .footer-actions :global(.button-edit) {
    background: var(--signature-color);
    color: var(--color-white);
    box-shadow: var(--shadow-s);

    /* Ensure it fills flex container */
    width: 100%;
  }

  footer .footer-actions :global(.button-edit):hover {
    filter: brightness(1.1);
    transform: translateY(var(--motion-button-hover-y));
    box-shadow: var(--shadow-m);
  }
</style>
