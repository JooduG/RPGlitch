<script>
  import { app } from "../../gamemaster/state.svelte.js";
  import Button from "../Button.svelte";

  let { entity, mode = "card" } = $props(); // mode: 'card' | 'full'

  // Default Fallback
  let visuals = $derived(entity?.visuals || {});
  let name = $derived(entity?.name || "Unknown");
  let description = $derived(entity?.description || "No data available.");
  let signatureColor = $derived(visuals.signatureColor || "#84cc16"); // Lime default
  let avatar = $derived(visuals.profilePictureUrl || "");
</script>

<!-- DYNAMIC CLASS BASED ON MODE -->
<div
  class="panel-container"
  class:mode-card={mode === "card"}
  class:mode-full={mode === "full"}
  style="--entity-color: {signatureColor}"
>
  {#if mode === "card"}
    <!-- === CARD MODE (Standard Lobby/Profile) === -->
    <Button
      class="avatar-btn"
      variant="ghost"
      onclick={() => app.toggleProfile(true, entity)}
      aria-label="Edit {name}"
    >
      {#if avatar}
        <img
          src={avatar}
          alt={name}
          class:no-bg={visuals.noBackground}
          class:flipped={visuals.flipped}
        />
      {:else}
        <div class="placeholder">
          {name.substring(0, 2).toUpperCase()}
        </div>
      {/if}
      <div class="glow-ring"></div>
    </Button>

    <div class="info-block">
      <h3 class="name" style="color: var(--entity-color)">{name}</h3>
      <p class="description">{description}</p>
    </div>
  {:else}
    <!-- === FULL MODE (Cinematic Side Panel) === -->
    <div
      class="full-bleed-visual"
      role="button"
      tabindex="0"
      onclick={() => app.toggleProfile(true, entity)}
      onkeydown={(e) => e.key === "Enter" && app.toggleProfile(true, entity)}
      aria-label="View Profile: {name}"
    >
      {#if avatar}
        <img
          src={avatar}
          alt={name}
          class="bg-image"
          class:flipped={visuals.flipped}
        />
      {:else}
        <div class="placeholder-full">
          <span>{name}</span>
        </div>
      {/if}

      <!-- Gradient Overlay for Text Readability -->
      <div class="cinematic-overlay">
        <h3 class="cinematic-name">{name}</h3>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .panel-container {
    width: 100%;
    height: 100%;
    pointer-events: auto;

    &.mode-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 1rem;
      gap: 1.5rem;
      opacity: 0;
      animation: fadeIn 0.8s ease forwards;
    }

    &.mode-full {
      position: relative;
      overflow: hidden;
      /* No padding, no gap */
    }
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }

  /* === CARD STYLES === */
  :global(.avatar-btn.btn) {
    position: relative;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.3);
    border: none;
    padding: 0;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    outline: none;
    backdrop-filter: blur(4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: scale(1.05);
      .glow-ring {
        opacity: 1;
        transform: scale(1.1);
      }
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.1);

      &.no-bg {
        object-fit: contain;
        border: none;
        background: transparent;
      }
      &.flipped {
        transform: scaleX(-1);
      }
    }

    .placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      color: var(--entity-color);
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
      border: 2px solid var(--entity-color);
      font-family: var(--font-heading);
    }

    .glow-ring {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid var(--entity-color);
      opacity: 0;
      transform: scale(0.9);
      transition: all 0.4s ease;
      box-shadow: 0 0 20px var(--entity-color);
    }
  }

  .info-block {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 240px;

    .name {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }

    .description {
      font-size: 0.85rem;
      color: #a1a1aa;
      line-height: 1.4;
      margin: 0;
      display: -webkit-box;
      line-clamp: 4;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  /* === FULL MODE STYLES === */
  .full-bleed-visual {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
    background: #000;

    .bg-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.8;
      transition:
        opacity 0.3s ease,
        transform 10s ease-out; /* Slow zoom effect? */

      &.flipped {
        transform: scaleX(-1);
      }
    }

    &:hover .bg-image {
      opacity: 1;
      /* transform: scale(1.02); // Maybe subtle zoom */
    }

    .placeholder-full {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(to bottom, #111, #222);
      color: var(--entity-color);
      font-size: 1.5rem;
      font-weight: bold;
      font-family: var(--font-heading);
      text-transform: uppercase;
    }

    .cinematic-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      padding: 2rem 1rem 1rem;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0));
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .cinematic-name {
      font-family: var(--font-heading);
      color: var(--entity-color);
      font-size: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin: 0;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
      opacity: 0.8;
      transition: opacity 0.3s;
    }

    &:hover .cinematic-name {
      opacity: 1;
    }
  }

  /* Mobile Scaling */
  @media (max-width: 768px) {
    :global(.avatar-btn.btn) {
      width: 100px;
      height: 100px;
    }
    .info-block {
      display: none;
    }

    /* .mode-full styles handled by Layout grid changes or global mobile styles */
  }
</style>
