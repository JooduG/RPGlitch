<script>
  /**
   * @file Button.svelte
   * 🕹️ SOTA ATOMIC BUTTON COMPONENT
   * High-performance, multi-variant interaction layer.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@ui/actions/use-actions.js";

  import { controlState } from "@state/status.svelte.js";

  let {
    // Data
    label = "",
    children = null,

    // State
    variant = "primary", // 'primary' | 'secondary' | 'danger' | 'invisible'
    size = "md", // 'small' | 'md'
    busy = false,
    disabled = false,

    // Design
    cover = false,
    square = false,
    full_width = false,
    class: className = "",

    // Handlers
    actions = [],

    ...rest
  } = $props();

  /** @type {HTMLButtonElement} */
  let element;

  /** API: Focus the button */
  export function focus() {
    element?.focus();
  }

  const is_interrupt_btn = $derived(
    label?.toLowerCase().includes("interrupt") ||
      rest["aria-label"]?.toLowerCase().includes("interrupt") ||
      className?.toLowerCase().includes("interrupt"),
  );

  let is_disabled = $derived(disabled || (controlState.intent_active && !is_interrupt_btn));
</script>

<button
  bind:this={element}
  type="button"
  {...rest}
  class="root variant-{variant} {className}"
  class:is-cover={cover}
  class:is-small={size === "small"}
  class:is-square={square}
  class:is-full={full_width}
  class:is-busy={busy}
  aria-busy={busy}
  aria-disabled={is_disabled || busy}
  disabled={is_disabled || busy}
  use:use_actions={actions}
>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</button>

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .root - Main interaction layer.
   */
  .root {
    /* --- Layout --- */

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--gap-standard);
    padding: 0 var(--padding-standard);
    height: calc(var(--spacing-unit) * 12);
    position: relative;

    /* --- Typography --- */
    font-family: inherit;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    text-decoration: none;
    user-select: none;

    /* --- Surface --- */
    cursor: pointer;
    pointer-events: auto;
    border: var(--border-width-base) solid transparent;
    border-radius: var(--radius-standard);
    background: transparent;
    color: var(--frisk);

    /* --- Motion --- */
    transition:
      background-color var(--duration-slow) var(--ease-elastic),
      color var(--duration-slow) var(--ease-elastic),
      box-shadow var(--duration-slow) var(--ease-elastic),
      transform var(--duration-slow) var(--ease-elastic),
      filter var(--duration-slow) var(--ease-elastic),
      border-color var(--duration-slow) var(--ease-elastic);
  }

  /* --- Kinetic Stabilization --- */
  .root[data-kinetic="true"] {
    /* Disable CSS transform transitions when WAAPI is active to prevent jitter */
    transition:
      background-color var(--duration-slow) var(--ease-elastic),
      color var(--duration-slow) var(--ease-elastic),
      box-shadow var(--duration-slow) var(--ease-elastic),
      filter var(--duration-slow) var(--ease-elastic),
      border-color var(--duration-slow) var(--ease-elastic);
  }

  /* --- Structural Modifiers --- */
  .root.is-small {
    padding: 0 var(--padding-tight);
    font-size: var(--font-size-tiny);
  }

  .root.is-square {
    width: calc(var(--spacing-unit) * 12);
    height: calc(var(--spacing-unit) * 12);
    aspect-ratio: var(--aspect-square);
    flex-shrink: 0;
  }

  .root.is-square.is-small {
    width: calc(var(--spacing-unit) * 8);
    height: calc(var(--spacing-unit) * 8);
  }

  .root.is-full {
    width: 100%;
    flex: 1;
  }

  .root.is-cover {
    position: absolute;
    inset: 0;
    z-index: var(--z-index-surface);
    border-radius: inherit;
    padding: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  /* --- Thematic Variants --- */
  .variant-primary {
    background: var(--pure-white);
    color: var(--chalk);
    box-shadow: var(--shadow-standard);
  }

  .variant-secondary {
    background: var(--signature-color, var(--frozen));
    color: var(--pure-white);
    box-shadow: var(--shadow-ghost);
  }

  .variant-danger {
    background: transparent;
    color: var(--crimson-red);
  }

  .variant-invisible {
    background: transparent;
    color: var(--frozen);
  }

  /* --- Operational States --- */
  .root:focus-visible {
    outline: var(--border-width-base) solid var(--pure-white);
    outline-offset: var(--border-width-base);
  }

  .root:disabled {
    opacity: var(--opacity-whisper);
    filter: grayscale(var(--opacity-solid));
    pointer-events: none;
    transform: none;
    box-shadow: none;
  }

  .root:active:not(:disabled) {
    transform: var(--scale-sink);
  }

  .root[data-kinetic="true"]:active:not(:disabled) {
    transform: none; /* Let kinetic engine handle the physics */
  }

  .root:hover:not(:disabled) {
    filter: var(--brightness-glow);
  }

  .root.is-busy {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(var(--opacity-whisper));
    pointer-events: none;
  }

  /* --- Interaction Refinements --- */
  .variant-primary:hover:not(:disabled) {
    filter: var(--brightness-glow);
    box-shadow: var(--shadow-standard);
    transform: var(--scale-lift);
  }

  .variant-primary[data-kinetic="true"]:hover:not(:disabled) {
    transform: none;
  }

  .variant-secondary:hover:not(:disabled) {
    box-shadow: var(--shadow-standard);
    border-color: var(--pure-white);
  }

  .variant-danger:hover:not(:disabled) {
    background: var(--crimson-red);
    color: var(--pure-white);
    box-shadow: var(--danger-hover-shadow);
  }

  .variant-invisible:hover:not(:disabled) {
    background: transparent;
    color: var(--pure-white);
    filter: var(--brightness-glow);
  }

  /* --- Global Resets --- */
  .root :global(.icon) {
    pointer-events: none;
  }
</style>
