<script>
  /**
   * @file Drawer.svelte
   * ðŸ£ THE ENTITY BIRTHPLACE
   * Slide-up sheet for selecting or creating entities (AI, User, or Fractal).
   * Standard: Fluid coordinate-free physics, pure percentage translation rules.
   */
  import { create_new, entities as repository } from "@data";
  import { kinetic_scroll, motion, spring } from "@motion";
  import { app } from "@state";
  import { fade } from "svelte/transition";

  import { Backdrop } from "@atoms";
  import { EntityCard } from "@molecules";

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
  class="
    fixed inset-x-0
    bottom-0
    z-50
    mx-auto
    flex
    max-h-(--modal-height-standard)
    w-fit
    max-w-(--modal-width-wide)
    min-w-(--modal-width-thin)
    flex-col
    overflow-hidden
    rounded-t-md
    bg-(--glass-elevated)
    shadow-md
    [backdrop-filter:var(--blur-mist)]

    {offset_spring.value > 99.5
    ? `
      pointer-events-none
      invisible
    `
    : ''}
    {app.viewport.mobile ? 'max-w-[100vw]' : ''}"
  role="dialog"
  aria-labelledby="drawer-title"
  style:transform={motion.isReduced ? "none" : `translateY(${offset_spring.value}%)`}
>
  <header
    class="{app.viewport.mini
      ? 'p-4'
      : `
    px-4
    pt-4
    pb-0
  `}

    flex
    items-center
    justify-between
  "
  >
    <h4
      id="drawer-title"
      class="
      m-0
      font-bold
      tracking-widest
      uppercase
    "
    >
      {title}
    </h4>
  </header>

  <div
    class="
      flex-1
      overflow-x-hidden
      overflow-y-auto

      {app.viewport.mini
      ? `
        px-4
        pt-0
        pb-4
      `
      : 'p-4'}

      -mt-4
    "
    use:kinetic_scroll
  >
    <div
      class="
        flex
        w-full
        flex-row
        flex-wrap
        content-start
        pt-4

        {app.viewport.mobile || app.viewport.mini ? 'gap-2' : 'gap-4'}"
    >
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
      <div
        class="
        flex
        flex-col
        items-center
        justify-center
        p-4
        text-center
        text-slate-600
      "
      >
        <h4
          class="
          m-0
          font-bold
        "
        >
          No {drawer_type === "fractal" ? "Realities" : "Entities"} Found
        </h4>
        <p
          class="
          mt-4
          opacity-30
        "
        >
          Click "Create New" to initialize one.
        </p>
      </div>
    {/if}
  </div>
</div>
