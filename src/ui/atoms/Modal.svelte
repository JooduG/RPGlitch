<script>
  /**
   * @file Modal.svelte
   * 🖼️ THE VOID CONTAINER
   * A generic glassmorphic modal wrapper.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import Backdrop from "@atoms/Backdrop.svelte";
  import { resolve_ms, resolve_px } from "@ui/components/ui-helpers.js";
  import { use_actions } from "@ui/actions/use-actions.js";
  import { quartOut } from "svelte/easing";
  import { fly, scale } from "svelte/transition";
  import { simulationState } from "@state/status.svelte.js";

  let {
    // State
    busy = null, // Dynamic fallback
    blur = true, // Pass-through for Backdrop blur
    is_pass_through = false, // Interaction pass-through

    // Design
    variant = "standard",
    z_index = "var(--z-index-modal)",
    class: className = "",

    // Handlers
    on_close = () => {},

    // Slots/Snippets
    children = null,
    actions = [],

    ...rest
  } = $props();

  // Determine active busy state using the unified simulationState if busy is not explicitly passed
  let is_busy = $derived(busy !== null ? busy : simulationState.busy);

  // The 'Fly' offset and durations are derived from design tokens.
  const offset = $derived(resolve_px("--spacing-5", 20));
  const duration_in = $derived(resolve_ms("--duration-standard", 350));
  const duration_out = $derived(resolve_ms("--duration-fast", 250));
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && on_close(e)} />

<!--
  DOM FLATTENED:
  The Modal content is nested directly within the Backdrop.
  Standardized Nomenclature: .root replaces .base for top-level alignment.
-->
<Backdrop
  onclick={on_close}
  {z_index}
  busy={is_busy}
  is_blurred={blur}
  {is_pass_through}
  class="{variant}-backdrop"
>
  <div
    {...rest}
    class="root glass-elevated {variant} {className}"
    class:is-busy={is_busy}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(/** @type {MouseEvent} */ e) => e.stopPropagation()}
    in:fly={{ y: offset, duration: duration_in, easing: quartOut }}
    out:scale={{ duration: duration_out, easing: quartOut, start: 0.95 }}
    use:use_actions={actions}
  >
    {@render children?.()}
  </div>
</Backdrop>

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .root - The core modal container.
   */
  .root {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    justify-content: space-between;

    /* Dimensions grounded in Grid Foundation */
    width: clamp(calc(var(--column-unit) * 3), 90vw, var(--modal-width-thin));
    height: clamp(calc(var(--row-unit) * 3), auto, var(--modal-height-standard));
    padding: var(--padding-standard);
    gap: var(--gap-standard);
    border-radius: var(--radius-standard);
    cursor: default;
    pointer-events: auto;
    transition: filter var(--duration-standard);
  }

  /* Nordic Collection Noise Texture */
  .root:not(.profile)::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: var(--z-index-below);
    background-image: var(--noise-url);
    opacity: var(--opacity-ghost);
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  /* Variant Specifics: Profile (Transparent Passthrough) */
  .root.profile {
    width: fit-content;
    height: 100vh;
    max-width: none;
    background: transparent;
    backdrop-filter: none;
    border: none;
    box-shadow: none;
    overflow: visible;
    padding: 0;
  }

  /* Variant Specifics: Preview/Mini (Compact) */
  .root.preview,
  .root.mini {
    max-width: var(--modal-width-thin);
    padding: var(--padding-standard);
  }

  /* Busy State Logic: Kinetic Grayout */
  .root.is-busy {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(0.5);
    pointer-events: none;
  }
</style>
