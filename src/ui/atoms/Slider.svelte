<script>
  import { use_actions } from "@ui/utils/use-actions.js";
  /**
   * @typedef {Object} Props
   * @property {number} [value] - Current slider value.
   * @property {number} [min] - Minimum range value.
   * @property {number} [max] - Maximum range value.
   * @property {number} [step] - Incremental step size.
   * @property {boolean} [disabled] - Interactive lock state.
   * @property {boolean} [busy] - Async lock state.
   * @property {string} [label] - Descriptive label.
   * @property {number | null} [neutral] - The 'zero' point for the fill gradient.
   * @property {any[]} [actions] - Svelte actions orchestration.
   * @property {string} [class] - External styling.
   * @property {string} [style] - Inline styling.
   * @property {(e: Event & { currentTarget: HTMLInputElement }) => void} [onchange] - Change callback.
   */

  /** @type {Props} */
  let {
    value = $bindable(1.0),
    min = 0,
    max = 2.0,
    step = 0.1,
    disabled = false,
    busy = false,
    label = "",
    neutral = null,
    actions = [],
    class: className = "",
    style = "",
    onchange = undefined,
    ...rest
  } = $props();

  // Logic Calculations
  const center_val = $derived(neutral ?? (min + max) / 2);
  const val_pct = $derived(((value - min) / (max - min)) * 100);
  const center_pct = $derived(((center_val - min) / (max - min)) * 100);

  const fill_start = $derived(Math.min(val_pct, center_pct));
  const fill_end = $derived(Math.max(val_pct, center_pct));

  // Diagnostic identifier
  const test_id = $derived(
    label ? `${label.toLowerCase().replace(/\s+/g, "-")}-slider` : "generic-slider",
  );
</script>

<label
  class="wrapper {className}"
  class:is-disabled={disabled || busy}
  class:is-busy={busy}
  style="{style}; --fill-start: {fill_start}%; --fill-end: {fill_end}%;"
  data-testid={test_id}
  aria-busy={busy}
  aria-disabled={disabled || busy}
  use:use_actions={actions}
>
  <span class="header">
    {label.toUpperCase()}: {busy ? "BUSY..." : disabled ? "DISABLED" : (value ?? 1.0).toFixed(1)}
  </span>
  <input
    type="range"
    {...rest}
    {min}
    {max}
    {step}
    bind:value
    disabled={disabled || busy}
    {onchange}
  />
</label>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    width: 100%;
    gap: var(--spacing-xxs);
    cursor: pointer;
  }

  .wrapper.is-disabled {
    opacity: var(--opacity-s);
    filter: grayscale(1);
    cursor: default;
  }

  .wrapper.is-busy {
    cursor: wait;
    filter: brightness(0.8) grayscale(0.5);
  }

  .wrapper.is-busy > * {
    pointer-events: none;
  }

  /* --- ELEMENTS --- */

  .header {
    font-family: var(--font-family-body);
    font-size: var(--font-size-xxs);
    color: var(--font-color-s);
    text-transform: uppercase;
    text-align: left;
    letter-spacing: 0.12em;
    font-weight: var(--font-weight-l);
    transition: color var(--motion-l);
    user-select: none;
    margin-bottom: var(--spacing-xxs);
  }

  /* Hover state for label */
  .wrapper:hover:not(.is-disabled) .header {
    color: var(--color-white);
  }

  input[type="range"] {
    display: block;
    width: 100%;
    margin: 0;
    height: var(--spacing-s);
    background: transparent;
    appearance: none;
    outline: none;
    border: none;
    padding: 0;
    overflow: visible;
  }

  /* Track Styling */
  input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 0.25rem;
    background: linear-gradient(
      to right,
      var(--glass-xs) 0%,
      var(--glass-xs) var(--fill-start),
      var(--color-frozen) var(--fill-start),
      var(--color-frozen) var(--fill-end),
      var(--glass-xs) var(--fill-end),
      var(--glass-xs) 100%
    );
    box-shadow: inset var(--spacing-0) var(--spacing-px) var(--spacing-xxxs) var(--color-white-glow);
    border-radius: var(--border-radius-full);
    border: none;
  }

  input[type="range"]::-moz-range-track {
    width: 100%;
    height: 0.25rem;
    background: linear-gradient(
      to right,
      var(--glass-xs) 0%,
      var(--glass-xs) var(--fill-start),
      var(--color-frozen) var(--fill-start),
      var(--color-frozen) var(--fill-end),
      var(--glass-xs) var(--fill-end),
      var(--glass-xs) 100%
    );
    box-shadow: inset var(--spacing-0) var(--spacing-px) var(--spacing-xxxs) var(--color-white-glow);
    border-radius: var(--border-radius-full);
    border: none;
  }

  /* Thumb Styling */
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: var(--spacing-s);
    height: var(--spacing-s);
    background: var(--color-white);
    border-radius: var(--border-radius-full);
    cursor: pointer;
    --thumb-shadow: 0 0 var(--spacing-xs) var(--color-white), var(--shadow-s);

    box-shadow: var(--thumb-shadow);
    margin-top: calc(var(--spacing-xxs) * -1); /* Centering on var(--spacing-xxs) track */
    border: none;
    transition:
      transform var(--motion-l) var(--motion-elastic),
      filter var(--motion-l);
  }

  input[type="range"]::-moz-range-thumb {
    appearance: none;
    width: var(--spacing-s);
    height: var(--spacing-s);
    background: var(--color-white);
    border-radius: var(--border-radius-full);
    cursor: pointer;
    --thumb-shadow: 0 0 var(--spacing-xs) var(--color-white), var(--shadow-s);

    box-shadow: var(--thumb-shadow);
    border: none;
    transition:
      transform var(--motion-l) var(--motion-elastic),
      filter var(--motion-l);
  }

  /* --- STATES --- */

  .wrapper:hover:not(.is-disabled) input[type="range"]::-webkit-slider-thumb {
    filter: brightness(1.2);
  }

  .wrapper:hover:not(.is-disabled) input[type="range"]::-moz-range-thumb {
    filter: brightness(1.2);
  }

  input[type="range"]:active:not(:disabled)::-webkit-slider-thumb {
    transform: scale(1.3);
  }

  input[type="range"]:active:not(:disabled)::-moz-range-thumb {
    transform: scale(1.3);
  }

  input[type="range"]:disabled::-webkit-slider-thumb {
    appearance: none;
    background: var(--color-frozen);
    opacity: var(--opacity-s);
    box-shadow: none;
    border: none;
  }

  input[type="range"]:disabled::-moz-range-thumb {
    background: var(--color-frozen);
    opacity: var(--opacity-s);
    box-shadow: none;
    border: none;
  }
</style>
