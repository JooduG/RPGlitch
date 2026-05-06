<script>
  /**
   * @file Modal.svelte
   * 🖼️ THE VOID CONTAINER
   * A generic glassmorphic modal wrapper.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { scale } from "svelte/transition";
  import { quartOut } from "svelte/easing";
  import Backdrop from "@atoms/Backdrop.svelte";
  import { use_actions } from "@ui/utils/use-actions.js";

  let {
    // State
    busy = false,

    // Design
    variant = "standard",
    z_index = "var(--z-index-xl)",
    class: className = "",

    // Handlers
    on_close = () => {},

    // Slots/Snippets
    children = null,
    actions = [],

    ...rest
  } = $props();
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && on_close(e)} />

<!-- 
  DOM FLATTENED: 
  The Modal content is nested directly within the Backdrop.
  This eliminates the redundant .modal-layout wrapper and leverages 
  the Backdrop's existing flex-centering and transition logic.
-->
<Backdrop onclick={on_close} {z_index} {busy}>
  <div
    {...rest}
    class="base glass-xxl {variant} {className}"
    class:is-busy={busy}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    transition:scale={{ duration: 400, easing: quartOut, start: 0.9 }}
    use:use_actions={actions}
  >
    {@render children?.()}
  </div>
</Backdrop>

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .base - The core modal container.
   */
  .base {
    position: relative;
    width: 95%;
    max-width: 480px;
    min-width: 280px;
    max-height: 90vh;
    padding: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-l);
    overflow: hidden;
    cursor: default; /* Reset cursor from Backdrop's pointer */
    pointer-events: auto;
    transition: filter var(--motion-m);
  }

  /* Variant Specifics */
  .base.profile {
    width: 100%;
    max-width: 1000px;
    background: transparent;
    backdrop-filter: none;
    border: none;
    box-shadow: none;
    overflow: visible;
    padding: 0;
  }

  .base.preview,
  .base.mini {
    max-width: 320px;
  }

  .base.mini {
    padding: var(--spacing-l);
    gap: var(--spacing-m);
  }

  /* Busy State Logic */
  .base.is-busy {
    filter: brightness(0.8) grayscale(0.5);
    pointer-events: none;
  }
</style>
