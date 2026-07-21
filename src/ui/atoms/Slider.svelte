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
   * @property {(v: number) => string} [format] - Optional custom value formatter function.
   * @property {any[]} [actions] - Svelte actions orchestration.
   * @property {string} [class] - External styling.
   * @property {string} [style] - Inline styling.
   * @property {(e: Event & { currentTarget: HTMLInputElement }) => void} [onchange] - Change callback.
   * @property {boolean} [horizontal] - Render in horizontal row layout.
   * @property {string} [disabled_label] - Override label text when disabled.
   * @property {boolean} [show_value_tooltip] - Show reactive value tooltip.
   */

  import { use_actions } from "@actions";
  import { simulationState } from "@state";
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
    format = (v) => v.toFixed(1),
    actions = [],
    class: className = "",
    style = "",
    onchange = undefined,
    horizontal = false,
    disabled_label = "DISABLED",
    show_value_tooltip = false,
    ...rest
  } = $props();

  // Logic Calculations for Gradient Track
  const center_val = $derived(neutral ?? (min + max) / 2);
  const val_pct = $derived(((value - min) / (max - min)) * 100);
  const center_pct = $derived(((center_val - min) / (max - min)) * 100);

  const fill_start = $derived(Math.min(val_pct, center_pct));
  const fill_end = $derived(Math.max(val_pct, center_pct));

  // Thumb is w-4 (16px). bits-ui constrains thumb so its center tracks:
  // position = calc(pct% * (100% - 16px) / 100% + 8px)
  // We invert that: css_pct = (pct / 100) * (1 - 16/track_px) * 100 + 8/track_px * 100
  // Since we can't read track_px reactively, we emit the calc() string directly.
  const fill_start_css = $derived(fill_start === 0 ? "0px" : fill_start === 100 ? "100%" : `calc(${fill_start} * (100% - 16px) / 100 + 8px)`);
  const fill_end_css = $derived(fill_end === 0 ? "0px" : fill_end === 100 ? "100%" : `calc(${fill_end} * (100% - 16px) / 100 + 8px)`);

  // Diagnostic identifier
  const test_id = $derived(label ? `${label.toLowerCase().replace(/\s+/g, "-")}-slider` : "generic-slider");

  let is_disabled = $derived(disabled || simulationState.intent_active);

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

  let is_active = $state(false);
  let is_hovered = $state(false);

  /** @param {MouseEvent | FocusEvent} e */
  function handle_enter(e) {
    if (!show_value_tooltip) return;
    if (e instanceof MouseEvent && e.type === "mouseover" && e.currentTarget.contains(/** @type {Node} */ (e.relatedTarget))) return;
    is_hovered = true;
  }

  /** @param {MouseEvent | FocusEvent} e */
  function handle_leave(e) {
    if (!show_value_tooltip) return;
    if (e instanceof MouseEvent && e.type === "mouseout" && e.currentTarget.contains(/** @type {Node} */ (e.relatedTarget))) return;
    is_hovered = false;
  }

  function handle_pointer_down() {
    if (!show_value_tooltip) return;
    is_active = true;
  }

  function handle_pointer_up() {
    if (is_active) {
      is_active = false;
    }
  }

  // Tooltip Portal Logic
  let tooltip_pos = $state({ x: 0, y: 0 });
  let thumb_el = $state();
  let tooltip_el = $state();

  $effect(() => {
    if (tooltip_el) {
      document.body.appendChild(tooltip_el);
      return () => {
        if (tooltip_el && tooltip_el.parentNode) {
          tooltip_el.parentNode.removeChild(tooltip_el);
        }
      };
    }
  });

  $effect(() => {
    // Reactive dependencies
    value;
    if (show_value_tooltip && (is_hovered || is_active) && thumb_el && tooltip_el) {
      const rect = thumb_el.getBoundingClientRect();
      tooltip_pos.x = rect.left + rect.width / 2;
      tooltip_pos.y = rect.top;
    }
  });
</script>

<svelte:window onpointerup={handle_pointer_up} />

<label
  class="
    group/slider
    relative
    flex
    cursor-pointer
    {horizontal ? 'flex-1 flex-row items-center justify-between gap-4 py-1' : 'w-full flex-col justify-center gap-1'}

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
  onmouseover={handle_enter}
  onmouseout={handle_leave}
  onfocus={handle_enter}
  onblur={handle_leave}
  onpointerdown={handle_pointer_down}
>
  {#if label}
    <span
      class="
        {horizontal ? '' : 'mb-1'}
        text-left
        font-sans
        text-xs
        font-bold
        tracking-widest
        whitespace-nowrap
        text-slate-400
        uppercase
        transition-[color,filter]
        duration-300
        ease-in-out
        select-none
        [text-shadow:0_0_10px_rgba(0,0,0,0.5)]

        {!is_disabled ? 'group-hover/slider:brightness-125' : ''}
      "
    >
      {label.toUpperCase()}: {busy ? "BUSY..." : is_disabled ? disabled_label : format(value ?? 1.0)}
    </span>
  {/if}

  <Slider.Root type="single" {value} onValueChange={handle_value_change} {min} {max} {step} disabled={is_disabled || busy} {...rest}>
    {#snippet child({ props })}
      <div
        {...props}
        class="
          relative
          flex
          h-4
          {horizontal ? 'flex-1' : 'w-full'}
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
              bind:this={thumb_el}
              {...thumbProps}
              class="
                absolute
                h-4
                w-4
                scale-100
                cursor-pointer
                rounded-full
                border-none
                transition-[scale,filter,background-color,box-shadow]
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
              style="{thumbProps.style}; top: 50%; transform: translateY(-50%);"
            >
            </span>
          {/snippet}
        </Slider.Thumb>
      </div>
    {/snippet}
  </Slider.Root>
</label>

{#if show_value_tooltip}
  <div
    bind:this={tooltip_el}
    class="
      pointer-events-none fixed z-9999
      mb-3 w-max max-w-[400px]
      -translate-x-1/2 -translate-y-full
      rounded-md border border-slate-600 bg-neutral-900/98
      px-2 py-1.5
      text-center font-sans text-xs/normal tracking-normal whitespace-normal text-slate-50 normal-case
      shadow-lg
      transition-[opacity,transform] duration-150 ease-out
      {is_hovered || is_active ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
    "
    style="left: {tooltip_pos.x}px; top: {tooltip_pos.y}px;"
  >
    {is_disabled ? disabled_label : format(value ?? 1.0)}
    <!-- Down Arrow -->
    <div class="absolute bottom-[-8px] left-1/2 z-0 size-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-slate-600">
      <div class="absolute bottom-px left-1/2 size-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-neutral-900"></div>
    </div>
  </div>
{/if}
