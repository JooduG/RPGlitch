<script>
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

  import { controlState } from "@state";
  import { use_actions } from "@ui/actions";
  import { Slider } from "bits-ui";

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

  // Logic Calculations for Nordic Gradient Track
  const center_val = $derived(neutral ?? (min + max) / 2);
  const val_pct = $derived(((value - min) / (max - min)) * 100);
  const center_pct = $derived(((center_val - min) / (max - min)) * 100);

  const fill_start = $derived(Math.min(val_pct, center_pct));
  const fill_end = $derived(Math.max(val_pct, center_pct));

  // Diagnostic identifier
  const test_id = $derived(
    label ? `${label.toLowerCase().replace(/\s+/g, "-")}-slider` : "generic-slider",
  );

  let is_disabled = $derived(disabled || controlState.intent_active);

  /**
   * Adapts bits-ui number value to the backward compatible HTMLInputElement event structure.
   * @param {number} val
   */
  function handle_value_change(val) {
    value = val;

    if (onchange) {
      // Create a mock HTMLInputElement that supports standard .value and range configurations
      const mockInput = Object.assign(document.createElement("input"), {
        type: "range",
        min: String(min),
        max: String(max),
        step: String(step),
        value: String(val),
      });

      const event = new Event("change", { bubbles: true });
      Object.defineProperty(event, "currentTarget", {
        value: mockInput,
        writable: false,
      });
      Object.defineProperty(event, "target", {
        value: mockInput,
        writable: false,
      });

      onchange(/** @type {any} */ (event));
    }
  }
</script>

<label
  class="root {className}"
  class:is-disabled={is_disabled || busy}
  class:is-busy={busy}
  style="{style}; --state-fill-start: {fill_start}%; --state-fill-end: {fill_end}%;"
  data-testid={test_id}
  aria-busy={busy}
  aria-disabled={is_disabled || busy}
  use:use_actions={actions}
>
  <span class="header">
    {label.toUpperCase()}: {busy ? "BUSY..." : is_disabled ? "DISABLED" : (value ?? 1.0).toFixed(1)}
  </span>

  <Slider.Root
    type="single"
    {value}
    onValueChange={handle_value_change}
    {min}
    {max}
    {step}
    disabled={is_disabled || busy}
    {...rest}
  >
    {#snippet child({ props })}
      <div {...props} class="slider-root">
        <span class="slider-track"></span>
        <Slider.Thumb index={0}>
          {#snippet child({ props: thumbProps })}
            <span
              {...thumbProps}
              class="slider-thumb"
              style="{thumbProps.style}; top: 50%; transform: translate(-50%, -50%);"
            ></span>
          {/snippet}
        </Slider.Thumb>
      </div>
    {/snippet}
  </Slider.Root>
</label>

<style>
  .root {
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    width: 100%;
    gap: var(--gap-tight);
    cursor: pointer;
  }

  .root.is-disabled {
    opacity: var(--opacity-whisper);
    filter: grayscale(1);
    cursor: default;
  }

  .root.is-busy {
    cursor: wait;
    filter: var(--brightness-dim) grayscale(0.5);
  }

  .root.is-busy > * {
    pointer-events: none;
  }

  /* --- ELEMENTS --- */

  .header {
    font-family: var(--font-family-base);
    font-size: var(--font-size-tiny);
    color: var(--frozen);
    text-transform: uppercase;
    text-align: left;
    letter-spacing: var(--font-spacing-loose);
    font-weight: var(--font-weight-bold);
    transition: color var(--duration-standard) var(--ease-standard);
    user-select: none;
    margin-bottom: var(--margin-tight);
  }

  /* Hover state for label */
  .root:hover:not(.is-disabled) .header {
    color: var(--pure-white);
  }

  /* Interactive base layout area replacing transparent range input */
  .slider-root {
    display: flex;
    align-items: center;
    position: relative;
    width: 100%;
    height: var(--slider-thumb-size);
    touch-action: none;
    user-select: none;
    cursor: pointer;
  }

  /* Track Styling */
  .slider-track {
    position: relative;
    width: 100%;
    height: var(--slider-track-height);
    background: linear-gradient(
      to right,
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-whisper)) 0%,
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-whisper)) var(--state-fill-start),
      var(--slider-fill-color-start) var(--state-fill-start),
      var(--slider-fill-color-start) var(--state-fill-end),
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-whisper)) var(--state-fill-end),
      rgb(from var(--slider-fill-color-end) r g b / var(--opacity-whisper)) 100%
    );
    box-shadow: inset 0 var(--border-width-base) var(--border-width-base)
      rgb(from var(--pure-white) r g b / var(--opacity-ghost));
    border-radius: var(--radius-full);
    border: none;
  }

  /* Thumb Styling */
  .slider-thumb {
    position: absolute;
    width: var(--slider-thumb-size);
    height: var(--slider-thumb-size);
    background: var(--pure-white);
    border-radius: var(--radius-full);
    cursor: pointer;
    box-shadow: var(--slider-thumb-shadow);
    border: none;
    transition:
      transform var(--duration-standard) var(--ease-elastic),
      filter var(--duration-standard) var(--ease-standard);
  }

  /* --- STATES --- */

  .root:hover:not(.is-disabled) .slider-thumb {
    filter: var(--brightness-glow);
  }

  .slider-thumb:active:not(:disabled) {
    transform: translate(-50%, -50%) var(--scale-lift) !important;
  }

  .root.is-disabled .slider-thumb {
    background: var(--frozen);
    opacity: var(--opacity-whisper);
    box-shadow: none;
    border: none;
  }
</style>
