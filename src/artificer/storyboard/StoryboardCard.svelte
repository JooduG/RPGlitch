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

  // Derived Values
  let isEmpty = $derived(!entity);

  let signatureColor = $derived(themeStore.getSignatureColor(entity));
  let signatureRgb = $derived(themeStore.hexToRgb(signatureColor));
  let avatar = $derived(entity?.visuals?.avatar);
</script>

<div
  class="split-card {type}-card"
  class:fractal-card={type === "fractal"}
  class:is-empty={isEmpty}
  style="--signature-color: {signatureColor}; --signature-rgb: {signatureRgb};"
>
  <!-- Top Half: Visuals & Trigger for Profile -->
  <button
    class="card-top"
    onclick={onViewProfile}
    aria-label="View {roleLabel} Profile"
    disabled={isEmpty}
  >
    {#if isEmpty}
      <div class="slot-icon">
        {#if type === "fractal"}
          <svg viewBox="0 0 24 24" class="icon"
            ><path
              fill="currentColor"
              d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z"
            /></svg
          >
        {:else}
          <svg viewBox="0 0 24 24" class="icon"
            ><path
              fill="currentColor"
              d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
            /></svg
          >
        {/if}
      </div>
    {:else if type === "fractal"}
      <div class="fractal-diamond">♦</div>
    {:else if avatar}
      <img
        src={avatar}
        alt="{entity?.name || 'Entity'} Avatar"
        class="avatar-icon"
      />
    {:else}
      <div class="avatar-placeholder">?</div>
    {/if}
  </button>

  <!-- Bottom Half: Info & Trigger for Selection -->
  <button class="card-bottom" onclick={onSelect}>
    <span class="role-label">
      {roleLabel}
    </span>
    <h3>{entity?.name || `Select ${roleLabel}`}</h3>
    <p>{entity?.description || "Click to browse choices..."}</p>
  </button>
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
      box-shadow 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);

    width: 300px; /* Standard Width */
    height: 480px;

    /* Specific modification for the Center Card */
    &.fractal-card {
      width: 420px; /* Wider */
      height: 380px;
      transform: scale(1.05); /* Slight prominence */
      z-index: 10;

      .card-top {
        flex: 1.2; /* More visual space */
      }
    }

    &:hover:not(.is-empty) {
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
      z-index: 20;
    }

    &.is-empty {
      background: rgba(255, 255, 255, 0.03);
      border: 2px dashed rgba(var(--signature-rgb) / 0.15);
      cursor: default;

      .card-top {
        cursor: default;
        &:hover {
          filter: none;
        }
      }

      .slot-icon {
        color: rgba(255, 255, 255, 0.2);
        svg {
          width: 48px;
          height: 48px;
        }
      }
    }
  }

  /* Top Half: Visuals & Trigger for Profile */
  .card-top {
    flex: 1;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    background-color: var(--signature-color);
    transition: filter 0.2s ease;

    /* Interactive */
    &:hover {
      filter: brightness(1.1);
    }

    .avatar-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .avatar-placeholder {
      font-size: 3rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: bold;
    }

    .fractal-diamond {
      font-size: 4rem;
      color: #fff;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
    }
  }

  /* Bottom Half: Info & Trigger for Selection */
  .card-bottom {
    flex: 0.8;
    background: #09090b; /* Dark Slate */
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding: 1.5rem;
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #18181b;
    }

    .role-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      margin-bottom: 0.25rem;
      color: var(--signature-color);
    }

    h3 {
      margin: 0;
      color: #fff;
      font-size: 1.25rem;
      font-weight: 700;
    }

    p {
      margin: 0;
      color: #a1a1aa;
      font-size: 0.9rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
</style>
