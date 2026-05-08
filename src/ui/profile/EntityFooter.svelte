<script>
  /**
   * @file src/ui/profile/EntityFooter.svelte
   * THE COMMAND CENTER — Primary Save, Delete, and Edit actions.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import Button from "@atoms/Button.svelte";

  /**
   * @typedef {Object} Props
   * @property {boolean} is_editing - Global editing state
   * @property {boolean} is_saving  - Global saving state
   * @property {import('svelte/elements').MouseEventHandler<HTMLButtonElement>} onclick_edit   - Handler for entering edit mode
   * @property {import('svelte/elements').MouseEventHandler<HTMLButtonElement>} onclick_save   - Handler for saving changes
   * @property {import('svelte/elements').MouseEventHandler<HTMLButtonElement>} onclick_delete - Handler for deleting the entity
   */

  /** @type {Props} */
  let { is_editing, is_saving, onclick_edit, onclick_save, onclick_delete } = $props();
</script>

<footer class="footer" data-testid="entity-footer">
  {#if is_editing}
    <div class="actions">
      <Button
        variant="danger"
        full_width
        onclick={onclick_delete}
        disabled={is_saving}
        data-testid="delete-button"
      >
        Delete
      </Button>
      <Button
        variant="secondary"
        full_width
        onclick={onclick_save}
        disabled={is_saving}
        data-testid="save-button"
      >
        {is_saving ? "Saving..." : "Save"}
      </Button>
    </div>
  {:else}
    <span class="gap"></span>
    <div class="actions">
      <span class="spacer"></span>
      <Button variant="secondary" full_width onclick={onclick_edit} data-testid="edit-button">
        Edit
      </Button>
    </div>
  {/if}
</footer>

<style>
  .footer {
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
    z-index: var(--z-index-xl);
    transition: all var(--motion-l);
    border-radius: 0 0 var(--border-radius-l) 0;
  }

  /* Fills column 1 when only the Edit button is shown. */
  .gap {
    grid-column: 1;
  }

  /* Occupies column 2; flex distributes buttons equally. */
  .actions {
    grid-column: 2;
    display: flex;
    gap: var(--spacing-m);
    width: 100%;
  }

  @media (width <= 768px) {
    .footer {
      grid-template-columns: 1fr;
      padding: var(--spacing-s);
    }

    .gap {
      display: none;
    }

    .actions {
      grid-column: 1;
    }
  }

  /* Phantom slot; mirrors Delete's position in readonly mode. */
  .spacer {
    flex: 1;
  }

  /* Stretch every Button inside .actions to share space equally. */
  :global(.actions > *) {
    flex: 1;
  }
</style>
