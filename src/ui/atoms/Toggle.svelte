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
    /* Layout */
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-m);
    padding: var(--spacing-xxs) 0;
    
    /* Interaction */
    cursor: pointer;
    user-select: none;
    transition: opacity var(--motion-l);

    /* Internal Geometry (Chalk Regime Mapping) */
    --toggle-w: calc(var(--spacing-xl) + var(--spacing-s));
    --toggle-h: var(--font-size-h5);
    --thumb-size: var(--spacing-m);
    --thumb-offset: calc((var(--toggle-h) - var(--thumb-size)) / 2);
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
    --toggle-w: calc(var(--spacing-xl) + var(--spacing-xxs));
    --toggle-h: var(--spacing-m);
    --thumb-size: var(--font-size-small);
  }

  /* --- ELEMENTS --- */

  /* Logic Kernel (Hidden Input) */
  input {
    position: absolute;
    width: var(--spacing-0);
    height: var(--spacing-0);
    opacity: var(--opacity-none);
    pointer-events: none;
  }

  /* The Track */
  .track {
    position: relative;
    flex-shrink: 0;
    width: var(--toggle-w);
    height: var(--toggle-h);
    background-color: var(--glass-xs);
    border-radius: var(--border-radius-full);
    transition: all var(--motion-l) var(--motion-elastic);
  }

  /* The Thumb */
  .track::before {
    content: "";
    position: absolute;
    top: var(--thumb-offset);
    left: var(--thumb-offset);
    width: var(--thumb-size);
    height: var(--thumb-size);
    background-color: var(--color-frisk);
    border-radius: var(--border-radius-full);
    transition: all var(--motion-l) var(--motion-elastic);
  }

  /* Label Styling */
  .label {
    font-family: var(--font-family-body);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-l);
    color: var(--font-color-s);
    letter-spacing: var(--letter-spacing-l);
    text-transform: uppercase;
    white-space: nowrap;
    transition: color var(--motion-l);
  }

  /* --- STATES --- */

  /* Hover Interaction */
  .wrapper:hover:not(.is-disabled) .track::before {
    filter: var(--hover-brightness);
  }

  .wrapper:hover:not(.is-disabled) .label {
    color: var(--color-white);
  }

  /* Checked Appearance */
  input:checked + .track {
    background-color: rgb(var(--color-frozen-rgb) / var(--opacity-xl));
  }

  input:checked + .track::before {
    background-color: var(--color-white);
    transform: translateX(calc(var(--toggle-w) - var(--thumb-size) - (var(--thumb-offset) * 2)));
    box-shadow: 0 0 var(--spacing-xs) rgb(var(--color-white-rgb) / var(--opacity-m));
  }

  /* Accessibility Focus */
  input:focus-visible + .track {
    outline: var(--spacing-2px) solid var(--color-frozen);
    outline-offset: var(--spacing-2px);
  }
</style>
