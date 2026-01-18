<script>
  /**
   * @typedef {Object} Entity
   * @property {string} name
   * @property {string} description
   * @property {Object} [visuals]
   * @property {string} [visuals.signatureColor]
   * @property {string} [visuals.avatar]
   * @property {string} [signatureColor]
   */

  let {
    entity,
    roleLabel,
    type = "user", // "ai" | "fractal" | "user"
    onSelect,
    onViewProfile,
  } = $props();

  import { themeStore } from "../../mesmer/logic/theme.svelte.js";
  import { app } from "../../gamemaster/state.svelte.js";
  import Skeleton from "../Skeleton.svelte";
  import { fade } from "svelte/transition";

  // Derived Values
  let isEmpty = $derived(!entity);
  let isLoading = $derived(app.simulation.loading);
  let isProcessing = $derived(
    ["scanning reality", "synthesizing", "saving"].includes(
      app.simulation.status,
    ),
  );

  let signatureColor = $derived(themeStore.getSignatureColor(entity));
  let signatureRgb = $derived(themeStore.hexToRgb(signatureColor));
  let avatar = $derived(entity?.visuals?.avatar);
  let avatarSeed = $derived(entity?.visuals?.avatarSeed || avatar);
</script>

<div
  class="split-card {type}-card"
  class:fractal-card={type === "fractal"}
  class:is-empty={isEmpty}
  class:is-loading={isLoading}
  class:is-processing={isProcessing}
  style="--signature-color: {signatureColor}; --signature-rgb: {signatureRgb};"
>
  {#snippet emptyState()}
    <button
      class="empty-card"
      onclick={onSelect}
      aria-label="Select {roleLabel}"
    >
      <span class="empty-label">{roleLabel}</span>
      <div class="empty-icon">
        {#if type === "fractal"}
          <svg viewBox="0 0 24 24" class="icon">
            <path
              fill="currentColor"
              d="M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z"
            />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" class="icon">
            <path
              fill="currentColor"
              d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
            />
          </svg>
        {/if}
      </div>
    </button>
  {/snippet}

  {#snippet populatedState()}
    <!-- Top Half: Visuals & Trigger for Profile -->
    <button
      class="card-top"
      onclick={onViewProfile}
      aria-label="View {roleLabel} Profile"
    >
      {#if avatar}
        {#key avatarSeed}
          <img
            src={avatar}
            alt="{entity?.name || 'Entity'} Avatar"
            class="avatar-icon"
            transition:fade={{ duration: 300 }}
          />
        {/key}
      {:else}
        <div class="avatar-placeholder">
          {themeStore.getInitials(entity?.name)}
        </div>
      {/if}
    </button>

    <!-- Bottom Half: Info & Trigger for Selection -->
    <button class="card-bottom" onclick={onSelect}>
      <div class="text-half title-half">
        <h3>{entity?.name || `Select ${roleLabel}`}</h3>
      </div>
      <div class="text-half desc-half">
        <p>{entity?.description || "Click to browse choices..."}</p>
      </div>
    </button>
  {/snippet}

  {#if isLoading}
    <Skeleton variant="card" width="100%" height="100%" />
  {:else if isEmpty}
    {@render emptyState()}
  {:else}
    {@render populatedState()}
  {/if}
</div>

<style lang="scss">
  @use "../../scss/abstracts" as *;

  .split-card {
    @include card-common;
    @extend %material-interactive;

    display: flex;
    flex-direction: column;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease,
      border-color 0.3s ease;
    container-type: inline-size;

    /* Geometric Containment Variables */
    --long-side: 40vh;
    --short-side: 25vh;

    /* Default: Side Card (Portrait) */
    height: var(--long-side);
    width: var(--short-side);
    margin: auto;
    justify-self: center;
    position: relative;

    /* Signature Border Sync */
    border: 1px solid rgba(var(--signature-rgb) / 0.2);

    /* Center Card (Fractal/Landscape) */
    &.fractal-card {
      height: var(--short-side);
      width: var(--long-side);
      transform: scale(1.02);
      z-index: 10;

      .card-top {
        height: 50%;
      }
      .card-bottom {
        height: 50%;
      }
    }

    &:hover:not(.is-empty):not(.is-loading) {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 30px 60px rgba(var(--signature-rgb) / 0.3);
      border-color: var(--signature-color);
      z-index: 20;
    }

    &.is-empty {
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(10, 10, 15, 0.5);
    }
  }

  .card-top {
    height: 60%; /* Characters: 60/40 Split */
    width: 100%;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    background-color: var(--signature-color);
    overflow: hidden;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      transform: translateX(-100%);
      animation: shimmer 5s infinite;
    }

    .avatar-icon {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }

    &:hover .avatar-icon {
      transform: scale(1.05);
    }

    .avatar-placeholder {
      color: #fff;
      font-size: 3rem;
      font-weight: 800;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }

  .card-bottom {
    height: 40%;
    width: 100%;
    background: #09090b;
    border: none;
    border-top: 1px solid rgba(var(--signature-rgb) / 0.2);
    display: flex;
    flex-direction: column;
    padding: 0;
    cursor: pointer;

    .text-half {
      height: 50%;
      width: 100%;
      display: flex;
      flex-direction: column;
      padding: 1.25rem;
    }

    .title-half {
      justify-content: flex-end;
      padding-bottom: 0.25rem;

      h3 {
        margin: 0;
        color: rgb(var(--signature-rgb));
        font-family: var(--font-heading);
        font-weight: 900;
        font-size: clamp(1rem, 10cqw, 1.8rem);
        line-height: 1.1;
        text-align: left;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .desc-half {
      justify-content: flex-start;
      padding-top: 0.25rem;

      p {
        margin: 0;
        color: white;
        text-align: left;
        font-size: clamp(0.7rem, 6cqw, 0.95rem);
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-wrap: pretty;
      }
    }
  }

  .empty-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: transparent;
    border: none;

    .empty-label {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: rgba(255, 255, 255, 0.5);
    }

    .empty-icon {
      color: rgba(255, 255, 255, 0.3);
      width: 32px;
    }
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
</style>
