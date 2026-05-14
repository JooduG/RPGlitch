<script>
  /**
   * @file Skeleton.svelte
   * 🕹️ SOTA ATOMIC SKELETON
   * A high-fidelity placeholder component designed for the Chalk Regime.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { use_actions } from "@ui/utils/use-actions.js";

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
</script>

<div
  {...rest}
  class="root {variant} {className}"
  style:width
  style:height
  style:aspect-ratio={aspect_ratio}
  use:use_actions={actions}
></div>

<style>
  .root {
    /* Base Surface: Sunken placeholder logic */
    background: var(--glass-sunken);
    backdrop-filter: var(--glass-sunken-blur);
    border: var(--spacing-pixel) solid rgb(from var(--pure-white) r g b / var(--opacity-ghost));
    border-radius: var(--radius-standard);
    overflow: hidden;
    position: relative;
    min-height: var(--spacing-4);

    /* Hardware acceleration for shimmer */
    isolation: isolate;
  }

  /* Variant Harmonization */
  .root.card {
    border-radius: var(--radius-standard);
    min-height: var(--skeleton-card-min-height);
  }

  .root.hero {
    border-radius: var(--radius-standard);
    min-height: var(--skeleton-hero-min-height);
  }

  .root.profile-picture,
  .root.circle {
    border-radius: var(--radius-full);
    aspect-ratio: var(--aspect-square);
    width: var(--icon-medium);
    height: var(--icon-medium);
  }

  .root.text {
    height: var(--skeleton-text-height);
    margin-bottom: var(--spacing-2);
    border-radius: var(--radius-subtle);
    width: var(--skeleton-text-width);
  }

  /* Shimmer Effect: The Nordic Fog */
  .root::after {
    content: "";
    position: absolute;
    inset: var(--spacing-0);
    transform: translateX(-100%);
    background: linear-gradient(
      var(--angle-right),
      transparent 0%,
      rgb(from var(--pure-white) r g b / var(--opacity-ghost)) 30%,
      rgb(from var(--pure-white) r g b / var(--opacity-muted)) 50%,
      rgb(from var(--pure-white) r g b / var(--opacity-ghost)) 70%,
      transparent 100%
    );
    filter: var(--blur-mist);
    animation: shimmer var(--duration-shimmer) var(--ease-standard) infinite;
    pointer-events: none;
    z-index: var(--surface-z-index);
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
</style>
