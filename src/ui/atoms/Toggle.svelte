<script>
  /**
   * @typedef {Object} Props
   * @property {boolean} [value] - Current toggle state.
   * @property {string} [label] - Optional label text.
   * @property {"md" | "sm"} [size] - Component scale.
   * @property {boolean} [disabled] - Interactive lock state.
   * @property {boolean} [busy] - Async lock state.
   * @property {any[]} [actions] - Svelte actions.
   * @property {string} [class] - External styling.
   * @property {string} [style] - Inline styling.
   * @property {(e: Event & { currentTarget: HTMLInputElement }) => void} [onchange] - Change callback.
   */

  import { use_actions } from "@ui/utils/use-actions.js";

  /** @type {Props} */
  let {
    value = $bindable(false),
    label = "",
    size = "md",
    disabled = false,
    busy = false,
    actions = [],
    class: className = "",
    style = "",
    onchange = undefined,
    ...rest
  } = $props();

  // Derived identifier for testing
  const test_id = $derived(
    label ? `${label.toLowerCase().replace(/\s+/g, "-")}-toggle` : undefined,
  );
</script>

<label
  class="wrapper {className}"
  class:is-disabled={disabled || busy}
  class:is-busy={busy}
  class:is-sm={size === "sm"}
  aria-busy={busy}
  aria-disabled={disabled || busy}
  {style}
  use:use_actions={actions}
>
  <input
    type="checkbox"
    {...rest}
    bind:checked={value}
    disabled={disabled || busy}
    {onchange}
    data-testid={test_id}
  />
  <span class="track"></span>

  {#if label}
    <span class="label">{label}</span>
  {/if}
</label>

<style>
  .wrapper {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-m);
    cursor: pointer;
    user-select: none;
    position: relative;
    padding: var(--spacing-xxs) 0;
    transition: opacity var(--motion-l);

    /* Internal Tokens */
    --switch-w: 2.8rem;
    --switch-h: 1.25rem;
    --thumb-size: 1rem;
  }

  /* --- MODIFIERS --- */

  .wrapper.is-disabled {
    opacity: var(--opacity-m);
    cursor: default;
  }

  .wrapper.is-busy {
    cursor: wait;
    filter: brightness(0.8) grayscale(0.5);
  }

  .wrapper.is-busy > * {
    pointer-events: none;
  }

  .wrapper.is-sm {
    --switch-w: 2.22rem;
    --switch-h: 1rem;
    --thumb-size: 0.8rem;
  }

  /* --- ELEMENTS --- */

  /* Logic Kernel */
  .wrapper input {
    opacity: var(--opacity-none);
    width: 0;
    height: 0;
    position: absolute;
  }

  /* The Track */
  .track {
    position: relative;
    width: var(--switch-w);
    height: var(--switch-h);
    background-color: var(--glass-xs);
    border-radius: var(--border-radius-full);
    transition: all var(--motion-l) var(--motion-elastic);
    flex-shrink: 0;
  }

  /* The Thumb */
  .track::before {
    content: "";
    position: absolute;
    height: var(--thumb-size);
    width: var(--thumb-size);
    left: calc((var(--switch-h) - var(--thumb-size)) / 2);
    top: calc((var(--switch-h) - var(--thumb-size)) / 2);
    background-color: var(--color-frisk);
    border-radius: var(--border-radius-full);
    transition: all var(--motion-l) var(--motion-elastic);
  }

  /* --- STATES --- */

  /* Hover Interaction */
  .wrapper:hover:not(.is-disabled) .track::before {
    filter: brightness(1.2);
  }

  /* Checked Appearance */
  .wrapper input:checked + .track {
    background-color: rgb(var(--color-frozen-rgb) / 60%);
  }

  .wrapper input:checked + .track::before {
    transform: translateX(
      calc(var(--switch-w) - var(--thumb-size) - (var(--switch-h) - var(--thumb-size)))
    );
    background-color: var(--color-white);
    box-shadow: 0 0 var(--spacing-xs) rgb(var(--color-white-rgb) / var(--opacity-m));
  }

  /* Label Styling */
  .label {
    color: var(--font-color-s);
    font-weight: var(--font-weight-l);
    font-size: var(--font-size-tiny);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-family: var(--font-family-body);
    transition: color var(--motion-l);
    white-space: nowrap;
  }

  .wrapper:hover:not(.is-disabled) .label {
    color: var(--color-white);
  }

  /* Accessibility Focus */
  .wrapper input:focus-visible + .track {
    outline: 2px solid var(--color-frozen);
    outline-offset: 2px;
  }
</style>
