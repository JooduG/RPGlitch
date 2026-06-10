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

  import { use_actions } from "@actions";
  import { controlState } from "@state";
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

  // Thumb is w-4 (16px). bits-ui constrains thumb so its center tracks:
  // position = calc(pct% * (100% - 16px) / 100% + 8px)
  // We invert that: css_pct = (pct / 100) * (1 - 16/track_px) * 100 + 8/track_px * 100
  // Since we can't read track_px reactively, we emit the calc() string directly.
  const fill_start_css = $derived(
    `calc(${fill_start} * (100% - 16px) / 100 + ${fill_start === 0 ? "0px" : `${fill_start / 100} * 16px`})`,
  );
  const fill_end_css = $derived(
    `calc(${fill_end} * (100% - 16px) / 100 + ${fill_end / 100} * 16px)`,
  );

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
  class="
    group/slider
    relative
    flex
    w-full
    cursor-pointer
    flex-col
    justify-center
    gap-1

    {is_disabled || busy
    ? `
      opacity-30
      grayscale
    `
    : ''}
    {busy
    ? `
      cursor-wait
      brightness-90
      grayscale-50

      *:pointer-events-none
    `
    : ''}
    {className}"
  style="{style}; --state-fill-start: {fill_start_css}; --state-fill-end: {fill_end_css};"
  data-testid={test_id}
  aria-busy={busy}
  aria-disabled={is_disabled || busy}
  use:use_actions={actions}
>
  <span
    class="
      mb-1
      text-left
      font-sans
      text-xs
      font-bold
      tracking-widest
      whitespace-nowrap
      text-(--signature-color,#555d66)
      uppercase
      transition-[color,filter]
      duration-300
      ease-in-out
      select-none
      [text-shadow:0_0_10px_rgba(0,0,0,0.5)]

      {!is_disabled ? 'group-hover/slider:brightness-125' : ''}
    "
  >
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
      <div
        {...props}
        class="
          relative
          flex
          h-4
          w-full
          cursor-pointer
          touch-none
          items-center
          select-none
        "
      >
        <span
          class="
            relative
            h-1
            w-full
            rounded-full
            border-none
            bg-[linear-gradient(to_right,var(--empty-fill)_0%,var(--empty-fill)_var(--state-fill-start),var(--signature-color,#555d66)_var(--state-fill-start),var(--signature-color,#555d66)_var(--state-fill-end),var(--empty-fill)_var(--state-fill-end),var(--empty-fill)_100%)]
            shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
            transition-[filter]
            duration-300
            ease-in-out

            group-hover/slider:brightness-125
          "
        ></span>
        <Slider.Thumb index={0}>
          {#snippet child({ props: thumbProps })}
            <span
              {...thumbProps}
              class="
                absolute
                h-4
                w-4
                scale-100
                cursor-pointer
                rounded-full
                border-none
                transition-[transform,filter]
                duration-300
                ease-in-out

                {is_disabled
                ? `
                  bg-[#555d66]
                  opacity-30
                  shadow-none
                `
                : `
                  ${value > min ? 'bg-white' : 'bg-slate-50'}
                  shadow-[0_2px_8px_rgba(0,0,0,0.4)]

                  active:scale-[1.1]
                `}
              "
              style="{thumbProps.style}; top: 50%; transform: translate(-50%, -50%);"
            ></span>
          {/snippet}
        </Slider.Thumb>
      </div>
    {/snippet}
  </Slider.Root>
</label>
