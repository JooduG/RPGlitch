<!-- src/ui/atoms/Shimmer.svelte -->
<script>
  let { color = "var(--color-electric-cyan)", class: className = "" } = $props();
</script>

<div
  data-shimmer-sweep
  aria-hidden="true"
  class={["pointer-events-none absolute inset-0 z-30 rounded-[inherit] opacity-20", className]}
  style="
    --shimmer-color: {color};

    background: linear-gradient(
      115deg,
      transparent 35%,
      color-mix(in srgb, var(--shimmer-color) 30%, transparent) 48%,
      color-mix(in srgb, var(--shimmer-color) 45%, white) 50%,
      color-mix(in srgb, var(--shimmer-color) 30%, transparent) 52%,
      transparent 65%
    );
    background-size: 250% 100%;
  ">
</div>

<style>
  [data-shimmer-sweep] {
    animation: shimmer-sweep-anim 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    [data-shimmer-sweep] {
      animation: none;
    }
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
