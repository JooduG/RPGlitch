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
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-m);
    min-height: var(--spacing-xxl);
    position: relative;

    /* --- Typography --- */
    font-family: inherit;
    font-weight: var(--font-weight-l);
    font-size: var(--font-size-small);
    line-height: 1;
    text-decoration: none;
    user-select: none;

    /* --- Surface --- */
    cursor: pointer;
    pointer-events: auto;
    border: none;
    border-radius: var(--border-radius-m);
    background: transparent;
    color: var(--font-color-m);

    /* --- Motion --- */
    transition:
      background-color var(--motion-l) var(--motion-elastic),
      color var(--motion-l) var(--motion-elastic),
      box-shadow var(--motion-l) var(--motion-elastic),
      transform var(--motion-l) var(--motion-elastic),
      filter var(--motion-l) var(--motion-elastic),
      border-color var(--motion-l) var(--motion-elastic);
  }

  /* --- Kinetic Stabilization --- */
  .wrapper[data-kinetic="true"] {
    /* Disable CSS transform transitions when WAAPI is active to prevent jitter */
    transition:
      background-color var(--motion-l) var(--motion-elastic),
      color var(--motion-l) var(--motion-elastic),
      box-shadow var(--motion-l) var(--motion-elastic),
      filter var(--motion-l) var(--motion-elastic),
      border-color var(--motion-l) var(--motion-elastic);
  }

  /* --- Structural Modifiers --- */
  .wrapper.is-sm {
    min-height: var(--spacing-xl);
    padding: var(--spacing-xxs) var(--spacing-s);
    font-size: var(--font-size-tiny);
  }

  .wrapper.is-square {
    padding: 0;
    min-height: var(--spacing-m);
    aspect-ratio: 1;
    flex-shrink: 0;
  }

  .wrapper.is-square.is-sm {
    width: var(--icon-s);
    height: var(--icon-s);
  }

  .wrapper.is-full {
    width: 100%;
    flex: 1;
  }

  .wrapper.is-cover {
    position: absolute;
    inset: 0;
    z-index: var(--z-index-m);
    border-radius: 0;
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
    box-shadow: var(--shadow-m);
  }

  .variant-secondary {
    background: var(--signature-color, var(--color-frozen));
    color: var(--color-white);
    box-shadow: var(--shadow-s);
  }

  .variant-danger {
    background: transparent;
    color: var(--color-red);
  }

  .variant-invisible {
    background: transparent;
    color: var(--font-color-s);
  }

  /* --- Operational States --- */
  .wrapper:focus-visible {
    outline: 2px solid var(--color-white);
    outline-offset: 2px;
  }

  .wrapper:disabled {
    opacity: var(--opacity-s);
    filter: grayscale(1);
    pointer-events: none;
    transform: none;
    box-shadow: none;
  }

  .wrapper:active:not(:disabled) {
    transform: scale(var(--motion-click, 0.95));
  }

  .wrapper[data-kinetic="true"]:active:not(:disabled) {
    transform: none; /* Let kinetic engine handle the physics */
  }

  .wrapper:hover:not(:disabled) {
    filter: var(--hover-brightness);
  }

  .wrapper.is-busy {
    cursor: wait;
    filter: brightness(0.8) grayscale(0.5);
    pointer-events: none;
  }

  /* --- Interaction Refinements --- */
  .variant-primary:hover:not(:disabled) {
    filter: brightness(1.05);
    box-shadow: var(--shadow-l);
    transform: scale(1.02);
  }

  .variant-primary[data-kinetic="true"]:hover:not(:disabled) {
    transform: none;
  }

  .variant-secondary:hover:not(:disabled) {
    box-shadow: var(--shadow-m);
    border-color: var(--color-white);
  }

  .variant-danger:hover:not(:disabled) {
    background: var(--color-red);
    color: var(--color-white);
    --danger-hover-shadow:
      0 0 var(--spacing-m) var(--color-red-glow), inset 0 0 0 var(--spacing-px) var(--color-red);

    box-shadow: var(--danger-hover-shadow);
  }

  .variant-invisible:hover:not(:disabled) {
    background: transparent;
    color: var(--color-white);
    filter: brightness(1.2);
  }

  /* --- Global Resets --- */
  .wrapper :global(.icon) {
    pointer-events: none;
  }
</style>
