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
    z_index = "var(--overlay-z-index)",
    class: className = "",

    // Slots/Snippets
    children = null,
    actions = [],

    ...rest
  } = $props();

  // Sync transition with design tokens
  let duration = $state(250);
  if (typeof window !== "undefined") {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue("--duration-fast")
      .trim();
    if (val) duration = parseInt(val, 10) || 250;
  }
</script>

<div
  {...rest}
  class="wrapper {className}"
  class:is-blurred={is_blurred}
  class:is-busy={busy}
  style:z-index={z_index}
  transition:fade={{ duration }}
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
      rgb(from var(--background-gradient-4) r g b / var(--opacity-heavy)),
      rgb(from var(--color-black) r g b / var(--opacity-substantial))
    );
    cursor: pointer;

    /* Physics */
    z-index: var(--overlay-z-index);

    /* Interaction Hygiene */
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    pointer-events: auto;
  }

  .wrapper.is-blurred {
    backdrop-filter: var(--blur-mist) saturate(0.4) var(--brightness-dim);
  }

  .wrapper.is-busy {
    cursor: wait;
    pointer-events: none;
  }
</style>
