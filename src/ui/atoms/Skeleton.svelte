<script>
  /**
   * @file Skeleton.svelte
   * 🕹️ SOTA ATOMIC SKELETON
   * A high-fidelity placeholder component designed for the Chalk Regime.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@actions";

  let {
    // Design
    variant = "card", // 'card' | 'text' | 'hero' | 'profile-picture' | 'circle'
    width = "100%",
    height = "auto",
    aspect_ratio = "auto",
    class: className = "",

    // Slots/Snippets
    actions = [],

    ...rest
  } = $props();

  // Architectural variant dictionary for zero-drift token realization mapped to Tailwind v4
  const variantClasses = {
    card: "rounded-xl min-h-[200px]",
    hero: "rounded-xl min-h-[160px]",
    "profile-picture": "rounded-full aspect-square w-12 h-12",
    circle: "rounded-full aspect-square w-12 h-12",
    text: "h-4 mb-2 rounded w-[60%]",
  };

  let variantClass = $derived(variantClasses[variant] || "");
</script>

<div
  {...rest}
  class="
    relative
    isolate
    min-h-4
    overflow-hidden
    rounded-xl
    border
    border-solid
    border-white/10
    bg-zinc-900/40
    backdrop-blur-sm

    after:pointer-events-none
    after:absolute
    after:inset-0
    after:z-10
    after:-translate-x-full
    after:animate-[shimmer_2s_ease-in-out_infinite]
    after:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_30%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.08)_70%,transparent_100%)]
    after:blur-md
    after:content-['']

    {variantClass}
    {className}"
  style:width
  style:height
  style:aspect-ratio={aspect_ratio}
  use:use_actions={actions}
></div>

<style>
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
</style>
