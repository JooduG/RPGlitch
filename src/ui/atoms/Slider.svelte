<script>
  /**
   * @file src/ui/atoms/Slider.svelte
   * Range slider atom wrapping bits-ui Slider with centered neutral gradient track and optional value tooltip.
   */
  import { clamp, use_actions } from "@utils";
  import { Slider } from "bits-ui";
  import Label from "./Label.svelte";

  let {
    value = $bindable(1.0),
    min = 0,
    max = 2.0,
    step = 0.1,
    disabled = false,
    busy = false,
    label = "",
    neutral = null,
    format = (v) => (step < 0.1 ? Number(v).toFixed(2) : Number(v).toFixed(1)),
    actions = [],
    class: className = "",
    style = "",
    onchange = undefined,
    horizontal = false,
    disabled_label = "DISABLED",
    show_value_tooltip = false,
    ...rest
  } = $props();

  const control_id = $props.id();
  const is_locked = $derived(disabled || busy);
  const test_id = $derived(label ? `${label.toLowerCase().replace(/\s+/g, "-")}-slider` : "generic-slider");

  const span = $derived(max - min);
  const center_val = $derived(neutral ?? (min + max) / 2);
  const val_pct = $derived(span > 0 ? clamp(((value - min) / span) * 100, 0, 100) : 0);
  const center_pct = $derived(span > 0 ? clamp(((center_val - min) / span) * 100, 0, 100) : 0);

  const to_track_css = (pct) =>
    pct === 0 ? "0px"
    : pct === 100 ? "100%"
    : `calc(${pct} * (100% - 16px) / 100 + 8px)`;
  const fill_start_css = $derived(to_track_css(Math.min(val_pct, center_pct)));
  const fill_end_css = $derived(to_track_css(Math.max(val_pct, center_pct)));

  let is_active = $state(false);
  let is_hovered = $state(false);
  let tooltip_pos = $state({ x: 0, y: 0 });
  /** @type {HTMLElement | undefined} */
  let thumb_el = $state();

  function portal(node) {
    document.body.appendChild(node);
    return { destroy: () => node.remove() };
  }

  $effect(() => {
    void value;
    if (show_value_tooltip && (is_hovered || is_active) && thumb_el) {
      const rect = thumb_el.getBoundingClientRect();
      tooltip_pos = { x: rect.left + rect.width / 2, y: rect.top };
    }
  });
</script>

<svelte:window onpointerup={() => (is_active = false)} onpointercancel={() => (is_active = false)} />

<div
  class={[
    "group/slider relative flex cursor-pointer",
    horizontal ? "flex-1 flex-row items-center justify-between gap-standard py-1" : "w-full flex-col justify-center gap-tight",
    is_locked && "opacity-30 grayscale",
    busy && "cursor-wait brightness-90 grayscale-50 *:pointer-events-none",
    className,
  ]}
  style="{style}; --state-fill-start: {fill_start_css}; --state-fill-end: {fill_end_css};"
  data-testid={test_id}
  aria-busy={busy}
  aria-disabled={is_locked}
  role="group"
  use:use_actions={actions}
  onpointerenter={() => show_value_tooltip && (is_hovered = true)}
  onpointerleave={() => show_value_tooltip && (is_hovered = false)}
  onfocusin={() => show_value_tooltip && (is_hovered = true)}
  onfocusout={(e) => {
    if (!show_value_tooltip) return;
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    is_hovered = false;
  }}
  onpointerdown={() => show_value_tooltip && (is_active = true)}>
  {#if label}
    <Label
      for={control_id}
      disabled={is_locked}
      class={[!horizontal && "mt-tight", "w-auto flex-none [text-shadow:0_0_10px_rgba(0,0,0,0.5)]", !disabled && "group-hover/slider:brightness-125"]}>
      {label}: {busy ? "BUSY..."
      : disabled ? disabled_label
      : format(value ?? 1.0)}
    </Label>
  {/if}

  <Slider.Root
    type="single"
    {value}
    onValueChange={(val) => {
      value = val;
      onchange?.(val);
    }}
    {min}
    {max}
    {step}
    disabled={is_locked}
    id={control_id}
    {...rest}>
    {#snippet child({ props })}
      <div {...props} class={["relative flex h-4 cursor-pointer touch-none items-center select-none", horizontal ? "flex-1" : "w-full"]}>
        <span
          class="relative h-1 w-full rounded-full border-none bg-[linear-gradient(to_right,var(--empty-fill)_0%,var(--empty-fill)_var(--state-fill-start),var(--signature-color,#555d66)_var(--state-fill-start),var(--signature-color,#555d66)_var(--state-fill-end),var(--empty-fill)_var(--state-fill-end),var(--empty-fill)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-[filter] duration-standard ease-in-out group-hover/slider:brightness-125"
        ></span>
        <Slider.Thumb index={0}>
          {#snippet child({ props: thumbProps })}
            <span
              bind:this={thumb_el}
              {...thumbProps}
              class={[
                "absolute top-1/2 size-4 -translate-y-1/2 scale-100 cursor-pointer rounded-full border-none transition-[scale,filter,background-color,box-shadow] duration-standard ease-in-out",
                disabled ? "bg-frozen opacity-30 shadow-none" : (
                  [value > min ? "bg-pure-white" : "bg-frisk", "shadow-[0_2px_8px_rgba(0,0,0,0.4)] active:scale-[1.1]"]
                ),
              ]}>
            </span>
          {/snippet}
        </Slider.Thumb>
      </div>
    {/snippet}
  </Slider.Root>
</div>

{#if show_value_tooltip}
  <div
    use:portal
    class={[
      "pointer-events-none fixed z-popover mb-standard w-max max-w-100 -translate-x-1/2 -translate-y-full rounded-sharp border border-gunmetal bg-chalk/95 px-tight py-1.5 text-center type-interact whitespace-normal text-frisk shadow-standard transition-[opacity,transform] duration-fast ease-out",
      is_hovered || is_active ? "scale-100 opacity-100" : "scale-95 opacity-0",
    ]}
    style:left="{tooltip_pos.x}px"
    style:top="{tooltip_pos.y}px">
    {disabled ? disabled_label : format(value ?? 1.0)}
    <div class="absolute -bottom-2 left-1/2 z-0 size-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-gunmetal">
      <div class="absolute bottom-px left-1/2 size-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-chalk"></div>
    </div>
  </div>
{/if}
