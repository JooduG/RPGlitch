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
    backdrop-filter: var(--blur-whisper);
    border: var(--spacing-pixel) solid rgb(from var(--pure-white) r g b / var(--opacity-ghost));
    border-radius: var(--radius-standard);
    overflow: hidden;
    position: relative;
    min-height: var(--padding-standard);

    /* Hardware acceleration for shimmer */
    isolation: isolate;
  }

  /* Variant Harmonization */
  .root.card {
    border-radius: var(--radius-standard);
    min-height: var(--storyboard-character-card-height);
  }

  .root.hero {
    border-radius: var(--radius-standard);
    min-height: var(--storyboard-fractal-card-height);
  }

  .root.profile-picture,
  .root.circle {
    border-radius: var(--radius-full);
    aspect-ratio: var(--aspect-square);
    width: var(--icon-large);
    height: var(--icon-large);
  }

  .root.text {
    height: var(--font-height-base);
    margin-bottom: var(--margin-tight);
    border-radius: var(--radius-sharp);
    width: 60%;
  }

  /* Shimmer Effect: The Nordic Fog */
  .root::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgb(from var(--pure-white) r g b / var(--opacity-ghost)) 30%,
      rgb(from var(--pure-white) r g b / var(--opacity-whisper)) 50%,
      rgb(from var(--pure-white) r g b / var(--opacity-ghost)) 70%,
      transparent 100%
    );
    filter: var(--blur-mist);
    animation: shimmer var(--duration-ambient) var(--ease-standard) infinite;
    pointer-events: none;
    z-index: var(--z-index-surface);
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
</style>
