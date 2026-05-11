<script>
  /**
   * @file Modal.svelte
   * 🖼️ THE VOID CONTAINER
   * A generic glassmorphic modal wrapper.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import Backdrop from "@atoms/Backdrop.svelte";
  import { use_actions } from "@ui/utils/use-actions.js";
  import { quartOut } from "svelte/easing";
  import { scale, fly } from "svelte/transition";

  let {
    // State
    busy = false,

    // Design
    variant = "standard",
    z_index = "var(--z-index-overlay)",
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
    class="base glass-peak {variant} {className}"
    class:is-busy={busy}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(/** @type {MouseEvent} */ e) => e.stopPropagation()}
    in:fly={{ y: 20, duration: 400, easing: quartOut }}
    out:scale={{ duration: 300, easing: quartOut, start: 0.95 }}
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
    max-width: var(--modal-width-base);
    min-width: var(--modal-width-thin);
    max-height: var(--modal-height-standard);
    padding: var(--padding-loose);
    display: flex;
    flex-direction: column;
    gap: var(--gap-loose);
    overflow: hidden;
    border-radius: var(--radius-standard);
    cursor: default;
    pointer-events: auto;
    transition: filter var(--duration-standard);
  }

  /* Nordic Collection Noise Texture */
  .base:not(.profile)::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: var(--z-index-below);
    background-image: var(--noise-url);
    opacity: var(--noise-opacity);
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  /* Variant Specifics */
  .base.profile {
    width: 100%;
    max-width: var(--modal-width-wide);
    background: transparent;
    backdrop-filter: none;
    border: none;
    box-shadow: none;
    overflow: visible;
    padding: 0;
  }

  .base.preview,
  .base.mini {
    max-width: var(--modal-width-thin);
  }

  .base.mini {
    padding: var(--padding-tight);
    gap: var(--gap-tight);
  }

  /* Busy State Logic */
  .base.is-busy {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(0.5);
    pointer-events: none;
  }
</style>
