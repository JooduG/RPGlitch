<script>
  /**
   * @file Button.svelte
   * 🕹️ SOTA ATOMIC BUTTON COMPONENT
   * High-performance, multi-variant interaction layer.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@ui/utils/use-actions.js";

  let {
    label = "",
    variant = "primary", // primary | secondary | danger | invisible
    cover = false, // absolute-fill parent
    size = "md", // sm | md
    square = false, // 1:1 aspect ratio
    full_width = false, // 100% width
    busy = false, // async state
    class: className = "",
    children = null,
    actions = [], // Svelte actions orchestration
    ...rest
  } = $props();

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
  class="wrapper variant-{variant} {className}"
  class:is-cover={cover}
  class:is-sm={size === "sm"}
  class:is-square={square}
  class:is-full={full_width}
  class:is-busy={busy}
  aria-busy={busy}
  aria-disabled={rest.disabled || busy}
  disabled={rest.disabled || busy}
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-m);
    min-height: var(--spacing-xxl);
    font-family: inherit;
    font-weight: var(--font-weight-l);
    font-size: var(--font-size-s);
    line-height: 1;
    text-decoration: none;
    cursor: pointer;
    pointer-events: auto;
    border: none;
    user-select: none;
    border-radius: var(--border-radius-m);
    background: transparent;
    color: var(--font-color-m);
    position: relative;
    transition:
      background-color var(--motion-l) var(--motion-elastic),
      color var(--motion-l) var(--motion-elastic),
      box-shadow var(--motion-l) var(--motion-elastic),
      transform var(--motion-l) var(--motion-elastic),
      filter var(--motion-l) var(--motion-elastic),
      border-color var(--motion-l) var(--motion-elastic);
  }

  /* 1. Structural Modifiers */
  .wrapper.is-sm {
    min-height: var(--spacing-xl);
    padding: var(--spacing-xxs) var(--spacing-s);
    font-size: var(--font-size-xs);
  }

  .wrapper.is-square {
    padding: 0;
    width: var(--icon-m);
    height: var(--icon-m);
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

  /* 2. Thematic Variants */
  .variant-primary {
    background: var(--color-white);
    color: var(--color-chalk);
    box-shadow: var(--shadow-m);
  }

  .variant-secondary {
    background: var(--signature-color, var(--color-frozen));
    color: var(--color-white);
    box-shadow: var(--shadow-s);
    border: var(--border-l);
  }

  .variant-danger {
    background: transparent;
    color: var(--color-red);
  }

  .variant-invisible {
    background: transparent;
    color: var(--font-color-s);
  }

  /* 3. Operational States */
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

  .wrapper:hover:not(:disabled) {
    filter: var(--hover-brightness);
  }

  .wrapper.is-busy {
    cursor: wait;
    filter: brightness(0.8) grayscale(0.5);
    pointer-events: none;
  }

  /* 4. Interaction Logic */
  .variant-primary:hover:not(:disabled) {
    filter: brightness(1.05);
    box-shadow: var(--shadow-l);
    transform: scale(1.02);
  }

  .variant-secondary:hover:not(:disabled) {
    box-shadow: var(--shadow-m);
    border-color: var(--color-white);
  }

  .variant-danger:hover:not(:disabled) {
    background: var(--color-red);
    color: var(--color-white);
    box-shadow:
      0 0 1rem rgb(var(--color-red-rgb) / var(--opacity-s)),
      inset 0 0 0 var(--spacing-px) var(--color-red);
  }

  .variant-invisible:hover:not(:disabled) {
    background: transparent;
    color: var(--color-white);
    filter: brightness(1.2);
  }

  .wrapper :global(.icon) {
    pointer-events: none;
  }
</style>
