<script>
  /**
   * @file src/ui/atoms/Meter.svelte
   * 📊 THE ATOMIC METER
   * Displays status levels using bits-ui/Meter and Chalk Regime tokens.
   * RUTHLESSLY FLATTENED: Headless, Svelte 5 runes-powered, highly accessible.
   */
  import { Meter } from "bits-ui";

  let {
    // Data
    value = 0,
    min = 0,
    max = 100,

    // Design / Styling
    class: className = "",
    style = "",
    ...rest
  } = $props();

  // Safeguard boundary computations against NaN/undefined using derived reactivity
  const percentage = $derived.by(() => {
    const val = Number(value);
    if (isNaN(val)) return 0;
    return max - min > 0 ? Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)) : 0;
  });
</script>

<Meter.Root
  {value}
  {min}
  {max}
  class="
    relative
    w-full
    overflow-hidden

    {className}"
  {style}
  {...rest}
>
  <div
    class="
      h-full
      bg-[var(--signature-color,var(--dev-accent,var(--frozen)))]
      shadow-[0_0_8px_var(--signature-color,var(--dev-accent,var(--frozen)))]
      transition-[width]
      duration-150
      ease-in-out
    "
    style="width: {percentage}%;"
  ></div>
</Meter.Root>
