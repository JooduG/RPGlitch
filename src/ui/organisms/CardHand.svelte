<script>
  /**
   * @file CardHand.svelte
   * 🃏 THE QUANTUM CARD-FAN OVERLAY
   * Replaces the legacy slide-up drawer with an immersive, orbital card-fan engine.
   * Standard: Fine-grained Svelte 5 Reactivity & Kinetic Geometry.
   */
  import { Backdrop } from "@atoms";
  import { create_new, entities as repository } from "@data";
  import { EntityCard } from "@molecules";
  import { motion } from "@motion";
  import { app } from "@state";

  // --- RUNES & CORE VIEW ENGINE CONNECTIONS ---
  let is_open = $derived(app.drawer.open);
  let drawer_type = $derived(app.drawer.type);

  /** @type {number | null} */
  let hovered_index = $state(null);

  // Deferral state for symmetric unmount
  let render_active = $state(false);
  let is_visible = $state(false);

  $effect(() => {
    if (is_open) {
      render_active = true;
      // Allow DOM to render `.deck-overlay` at its starting translated state
      // before adding `.is-visible` to trigger the CSS transition
      requestAnimationFrame(() => {
        is_visible = true;
      });
    } else if (render_active) {
      is_visible = false;
      // Use standard layout duration (300ms) for deterministic unmount
      const timer = setTimeout(() => {
        render_active = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  });

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
  <!-- Svelte handles Backdrop outro natively. Removing redundant wrapper div. -->
  <Backdrop onclick={() => app.close_drawer()} z_index="50" />
{/if}

{#if render_active}
  <div
    class="
      pointer-events-none
      fixed
      right-0
      bottom-0
      left-0
      z-50
      flex
      h-screen
      w-screen
      flex-col
      items-center
      justify-end
      overflow-hidden
      pb-[calc(var(--row-unit)*0.1)]
      transition-all
      duration-300
      ease-in-out

      {is_visible
      ? `
        translate-y-0
        opacity-100
      `
      : `
        translate-y-full
        opacity-0
      `}
      {motion.isReduced
      ? `
        translate-y-0
        transition-opacity!
        duration-300!
      `
      : ''}"
    role="dialog"
    aria-labelledby="hand-title"
  >
    <header
      class="
      pointer-events-auto
      z-20
      -mb-4
      text-center
    "
    >
      <h4
        id="hand-title"
        class="
          m-0
          font-bold
          tracking-widest
          text-slate-600
          uppercase
          text-shadow-(--title-shadow-ambient)
        "
      >
        {title}
      </h4>
    </header>

    <div
      class="
        relative
        block
        h-[calc(var(--row-unit)*3.5)]
        w-full
        max-w-(--grid-width-max)
        origin-bottom
        pb-[calc(var(--row-unit)*0.2)]
      "
      style:--total-count={total_cards}
    >
      <div
        class="
          pointer-events-auto
          absolute
          bottom-0
          left-1/2
          ml-[calc(-0.425*var(--column-unit))]
          h-[calc(var(--row-unit)*2.8)]
          w-[calc(var(--column-unit)*0.85)]

          hover:z-50!
        "
        role="presentation"
        style:transform="rotate({factory_angle}deg) translateY(0)"
        style:transform-origin="center calc(100% + calc(var(--row-unit) * 25))"
        style:z-index="0"
        onmouseenter={() => (hovered_index = -1)}
        onmouseleave={() => (hovered_index = null)}
      >
        <button
          class="
            absolute
            inset-0
            z-0
            h-full
            w-full
            cursor-pointer
            border-none
            bg-none
            opacity-0

            disabled:pointer-events-none
            disabled:cursor-default
          "
          aria-label="Create New"
          onclick={handle_create_new}
        ></button>
        <div
          class="
            relative
            z-10
            h-full
            w-full
            rounded-md
            transition-all
            duration-300
            ease-in-out
            will-change-transform
          "
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
          class="
            pointer-events-auto
            absolute
            bottom-0
            left-1/2
            ml-[calc(-0.425*var(--column-unit))]
            h-[calc(var(--row-unit)*2.8)]
            w-[calc(var(--column-unit)*0.85)]

            hover:z-50!
          "
          role="presentation"
          style:transform="rotate({dynamic_angle}deg) translateY(0)"
          style:transform-origin="center calc(100% + calc(var(--row-unit) * 25))"
          style:z-index={idx + 1}
          onmouseenter={() => (hovered_index = idx)}
          onmouseleave={() => (hovered_index = null)}
        >
          <button
            class="
              absolute
              inset-0
              z-0
              h-full
              w-full
              cursor-pointer
              border-none
              bg-none
              opacity-0

              disabled:pointer-events-none
              disabled:cursor-default
            "
            aria-label="Select {entity.name}"
            onclick={() => handle_select(entity)}
            disabled={is_disabled(entity)}
          ></button>

          <div
            class="
              relative
              z-10
              h-full
              w-full
              rounded-md
              transition-all
              duration-300
              ease-in-out
              will-change-transform

              {is_disabled(entity)
              ? `
                pointer-events-none
                opacity-30
                brightness-[0.2]
                grayscale-[0.9]
              `
              : ''}
              {hovered_index !== null && !is_hovered && !is_disabled(entity)
              ? `
                opacity-50
                blur-[1px]
                brightness-[0.35]
                grayscale-[0.4]
              `
              : ''}"
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
