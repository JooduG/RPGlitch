<script>
  let {
    label = "",
    variant = "primary", // primary | secondary | danger | invisible
    cover = false, // If true, absolute-fills the parent (replaces old overlay)
    size = "md", // sm | md
    square = false, // Enforce 1:1 aspect ratio
    fullWidth = false, // Enforce 100% width
    className = "", // Allow local overrides
    children = null,
    onclick = null,
    actions = [],
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
  class="button button-{variant} {cover ? 'button-cover' : ''} {size === 'sm' ? 'button-sm' : ''} {square
    ? 'button-square'
    : ''} {fullWidth ? 'button-full' : ''} {className}"
  {...restProps}
  {onclick}
  use:applyActions={actions}
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
    border: none;
    user-select: none;
    border-radius: var(--border-radius-m);
    background: transparent;
    color: var(--font-color-m);
    position: relative; /* Anchor tooltips correctly */
    transition:
      background-color var(--motion-l) var(--motion-elastic),
      color var(--motion-l) var(--motion-elastic),
      box-shadow var(--motion-l) var(--motion-elastic),
      transform var(--motion-l) var(--motion-elastic),
      filter var(--motion-l) var(--motion-elastic),
      border-color var(--motion-l) var(--motion-elastic);
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

  .button.button-cover {
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

  /* 2. Variants (Thematic) */

  /* Primary: "Pure" style - Solid White/Chalk */
  .button-primary {
    background: var(--color-white);
    color: var(--color-chalk);
    box-shadow: var(--shadow-m);
    border: none;
  }

  /* Secondary: "Signature" style - Themed Frisk */
  .button-secondary {
    background: var(--signature-color, var(--color-frozen));
    color: var(--color-white);
    box-shadow: var(--shadow-s);
    border: var(--border-l);
  }

  /* Danger: High-alert Action */
  .button-danger {
    background: transparent;
    color: var(--color-red);
    border: none;
    box-shadow: none;
  }

  /* Invisible: No background/border (unless cover is used for interaction) */
  .button-invisible {
    background: transparent;
    color: var(--font-color-s);
    box-shadow: none;
    border: none;
  }

  /* 3. Operational States */

  .button:focus-visible {
    outline: 2px solid var(--color-white);
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
  }

  /* 4. The Hover Logic (Internalized) */

  .button:hover:not(:disabled, .disabled) {
    filter: var(--hover-brightness);
  }

  .button-primary:hover:not(:disabled, .disabled) {
    filter: brightness(1.05);
    box-shadow: var(--shadow-l);
    transform: scale(1.02);
  }

  .button-secondary:hover:not(:disabled, .disabled) {
    box-shadow: var(--shadow-m);
    border-color: var(--color-white);
  }

  .button-danger:hover:not(:disabled, .disabled) {
    background: var(--color-red);
    color: var(--color-white);
    box-shadow: 
      0 0 1rem rgb(var(--color-red-rgb) / var(--opacity-s)),
      inset 0 0 0 var(--spacing-px) var(--color-red);
  }

  .button-invisible:hover:not(:disabled, .disabled) {
    background: transparent;
    color: var(--color-white);
    filter: brightness(1.2);
  }

  .button :global(.icon) {
    pointer-events: none;
  }

  /* 5. Positional Overrides (Must be last) */
  :global(.button-group-joined) .button {
    border-radius: 0;
    flex: 1;
  }

  :global(.button-group-joined) .button:first-child {
    border-radius: var(--border-radius-m) 0 0 var(--border-radius-m);
  }

  :global(.button-group-joined) .button:last-child {
    border-radius: 0 var(--border-radius-m) var(--border-radius-m) 0;
  }

  :global(.button-group-joined) .button:not(:last-child) {
    border-right: var(--spacing-px) solid var(--glass-s);
  }
</style>


