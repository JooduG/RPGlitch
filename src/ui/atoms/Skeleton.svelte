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
  class="wrapper {variant} {className}"
  style:width
  style:height
  style:aspect-ratio={aspect_ratio}
  use:use_actions={actions}
></div>

<style>
  .wrapper {
    /* Base Surface: Sunken placeholder logic */
    background: rgb(from var(--glass-sunken-color) r g b / var(--glass-sunken-opacity));
    backdrop-filter: var(--glass-sunken-blur);
    border: var(--spacing-pixel) solid rgb(from var(--color-white) r g b / var(--opacity-ghost));
    border-radius: var(--radius-standard);
    overflow: hidden;
    position: relative;
    min-height: var(--spacing-4);

    /* Hardware acceleration for shimmer */
    isolation: isolate;
  }

  /* Variant Harmonization */
  .wrapper.card {
    border-radius: var(--radius-standard);
    min-height: 6.25rem; /* 100px */
  }

  .wrapper.hero {
    border-radius: var(--radius-standard);
    min-height: 15rem; /* 240px */
  }

  .wrapper.profile-picture,
  .wrapper.circle {
    border-radius: var(--radius-full);
    aspect-ratio: 1 / 1;
    width: var(--icon-medium);
    height: var(--icon-medium);
  }

  .wrapper.text {
    height: 1em;
    margin-bottom: var(--spacing-2);
    border-radius: var(--radius-subtle);
    width: 60%; /* Default partial width for text skeletons */
  }

  /* Shimmer Effect: The Nordic Fog */
  .wrapper::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgb(from var(--color-white) r g b / var(--opacity-ghost)) 30%,
      rgb(from var(--color-white) r g b / var(--opacity-muted)) 50%,
      rgb(from var(--color-white) r g b / var(--opacity-ghost)) 70%,
      transparent 100%
    );
    filter: var(--blur-mist);
    animation: shimmer 2.5s var(--ease-standard) infinite;
    pointer-events: none;
    z-index: var(--surface-z-index);
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
</style>
