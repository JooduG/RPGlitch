<script>
  /**
   * @file Drawer.svelte
   * 🐣 THE ENTITY BIRTHPLACE
   * Slide-up sheet for selecting or creating entities (AI, User, or Fractal).
   */
  import { create_new } from "@data/content-normaliser.js";
  import { entities as repository } from "@data/repository.js";
  import { app } from "@state/app.svelte.js";
  import { kineticScroll } from "@utils/kinetic.js";
  import { quintOut } from "svelte/easing";
  import { fly } from "svelte/transition";

  import Backdrop from "@atoms/Backdrop.svelte";
  import LibraryCard from "@drawer/LibraryCard.svelte";
  import Button from "@atoms/Button.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";

  // --- STATE & DERIVATIONS ---

  let is_open = $derived(app.drawer.open);

  /** @type {'ai' | 'user' | 'fractal' | null} */
  let drawer_type = $derived(app.drawer.type);

  /** Maps the UI drawer type to the appropriate entity list. */
  let entity_list = $derived(
    drawer_type === "ai"
      ? app.ai_list
      : drawer_type === "user"
        ? app.user_list
        : drawer_type === "fractal"
          ? app.fractal_list
          : [],
  );

  /** @type {Record<string, string>} */
  const TITLES = {
    ai: "Select AI Companion",
    user: "Choose Your Persona",
    fractal: "Select Fractal",
  };

  let title = $derived((drawer_type ? TITLES[drawer_type] : null) ?? "Select Entity");

  // --- GUARDS ---

  /**
   * Prevents the same entity from being used for both User and AI roles.
   * @param {any} entity
   */
  function is_disabled(entity) {
    if (drawer_type === "ai" && app.selected_user?.id === entity.id) return true;
    if (drawer_type === "user" && app.selected_ai?.id === entity.id) return true;
    return false;
  }

  // --- ACTIONS ---

  /**
   * THE BIRTH EVENT: handle_create_new
   * Uses the Factory to generate a fresh entity and persists it to the DB.
   */
  async function handle_create_new() {
    const type = drawer_type === "fractal" ? "fractal" : "character";
    const plan = create_new(type, {
      name: `New ${drawer_type ? drawer_type.toUpperCase() : type.toUpperCase()}`,
    });

    try {
      const saved = await repository.upsert(type, plan);
      app.log(`Birthed new ${type}: ${saved.id}`, "db");
      app.select_entity(drawer_type, saved);
      app.open_profile(saved);
    } catch (err) {
      const error = /** @type {Error} */ (err);
      app.log(`Creation failed: ${error.message}`, "error");
    }
  }

  /** @param {any} entity */
  function handle_select(entity) {
    app.select_entity(drawer_type, entity);
  }

  /** @param {KeyboardEvent} e */
  function handle_keydown(e) {
    if (e.key === "Escape" && is_open) app.close_drawer();
  }
</script>

<svelte:window onkeydown={handle_keydown} />

{#if is_open}
  <Backdrop onclick={() => app.close_drawer()} z_index="calc(var(--z-index-xl) - 1)" />

  <div
    class="drawer glass-l"
    role="dialog"
    aria-labelledby="drawer-title"
    transition:fly={{ y: "100%", duration: 500, easing: quintOut }}
  >
    <header class="header">
      <h3 id="drawer-title">{title}</h3>
    </header>

    <div class="body no-scrollbar" use:kineticScroll>
      <div class="grid">
        <!-- "Create New" card -->
        <div
          class="card--new glass-s"
          style="--signature-color: var(--color-frisk); --signature-rgb: var(--color-frisk-rgb);"
        >
          <Button
            variant="invisible"
            cover={true}
            onclick={handle_create_new}
            aria-label="Create new entity"
          />
          <div class="visual">
            <ProfilePicture placeholder_char="?" />
          </div>
          <div class="info">
            <span class="label">Create New</span>
          </div>
          <div class="bar"></div>
        </div>

        {#each entity_list as entity (entity.id)}
          <LibraryCard
            {entity}
            type={drawer_type ?? undefined}
            disabled={is_disabled(entity)}
            onSelect={() => handle_select(entity)}
            onViewProfile={() => app.open_profile(entity)}
          />
        {/each}
      </div>

      {#if entity_list.length === 0}
        <div class="empty">
          <svg class="empty-icon" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"
            />
          </svg>
          <h4>No {drawer_type === "fractal" ? "Realities" : "Entities"} Found</h4>
          <p>Click "Create New" to initialize one.</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* --- SHELL --- */
  .drawer {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 1200px;
    max-height: 85vh;
    border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
    z-index: var(--z-index-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-bottom: none;
    box-shadow: var(--shadow-xl);
  }

  /* --- HEADER --- */
  .header {
    padding: var(--spacing-m) var(--spacing-l);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: var(--border-xl);
  }

  .header h3 {
    margin: 0;
    letter-spacing: var(--letter-spacing-l);
    font-weight: var(--font-weight-xl);
    font-size: var(--font-size-xl);
    font-family: var(--font-family-heading);
    text-transform: uppercase;
    color: var(--color-white);
    text-shadow: var(--shadow-font);
  }

  /* --- BODY --- */
  .body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-xl);
  }

  /* --- GRID --- */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--spacing-l);
    width: 100%;
  }

  /* --- NEW ENTITY CARD --- */
  .card--new {
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

  .card--new:hover {
    transform: scale(1.02);
    filter: brightness(1.1);
  }

  .card--new:active {
    transform: scale(var(--motion-click));
  }

  .card--new .visual {
    flex: 1.5;
    background: var(--glass-s);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    border-radius: var(--border-radius-m) var(--border-radius-m) 0 0;
  }

  /* Strip ProfilePicture's own background so .visual glass-s shows through */
  .card--new .visual :global(.profile-picture),
  .card--new .visual :global(.placeholder) {
    background: transparent;
    background-image: none;
  }

  .card--new .info {
    flex: 0.6;
    padding: var(--spacing-s);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--glass-s);
    border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);
  }

  .card--new .label {
    font-weight: var(--font-weight-xl);
    font-family: var(--font-family-heading);
    text-transform: uppercase;
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-m);
    color: var(--signature-color);
    text-align: center;
  }

  .card--new .bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--signature-color);
    opacity: 0.3;
    transition: opacity var(--motion-l);
  }

  .card--new:hover .bar {
    opacity: 1;
  }

  /* --- EMPTY STATE --- */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--font-color-s);
  }

  .empty-icon {
    width: 80px;
    height: 80px;
    opacity: var(--opacity-xs);
    margin-bottom: var(--spacing-m);
  }

  .empty h4 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: var(--font-weight-xl);
  }

  .empty p {
    opacity: var(--opacity-l);
    margin-top: 0.5rem;
  }

  /* --- RESPONSIVE --- */
  @media (width <= 768px) {
    .drawer {
      max-width: 100vw;
      border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
    }

    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-m);
    }
  }
</style>
