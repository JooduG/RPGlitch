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
    z_index = "var(--z-index-xl)",
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
  transition:fade={{ duration: 300 }}
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
    background: var(--glass-xs);
    cursor: pointer;

    /* Physics */
    z-index: var(--z-index-xl);

    /* Interaction Hygiene */
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    pointer-events: auto;
  }

  .wrapper.is-blurred {
    backdrop-filter: var(--blur-s);
  }

  .wrapper.is-busy {
    cursor: wait;
    pointer-events: none;
  }
</style>
