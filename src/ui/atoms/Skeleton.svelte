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

  // Architectural variant dictionary for zero-drift token realization
  const variantClasses = {
    card: "rounded-[var(--radius-standard)] min-h-[var(--storyboard-character-card-height)]",
    hero: "rounded-[var(--radius-standard)] min-h-[var(--storyboard-fractal-card-height)]",
    "profile-picture":
      "rounded-[var(--radius-full)] aspect-[var(--aspect-square)] w-[var(--icon-large)] h-[var(--icon-large)]",
    circle:
      "rounded-[var(--radius-full)] aspect-[var(--aspect-square)] w-[var(--icon-large)] h-[var(--icon-large)]",
    text: "h-[var(--font-height-base)] mb-[var(--margin-tight)] rounded-[var(--radius-sharp)] w-[60%]",
  };

  let variantClass = $derived(variantClasses[variant] || "");
</script>

<div
  {...rest}
  class="
    relative
    isolate
    min-h-(--padding-standard)
    overflow-hidden
    rounded-(--radius-standard)
    border-solid
    border-white/(--opacity-ghost)
    bg-(--glass-sunken)
    [backdrop-filter:var(--blur-whisper)]

    after:pointer-events-none
    after:absolute
    after:inset-0
    after:z-(--z-index-surface)
    after:-translate-x-full
    after:animate-[shimmer_var(--duration-ambient)_var(--ease-standard)_infinite]
    after:bg-[linear-gradient(90deg,transparent_0%,rgb(from_var(--pure-white)_r_g_b/var(--opacity-ghost))_30%,rgb(from_var(--pure-white)_r_g_b/var(--opacity-whisper))_50%,rgb(from_var(--pure-white)_r_g_b/var(--opacity-ghost))_70%,transparent_100%)]
    after:filter-(--blur-mist)
    after:content-['']

    {variantClass}
    {className}"
  style:width
  style:height
  style:aspect-ratio={aspect_ratio}
  use:use_actions={actions}
></div>
