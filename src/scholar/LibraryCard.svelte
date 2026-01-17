<script>
  /**
   * LibraryCard - A compact version of StoryboardCard for the Library drawer.
   */
  let {
    entity,
    type = "ai", // "ai" | "user" | "fractal"
    onSelect,
    onViewProfile,
  } = $props();

  import { themeStore } from "../mesmer/logic/theme.svelte.js";
  import { fade } from "svelte/transition";

  let signatureColor = $derived(themeStore.getSignatureColor(entity));
  let signatureRgb = $derived(themeStore.hexToRgb(signatureColor));
  let avatar = $derived(entity?.visuals?.avatar);
  let name = $derived(entity?.name || "Untitled");
  let description = $derived(entity?.description || "");
</script>

<button
  class="drawer-card"
  class:fractal-card={type === "fractal"}
  style="--signature-color: {signatureColor}; --signature-rgb: {signatureRgb};"
  onclick={onSelect}
  oncontextmenu={(e) => {
    e.preventDefault();
    onViewProfile();
  }}
>
  <div class="card-visual">
    {#if avatar}
      <img
        src={avatar}
        alt="{name} Avatar"
        class="avatar-image"
        transition:fade={{ duration: 200 }}
      />
    {:else}
      <div class="avatar-placeholder" class:fractal-mode={type === "fractal"}>
        {themeStore.getInitials(name)}
      </div>
    {/if}
  </div>

  <div class="card-info">
    <span class="entity-name">{name}</span>
    <span class="entity-desc" title={description}>{description}</span>
  </div>

  <div class="signature-bar"></div>
</button>

<style lang="scss">
  @use "../scss/abstracts" as *;

  .drawer-card {
    aspect-ratio: 2 / 3;
    background: var(--pico-card-background-color);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    padding: 0;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    width: 100%;

    @extend %material-interactive;

    &:hover {
      transform: translateY(-4px);
      border-color: var(--signature-color);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);

      .signature-bar {
        opacity: 1;
        height: 4px;
      }
    }

    .card-visual {
      flex: 1.5;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;

      .avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s ease;
      }

      .avatar-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: var(--signature-color);
        color: #ffffff;
        font-size: 2rem;
        font-weight: 800;
        transition: transform 0.6s ease;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

        &.fractal-mode {
          font-size: 3rem;
        }
      }
    }

    &:hover {
      .avatar-image,
      .avatar-placeholder {
        transform: scale(1.05);
      }

      .avatar-placeholder.fractal-mode {
        transform: scale(1.1) rotate(5deg);
      }
    }

    .card-info {
      flex: 1;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.4),
        rgba(0, 0, 0, 0.8)
      );

      .entity-name {
        font-size: 0.85rem;
        font-weight: 800;
        color: var(--signature-color);
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .entity-desc {
        font-size: 0.7rem;
        color: #ffffff;
        line-height: 1.3;
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .signature-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--signature-color);
      opacity: 0.6;
      transition: all 0.2s ease;
    }
  }
</style>
