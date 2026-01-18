<script>
  /**
   * LibraryDrawer - Slide-up bottom sheet for selecting entities.
   * Internalized drawer and card styling.
   */
  import { app } from "../gamemaster/state.svelte.js";
  import { themeStore } from "../mesmer/logic/theme.svelte.js";
  import { fade, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import LibraryCard from "./LibraryCard.svelte";

  // Derived from drawer state
  let isOpen = $derived(app.drawer.open);
  let drawerType = $derived(app.drawer.type);

  // Get the appropriate list based on drawer type
  let entityList = $derived(() => {
    if (drawerType === "ai") return app.aiList;
    if (drawerType === "user") return app.userList;
    if (drawerType === "fractal") return app.fractalList;
    return [];
  });

  // Get drawer title
  let title = $derived(() => {
    if (drawerType === "ai") return "Select AI Companion";
    if (drawerType === "user") return "Select User Persona";
    if (drawerType === "fractal") return "Select Fractal";
    return "Select Entity";
  });

  function handleSelect(entity) {
    app.selectEntity(drawerType, entity);
  }

  function handleBackdropClick() {
    app.closeDrawer();
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && isOpen) {
      app.closeDrawer();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="drawer-backdrop"
    role="button"
    tabindex="-1"
    aria-label="Close drawer"
    transition:fade={{ duration: 500, easing: quintOut }}
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === "Enter" && handleBackdropClick()}
  ></div>

  <!-- Drawer -->
  <div
    class="entity-drawer"
    role="dialog"
    aria-labelledby="drawer-title"
    transition:fly={{ y: "100%", duration: 500, easing: quintOut }}
  >
    <div class="drawer-handle"></div>

    <header class="drawer-header">
      <h3 id="drawer-title">{title()}</h3>
    </header>

    <div class="drawer-content">
      {#if entityList().length === 0}
        <div class="drawer-empty">
          <svg class="empty-icon" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"
            />
          </svg>
          <h4>
            No {drawerType === "fractal" ? "Realities" : "Characters"} Found
          </h4>
          <p>Create one to get started.</p>
        </div>
      {:else}
        <div class="drawer-grid">
          <!-- Add New Card -->
          <button
            class="drawer-card drawer-card--new"
            onclick={() => console.log("Create new", drawerType)}
          >
            <span class="drawer-card-icon">+</span>
            <span class="drawer-card-label">Create New</span>
          </button>

          <!-- Entity Cards -->
          {#each entityList() as entity (entity.id)}
            <LibraryCard
              {entity}
              type={drawerType}
              onSelect={() => handleSelect(entity)}
              onViewProfile={() => app.openProfile(entity)}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  @use "../scss/abstracts" as *;

  /* --- DRAWER CONTAINER --- */
  .entity-drawer {
    /* Solid, fully opaque drawer - no glass effect */
    background: rgb(18, 24, 34);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: none;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);

    /* --- POSITIONING --- */
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);

    width: 80vw;
    max-height: 85vh;

    /* --- SHAPE & LAYERS --- */
    border-radius: 20px 20px 0 0;
    z-index: z(drawer);
    display: flex;
    flex-direction: column;
    pointer-events: auto;
  }

  /* --- BACKDROP --- */
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 60%);
    backdrop-filter: blur(4px);
    z-index: calc(z(drawer) - 1);
    opacity: 1;
    cursor: pointer;
  }

  /* --- HEADER --- */
  .drawer-header {
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgb(255 255 255 / 10%);
    background: rgb(12, 16, 24); /* Fully opaque, slightly darker */
    border-radius: 20px 20px 0 0; /* Match drawer corners */
    flex-shrink: 0;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-family: var(--font-heading);
      color: var(--app-h3-color);
    }
  }

  /* --- CONTENT GRID --- */
  .drawer-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;

    @include custom-scrollbar;
  }

  .drawer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1.25rem;
    padding-bottom: 2rem;
  }

  /* --- ADD NEW CARD --- */
  .drawer-card--new {
    aspect-ratio: 2 / 3;
    border: 2px dashed rgb(255 255 255 / 20%);
    background: transparent;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--app-muted);
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--app-primary);
      color: var(--app-primary);
      background: rgb(255 255 255 / 3%);
      transform: translateY(-4px);
    }

    .drawer-card-icon {
      font-size: clamp(1.2rem, 4vw, 2.2rem);
      font-family: var(--font-heading);
      margin: 0;
    }

    .drawer-card-label {
      font-size: 0.8rem;
      font-weight: 700;
    }
  }

  /* --- EMPTY STATE --- */
  .drawer-empty {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    width: 100%;
    color: var(--app-muted);
    text-align: center;
    padding: 2rem;
    gap: 1rem;

    .empty-icon {
      width: 4rem;
      height: 4rem;
      opacity: 0.2;
      fill: currentcolor;
      margin-bottom: 0.5rem;
      transition: all 0.3s ease;
    }

    &:hover .empty-icon {
      transform: scale(1.1) rotate(-5deg);
      opacity: 0.3;
    }

    h4 {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 800;
      font-family: var(--font-heading);
      color: var(--signature-color);
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.7;
      font-family: var(--font-body);
    }
  }

  @include mobile {
    .entity-drawer {
      width: 100vw;
      left: 0;
      transform: none;
      border-radius: 20px 20px 0 0;
      max-height: 85vh;
    }

    .drawer-grid {
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 1rem;
    }
  }
</style>
