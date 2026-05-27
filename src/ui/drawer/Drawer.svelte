<script>
  /**
   * @file Drawer.svelte
   * 🐣 THE ENTITY BIRTHPLACE
   * Slide-up sheet for selecting or creating entities (AI, User, or Fractal).
   */
  import { resolve_ms } from "@components";
  import { create_new, entities as repository } from "@data";
  import { kinetic_scroll } from "@motion";
  import { app } from "@state";
  import { quartOut } from "svelte/easing";
  import { fly } from "svelte/transition";

  import Backdrop from "@atoms/Backdrop.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import EntityCard from "@atoms/EntityCard.svelte";

  // --- STATE & DERIVATIONS ---

  const duration = resolve_ms("--duration-slow", 400);

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
  <Backdrop onclick={() => app.close_drawer()} z_index="var(--z-index-modal)" />

  <div
    class="drawer glass-elevated"
    class:is-mobile={app.viewport.mobile}
    class:is-mini={app.viewport.mini}
    role="dialog"
    aria-labelledby="drawer-title"
    transition:fly={{ y: 800, duration, easing: quartOut }}
  >
    <header class="header">
      <h4 id="drawer-title">{title}</h4>
    </header>

    <div class="body" use:kinetic_scroll>
      <div class="grid">
        <!-- "Create New" card -->
        <div
          class="card--new glass-sunken interactable"
          class:is-fractal={drawer_type === "fractal"}
          style="--signature-color: var(--frisk);"
          role="button"
          tabindex="0"
          aria-label="Create new entity"
          onclick={handle_create_new}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handle_create_new();
            }
          }}
        >
          <div class="visual">
            <ProfilePicture placeholder_char="?" />
          </div>
          <div class="info">
            <span class="label">Create New</span>
          </div>
          <div class="bar"></div>
        </div>

        {#each entity_list as entity (entity.id)}
          <EntityCard
            variant="library"
            {entity}
            type={drawer_type ?? undefined}
            disabled={is_disabled(entity)}
            onclick={() => handle_select(entity)}
            onViewProfile={() => app.open_profile(entity)}
          />
        {/each}
      </div>

      {#if entity_list.length === 0}
        <div class="empty">
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
    left: 0;
    right: 0;
    margin-inline: auto;
    width: 100%;
    max-width: calc(var(--column-unit) * 10);
    max-height: var(--modal-height-standard);
    border-radius: var(--radius-standard) var(--radius-standard) 0 0;
    z-index: var(--z-index-modal);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--shadow-standard);
  }

  /* --- HEADER --- */
  .header {
    padding: var(--padding-standard) var(--padding-standard);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header h4 {
    margin: 0;
    letter-spacing: var(--font-spacing-loose);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
  }

  /* --- BODY --- */
  .body {
    flex: 1;
    overflow: auto hidden;
    padding: 0 var(--padding-standard) var(--padding-standard);
    display: flex;
    align-items: center;
  }

  /* --- GRID (single-row horizontal flex row) --- */
  .grid {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--gap-standard);
    flex-shrink: 0;
    height: 100%;
  }

  /* --- NEW ENTITY CARD --- */
  .card--new {
    position: relative;
    width: calc(var(--storyboard-character-card-width) * 0.5);
    height: calc(var(--storyboard-character-card-height) * 0.5);
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    border: var(--border-whisper);
    border-color: rgb(from var(--signature-color) r g b / var(--opacity-whisper));
    padding: 0;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-standard);
    overflow: hidden;
    transition:
      width var(--duration-standard) var(--ease-standard),
      height var(--duration-standard) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard),
      filter var(--duration-fast) var(--ease-standard),
      opacity var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
  }

  .card--new.is-fractal {
    width: calc(var(--storyboard-fractal-card-width) * 0.5);
    height: calc(var(--storyboard-fractal-card-height) * 0.5);
  }

  .card--new:hover {
    border-color: var(--signature-color);
    box-shadow: var(--signature-glow);
  }

  .card--new .visual {
    height: calc(100% - calc(var(--spacing-unit) * 8));
    width: 100%;
    background: var(--signature-color, var(--frisk));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    border-radius: var(--radius-standard) var(--radius-standard) 0 0;
  }

  .card--new .info {
    height: calc(var(--spacing-unit) * 8);
    width: 100%;
    padding: var(--padding-tight);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--glass-sunken);
    border-radius: 0 0 var(--radius-standard) var(--radius-standard);
  }

  .card--new .label {
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-heading);
    text-transform: uppercase;
    font-size: clamp(var(--font-size-nano), 12cqi, var(--font-size-small));
    letter-spacing: var(--font-spacing-loose);
    color: var(--signature-color, var(--frisk));
    text-shadow: 0 0 calc(var(--spacing-unit) * 2)
      rgb(from var(--signature-color, var(--frisk)) r g b / var(--opacity-muted));
    text-align: center;
  }

  .card--new .bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--gap-tight);
    background: var(--signature-color, var(--frisk));
    opacity: 0;
    transition: opacity var(--motion-standard);
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
    padding: var(--padding-standard) var(--padding-standard);
    text-align: center;
    color: var(--frozen);
  }

  .empty h4 {
    margin: 0;
    font-weight: var(--font-weight-bold);
  }

  .empty p {
    opacity: var(--opacity-whisper);
    margin-top: var(--padding-standard);
  }

  /* --- RESPONSIVE --- */
  .drawer.is-mobile {
    max-width: 100vw;
    border-radius: var(--radius-standard) var(--radius-standard) 0 0;
  }

  .drawer.is-mobile .grid {
    gap: var(--gap-tight);
  }

  .drawer.is-mini .grid {
    gap: var(--gap-tight);
  }

  .drawer.is-mini .header {
    padding: var(--padding-standard);
  }

  .drawer.is-mini .body {
    padding: 0 var(--padding-standard) var(--padding-standard);
  }
</style>
