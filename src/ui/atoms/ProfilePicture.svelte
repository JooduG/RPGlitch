<script>
  /**
   * @file ProfilePicture.svelte
   * 🖼️ SOTA PROFILE IMAGE RENDERER
   * Handles real images, placeholders, and watermark-style initials.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { themeStore } from "@theme/palette.svelte.js";
  import { use_actions } from "@ui/utils/use-actions.js";

  let {
    // Data
    entity = null,
    src = null,
    alt = null,
    placeholder_char = null,

    // Design
    class: className = "",

    // Slots/Snippets
    actions = [],

    ...rest
  } = $props();

  /**
   * Generates initials from entity name, filtering common stop words.
   * @param {string} str
   * @returns {string}
   */
  const calculate_initials = (str) => {
    if (!str) return "?";
    const words = str
      .replace(/[^\p{L}\s]/gu, " ")
      .trim()
      .split(/\s+/);
    const stop_words = new Set([
      "the",
      "a",
      "an",
      "of",
      "in",
      "and",
      "or",
      "for",
      "to",
      "at",
      "by",
      "with",
    ]);
    let filtered = words.filter((w) => !stop_words.has(w.toLowerCase()));

    return (
      (filtered.length ? filtered : words)
        .slice(0, 3)
        .map((w) => w.charAt(0))
        .join("")
        .toUpperCase() || "?"
    );
  };

  // 1. Reactive State
  let image_failed = $state(false);
  const name = $derived(entity?.name || (placeholder_char ? "" : "Entity"));
  const media_url = $derived(!image_failed && (src || entity?.profile_picture));
  const signature_color = $derived(themeStore.get_signature_color(entity));
  const initials = $derived(placeholder_char || calculate_initials(name));

  // 2. Modifiers
  const is_no_bg = $derived(entity?.modifiers?.no_background ?? false);
  const is_flipped = $derived(entity?.modifiers?.flipped ?? false);
</script>

<div
  {...rest}
  class="root {className}"
  style="--signature-color: {signature_color};"
  use:use_actions={actions}
>
  <!-- 🧬 THE BASE: Massive Signature Placeholder -->
  <div class="profile-placeholder" aria-hidden="true">
    <div class="profile-initials">
      {initials}
    </div>
  </div>

  <!-- 🖼️ THE OVERLAY: Actual Media -->
  {#if media_url}
    <img
      src={media_url}
      alt={alt || `${name} Profile`}
      class="media"
      class:no-bg={is_no_bg}
      class:flipped={is_flipped}
      onerror={() => (image_failed = true)}
    />
  {/if}
</div>

<style>
  .root {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    container-type: size;
  }

  .media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    z-index: var(--z-index-surface);
  }

  .media.no-bg {
    object-fit: contain;
    filter: drop-shadow(
      0 var(--margin-tight) var(--margin-standard)
        rgb(from var(--void-black) r g b / var(--opacity-whisper))
    );
  }

  .media.flipped {
    transform: scaleX(-1);
  }

  /* Placeholder State: Neural Nordic Depth */
  .profile-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    /* 🎨 Signature Color Background: Primary Brand Surface */
    background-color: var(--signature-color, var(--frozen));

    /* 🌫️ Atmospheric Filter: Storyboard Alignment & Neural Depth */
    background-image:
      linear-gradient(
        to top,
        var(--chalk) 0%,
        rgb(from var(--chalk) r g b / var(--opacity-solid)) 30%,
        rgb(from var(--chalk) r g b / var(--opacity-muted)) 60%,
        rgb(from var(--chalk) r g b / var(--opacity-ghost)) 80%,
        transparent 100%
      ),
      radial-gradient(
        circle at 50% 50%,
        transparent 0%,
        rgb(from var(--void-black) r g b / var(--opacity-muted)) 100%
      );
    z-index: var(--z-index-base);
  }

  /* The Watermark Initials: MASSIVE AESTHETIC */
  .profile-initials {
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-bold);
    color: var(--pure-white);
    text-transform: uppercase;
    user-select: none;
    pointer-events: none;
    line-height: 0.7; /* Massive impact tight tracking */
    letter-spacing: var(--font-spacing-tight);

    /* ❄️ Nordic Collection Depth - High Contrast White */
    opacity: 0.95;

    /* Vibrant custom signature-colored bloom: The Glitch Aura */
    filter: drop-shadow(
      0 0 calc(var(--spacing-unit) * 4)
        rgb(from var(--signature-color, var(--frozen)) r g b / var(--opacity-muted))
    );

    /* Massive Layout Construction */
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    text-align: center;
    padding: 0;
    font-size: clamp(var(--font-size-nano), 60cqi, var(--font-size-h1));
  }
</style>
