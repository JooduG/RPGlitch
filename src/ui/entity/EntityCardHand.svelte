<script>
  /**
   * @file src/ui/entity/EntityCardHand.svelte
   * 🃏 THE QUANTUM CARD-FAN OVERLAY
   * Replaces the legacy slide-up drawer with an immersive, orbital card-fan engine.
   * Standard: Fine-grained Svelte 5 Reactivity & Kinetic Geometry.
   */
  import { Backdrop, Button } from "@primitives";
  import { create_new, entities as repository } from "@data";
  import ImportModal from "./ImportModal.svelte";
  import EntityCard from "./EntityCard.svelte";
  import { motion, fly_card_in, fly_card_out, rect_of } from "@motion";
  import { app } from "@state";

  // --- RUNES & CORE VIEW ENGINE CONNECTIONS ---
  let is_open = $derived(app.card_hand.open);
  let card_hand_type = $derived(app.card_hand.type);

  /** @type {number | null} */
  let hovered_index = $state(null);
  let show_import_modal = $state(false);
  /** True while a card is mid-flight to its storyboard slot — ignores concurrent selects. */
  let flight_active = $state(false);

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
      card_hand_type === "ai" ? app.ai_list : card_hand_type === "user" ? app.user_list : card_hand_type === "fractal" ? app.fractal_list : []
    ).filter((/** @type {any} */ entity) => !is_disabled(entity)),
  );

  const total_cards = $derived(entity_list.length);
  const card_step = $derived(Math.max(1.8, Math.min(3.2, 45 / Math.max(1, total_cards))));

  // Center premade cards at angle 0; place action cards predictably to the left
  const first_card_angle = $derived(-((total_cards - 1) / 2) * card_step);
  const create_angle = $derived(first_card_angle - card_step);
  const import_angle = $derived(create_angle - card_step);

  /** @type {Record<string, string>} */
  const TITLES = {
    ai: "Select AI Character",
    user: "Select User Persona",
    fractal: "Select Fractal",
  };

  let title = $derived((card_hand_type ? TITLES[card_hand_type] : null) ?? "Select Entity");

  // --- MUTUAL EXCLUSION SAFETY BARRIERS ---
  /**
   * Prevents identity allocation collisions across synchronized role slots.
   * @param {any} entity
   * @returns {boolean}
   */
  function is_disabled(entity) {
    if (!entity || !card_hand_type) return false;
    if (card_hand_type === "ai") {
      return app.selected_ai?.id === entity.id || app.selected_user?.id === entity.id;
    }
    if (card_hand_type === "user") {
      return app.selected_user?.id === entity.id || app.selected_ai?.id === entity.id;
    }
    if (card_hand_type === "fractal") {
      return app.selected_fractal?.id === entity.id;
    }
    return false;
  }

  // --- PERSISTENCE & FACTORY ACTIONS ---
  /**
   * Generates a pristine entity instance template via the Factory and upserts to storage.
   */
  async function handle_create_new() {
    const type = card_hand_type === "fractal" ? "fractal" : "character";
    const plan = create_new(type, {
      name: `New ${type === "character" ? "Character" : "Fractal"}`,
    });

    try {
      const saved = await repository.upsert(type, plan);
      await app.load_entities(); // Refresh lists so the new entity appears immediately
      app.log(`Birthed new ${type} blueprint: ${saved.id}`, "db");
      app.select_entity(card_hand_type, saved);
      app.open_profile(saved);
      app.close_card_hand();
    } catch (err) {
      const error = /** @type {Error} */ (err);
      app.log(`Factory initialization failed: ${error.message}`, "error");
    }
  }

  function handle_open_import() {
    show_import_modal = true;
  }

  /** @param {any} entity */
  function handle_select(entity) {
    if (is_disabled(entity) || flight_active) return;
    hovered_index = null;

    if (motion.is_reduced) {
      app.select_entity(card_hand_type, entity);
      app.close_card_hand();
      return;
    }

    const source = document.querySelector(`[data-entity-id="${CSS.escape(String(entity.id))}"] [data-card-root]`);
    const target =
      document.querySelector(`[data-slot-type="${card_hand_type}"] [data-card-root]`) ||
      document.querySelector(`[data-slot-type="${card_hand_type}"]`);
    if (!source || !target) {
      app.select_entity(card_hand_type, entity);
      app.close_card_hand();
      return;
    }
    fly_card_to_slot(entity, source, target);
  }

  /**
   * 🛫 THE HAND-TO-SLOT FLIGHT
   * Physically lifts the clicked card out of the fan and carries it across the
   * stage onto its storyboard slot. If the slot already holds an entity, the
   * swapped-out card returns to the deck in the same motion. Real selection is
   * committed only when the clone lands, masking the slot's update.
   * @param {any} entity
   * @param {HTMLElement} source
   * @param {HTMLElement} target
   */
  function fly_card_to_slot(entity, source, target) {
    flight_active = true;
    app.close_card_hand();

    const existing =
      card_hand_type === "ai"
        ? app.selected_ai
        : card_hand_type === "user"
          ? app.selected_user
          : card_hand_type === "fractal"
            ? app.selected_fractal
            : null;

    const source_rect = rect_of(source);
    const target_rect = rect_of(target);

    // Hide the real card — its clone is the stand-in for the flight.
    source.style.transition = "none";
    source.style.opacity = "0";

    // Swap: return the current slot occupant to the deck while the new card is airborne.
    let old_root = null;
    if (existing && String(existing.id) !== String(entity.id)) {
      old_root = target.matches("[data-card-root]") ? target : target.querySelector("[data-card-root]");
      if (old_root) {
        const out_rect = rect_of(old_root);
        fly_card_out(old_root, {
          left: Math.max(0, window.innerWidth / 2 - (out_rect.width * 0.7) / 2),
          top: Math.max(0, window.innerHeight - out_rect.height * 0.72),
          width: out_rect.width * 0.7,
          height: out_rect.height * 0.7,
        });
        old_root.style.transition = "none";
        old_root.style.opacity = "0";
      }
    }

    fly_card_in(source, source_rect, target_rect, {
      on_land: () => {
        if (old_root) {
          old_root.style.opacity = "";
          old_root.style.transition = "";
        }
        app.select_entity(card_hand_type, entity);
      },
    }).finally(() => {
      flight_active = false;
    });
  }

  /** @param {KeyboardEvent} e */
  function handle_keydown(e) {
    if (e.key === "Escape" && is_open) app.close_card_hand();
  }
</script>

<svelte:window onkeydown={handle_keydown} />

{#if is_open}
  <!-- Svelte handles Backdrop outro natively. Removing redundant wrapper div. -->
  <Backdrop onclick={() => app.close_card_hand()} layer="cardhand" />
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
      pb-[calc(var(--spacing-row-unit)*0.1)]
      transition-all
      duration-300
      ease-in-out

      {show_import_modal ? 'pointer-events-none opacity-0 transition-opacity duration-200' : ''}
      {is_visible
      ? `
        translate-y-0
        opacity-100
      `
      : `
        translate-y-full
        opacity-0
      `}
      {motion.is_reduced
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
          text-shadow-(--shadow-ambient)
        "
      >
        {title}
      </h4>
    </header>

    <div
      class="
        relative
        block
        h-[calc(var(--spacing-row-unit)*3.5)]
        w-full
        max-w-(--grid-width-max)
        origin-bottom
        pb-[calc(var(--spacing-row-unit)*0.2)]
        transition-all
        duration-300
      "
      style:--total-count={total_cards}
    >
      <!-- IMPORT CARD -->
      <div
        class="
          pointer-events-auto
          absolute
          bottom-0
          left-1/2
          ml-[calc(-0.425*var(--spacing-column-unit))]
          h-[calc(var(--spacing-row-unit)*2.8)]
          w-[calc(var(--spacing-column-unit)*0.85)]

          hover:z-50!
        "
        role="presentation"
        style:transform="rotate({import_angle}deg) translateY(0)"
        style:transform-origin="center calc(100% + calc(var(--spacing-row-unit) * 25))"
        style:z-index="0"
        onmouseenter={() => (hovered_index = -2)}
        onmouseleave={() => (hovered_index = null)}
      >
        <Button
          variant="bare"
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
          aria-label="Import"
          onclick={handle_open_import}
        ></Button>
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
          style:transform={hovered_index === -2 ? `rotate(${-import_angle}deg) translateY(calc(var(--spacing-row-unit) * -0.6)) scale(1.08)` : "none"}
        >
          <EntityCard variant="library" type={card_hand_type ?? undefined} role_label="Import" onclick={handle_open_import} />
        </div>
      </div>

      <!-- CREATE NEW CARD -->
      <div
        class="
          pointer-events-auto
          absolute
          bottom-0
          left-1/2
          ml-[calc(-0.425*var(--spacing-column-unit))]
          h-[calc(var(--spacing-row-unit)*2.8)]
          w-[calc(var(--spacing-column-unit)*0.85)]

          hover:z-50!
        "
        role="presentation"
        style:transform="rotate({create_angle}deg) translateY(0)"
        style:transform-origin="center calc(100% + calc(var(--spacing-row-unit) * 25))"
        style:z-index="0"
        onmouseenter={() => (hovered_index = -1)}
        onmouseleave={() => (hovered_index = null)}
      >
        <Button
          variant="bare"
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
        ></Button>
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
          style:transform={hovered_index === -1 ? `rotate(${-create_angle}deg) translateY(calc(var(--spacing-row-unit) * -0.6)) scale(1.08)` : "none"}
        >
          <EntityCard variant="library" type={card_hand_type ?? undefined} role_label="Create New" onclick={handle_create_new} />
        </div>
      </div>

      {#each entity_list as entity, idx (entity.id)}
        {@const dynamic_angle = (idx - (total_cards - 1) / 2) * card_step}
        {@const is_hovered = hovered_index === idx}

        <div
          class="
            pointer-events-auto
            absolute
            bottom-0
            left-1/2
            ml-[calc(-0.425*var(--spacing-column-unit))]
            h-[calc(var(--spacing-row-unit)*2.8)]
            w-[calc(var(--spacing-column-unit)*0.85)]

            hover:z-50!
          "
          role="presentation"
          data-entity-id={entity.id}
          style:transform="rotate({dynamic_angle}deg) translateY(0)"
          style:transform-origin="center calc(100% + calc(var(--spacing-row-unit) * 25))"
          style:z-index={idx + 1}
          onmouseenter={() => (hovered_index = idx)}
          onmouseleave={() => (hovered_index = null)}
        >
          <Button
            variant="bare"
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
          ></Button>

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
                brightness-[0.2]
                grayscale-[0.9]
              `
              : ''}
              {hovered_index !== null && !is_hovered && !is_disabled(entity)
              ? `
                blur-[1px]
                brightness-[0.35]
                grayscale-[0.4]
              `
              : ''}"
            style:transform={is_hovered ? `rotate(${-dynamic_angle}deg) translateY(calc(var(--spacing-row-unit) * -0.85)) scale(1.18)` : "none"}
          >
            <EntityCard
              variant="library"
              {entity}
              type={card_hand_type ?? undefined}
              disabled={is_disabled(entity)}
              launch_gesture={false}
              onclick={() => handle_select(entity)}
            />
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<ImportModal bind:open={show_import_modal} target_type={card_hand_type === "fractal" ? "fractal" : "character"} />
