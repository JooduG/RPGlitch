<script>
  /**
   * @file src/ui/atoms/Slider.svelte
   * Range slider atom wrapping bits-ui Slider with centered neutral gradient track and optional value tooltip.
   */
  import { clamp } from "@utils";
  import { Slider } from "bits-ui";
  import Label from "./Label.svelte";

  let {
    value = $bindable(1.0),
    min = 0,
    max = 2.0,
    step = 0.1,
    disabled = false,
    label = "",
    neutral = null,
    format = (v) => (step < 0.1 ? Number(v).toFixed(2) : Number(v).toFixed(1)),
    class: className = "",
    onchange = undefined,
    ...rest
  } = $props();

  const control_id = $props.id();
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
</script>

<div
  class={["group/slider relative flex w-full cursor-pointer flex-col justify-center gap-tight", disabled && "opacity-30 grayscale", className]}
  style="--state-fill-start: {fill_start_css}; --state-fill-end: {fill_end_css};"
  data-testid={test_id}
  aria-disabled={disabled}
  role="group">
  {#if label}
    <Label
      for={control_id}
      {disabled}
      class={["mt-tight w-auto flex-none [text-shadow:0_0_10px_rgba(0,0,0,0.5)]", !disabled && "group-hover/slider:brightness-125"]}>
      {label}: {disabled ? "DISABLED" : format(value ?? 1.0)}
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
    {disabled}
    id={control_id}
    {...rest}>
    {#snippet child({ props })}
      <div {...props} class="relative flex h-4 w-full cursor-pointer touch-none items-center select-none">
        <span
          class="relative h-1 w-full rounded-full border-none bg-[linear-gradient(to_right,var(--empty-fill)_0%,var(--empty-fill)_var(--state-fill-start),var(--signature-color,#555d66)_var(--state-fill-start),var(--signature-color,#555d66)_var(--state-fill-end),var(--empty-fill)_var(--state-fill-end),var(--empty-fill)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-[filter] duration-standard ease-in-out group-hover/slider:brightness-125"
        ></span>
        <Slider.Thumb index={0}>
          {#snippet child({ props: thumbProps })}
            <span
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
