<script>
  /**
   * @file src/ui/atoms/ProgressBar.svelte
   * 📊 PROGRESS BAR ATOM
   * Task completion indicator for monotonically-increasing work (model downloads, etc.).
   * Wraps bits-ui Progress.Root with Nordic design tokens.
   * For fluctuating range measurements (dynamics, volume), use Meter (bits-ui Meter).
   */
  import { Progress, useId } from "bits-ui";
  import { Tween } from "svelte/motion";
  import { quartOut } from "svelte/easing";
  import { motion } from "@motion";
  import Label from "./Label.svelte";

  /**
   * @typedef {Object} Props
   * @property {number | null} [value] - Current progress (0–max). `null` = indeterminate.
   * @property {number} [max] - Maximum value.
   * @property {number} [min] - Minimum value.
   * @property {string} [label] - Optional visible label (rendered above the bar).
   * @property {string} [value_label] - Optional aria-valuetext override (e.g. "45%").
   * @property {string} [variant] - Visual variant: "thin" (1px line) or "full" (rounded bar).
   * @property {string} [class] - External styling overrides.
   * @property {string} [style] - Inline styling.
   */

  /** @type {Props} */
  let { value = 0, max = 100, min = 0, label = "", value_label = "", variant = "full", class: className = "", style = "" } = $props();

  const label_id = useId();
  const is_indeterminate = $derived(value === null);
  const clamped_pct = $derived(is_indeterminate ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)));
  const pct_tween = new Tween(0, { duration: 300, easing: quartOut });
  $effect(() => {
    pct_tween.set(clamped_pct, { duration: motion.is_reduced ? 0 : 300, easing: quartOut });
  });
</script>

<div class="flex w-full flex-col gap-1 {className}" {style}>
  {#if label}
    <Label id={label_id} class="w-full justify-between font-mono">
      <span>{label}</span>
      {#if !is_indeterminate}
        <span class="tabular-nums opacity-70">{Math.round(pct_tween.current)}%</span>
      {/if}
    </Label>
  {/if}

  <Progress.Root
    aria-labelledby={label ? label_id : undefined}
    aria-valuetext={value_label || (is_indeterminate ? undefined : `${Math.round(clamped_pct)}%`)}
    {value}
    {min}
    {max}
    class="
      relative
      overflow-hidden
      border-none
      {variant === 'thin'
      ? 'h-px w-full bg-slate-700/40'
      : 'h-2.5 w-full rounded-full bg-slate-700/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'}
    "
  >
    {#if is_indeterminate}
      <div
        class="
          absolute
          inset-y-0
          w-1/3
          animate-[progress-indeterminate_var(--duration-slow)_var(--ease-standard)_infinite]
          rounded-full
          bg-electric-cyan
          shadow-[0_0_8px_var(--color-electric-cyan)]
        "
      ></div>
    {:else}
      <div
        class="
          absolute
          inset-y-0
          left-0
          rounded-full
          bg-electric-cyan
          shadow-[0_0_8px_var(--color-electric-cyan)]
        "
        style="width: {pct_tween.current}%;"
      ></div>
    {/if}
  </Progress.Root>
</div>

<style>
  @keyframes progress-indeterminate {
    0% {
      transform: translateX(-100%);
    }

    100% {
      transform: translateX(400%);
    }
  }
</style>
