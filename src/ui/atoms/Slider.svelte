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
  style="{style}; --state-fill-start: {fill_start}%; --state-fill-end: {fill_end}%;"
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
    gap: var(--spacing-1);
    cursor: pointer;
  }

  .wrapper.is-disabled {
    opacity: var(--opacity-muted);
    filter: grayscale(1);
    cursor: default;
  }

  .wrapper.is-busy {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(0.5);
  }

  .wrapper.is-busy > * {
    pointer-events: none;
  }

  /* --- ELEMENTS --- */

  .header {
    font-family: var(--font-family-base);
    font-size: var(--font-size-tiny);
    color: var(--font-color-muted);
    text-transform: uppercase;
    text-align: left;
    letter-spacing: var(--font-spacing-loose);
    font-weight: var(--font-weight-bold);
    transition: color var(--duration-standard) var(--ease-standard);
    user-select: none;
    margin-bottom: var(--spacing-1);
  }

  /* Hover state for label */
  .wrapper:hover:not(.is-disabled) .header {
    color: var(--color-white);
  }

  input[type="range"] {
    display: block;
    width: 100%;
    margin: 0;
    height: var(--slider-thumb-size);
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
    height: var(--slider-track-height);
    background: linear-gradient(
      to right,
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-muted)) 0%,
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-muted)) var(--state-fill-start),
      var(--slider-fill-color-start) var(--state-fill-start),
      var(--slider-fill-color-start) var(--state-fill-end),
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-muted)) var(--state-fill-end),
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-muted)) 100%
    );
    box-shadow: inset 0 var(--spacing-pixel) var(--spacing-pixel)
      rgb(from var(--color-white) r g b / var(--opacity-ghost));
    border-radius: var(--radius-full);
    border: none;
  }

  input[type="range"]::-moz-range-track {
    width: 100%;
    height: var(--slider-track-height);
    background: linear-gradient(
      to right,
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-muted)) 0%,
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-muted)) var(--state-fill-start),
      var(--slider-fill-color-start) var(--state-fill-start),
      var(--slider-fill-color-start) var(--state-fill-end),
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-muted)) var(--state-fill-end),
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-muted)) 100%
    );
    box-shadow: inset 0 var(--spacing-pixel) var(--spacing-pixel)
      rgb(from var(--color-white) r g b / var(--opacity-ghost));
    border-radius: var(--radius-full);
    border: none;
  }

  /* Thumb Styling */
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: var(--slider-thumb-size);
    height: var(--slider-thumb-size);
    background: var(--color-white);
    border-radius: var(--radius-full);
    cursor: pointer;
    box-shadow: var(--slider-thumb-shadow);
    margin-top: calc(
      (var(--slider-track-height) - var(--slider-thumb-size)) / 2
    ); /* Centering on track */

    border: none;
    transition:
      transform var(--duration-standard) var(--ease-elastic),
      filter var(--duration-standard) var(--ease-standard);
  }

  input[type="range"]::-moz-range-thumb {
    appearance: none;
    width: var(--slider-thumb-size);
    height: var(--slider-thumb-size);
    background: var(--color-white);
    border-radius: var(--radius-full);
    cursor: pointer;
    box-shadow: var(--slider-thumb-shadow);
    margin-top: calc(
      (var(--slider-track-height) - var(--slider-thumb-size)) / 2
    ); /* Centering on track */

    border: none;
    transition:
      transform var(--duration-standard) var(--ease-elastic),
      filter var(--duration-standard) var(--ease-standard);
  }

  /* --- STATES --- */

  .wrapper:hover:not(.is-disabled) input[type="range"]::-webkit-slider-thumb {
    filter: var(--hover-glow);
  }

  .wrapper:hover:not(.is-disabled) input[type="range"]::-moz-range-thumb {
    filter: var(--hover-glow);
  }

  input[type="range"]:active:not(:disabled)::-webkit-slider-thumb {
    transform: var(--scale-lift);
  }

  input[type="range"]:active:not(:disabled)::-moz-range-thumb {
    transform: var(--scale-lift);
  }

  input[type="range"]:disabled::-webkit-slider-thumb {
    appearance: none;
    background: var(--color-frozen);
    opacity: var(--opacity-muted);
    box-shadow: none;
    border: none;
  }

  input[type="range"]:disabled::-moz-range-thumb {
    background: var(--color-frozen);
    opacity: var(--opacity-muted);
    box-shadow: none;
    border: none;
  }
</style>
