<script>
  /**
   * @file ProfilePicture.svelte
   * 🖼️ SOTA PROFILE IMAGE RENDERER
   * Handles real images, placeholders, and watermark-style initials.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { themeStore } from "@theme/palette.svelte.js";
  import { fit_text } from "@ui/utils/fit-text.js";
  import { use_actions } from "@ui/utils/use-actions.js";

  let {
    // Data
    entity = null,
    placeholder_char = null,

    // State
    busy = false,

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
      .replace(/[^\p{L}\s]/gu, "")
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
  const name = $derived(entity?.name || (placeholder_char ? "" : "Entity"));
  const media_url = $derived(entity?.profile_picture);
  const signature_color = $derived(
    entity ? themeStore.get_signature_color(entity) : "var(--color-gunmetal)",
  );
  const initials = $derived(placeholder_char || calculate_initials(name));

  // 2. Modifiers
  const is_no_bg = $derived(entity?.modifiers?.no_background ?? false);
  const is_flipped = $derived(entity?.modifiers?.flipped ?? false);
</script>

<div
  {...rest}
  class="wrapper {className}"
  class:is-busy={busy}
  style="--signature-color: {signature_color}"
  use:use_actions={actions}
>
  {#if media_url}
    <img
      src={media_url}
      alt="{name} Profile"
      class="media"
      class:no-bg={is_no_bg}
      class:flipped={is_flipped}
    />
  {:else}
    <div class="status">
      <div class="initials" use:fit_text={{ maxSize: 600, minSize: 10 }}>
        {initials}
      </div>
    </div>
  {/if}
</div>

<style>
  .wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--glass-xs);
    position: relative;
    transition: filter var(--motion-m);
  }

  .wrapper.is-busy {
    filter: brightness(0.8) grayscale(0.5);
    cursor: wait;
    pointer-events: none;
  }

  .media {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: filter var(--motion-m);
  }

  .media.no-bg {
    object-fit: contain;
    filter: drop-shadow(0 0.5rem 1rem rgb(var(--color-black-rgb) / 50%));
  }

  .media.flipped {
    transform: scaleX(-1);
  }

  /* Placeholder State: Neural Nordic Depth */
  .status {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: var(--signature-color);

    /* Atmospheric Depth: Radial Vignette */
    background-image: radial-gradient(
      circle at center,
      transparent 0%,
      rgb(var(--color-black-rgb) / 40%) 100%
    );
  }

  /* The Watermark Initials */
  .initials {
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-xl);
    color: var(--color-white);
    text-transform: uppercase;
    user-select: none;
    pointer-events: none;
    line-height: 0.7;
    letter-spacing: -0.05em;

    /* Punchy "Branded" Aesthetics - Boosted Presence */
    opacity: 0.35;
    mix-blend-mode: soft-light;

    /* Subtle Depth Shadow */
    filter: drop-shadow(0 0 20px rgb(var(--color-white-rgb) / 15%));

    /* Layout Hardening */
    white-space: nowrap;
    text-align: center;
    padding: var(--spacing-xs);
  }
</style>
