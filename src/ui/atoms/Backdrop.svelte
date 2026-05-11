<script>
  /**
   * @file Backdrop.svelte
   * 🕹️ SOTA ATOMIC BACKDROP
   * Standard shielding overlay for Modals, Drawers, and Panels.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@ui/utils/use-actions.js";
  import { fade } from "svelte/transition";

  let {
    // State
    is_blurred = true,
    busy = false,

    // Design
    z_index = "var(--z-index-overlay)",
    class: className = "",

    // Slots/Snippets
    children = null,
    actions = [],

    ...rest
  } = $props();
</script>

<div
  {...rest}
  class="wrapper {className}"
  class:is-blurred={is_blurred}
  class:is-busy={busy}
  style:z-index={z_index}
  transition:fade={{ duration: 250 }}
  use:use_actions={actions}
>
  {@render children?.()}
</div>

<style>
  .wrapper {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    /* Atmosphere */
    background: radial-gradient(
      circle at center,
      rgb(var(--background-gradient-4-rgb), var(--opacity-heavy)),
      rgb(var(--color-black-rgb), var(--opacity-substantial))
    );
    cursor: pointer;

    /* Physics */
    z-index: var(--z-index-overlay);

    /* Interaction Hygiene */
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    pointer-events: auto;
  }

  .wrapper.is-blurred {
    backdrop-filter: var(--blur-mist) saturate(0.4) brightness(0.8);
  }

  .wrapper.is-busy {
    cursor: wait;
    pointer-events: none;
  }
</style>
