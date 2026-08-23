<script>
  /**
   * @file src/ui/motion/Shimmer.svelte
   * ✨ THE SOVEREIGN SHIMMER
   * Reusable light-sweep kinetic indicator for loading states, ghostwriting,
   * and modal backgrounds. Uses background-position to remain view-transition safe.
   */

  /**
   * @typedef {Object} Props
   * @property {string} [color="var(--color-electric-cyan)"] - The signature or accent color for the sweep.
   * @property {string} [class] - Extra CSS classes.
   */

  /** @type {Props} */
  let { color = "var(--color-electric-cyan)", class: className = "" } = $props();
</script>

<div class="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[inherit] opacity-50 {className}" aria-hidden="true">
  <div
    data-shimmer-sweep
    class="absolute inset-0 h-full w-full"
    style="
      background: linear-gradient(
        115deg,
        transparent 35%,
        color-mix(in srgb, var(--shimmer-color, var(--color-electric-cyan)) 75%, white) 50%,
        transparent 65%
      );
      background-size: 250% 100%;
      --shimmer-color: {color};
    "
  ></div>
</div>

<style>
  [data-shimmer-sweep] {
    animation: shimmer-sweep-anim 2.4s linear infinite;
  }

  @keyframes shimmer-sweep-anim {
    0% {
      background-position: 100% 0;
    }

    100% {
      background-position: -150% 0;
    }
  }
</style>
