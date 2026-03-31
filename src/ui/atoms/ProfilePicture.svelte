<script>
  /**
   * @file ProfilePicture.svelte
   * 🖼️ AGNOSTIC PROFILE IMAGE RENDERER
   * Handles real images, placeholders, and glitch overlays.
   * RUTHLESSLY FLATTENED — Zero backward compatibility.
   */
  import { themeStore } from "@theme/palette.svelte.js";
  import { fitText } from "@ui/utils/actions/fit-text.js";
  let { entity } = $props();

  // 1. Core Flattened Properties
  let name = $derived(entity?.name || "Entity");
  let pictureUrl = $derived(entity?.profile_picture);
  let signature_color = $derived(themeStore.get_signature_color(entity));
  let initials = $derived(themeStore.get_initials(name));

  // 2. Minor Modifiers
  let isNoBg = $derived(entity?.visuals?.noBackground ?? false);
  let isFlipped = $derived(entity?.visuals?.flipped ?? false);
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
      <div class="glitch-overlay"></div>
    </div>
  {:else}
    <div
      class="placeholder"
      use:fitText={{
        maxSize: 150,
        minSize: 40,
        lineHeight: "1",
      }}
    >
      {initials}
      <div class="glitch-overlay"></div>
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

  .glitch-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    mix-blend-mode: overlay;
    opacity: var(--opacity-s);
    background: linear-gradient(
      transparent 50%,
      rgb(var(--color-black-rgb) / var(--opacity-xs)) 50%
    );
    background-size: 100% var(--spacing-xxs);
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-xl);
    color: var(--color-white);
    text-shadow: 0 0.2rem 1rem rgb(var(--color-black-rgb) / 50%);
    background-color: var(--signature-color);
    background-image:
      linear-gradient(to bottom, transparent, rgb(var(--color-black-rgb) / 30%)),
      radial-gradient(circle at top left, rgb(255 255 255 / 20%), transparent);
    text-transform: uppercase;
  }
</style>
