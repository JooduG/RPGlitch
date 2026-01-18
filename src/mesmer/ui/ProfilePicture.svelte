<script>
  /**
   * @typedef {Object} Entity
   * @property {string} name
   * @property {Object} [visuals]
   * @property {string} [visuals.avatar] // Keeping schema property name as is for now
   * @property {string} [visuals.avatarSeed]
   * @property {string} [visuals.signatureColor]
   * @property {boolean} [visuals.noBackground]
   * @property {boolean} [visuals.flipped]
   */

  let { entity, ...rest } = $props();

  import { fade } from "svelte/transition";
  import { AVATAR_PLACEHOLDERS } from "../../gamemaster/config.js";
  import { themeStore } from "../logic/theme.svelte.js";

  // Derived Reactive Properties
  let pictureUrl = $derived(entity?.visuals?.profilePictureUrl);
  let name = $derived(entity?.name || "Entity");
  let signatureColor = $derived(themeStore.getSignatureColor(entity));
  let initials = $derived(themeStore.getInitials(name));

  // Visual Transforms
  let isNoBg = $derived(entity?.visuals?.noBackground);
  let isFlipped = $derived(entity?.visuals?.flipped);
  let pictureSeed = $derived(entity?.visuals?.avatarSeed || pictureUrl);
</script>

<div class="picture-root" style="--picture-color: {signatureColor};" {...rest}>
  {#if pictureUrl}
    {#key pictureSeed}
      <img
        src={pictureUrl}
        alt="{name} Profile Picture"
        class="picture-image"
        class:no-bg={isNoBg}
        class:flipped={isFlipped}
        transition:fade={{ duration: 300 }}
      />
    {/key}
  {:else}
    <div class="picture-placeholder">
      <img src={AVATAR_PLACEHOLDERS.default} alt="" class="placeholder-icon" />
      <span class="initials">{initials}</span>
    </div>
  {/if}
</div>

<style lang="scss">
  .picture-root {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    background-color: var(--picture-color);
    container-type: both; /* Enable container queries for font sizing */
  }

  .picture-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;

    &.no-bg {
      object-fit: contain;
    }

    &.flipped {
      transform: scaleX(-1);
    }

    /* Allow parent components (like StoryboardCard) to hover-scale */
    .picture-root:hover & {
      transform: scale(1.05);

      &.flipped {
        transform: scaleX(-1) scale(1.05);
      }
    }
  }

  .picture-placeholder {
    color: #fff;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    font-family: var(--font-heading);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
    height: 100%;
    position: relative;

    /* Responsive font size based on container size */
    font-size: clamp(1rem, 30cqmin, 6rem);
    line-height: 1;
    user-select: none;

    .placeholder-icon {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.3; /* Subtle background */
      mix-blend-mode: overlay;
    }

    .initials {
      position: relative;
      z-index: 2;
    }
  }
</style>
