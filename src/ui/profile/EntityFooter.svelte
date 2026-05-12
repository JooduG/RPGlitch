<script>
  /**
   * @file src/ui/profile/EntityFooter.svelte
   * THE COMMAND CENTER — Primary Save, Delete, and Edit actions.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import { app } from "@state/app.svelte.js";
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

<footer
  class="footer"
  class:is-mobile={app.viewport.mobile}
  class:is-mini={app.viewport.mini}
  data-testid="entity-footer"
>
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
    padding: var(--padding-standard);
    display: grid;
    grid-template-columns: var(--profile-fragment-column) 1fr;
    gap: var(--spacing-4);
    background: color-mix(
      in srgb,
      rgb(from var(--color-gunmetal) r g b / 25%),
      var(--signature-color) 15%
    );
    z-index: var(--overlay-z-index);
    transition: all var(--duration-standard);
    border-radius: 0 0 var(--radius-standard) 0;
  }

  /* Fills column 1 when only the Edit button is shown. */
  .gap {
    grid-column: 1;
  }

  /* Occupies column 2; flex distributes buttons equally. */
  .actions {
    grid-column: 2;
    display: flex;
    gap: var(--spacing-4);
    width: 100%;
  }

  .footer.is-mobile {
    grid-template-columns: 1fr;
    padding: var(--spacing-3);
  }

  .footer.is-mobile .gap {
    display: none;
  }

  .footer.is-mobile .actions {
    grid-column: 1;
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
