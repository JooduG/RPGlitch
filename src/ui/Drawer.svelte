<script>
  /**
   * @file LibraryDrawer.svelte
   * 🐣 THE ENTITY BIRTHPLACE
   * Slide-up sheet for selecting or creating entities (AI, User, or Fractal).
   */
  import { create_new } from "@data/content-normaliser.js";
  import { entities as repository } from "@data/repository.js";
  import { app } from "@state/app.svelte.js";
  import { kineticScroll } from "@ui/utils/kinetic.js";
  import { quintOut } from "svelte/easing";
  import { fly } from "svelte/transition";

  import Backdrop from "@ui/core/Backdrop.svelte";
  import LibraryCard from "./LibraryCard.svelte";
  import Button from "@ui/core/Button.svelte";
  import ProfilePicture from "@ui/core/ProfilePicture.svelte";

  // --- STATE & DERIVATIONS ---
  let is_open = $derived(app.drawer.open);
  let drawerType = $derived(app.drawer.type); // 'ai' | 'user' | 'fractal'

  /**
   * Dynamically maps the UI drawer type to the appropriate data list.
   */
  let entity_list = $derived(() => {
    if (drawerType === "ai") return app.ai_list;
    if (drawerType === "user") return app.user_list;
    if (drawerType === "fractal") return app.fractal_list;
    return [];
  });

  /**
   * Prevents the same entity from being used for both User and AI roles.
   */
  function isDisabled(entity) {
    if (drawerType === "ai" && app.selected_user?.id === entity.id) return true;
    if (drawerType === "user" && app.selected_ai?.id === entity.id) return true;
    return false;
  }

  /**
   * Header Label Logic
   */
  let title = $derived(() => {
    const labels = {
      ai: "Select AI Companion",
      user: "Choose Your Persona",
      fractal: "Select Fractal",
    };
    return labels[drawerType] || "Select Entity";
  });

  // --- ACTIONS ---

  /**
   * THE BIRTH EVENT: handleCreateNew
   * Uses the Factory to generate a fresh entity and persists it to the DB.
   */
  async function handleCreateNew() {
    // 1. Map UI role to DB type
    const type = drawerType === "fractal" ? "fractal" : "character";

    // 2. Construct via Factory (Random color, Empty fields, Semantic Structure)
    const plan = create_new(type, {
      name: `New ${drawerType.toUpperCase()}`,
    });

    try {
      // 3. Save to Database via Repository
      const saved = await repository.upsert(type, plan);

      // 4. Log the event for telemetry
      app.log(`Birthed new ${type}: ${saved.id}`, "db");

      // 5. Select and Open for Editing
      // This closes the drawer and slides the Profile wing into view.
      app.select_entity(drawerType, saved);
      app.open_profile(saved);
    } catch (err) {
      app.log(`Creation failed: ${err.message}`, "error");
    }
  }

  function handle_select(entity) {
    app.select_entity(drawerType, entity);
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && is_open) {
      app.close_drawer();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if is_open}
  <Backdrop onclick={() => app.close_drawer()} z_index="calc(var(--z-index-xl) - 1)" />

  <div
    class="entity-drawer glass-l"
    role="dialog"
    aria-labelledby="drawer-title"
    transition:fly={{ y: "100%", duration: 500, easing: quintOut }}
  >
    <header class="drawer-header">
      <h3 id="drawer-title">{title()}</h3>
    </header>

    <div class="drawer-content no-scrollbar" use:kineticScroll>
      <div class="drawer-grid">
        <div
          class="drawer-card drawer-card--new glass-s"
          style="--signature-color: var(--color-frisk); --signature-rgb: var(--color-frisk-rgb);"
        >
          <Button
            variant="invisible"
            cover={true}
            onclick={handleCreateNew}
            aria-label="Create new entity"
          />
          <div class="card-visual">
            <ProfilePicture placeholderChar="?" />
          </div>
          <div class="card-info">
            <h5>
              <span class="drawer-card-label">Create New</span>
            </h5>
          </div>
          <div class="signature-bar"></div>
        </div>

        {#each entity_list() as entity (entity.id)}
          <LibraryCard
            {entity}
            type={drawerType}
            disabled={isDisabled(entity)}
            onSelect={() => handle_select(entity)}
            onViewProfile={() => app.open_profile(entity)}
          />
        {/each}
      </div>

      {#if entity_list().length === 0}
        <div class="drawer-empty">
          <svg class="empty-icon" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"
            />
          </svg>
          <h4>No {drawerType === "fractal" ? "Realities" : "Entities"} Found</h4>
          <p>Click "Create New" to initialize one.</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .entity-drawer {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: calc(var(--grid-unit) * 10);
    max-height: 85vh;
    border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
    z-index: var(--z-index-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-bottom: none;
    box-shadow: var(--shadow-xl);
  }

  .drawer-header {
    padding: var(--spacing-m) var(--spacing-l);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: var(--border-xl);
  }

  .drawer-header h3 {
    margin: 0;
    letter-spacing: var(--letter-spacing-l);
    font-weight: var(--font-weight-xl);
    font-size: var(--font-size-xl);
    font-family: var(--font-family-heading);
    text-transform: uppercase;
    color: var(--color-white);
    text-shadow: var(--shadow-font);
  }

  .drawer-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-xl);
  }

  .drawer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--grid-unit), 1fr));
    gap: var(--spacing-l);
    width: 100%;
  }

  /* --- NEW ENTITY CARD --- */
  .drawer-card--new {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 3;
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    border: none;
    padding: 0;
    background: var(--glass-s);
    cursor: pointer;
    border-radius: var(--border-radius-m);
    overflow: hidden;
    transition:
      transform var(--motion-l) var(--motion-elastic),
      filter var(--motion-l);
  }

  .drawer-card--new:hover {
    transform: scale(1.02);
    filter: brightness(1.1);
  }

  .drawer-card--new:active {
    transform: scale(var(--motion-click));
  }

  .drawer-card--new .card-visual {
    flex: 1.5;
    background: var(--glass-s);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    border-radius: var(--border-radius-m) var(--border-radius-m) 0 0;
  }

  .drawer-card--new .card-info {
    flex: 0.6;
    padding: var(--spacing-s);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--glass-s);
    border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);
  }

  /* Strip ProfilePicture's own background so card-visual glass-s shows through */
  .drawer-card--new .card-visual :global(.profile-picture),
  .drawer-card--new .card-visual :global(.placeholder) {
    background: transparent;
    background-image: none;
  }

  .drawer-card--new .card-info h5 {
    margin: 0;
    padding: 0;
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .drawer-card--new .drawer-card-label {
    font-weight: var(--font-weight-xl);
    font-family: var(--font-family-heading);
    text-transform: uppercase;
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-m);
    color: var(--signature-color);
    text-align: center;
  }

  .drawer-card--new .signature-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--signature-color);
    opacity: 0.3;
    transition: opacity var(--motion-l);
  }

  .drawer-card--new:hover .signature-bar {
    opacity: 1;
  }

  /* --- EMPTY STATE --- */
  .drawer-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--font-color-s);
  }

  .drawer-empty .empty-icon {
    width: 80px;
    height: 80px;
    opacity: var(--opacity-xs);
    margin-bottom: var(--spacing-m);
  }

  .drawer-empty h4 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: var(--font-weight-xl);
  }

  .drawer-empty p {
    opacity: var(--opacity-l);
    margin-top: 0.5rem;
  }

  @media (width <= 768px) {
    .entity-drawer {
      max-width: 100vw;
      border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
    }

    .drawer-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-m);
    }
  }
</style>
