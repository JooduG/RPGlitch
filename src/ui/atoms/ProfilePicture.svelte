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
      <div class="initials" use:fit_text={{ minSize: "var(--fit-text-min)" }}>
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
    position: relative;
    transition: filter var(--duration-standard) var(--ease-standard);
  }

  .wrapper.is-busy {
    filter: var(--brightness-dim) grayscale(var(--opacity-heavy));
    cursor: wait;
    pointer-events: none;
  }

  .media {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: filter var(--duration-standard) var(--ease-standard);
  }

  .media.no-bg {
    object-fit: contain;
    filter: drop-shadow(
      0 var(--spacing-2) var(--spacing-4)
        rgb(from var(--background-base) r g b / var(--opacity-heavy))
    );
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
      rgb(from var(--background-base) r g b / var(--opacity-heavy)) 100%
    );
  }

  /* The Watermark Initials */
  .initials {
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-heavy);
    color: var(--color-white);
    text-transform: uppercase;
    user-select: none;
    pointer-events: none;
    line-height: var(--font-height-short);
    letter-spacing: var(--font-spacing-tight);

    /* Punchy "Branded" Aesthetics - Boosted Presence */
    opacity: var(--opacity-solid);

    /* Subtle Depth Shadow */
    filter: drop-shadow(
      0 0 var(--spacing-8) rgb(from var(--color-white) r g b / var(--opacity-whisper))
    );

    /* Layout Hardening */
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    text-align: center;
    padding: 0;
    font-size: var(
      --profile-initials-size-base
    ); /* Large starting size for fit_text to scale down from */
  }
</style>
