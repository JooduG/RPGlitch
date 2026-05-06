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
    background: var(--glass-s);
    border: var(--border-s);
    border-radius: var(--border-radius-m);
    overflow: hidden;
    position: relative;
    min-height: var(--spacing-m);

    /* Hardware acceleration for shimmer */
    isolation: isolate;
  }

  /* Variant Harmonization */
  .wrapper.card {
    border-radius: var(--border-radius-xl);
    min-height: 100px;
  }

  .wrapper.hero {
    border-radius: var(--border-radius-xl);
    min-height: 240px;
  }

  .wrapper.profile-picture,
  .wrapper.circle {
    border-radius: var(--border-radius-full);
    aspect-ratio: 1 / 1;
    width: var(--icon-m);
    height: var(--icon-m);
  }

  .wrapper.text {
    height: 1em;
    margin-bottom: var(--spacing-xs);
    border-radius: var(--border-radius-s);
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
      rgb(var(--color-white-rgb) / var(--opacity-xxs)) 30%,
      rgb(var(--color-white-rgb) / var(--opacity-xs)) 50%,
      rgb(var(--color-white-rgb) / var(--opacity-xxs)) 70%,
      transparent 100%
    );
    filter: blur(var(--blur-xl));
    animation: shimmer 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
</style>
