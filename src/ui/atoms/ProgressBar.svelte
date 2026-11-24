<!-- src/ui/atoms/ProgressBar.svelte -->
<script>
  import { motion } from "@media";
  import { clamp } from "@utils";
  import { Progress } from "bits-ui";
  import { quartOut } from "svelte/easing";
  import { Tween } from "svelte/motion";

  let { value = 0, max = 100, min = 0, class: className = "" } = $props();

  const is_indeterminate = $derived(value === null);
  const clamped_pct = $derived(is_indeterminate || max <= min ? 0 : clamp(((value - min) / (max - min)) * 100, 0, 100));
  const pct_tween = new Tween(0, { duration: 300, easing: quartOut });

  $effect(() => {
    pct_tween.set(clamped_pct, { duration: motion.is_reduced ? 0 : 300, easing: quartOut });
  });
</script>

<div class={["flex w-full flex-col gap-tight", className]}>
  <Progress.Root
    aria-valuetext={is_indeterminate ? undefined : `${Math.round(clamped_pct)}%`}
    {value}
    {min}
    {max}
    class="relative h-2.5 w-full overflow-hidden rounded-full border-none bg-slate-700/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
    {#if is_indeterminate}
      <div
        class="absolute inset-y-0 w-1/3 animate-[progress-indeterminate_var(--transition-duration-slow)_var(--ease-in-out)_infinite] rounded-full bg-electric-cyan shadow-[0_0_8px_var(--color-electric-cyan)]"
        style:animation-play-state={motion.is_reduced ? "paused" : "running"}>
      </div>
    {:else}
      <div
        class="absolute inset-0 origin-left rounded-full bg-electric-cyan shadow-[0_0_8px_var(--color-electric-cyan)]"
        style:transform="scaleX({pct_tween.current / 100})">
      </div>
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
