<script>
  /**
   * @file Button.svelte
   * 🕹️ SOTA ATOMIC BUTTON COMPONENT
   * High-performance, multi-variant interaction layer.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@ui/utils/use-actions.js";

  /**
   * @type {{
   *   label?: string,
   *   variant?: "primary" | "secondary" | "danger" | "invisible",
   *   cover?: boolean,
   *   size?: "sm" | "md",
   *   square?: boolean,
   *   full_width?: boolean,
   *   busy?: boolean,
   *   class?: string,
   *   className?: string,
   *   children?: import('svelte').Snippet,
   *   actions?: Array<any>,
   *   disabled?: boolean,
   *   onclick?: import('svelte/elements').MouseEventHandler<HTMLButtonElement>,
   *   onmouseenter?: import('svelte/elements').MouseEventHandler<HTMLButtonElement>,
   *   onmouseleave?: import('svelte/elements').MouseEventHandler<HTMLButtonElement>,
   *   role?: string,
   *   style?: string,
   *   tooltip?: string,
   *   tabindex?: string | number,
   *   type?: "button" | "submit" | "reset",
   *   "aria-label"?: string,
   *   "aria-selected"?: boolean,
   *   "aria-expanded"?: boolean,
   *   "aria-haspopup"?: string | boolean,
   *   "data-testid"?: string,
   *   [key: string]: any
   * }}
   */
  let {
    label = "",
    variant = "primary",
    cover = false,
    size = "md",
    square = false,
    full_width = false,
    busy = false,
    class: svelte_class = "",
    className = "",
    children,
    disabled = false,
    actions = [],
    ...rest
  } = $props();

  // Merge both aliases for seamless migration
  const resolved_class = $derived([svelte_class, className].filter(Boolean).join(" "));

  /** @type {HTMLButtonElement} */
  let element;

  /** API: Focus the button */
  export function focus() {
    element?.focus();
  }
</script>

<button
  bind:this={element}
  type="button"
  {...rest}
  class="wrapper variant-{variant} {resolved_class}"
  class:is-cover={cover}
  class:is-sm={size === "sm"}
  class:is-square={square}
  class:is-full={full_width}
  class:is-busy={busy}
  aria-busy={busy}
  aria-disabled={disabled || busy}
  disabled={disabled || busy}
  use:use_actions={actions}
>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</button>

<style>
  .wrapper {
    /* --- Layout --- */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-4);
    min-height: var(--spacing-12);
    position: relative;

    /* --- Typography --- */
    font-family: inherit;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-small);
    line-height: 1;
    text-decoration: none;
    user-select: none;

    /* --- Surface --- */
    cursor: pointer;
    pointer-events: auto;
    border: none;
    border-radius: var(--radius-standard);
    background: transparent;
    color: var(--font-color-base);

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
  .wrapper[data-kinetic="true"] {
    /* Disable CSS transform transitions when WAAPI is active to prevent jitter */
    transition:
      background-color var(--duration-slow) var(--ease-elastic),
      color var(--duration-slow) var(--ease-elastic),
      box-shadow var(--duration-slow) var(--ease-elastic),
      filter var(--duration-slow) var(--ease-elastic),
      border-color var(--duration-slow) var(--ease-elastic);
  }

  /* --- Structural Modifiers --- */
  .wrapper.is-sm {
    min-height: var(--spacing-8);
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-tiny);
  }

  .wrapper.is-square {
    padding: 0;
    min-height: var(--spacing-4);
    aspect-ratio: 1;
    flex-shrink: 0;
  }

  .wrapper.is-square.is-sm {
    width: var(--icon-small);
    height: var(--icon-small);
  }

  .wrapper.is-full {
    width: 100%;
    flex: 1;
  }

  .wrapper.is-cover {
    position: absolute;
    inset: 0;
    z-index: var(--surface-z-index);
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
    background: var(--color-white);
    color: var(--color-chalk);
    box-shadow: var(--shadow-heavy);
  }

  .variant-secondary {
    background: var(--signature-color, var(--color-frozen));
    color: var(--color-white);
    box-shadow: var(--shadow-ghost);
  }

  .variant-danger {
    background: transparent;
    color: var(--color-red);
  }

  .variant-invisible {
    background: transparent;
    color: var(--font-color-muted);
  }

  /* --- Operational States --- */
  .wrapper:focus-visible {
    outline: var(--spacing-pixel) solid var(--color-white);
    outline-offset: var(--spacing-pixel);
  }

  .wrapper:disabled {
    opacity: var(--opacity-muted);
    filter: grayscale(var(--opacity-solid));
    pointer-events: none;
    transform: none;
    box-shadow: none;
  }

  .wrapper:active:not(:disabled) {
    transform: var(--click-sink);
  }

  .wrapper[data-kinetic="true"]:active:not(:disabled) {
    transform: none; /* Let kinetic engine handle the physics */
  }

  .wrapper:hover:not(:disabled) {
    filter: var(--hover-glow);
  }

  .wrapper.is-busy {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(var(--opacity-heavy));
    pointer-events: none;
  }

  /* --- Interaction Refinements --- */
  .variant-primary:hover:not(:disabled) {
    filter: var(--hover-glow);
    box-shadow: var(--shadow-heavy);
    transform: var(--hover-lift);
  }

  .variant-primary[data-kinetic="true"]:hover:not(:disabled) {
    transform: none;
  }

  .variant-secondary:hover:not(:disabled) {
    box-shadow: var(--shadow-heavy);
    border-color: var(--color-white);
  }

  .variant-danger:hover:not(:disabled) {
    background: var(--color-red);
    color: var(--color-white);
    --danger-hover-shadow:
      0 0 var(--spacing-4) rgb(from var(--color-red) r g b / var(--opacity-muted)),
      inset 0 0 0 var(--spacing-pixel) var(--color-red);

    box-shadow: var(--danger-hover-shadow);
  }

  .variant-invisible:hover:not(:disabled) {
    background: transparent;
    color: var(--color-white);
    filter: var(--hover-glow);
  }

  /* --- Global Resets --- */
  .wrapper :global(.icon) {
    pointer-events: none;
  }
</style>
