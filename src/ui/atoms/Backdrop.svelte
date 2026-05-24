<script>
  /**
   * @file Backdrop.svelte
   * 🕹️ SOTA ATOMIC BACKDROP
   * Standard shielding overlay for Modals, Drawers, and Panels.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@ui/actions/use-actions.js";
  import { fade } from "svelte/transition";
  import { resolve_ms } from "@ui/components/ui-helpers.js";

  let {
    // State
    is_blurred = true,
    busy = false,
    is_pass_through = false,

    // Design
    z_index = "var(--z-index-overlay)",
    class: className = "",

    // Slots/Snippets
    children = null,
    actions = [],

    ...rest
  } = $props();

  // Sync transition with design tokens
  let duration = $state(resolve_ms("--duration-fast", 250));
</script>

<!-- 
  DOM FLATTENED: 
  The Backdrop provides the reactive stage for overlay components.
  Standardized Nomenclature: .root replaces .wrapper for architectural parity.
-->
<div
  {...rest}
  class="root {className}"
  class:is-blurred={is_blurred}
  class:is-busy={busy}
  class:is-pass-through={is_pass_through}
  style:z-index={z_index}
  transition:fade={{ duration }}
  use:use_actions={actions}
>
  {@render children?.()}
</div>

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .root - The primary backdrop layer.
   */
  .root {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: flex-start; /* Centering handled by margin:auto on children */
    justify-content: center;
    overflow-y: auto;
    padding: var(--padding-standard);

    /* Atmosphere: Abyssal Radial Gradient */
    background: radial-gradient(
      circle at center,
      rgb(from var(--background-gradient-4) r g b / var(--opacity-whisper)),
      rgb(from var(--void-black) r g b / var(--opacity-whisper))
    );
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    pointer-events: auto;
  }

  .root.is-pass-through {
    pointer-events: none;
  }

  /* Children must re-enable pointer events if backdrop is pass-through */
  .root.is-pass-through > :global(*) {
    pointer-events: auto;
  }

  /* 
   * [063] VERTICAL CENTERING HACK: 
   * By setting margin: auto on the direct child of an align-items: flex-start container,
   * we get perfect centering when the content is smaller than the viewport,
   * and a natural top-start scroll when it overflows.
   */
  .root > :global(*) {
    margin: auto;
  }

  /* Nordic Collection: Glassmorphic Atmosphere */
  .root.is-blurred {
    backdrop-filter: var(--blur-mist) saturate(0.4) var(--brightness-dim);
  }

  .root.profile-backdrop {
    padding: 0;
  }

  /* Busy State Logic: Kinetic Grayout */
  .root.is-busy {
    cursor: wait;
    pointer-events: none;
  }
</style>
