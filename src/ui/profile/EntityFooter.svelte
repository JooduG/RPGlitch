<script>
  /**
   * @file src/ui/profile/EntityFooter.svelte
   * THE COMMAND CENTER
   * Houses the primary Save, Delete, and Edit actions.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import Button from "@atoms/Button.svelte";

  /**
   * @typedef {Object} Props
   * @property {boolean} is_editing - Global editing state
   * @property {boolean} is_saving - Global saving state
   * @property {Function} onclick_edit - Handler for entering edit mode
   * @property {Function} onclick_save - Handler for saving changes
   * @property {Function} onclick_delete - Handler for deleting the entity
   */

  /** @type {Props} */
  let { is_editing, is_saving, onclick_edit, onclick_save, onclick_delete } = $props();
</script>

<footer class="wrapper" data-testid="entity-footer">
  <div class="actions">
    {#if is_editing}
      <Button
        variant="danger"
        fullWidth
        className="btn"
        onclick={onclick_delete}
        disabled={is_saving}
        data-testid="delete-button"
      >
        Delete
      </Button>
      <Button
        variant="secondary"
        fullWidth
        className="btn"
        onclick={onclick_save}
        disabled={is_saving}
        data-testid="save-button"
      >
        {is_saving ? "Saving..." : "Save"}
      </Button>
    {:else}
      <div class="spacer"></div>
      <Button
        variant="secondary"
        fullWidth
        className="btn"
        onclick={onclick_edit}
        data-testid="edit-button"
      >
        Edit
      </Button>
    {/if}
  </div>
</footer>

<style>
  .wrapper {
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

  .actions {
    grid-column: 2;
    display: flex;
    gap: var(--spacing-m);
    width: 100%;
  }

  .spacer {
    flex: 1;
  }

  @media (width <= 768px) {
    .wrapper {
      grid-template-columns: 1fr;
      padding: var(--spacing-s);
    }

    .actions {
      grid-column: 1;
    }
  }

  :global(.btn.button) {
    flex: 1;
  }
</style>
