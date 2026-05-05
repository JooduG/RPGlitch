<script>
  /**
   * @file ProfilePicture.svelte
   * 🖼️ AGNOSTIC PROFILE IMAGE RENDERER
   * Handles real images, placeholders, and glitch overlays.
   * RUTHLESSLY FLATTENED  Zero backward compatibility.
   */
  import { themeStore } from "@theme/palette.svelte.js";
  import { fitText } from "@utils/fit-text.js";
  let { entity = null, placeholderChar = null } = $props();

  /**
   * @param {string | null | undefined} str
   * @returns {string}
   */
  function calculate_initials(str) {
    if (!str) return "?";
    const clean_name = str.replace(/[^\p{L}\s]/gu, "");

    /** @type {string[]} */
    const words = clean_name.trim().split(/\s+/);
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
    let filtered_words = words.filter((w) => !stop_words.has(w.toLowerCase()));
    if (filtered_words.length === 0) filtered_words = words;
    return (
      filtered_words
        .slice(0, 3)
        .map((w) => w.charAt(0))
        .join("")
        .toUpperCase() || "?"
    );
  }

  // 1. Core Flattened Properties
  let name = $derived(entity?.name || (placeholderChar ? "" : "Entity"));
  let pictureUrl = $derived(entity?.profile_picture);
  let signature_color = $derived(
    entity
      ? themeStore.get_signature_color(entity)
      : "var(--signature-color, var(--color-gunmetal))",
  );
  let initials = $derived(placeholderChar || calculate_initials(name));

  // 2. Minor Modifiers
  let isNoBg = $derived(entity?.modifiers?.noBackground ?? false);
  let isFlipped = $derived(entity?.modifiers?.flipped ?? false);
</script>

<div class="profile-picture" style="--signature-color: {signature_color}">
  {#if pictureUrl}
    <div class="image-container">
      <img
        src={pictureUrl}
        alt="{name} Profile"
        class="picture"
        class:no-bg={isNoBg}
        class:flipped={isFlipped}
      />
    </div>
  {:else}
    <div class="placeholder">
      <div class="initials-bg" use:fitText={{ minSize: 80 }}>
        {initials}
      </div>
    </div>
  {/if}
</div>

<style>
  .profile-picture {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--glass-xs);
  }

  .image-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .picture {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .picture.no-bg {
    object-fit: contain;
    filter: drop-shadow(0 0.5rem 1rem rgb(var(--color-black-rgb) / 50%));
  }

  .picture.flipped {
    transform: scaleX(-1);
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: var(--signature-color);
    background-image: radial-gradient(
      circle at center,
      transparent,
      rgb(var(--color-black-rgb) / 30%)
    );
    position: relative;
    overflow: hidden;
  }

  .initials-bg {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-xl);
    color: var(--color-white);
    opacity: 1;
    text-transform: uppercase;
    user-select: none;
    pointer-events: none;
    filter: drop-shadow(0 0 10px rgb(var(--color-white-rgb) / 40%));
    font-size: 300px;
    line-height: 0.8;
    letter-spacing: -0.05em;
  }
</style>
