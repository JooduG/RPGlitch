<script>
  let {
    label = "",
    variant = "primary", // primary | secondary | ghost | danger | glass | dashed | overlay | magic | tech | signature
    size = "md", // sm | md
    square = false, // Enforce 1:1 aspect ratio
    fullWidth = false, // Enforce 100% width
    className = "", // Allow local overrides
    children = null,
    onclick = null,
    ...restProps // Pass through disabled, etc.
  } = $props();
  let element;
  export function focus() {
    element?.focus();
  }
  /**
   * Helper to apply an array of actions to the button element.
   * Actions can be: [action] or [action, params]
   */
  function applyActions(node, actions) {
    const destructors = [];
    actions.forEach((item) => {
      const action = Array.isArray(item) ? item[0] : item;
      const params = Array.isArray(item) ? item[1] : undefined;
      if (typeof action === "function") {
        const result = action(node, params);
        if (result && result.destroy) {
          destructors.push(result.destroy);
        }
      }
    });
    return {
      destroy() {
        destructors.forEach((d) => d());
      },
    };
  }
</script>

<button
  bind:this={element}
  class="button button-{variant} {size === 'sm' ? 'button-sm' : ''} {square
    ? 'button-square'
    : ''} {fullWidth ? 'button-full' : ''} {className}"
  {...restProps}
  {onclick}
  use:applyActions={restProps.actions || []}
>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</button>

<style>
  .button {
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
    user-select: none;
    border: none;
    border-radius: var(--border-radius-m);
    background: transparent;
    color: var(--font-color-m);
    transition:
      background-color var(--motion-l) var(--motion-elastic),
      color var(--motion-l) var(--motion-elastic),
      box-shadow var(--motion-l) var(--motion-elastic),
      transform var(--motion-l) var(--motion-elastic),
      filter var(--motion-l) var(--motion-elastic);
  }

  /* 1. Modifiers & Globals (Structural) */
  .button.button-sm {
    min-height: var(--spacing-xl);
    padding: var(--spacing-xxs) var(--spacing-s);
    font-size: var(--font-size-xs);
  }

  .button.button-square {
    padding: 0;
    width: var(--icon-m);
    height: var(--icon-m);
    aspect-ratio: 1;
    flex-shrink: 0;
  }

  .button.button-square.button-sm {
    width: var(--icon-s);
    height: var(--icon-s);
  }

  .button.button-full {
    width: 100%;
    flex: 1;
  }

  .button-round {
    border-radius: var(--border-radius-full);
    padding: 0;
    width: var(--spacing-xxl);
    height: var(--spacing-xxl);
  }

  :global(.button-group-joined) .button {
    border-radius: 0;
    flex: 1;
  }

  :global(.button-group-pill) .button {
    border-radius: var(--border-radius-full);
    min-height: var(--spacing-xl);
  }

  /* 2. Variants (Thematic) */

  .button-primary {
    background: var(--color-frisk);
    color: var(--color-black);
    box-shadow: var(--shadow-m);
  }

  .button-ghost {
    color: var(--font-color-s);
  }

  .button-outline {
    background: var(--border-l);
    color: var(--font-color-s);
  }

  .button-danger {
    color: var(--color-white);
  }

  .button-dashed {
    border: 1px dashed var(--border-l);
    color: var(--font-color-s);
  }

  .button-overlay {
    position: absolute;
    inset: 0;
    z-index: var(--z-index-m);
    border-radius: 0;
    padding: 0;
    min-height: 0;
  }

  .button-magic {
    color: var(--color-frozen);
  }

  .button-tech {
    color: var(--color-frisk);
  }

  .button-signature {
    background: var(--signature-color, var(--color-frisk));
    color: var(--color-white);
    border: none;
    box-shadow: var(--shadow-s);
  }

  .button-glass {
    background: var(--glass-l); /* 15% Frisk */
    backdrop-filter: var(--blur-s);
    border: var(--border-m);
    color: var(--color-white);
  }

  .button-secondary {
    background: rgb(var(--color-frisk-rgb) / 10%); /* Subtle initial state */
    backdrop-filter: var(--blur-s);
    border: var(--border-s);
    color: var(--font-color-m);
  }

  .button-security {
    color: var(--font-color-m);
    box-shadow: 0 0 0 1px var(--color-frisk);
  }

  /* 3. Base States (Behavioral - Lower Specificity) */
  .button:focus-visible {
    outline: 2px solid var(--color-frisk);
    outline-offset: 2px;
  }

  .button:disabled,
  .button.disabled {
    opacity: var(--opacity-s);
    filter: grayscale(1);
    pointer-events: none;
    transform: none;
    box-shadow: none;
  }

  .button:active:not(:disabled, .disabled) {
    transform: scale(var(--motion-click, 0.95));
    transition-duration: var(--motion-l);
  }

  /* 4. The Hover Monster (Highest Specificity due to :not) */
  .button:hover:not(:disabled, .disabled) {
    /* Transitions inherited from base .button */
  }

  .button-primary:hover:not(:disabled, .disabled) {
    background: color-mix(in srgb, var(--color-frisk), var(--color-white) 5%);
    box-shadow: var(--shadow-l);
  }

  .button-ghost:hover:not(:disabled, .disabled) {
    background: transparent;
    color: var(--color-white);
    filter: brightness(1.2);
  }

  .button-outline:hover:not(:disabled, .disabled) {
    color: var(--color-white);
    background: transparent;
    filter: brightness(1.2);
  }

  .button-danger:hover:not(:disabled, .disabled) {
    background: var(--color-red);
    color: var(--color-white);
    box-shadow: 0 0 1rem rgb(var(--color-red-rgb) / var(--opacity-s));
  }

  .button-dashed:hover:not(:disabled, .disabled) {
    background: transparent;
    border-color: var(--font-color-m);
    color: var(--color-white);
    filter: brightness(1.2);
  }

  .button-magic:hover:not(:disabled, .disabled) {
    background: rgb(var(--color-frozen-rgb) / 15%);
    color: var(--color-white);
  }

  .button-tech:hover:not(:disabled, .disabled) {
    background: rgb(var(--color-frisk-rgb) / 15%);
    color: var(--color-white);
  }

  .button-signature:hover:not(:disabled, .disabled) {
    box-shadow: var(--shadow-m);
  }

  .button-glass:hover:not(:disabled, .disabled) {
    background: var(--glass-xl); /* 30% Nordic Deep Glass */
    backdrop-filter: var(--blur-m);
    border-color: var(--color-frisk);
    box-shadow: var(--shadow-m);
  }

  .button-secondary:hover:not(:disabled, .disabled) {
    background: var(--glass-l); /* 15% Frisk on hover */
    backdrop-filter: var(--blur-m);
  }

  .button-security:hover:not(:disabled, .disabled) {
    box-shadow: 0 0 0 1px var(--font-color-m);
  }

  .button :global(.icon) {
    pointer-events: none;
  }

  /* 5. Positional Overrides (Must be last) */
  :global(.button-group-joined) .button:first-child {
    border-radius: var(--border-radius-m) 0 0 var(--border-radius-m);
  }

  :global(.button-group-joined) .button:last-child {
    border-radius: 0 var(--border-radius-m) var(--border-radius-m) 0;
  }

  :global(.button-group-joined) .button:not(:last-child) {
    border-right: 1px solid var(--glass-s);
  }
</style>
