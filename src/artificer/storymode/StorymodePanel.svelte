<script>
  import { app } from "../state.svelte.js";

  let { entity } = $props();

  // Default Fallback
  let visuals = $derived(entity?.visuals || {});
  let name = $derived(entity?.name || "Unknown");
  let description = $derived(entity?.description || "No data available.");
  let signatureColor = $derived(visuals.signatureColor || "#84cc16"); // Lime default
  let avatar = $derived(visuals.avatar || "");

  // Check if it's a fractal to adjust styling if needed
  let isFractal = $derived(entity?.type === "fractal");
</script>

<div class="entity-card" style="--entity-color: {signatureColor}">
  <!-- AVATAR AREA -->
  <button
    class="avatar-btn"
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

    <!-- Hover Glow Element -->
    <div class="glow-ring"></div>
  </button>

  <!-- INFO AREA -->
  <div class="info-block">
    <h3 class="name" style="color: var(--entity-color)">{name}</h3>
    <p class="description">{description}</p>
  </div>
</div>

<style lang="scss">
  .entity-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
    height: 100%;
    padding: 1rem;
    gap: 1.5rem;
    pointer-events: auto; /* [FIX] Enable interaction */

    /* Subtle Entrance */
    opacity: 0;
    animation: fadeIn 0.8s ease forwards;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }

  .avatar-btn {
    position: relative;
    width: 160px; /* Base size */
    height: 160px;
    border-radius: 50%; /* Circle by default? Or Card shape? Let's go Circle for avatars */
    background: rgba(0, 0, 0, 0.3);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    outline: none;

    /* Glassy BG */
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
    }

    /* The Selection/Hover Glow */
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
      font-family: var(--font-display, sans-serif);
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
      -webkit-line-clamp: 4; /* Limit lines */
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  /* Mobile Scaling */
  @media (max-width: 768px) {
    .avatar-btn {
      width: 100px;
      height: 100px;
    }
    .info-block {
      display: none; /* Hide text on mobile grid to save space? Or reduce? */
    }
  }
</style>
