<script>
  /**
   * @file CardHand.svelte
   * 🃏 THE QUANTUM CARD-FAN OVERLAY
   * Replaces the legacy slide-up drawer with an immersive, orbital card-fan engine.
   * Standard: Fine-grained Svelte 5 Reactivity & Kinetic Geometry.
   */
  import { create_new, entities as repository } from "@data";
  import { motion, spring } from "@motion";
  import { app } from "@state";
  import { fade } from "svelte/transition";
  import { Backdrop } from "@atoms";
  import { EntityCard } from "@molecules";

  // --- RUNES & CORE VIEW ENGINE CONNECTIONS ---
  let is_open = $derived(app.drawer.open);
  let drawer_type = $derived(app.drawer.type);

  /** @type {number | null} */
  let hovered_index = $state(null);

  // Core candidate source stream distribution
  let entity_list = $derived(
    /** @type {any[]} */ (
      drawer_type === "ai"
        ? app.ai_list
        : drawer_type === "user"
          ? app.user_list
          : drawer_type === "fractal"
            ? app.fractal_list
            : []
    ).filter((/** @type {any} */ entity) => !is_disabled(entity)),
  );

  const total_cards = $derived(entity_list.length);
  const factory_angle = $derived(-((total_cards / 2) * (total_cards > 6 ? 2.5 : 3) + 3));

  /** @type {Record<string, string>} */
  const TITLES = {
    ai: "Select AI Character",
    user: "Select User Persona",
    fractal: "Select Fractal",
  };

  let title = $derived((drawer_type ? TITLES[drawer_type] : null) ?? "Select Entity");

  // --- KINETIC SPRING ENGINE ---
  // Tracks smooth vertical entry/exit animations on a 0-100 percentage scale
  const hand_spring = spring(100, {
    stiffness: 0.1,
    damping: 0.72,
  });

  $effect(() => {
    if (is_open) {
      hand_spring.value = 0;
    } else {
      hand_spring.value = 100;
    }
  });

  // --- MUTUAL EXCLUSION SAFETY BARRIERS ---
  /**
   * Prevents identity allocation collisions across synchronized role slots.
   * @param {any} entity
   * @returns {boolean}
   */
  function is_disabled(entity) {
    if (!entity || !drawer_type) return false;
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

  // --- PERSISTENCE & FACTORY ACTIONS ---
  /**
   * Generates a pristine entity instance template via the Factory and upserts to storage.
   */
  async function handle_create_new() {
    const type = drawer_type === "fractal" ? "fractal" : "character";
    const plan = create_new(type, {
      name: `New ${drawer_type ? drawer_type.toUpperCase() : type.toUpperCase()}`,
    });

    try {
      const saved = await repository.upsert(type, plan);
      app.log(`Birthed new ${type} blueprint: ${saved.id}`, "db");
      app.select_entity(drawer_type, saved);
      app.open_profile(saved);
      app.close_drawer();
    } catch (err) {
      const error = /** @type {Error} */ (err);
      app.log(`Factory initialization failed: ${error.message}`, "error");
    }
  }

  /** @param {any} entity */
  function handle_select(entity) {
    if (is_disabled(entity)) return;
    app.select_entity(drawer_type, entity);
    app.close_drawer();
  }

  /** @param {KeyboardEvent} e */
  function handle_keydown(e) {
    if (e.key === "Escape" && is_open) app.close_drawer();
  }
</script>

<svelte:window onkeydown={handle_keydown} />

{#if is_open}
  <div transition:fade={{ duration: 250 }}>
    <Backdrop onclick={() => app.close_drawer()} z_index="var(--z-index-modal)" />
  </div>

  <div
    class="deck-overlay"
    role="dialog"
    aria-labelledby="hand-title"
    style:transform={motion.isReduced ? "none" : `translateY(${hand_spring.value}%)`}
  >
    <header class="deck-header">
      <h4 id="hand-title">{title}</h4>
    </header>

    <div class="deck-fan" style:--total-count={total_cards}>
      <div
        class="card-wrapper factory-node"
        role="presentation"
        style:transform="rotate({factory_angle}deg) translateY(0)"
        style:z-index="0"
        onmouseenter={() => (hovered_index = -1)}
        onmouseleave={() => (hovered_index = null)}
      >
        <button class="hitbox" aria-label="Create New" onclick={handle_create_new}></button>
        <div
          class="card-visual"
          class:is-raised={hovered_index === -1}
          style:transform={hovered_index === -1
            ? `rotate(${-factory_angle}deg) translateY(calc(var(--row-unit) * -0.6)) scale(1.08)`
            : "none"}
        >
          <EntityCard
            variant="library"
            type={drawer_type ?? undefined}
            role_label="Create New"
            onclick={handle_create_new}
          />
        </div>
      </div>

      {#each entity_list as entity, idx (entity.id)}
        {@const dynamic_angle = (idx - (total_cards - 1) / 2) * (total_cards > 6 ? 2.5 : 3)}
        {@const is_hovered = hovered_index === idx}

        <div
          class="card-wrapper interactable-node"
          role="presentation"
          style:transform="rotate({dynamic_angle}deg) translateY(0)"
          style:z-index={idx + 1}
          onmouseenter={() => (hovered_index = idx)}
          onmouseleave={() => (hovered_index = null)}
        >
          <button
            class="hitbox"
            aria-label="Select {entity.name}"
            onclick={() => handle_select(entity)}
            disabled={is_disabled(entity)}
          ></button>

          <div
            class="card-visual"
            class:is-raised={is_hovered}
            class:is-dimmed={hovered_index !== null && !is_hovered}
            class:is-allocated={is_disabled(entity)}
            style:transform={is_hovered
              ? `rotate(${-dynamic_angle}deg) translateY(calc(var(--row-unit) * -0.85)) scale(1.18)`
              : "none"}
          >
            <EntityCard
              variant="library"
              {entity}
              type={drawer_type ?? undefined}
              disabled={is_disabled(entity)}
              onclick={() => handle_select(entity)}
              onViewProfile={() => app.open_profile(entity)}
            />
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  /* --- SYSTEM BOUNDING FRAME OVERLAY --- */
  .deck-overlay {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--z-index-modal);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    padding-bottom: calc(var(--row-unit) * 0.1);
    overflow: hidden;
  }

  /* --- SYSTEM CONSOLE TEXT MODULE --- */
  .deck-header {
    pointer-events: auto;
    margin-bottom: calc(var(--spacing-unit) * -4);
    text-align: center;
    z-index: calc(var(--z-index-surface) + 10);
  }

  .deck-header h4 {
    margin: 0;
    letter-spacing: var(--font-spacing-loose);
    font-weight: var(--font-weight-bold);
    color: var(--frozen);
    text-shadow: var(--title-shadow-ambient);
    text-transform: uppercase;
  }

  /* --- ARC SELECTION DECK TRAY --- */
  .deck-fan {
    position: relative;
    display: block;
    width: 100%;
    max-width: var(--grid-width-max);
    height: calc(var(--row-unit) * 3.5);
    transform-origin: bottom center;
    padding-bottom: calc(var(--row-unit) * 0.2);
  }

  /* --- ARBITRARY TRANSFORM SHIELDS --- */
  .card-wrapper {
    position: absolute;
    pointer-events: auto;
    bottom: 0;
    left: 50%;
    width: calc(var(--column-unit) * 0.85);
    height: calc(var(--row-unit) * 2.8);
    margin-left: calc(var(--column-unit) * -0.425);
    transform-origin: center calc(100% + calc(var(--row-unit) * 25));
  }

  .hitbox {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: var(--z-index-base);
    border: none;
    background: none;
  }

  .hitbox:disabled {
    cursor: default;
    pointer-events: none;
  }

  .card-visual {
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: var(--radius-standard);
    z-index: var(--z-index-surface);
    will-change: transform;
    transition:
      transform var(--duration-fast) var(--ease-standard),
      filter var(--duration-fast) var(--ease-standard),
      opacity var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
  }

  .card-wrapper.interactable-node:hover {
    z-index: var(--z-index-max) !important;
  }

  .card-wrapper.factory-node:hover {
    z-index: var(--z-index-max) !important;
  }

  /* --- EXCLUSION BOUNDARY FILTER SHARDS --- */
  .card-visual.is-dimmed {
    filter: brightness(0.35) grayscale(0.4) blur(1px);
    opacity: 0.5;
  }

  .card-visual.is-allocated {
    filter: brightness(0.2) grayscale(0.9);
    opacity: 0.3;
    pointer-events: none;
  }
</style>
