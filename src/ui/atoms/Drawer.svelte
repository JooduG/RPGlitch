<script>
  /**
   * @file Drawer.svelte
   * 🐣 THE ENTITY BIRTHPLACE
   * Slide-up sheet for selecting or creating entities (AI, User, or Fractal).
   * Standard: Fluid coordinate-free physics, pure percentage translation rules.
   */
  import { create_new, entities as repository } from "@data";
  import { kinetic_scroll, motion, spring } from "@motion";
  import { app } from "@state";
  import { fade } from "svelte/transition";

  import Backdrop from "@atoms/Backdrop.svelte";
  import EntityCard from "@atoms/EntityCard.svelte";

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

  // --- SVELTE 5 SPRING PHYSICS ---

  // Refactored to operate on 0-100 percentage parameters
  const offset_spring = spring(100, {
    stiffness: 0.12,
    damping: 0.75,
  });

  $effect(() => {
    if (app.drawer.open) {
      offset_spring.value = 0;
    } else {
      offset_spring.value = 100;
    }
  });

  /**
   * Evaluates if a given entity should be disabled to prevent transition collisions.
   * @param {any} entity - The entity to check.
   * @returns {boolean} True if the entity is already selected.
   */
  function is_disabled(entity) {
    if (!entity) return false;

    if (drawer_type === "ai") {
      return app.selected_ai?.id === entity.id || app.selected_user?.id === entity.id;
    }
    if (drawer_type === "user") {
      return app.selected_user?.id === entity.id || app.selected_ai?.id === entity.id;
    }
    if (drawer_type === "fractal") {
      return app.selected_fractal?.id === entity.id;
    }
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
  <div transition:fade={{ duration: 200 }}>
    <Backdrop onclick={() => app.close_drawer()} z_index="var(--z-index-modal)" />
  </div>
{/if}

<div
  class="drawer glass-elevated"
  class:is-mobile={app.viewport.mobile}
  class:is-mini={app.viewport.mini}
  class:is-retracted={offset_spring.value > 99.5}
  role="dialog"
  aria-labelledby="drawer-title"
  style:transform={motion.isReduced ? "none" : `translateY(${offset_spring.value}%)`}
>
  <header class="header">
    <h4 id="drawer-title">{title}</h4>
  </header>

  <div class="body" use:kinetic_scroll>
    <div class="grid">
      <EntityCard
        variant="library"
        type={drawer_type ?? undefined}
        role_label="Create New"
        onclick={handle_create_new}
      />

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

<style>
  /* --- SHELL --- */
  .drawer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin-inline: auto;
    width: fit-content;
    min-width: var(--modal-width-thin);
    max-width: var(--modal-width-wide);
    max-height: var(--modal-height-standard);
    border-radius: var(--radius-standard) var(--radius-standard) 0 0;
    z-index: var(--z-index-modal);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--shadow-standard);
  }

  .drawer.is-retracted {
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* --- HEADER --- */
  .header {
    padding: var(--padding-standard) var(--padding-standard) 0 var(--padding-standard);
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
    overflow: hidden auto;
    padding: var(--padding-standard);
    margin-top: calc(var(--padding-standard) * -1);
  }

  /* --- GRID (wrapping flex row) --- */
  .grid {
    display: flex;
    flex-flow: row wrap;
    align-content: flex-start;
    gap: var(--gap-standard);
    width: 100%;
    padding-top: var(--padding-standard);
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
