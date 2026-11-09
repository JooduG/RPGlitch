<script module>
  /**
   * @file src/ui/Storyboard.svelte
   * ❄️ THE SOVEREIGN STORYBOARD STAGE
   * Master pre-story staging organism unifying the cinematic title header,
   * three entity selection slots (AI Character, Fractal, User Persona),
   * orbital card-fan hand overlay, shuffle deal choreography, and begin-story flight.
   */
  import { SvelteSet } from "svelte/reactivity";
  import { compute_initials, pick_random } from "@utils";
  import { active_entity_ids } from "@storage";
  import { VISUAL_STYLES } from "../media/styles.js";
  import { NARRATIVE_STYLES } from "../definitions/narrative-styles.js";
  const stories = { active_entity_ids };
  import { chrono_engine, app, simulation_log } from "@state";
  import { get_signature_color, motion, fly_card_in, fly_card_out, capture_storyboard_flight, fly_storyboard_cards_into_prologue } from "@media";
  import { parse_message } from "./Storymode.svelte";

  // ---------------------------------------------------------------------------------------------
  // PURE GEOMETRY & CLAIM HELPERS
  // ---------------------------------------------------------------------------------------------

  /**
   * Computes the on-screen deck rect a card travels to/from during a shuffle.
   * @param {{ width: number, height: number }} viewport
   * @param {{ width: number, height: number }} slot_rect
   * @param {{ pickup_scale?: number, deck_clearance?: number }} [options]
   */
  export function deck_geometry(viewport, slot_rect, { pickup_scale = 0.62, deck_clearance = 1.25 } = {}) {
    const width = slot_rect.width * pickup_scale;
    const height = slot_rect.height * pickup_scale;
    return {
      left: Math.max(0, viewport.width / 2 - width / 2),
      top: Math.max(0, viewport.height - height * deck_clearance),
      width,
      height,
    };
  }

  /**
   * Returns the first selected entity already claimed by an active story (or null),
   * so the begin flow can refuse to start with locked-in entities.
   * @param {Array<{ id: any } | null | undefined>} selected
   * @param {Iterable<unknown>} claimed_ids
   */
  export function claimed_entity_lock(selected, claimed_ids) {
    const claimed = new SvelteSet(claimed_ids);
    return selected.filter(Boolean).find((e) => e.id != null && claimed.has(String(e.id))) || null;
  }

  /**
   * Re-dresses a flying card clone with the newly drawn entity's appearance, so
   * the deal-in doesn't carry the swapped-out card's face up to the slot.
   * @param {HTMLElement} clone
   * @param {any} entity
   */
  function dress_deal_card(clone, entity) {
    if (!entity) return;
    const color = get_signature_color(entity, "var(--color-gunmetal)");
    clone.style.setProperty("--signature-color", color);
    clone.querySelectorAll("[style]").forEach((el) => {
      if (el.style.getPropertyValue("--signature-color")) {
        el.style.setProperty("--signature-color", color);
      }
    });
    const pic = entity.profile_picture;
    if (pic) {
      clone.querySelectorAll("img").forEach((img) => {
        img.src = pic;
        img.removeAttribute("srcset");
      });
    }
    const name_span = clone.querySelector(".bg-linear-to-t > span");
    if (name_span) name_span.textContent = entity.name || "Untitled";
    const desc = clone.querySelector(".bg-linear-to-t p");
    if (desc) desc.textContent = entity.description || "No description provided.";
    const initials = compute_initials(entity.name);
    clone.querySelectorAll("[class*='text-[clamp(0.6rem']").forEach((el) => {
      el.textContent = initials;
    });
  }

  // ---------------------------------------------------------------------------------------------
  // STORYBOARD CONTROLLER CLASS (SVELTE 5 RUNES)
  // ---------------------------------------------------------------------------------------------

  export class StoryboardController {
    #is_shuffling = $state(false);
    #begin_flight_started = $state(false);

    /**
     * Whether a card deal-shuffle animation is currently in progress.
     * @returns {boolean}
     */
    get is_shuffling() {
      return this.#is_shuffling;
    }

    /**
     * Whether the flight transition into the prologue message has been initiated.
     * @returns {boolean}
     */
    get begin_flight_started() {
      return this.#begin_flight_started;
    }

    set begin_flight_started(val) {
      this.#begin_flight_started = Boolean(val);
    }

    async shuffle() {
      if (app.simulation.loading) return;
      if (!app.ai_list.length) {
        await app.load_entities();
      }
      if (!app.ai_list.length) return;

      const pick_ai = pick_random(Array.isArray(app.ai_list) ? app.ai_list : []);
      let available_users = Array.isArray(app.user_list) ? app.user_list : [];
      if (pick_ai) {
        available_users = available_users.filter((u) => u.id !== pick_ai.id);
      }
      const pick_user = available_users.length ? pick_random(available_users) : app.user_list?.[0] || null;

      let pick_fractal = null;
      if (Array.isArray(app.fractal_list) && app.fractal_list.length) {
        const random_fractal = pick_random(app.fractal_list);
        if (random_fractal) {
          pick_fractal = {
            ...random_fractal,
            visual_style: pick_random(Object.keys(VISUAL_STYLES)),
            narrative_style: pick_random(Object.keys(NARRATIVE_STYLES)),
          };
        }
      }

      const commit = () => {
        app.selected_ai = pick_ai;
        app.selected_user = pick_user;
        app.selected_fractal = pick_fractal;
        if (typeof app.regenerate_title === "function") {
          app.regenerate_title();
        }
      };

      const slots = ["ai", "user", "fractal"].map((type) => {
        const wrapper = document.querySelector(`[data-slot-type="${type}"]`);
        const root = wrapper?.querySelector("[data-card-root]") || wrapper || null;
        return { type, wrap: wrapper, root, rect: root ? root.getBoundingClientRect() : null };
      });

      const dealable = !motion.is_reduced && app.view === "storyboard" && !this.#is_shuffling;
      if (!dealable || slots.some((s) => !s.root || !s.rect)) {
        if (!this.#is_shuffling) commit();
        return;
      }

      // 🃏 THE SHUFFLE DEAL: current cards return to the deck, then the newly
      // drawn cards deal out to their slots, staggered like a real hand.
      this.#is_shuffling = true;
      slots.forEach((s) => {
        s.wrap?.classList.remove("deal-reveal", "deal-revealed");
        s.wrap?.classList.add("deal-reveal");
      });
      const occupied = { ai: app.selected_ai, user: app.selected_user, fractal: app.selected_fractal };
      const picks = { ai: pick_ai, user: pick_user, fractal: pick_fractal };
      const viewport_w = window.innerWidth;
      const viewport_h = window.innerHeight;
      let title_done = false;

      slots.forEach((s, i) => {
        const r = /** @type {{ left: number, top: number, width: number, height: number }} */ (s.rect);
        const deck = deck_geometry({ width: viewport_w, height: viewport_h }, r);

        // Phase 1: return the current occupant to the deck (snappy exit).
        if (occupied[s.type] && s.root) {
          s.root.style.transition = "none";
          s.root.style.opacity = "0";
          fly_card_out(s.root, deck, { duration_ms: 210 });
        }

        // Phase 2: deal the new card in, staggered per slot.
        setTimeout(() => {
          if (!s.root || !s.rect) return;
          fly_card_in(s.root, deck, s.rect, {
            tag: "data-deal-in",
            on_clone: (clone) => dress_deal_card(clone, picks[s.type]),
            on_land: () => {
              if (s.root) {
                s.root.style.opacity = "";
                s.root.style.transition = "";
              }
              s.wrap?.classList.add("deal-revealed");
              app.selected_ai = picks.ai;
              app.selected_user = picks.user;
              app.selected_fractal = picks.fractal;
              if (!title_done && typeof app.regenerate_title === "function") {
                title_done = true;
                app.regenerate_title();
              }
            },
          });
        }, i * 90);
      });

      setTimeout(() => {
        this.#is_shuffling = false;
      }, 180 + 700);
    }

    async begin() {
      this.#begin_flight_started = false;
      if (!app.selected_ai || !app.selected_user || !app.selected_fractal) return;
      const claimed = await stories.active_entity_ids();
      const locked = claimed_entity_lock([app.selected_ai, app.selected_user, app.selected_fractal], claimed);
      if (locked) {
        app.log(`"${locked.name || "Entity"}" is claimed by an active story. End or delete that story first.`, "error");
        return;
      }
      await chrono_engine.start({
        ai: app.selected_ai,
        user: app.selected_user,
        fractal: app.selected_fractal,
      });
      await app.load_entities();
    }
  }

  export const storyboard = new StoryboardController();

  // ---------------------------------------------------------------------------------------------
  // BEGIN FLIGHT EFFECT
  // ---------------------------------------------------------------------------------------------

  /**
   * Installs the begin-story flight watcher. Must be called once during
   * Console.svelte's component init (it registers a runes effect, so it needs
   * the component's effect context).
   */
  export function install_begin_flight_effect() {
    $effect(() => {
      const _pending = app.begin_story_pending;
      if (!_pending) return;
      const has_prologue_entry = simulation_log.feed.some((entry) => entry.meta?.is_prologue);
      if (!has_prologue_entry || storyboard.begin_flight_started) return;

      if (app.streaming.active && app.streaming.content) {
        const parsed = parse_message(app.streaming.content);
        const visible_text = (parsed.displayText || "").replace(/<[^>]+>/g, "").trim();
        if (!visible_text) return;
      } else {
        return;
      }

      storyboard.begin_flight_started = true;
      const assets = capture_storyboard_flight();
      app._begin_flight_assets = assets;

      setTimeout(() => {
        if (!app.begin_story_pending) return;
        app.set_view("storymode");
        setTimeout(() => {
          if (!app.begin_story_pending) return;
          if (!document.querySelector("[data-msg-prologue]")) {
            app.begin_story_pending = false;
            app.suppress_card_transitions = false;
            app._begin_flight_assets = null;
            return;
          }
          const vp = document.querySelector("[data-id='storymode-scroll-area'] .scroll-area-viewport");
          if (vp) vp.scrollTop = 0;
          const dst_rects = {};
          const row = document.querySelector("[data-msg-prologue]");
          if (row) {
            for (const type of ["ai", "fractal", "user"]) {
              const card = row.querySelector(`[data-msg-card="${type}"] [data-card-root]`);
              if (card) dst_rects[type] = card.getBoundingClientRect();
            }
          }
          fly_storyboard_cards_into_prologue(assets, dst_rects);
          app.begin_story_pending = false;
          app.suppress_card_transitions = false;
          app._begin_flight_assets = null;
        }, 60);
      }, 0);
    });
  }
</script>

<script>
  import { untrack } from "svelte";
  import { Backdrop, Button, Shimmer, tooltip } from "@primitives";
  import { create_entity as create_new, detect_card_format, normalize_entity as normalize, parse_character_card, upsert_entity } from "@storage";
  const repository = { upsert: upsert_entity };
  import { Audio, rect_of } from "@media";
  import { runtime, simulation_state } from "@state";
  import { birth_entity_core } from "@storage";
  import { EntityCard } from "@ui";
  import { Modal, SourceField, Toggle } from "@primitives";

  // ============================================
  // TITLE HEADER STATE & CONSTANTS
  // ============================================
  let custom_title = $state("");
  let is_custom = $state(false);

  const PREFIXES = {
    STANDARD: ["The Story of", "The Adventures of", "The Tale of", "The Legend of", "The Saga of", "Chronicles of", "The Journey of"],
    FRACTAL: ["Adventures in", "Tales from", "The Fractal of", "Journey to"],
  };

  /** @param {any} entity */
  const get_color = (entity) => get_signature_color(entity);

  let prefix_roll = $state(roll_prefix());
  let last_roll_key = $state(app.card_hand.regenerate_count);

  function roll_prefix() {
    return untrack(() => {
      const has_entities = !!(app.selected_ai || app.selected_user);
      const has_fractal = !!app.selected_fractal;
      return pick_random(has_fractal && !has_entities ? PREFIXES.FRACTAL : PREFIXES.STANDARD);
    });
  }

  $effect(() => {
    const key = app.card_hand.regenerate_count;
    if (key === last_roll_key) return;
    last_roll_key = key;
    prefix_roll = roll_prefix();
  });

  let title_parts = $derived.by(() => {
    if (is_custom && custom_title) return [{ text: custom_title }];

    const { selected_ai: ai, selected_user: user, selected_fractal: fractal } = app;
    const has_entities = ai || user;
    const has_fractal = !!fractal;

    if (has_entities && has_fractal) {
      const prefix = prefix_roll || pick_random(PREFIXES.STANDARD);
      /** @type {Array<{text: string, color?: string, no_gap?: boolean}>} */
      const parts = [{ text: `${prefix} ` }];

      if (ai && user && ai.id === user.id) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else if (ai && user) {
        parts.push({ text: ai.name, color: get_color(ai) });
        parts.push({ text: " & " });
        parts.push({ text: user.name, color: get_color(user) });
      } else if (ai) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else if (user) {
        parts.push({ text: user.name, color: get_color(user) });
      }

      parts.push({ text: " in " });
      parts.push({ text: fractal.name, color: get_color(fractal) });

      return parts;
    }

    if (has_entities) {
      const prefix = prefix_roll || pick_random(PREFIXES.STANDARD);
      /** @type {Array<{text: string, color?: string, no_gap?: boolean}>} */
      const parts = [{ text: `${prefix} ` }];

      if (ai && user && ai.id === user.id) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else if (ai && user) {
        parts.push({ text: ai.name, color: get_color(ai) });
        parts.push({ text: " & " });
        parts.push({ text: user.name, color: get_color(user) });
      } else if (ai) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else {
        parts.push({ text: user.name, color: get_color(user) });
      }
      return parts;
    }

    if (has_fractal) {
      const prefix = prefix_roll || pick_random(PREFIXES.FRACTAL);
      const parts = [{ text: `${prefix} ` }, { text: fractal.name, color: get_color(fractal) }];
      return parts;
    }

    return [{ text: "Your story begins here..." }];
  });

  $effect(() => {
    app.story_title = title_parts
      .map((p) => p.text)
      .join("")
      .trim();
    app.story_title_parts = is_custom ? [{ text: custom_title }] : title_parts.map((p) => ({ ...p }));
  });

  /** @param {Event & { currentTarget: EventTarget & HTMLElement }} e */
  function handle_input(e) {
    custom_title = e.currentTarget.textContent;
    is_custom = true;
  }

  function handle_reset() {
    is_custom = false;
    custom_title = "";
    app.regenerate_title();
  }

  // ============================================
  // STAGE LAYOUT GRID CLASSES (STORYBOARD MODE)
  // ============================================
  let header_class = $derived(
    app.viewport.mobile
      ? "relative inset-auto col-start-1 col-end-13 row-start-1 row-end-3 self-end items-center justify-center"
      : "col-start-2 col-end-12 row-start-1 row-end-4 self-end pb-[calc(var(--spacing-row-unit)*0.5)]",
  );

  let left_class = $derived(
    app.viewport.mobile
      ? "relative inset-auto col-start-1 col-end-7 row-start-6 row-end-12 h-full items-center justify-center"
      : "col-start-2 col-end-4 row-start-3 row-end-11 h-full items-center",
  );

  let center_class = $derived(
    app.viewport.mobile
      ? "relative inset-auto col-start-1 col-end-13 row-start-3 row-end-6 h-full items-center justify-center"
      : "col-start-4 col-end-10 row-start-3 row-end-11 h-full items-center",
  );

  let right_class = $derived(
    app.viewport.mobile
      ? "relative inset-auto col-start-7 col-end-13 row-start-6 row-end-12 h-full items-center justify-center"
      : "col-start-10 col-end-12 row-start-3 row-end-11 h-full items-center",
  );

  // ============================================
  // ENTITY SLOT CONTEXT ACTIONS
  // ============================================
  /**
   * Factory: builds the context-menu action list for an entity slot in Storyboard.
   * @param {"ai" | "user" | "fractal"} type
   * @returns {any[]}
   */
  function build_actions(type) {
    const entity_map = {
      ai: app.selected_ai || runtime.active_ai,
      user: app.selected_user || runtime.active_user,
      fractal: app.selected_fractal || runtime.active_fractal,
    };
    const entity = entity_map[type];

    const items = [{ label: "Profile", onSelect: () => app.toggle_profile(true, entity), disabled: !entity }];

    if (entity?.profile_picture) {
      items.push({
        label: "Profile Picture",
        onSelect: () =>
          app.open_image_preview({
            src: entity.profile_picture,
            metadata: entity.modifiers
              ? {
                  prompt: entity.modifiers.prompt,
                  negative_prompt: entity.modifiers.negative_prompt,
                  seed: entity.modifiers.last_generated_seed,
                }
              : null,
          }),
      });
    }

    if (type === "ai" || type === "fractal") {
      const voice_label = Audio.entity_voice.ai ? "Disable AI Voice" : "Enable AI Voice";
      items.push({
        label: voice_label,
        active: Audio.entity_voice.ai,
        onSelect: () => Audio.toggle_entity_voice("ai"),
      });
    }

    items.push({ separator: true });
    items.push({
      label: "Swap",
      onSelect: () => app.open_card_hand(type),
    });

    return items;
  }

  let ai_actions = $derived(build_actions("ai"));
  let user_actions = $derived(build_actions("user"));
  let fractal_actions = $derived(build_actions("fractal"));

  // ============================================
  // CARD HAND FAN OVERLAY STATE & LOGIC
  // ============================================
  let is_open = $derived(app.card_hand.open);
  let card_hand_type = $derived(app.card_hand.type);

  /** @type {number | null} */
  let hovered_index = $state(null);
  let show_import_modal = $state(false);
  let flight_active = $state(false);

  // Ingestion state for ImportModal snippet
  let import_raw_text = $state("");
  let import_image_data = $state(null);
  let import_character = $state(true);
  let import_fractal = $state(false);
  let import_loading = $state(false);
  let import_error_message = $state("");

  const import_fetch_type = $derived(import_fractal && !import_character ? "fractal" : "character");

  $effect(() => {
    if (show_import_modal) {
      import_character = card_hand_type !== "fractal";
      import_fractal = card_hand_type === "fractal";
      import_error_message = "";
    }
  });

  function handle_import_source(info) {
    if (info.kind === "error") {
      import_error_message = info.message || "Failed to load source.";
      return;
    }
    import_error_message = "";
    if (info.kind === "url") {
      app.log(`Fetched ${info.chars?.toLocaleString()} chars from ${info.url}`, "system");
    } else if (info.kind === "file") {
      app.log(`Loaded ${info.name}${info.chars ? ` (${info.chars.toLocaleString()} chars)` : ""}`, "system");
    } else if (info.kind === "image") {
      app.log(`Loaded avatar from ${info.name || info.url}`, "system");
    }
  }

  async function import_native_json(type, parsed) {
    const merged = { ...create_new(type), ...normalize(parsed) };
    if (import_image_data) merged.profile_picture = import_image_data;
    await birth_entity_core(type, merged, {
      run_sorter: false,
      generate_portrait: false,
    });
  }

  async function import_card(type, parsed) {
    const flat = parse_character_card(parsed);
    if (import_image_data) flat.profile_picture = import_image_data;
    await birth_entity_core(type, flat, { generate_portrait: !import_image_data });
  }

  async function import_from_llm(type, raw) {
    const draft = { description: raw };
    if (import_image_data) draft.profile_picture = import_image_data;
    await birth_entity_core(type, draft, {
      run_sorter: true,
      generate_portrait: !import_image_data,
    });
  }

  async function execute_entity_import() {
    if (!import_raw_text.trim()) {
      import_error_message = "Please provide raw text to import.";
      return;
    }
    if (!import_character && !import_fractal) {
      import_error_message = "Please select at least one target to import (Character or Fractal).";
      return;
    }

    import_loading = true;
    import_error_message = "";
    simulation_state.set_intent_active(true);

    try {
      let parsed = null;
      try {
        parsed = JSON.parse(import_raw_text);
      } catch (_e) {
        /* prose falls through */
      }
      const format = parsed && typeof parsed === "object" ? detect_card_format(parsed) : "unknown";
      const is_structured = format !== "unknown";

      const targets = [];
      if (import_character) targets.push("character");
      if (import_fractal) targets.push("fractal");

      for (const type of targets) {
        if (is_structured) {
          if (format === "rpglitch") await import_native_json(type, parsed);
          else await import_card(type, parsed);
        } else {
          await import_from_llm(type, import_raw_text);
        }
      }

      app.log(`Import successful.`, "system");
      await app.load_entities();

      if (import_character && !app.selected_ai) {
        const latest_char = app.ai_list[app.ai_list.length - 1];
        if (latest_char) app.selected_ai = latest_char;
      }
      if (import_fractal && !app.selected_fractal) {
        const latest_fractal = app.fractal_list[app.fractal_list.length - 1];
        if (latest_fractal) app.selected_fractal = latest_fractal;
      }

      import_raw_text = "";
      import_image_data = null;
      show_import_modal = false;
    } catch (err) {
      console.error(err);
      import_error_message = err.message || "Failed to import entities.";
      app.log(`Import failed: ${import_error_message}`, "error");
    } finally {
      import_loading = false;
      simulation_state.set_intent_active(false);
    }
  }

  let render_active = $state(false);
  let is_visible = $state(false);

  $effect(() => {
    if (is_open) {
      render_active = true;
      requestAnimationFrame(() => {
        is_visible = true;
      });
    } else if (render_active) {
      is_visible = false;
      const timer = setTimeout(() => {
        render_active = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  });

  let entity_list = $derived(
    /** @type {any[]} */ (
      card_hand_type === "ai" ? app.ai_list : card_hand_type === "user" ? app.user_list : card_hand_type === "fractal" ? app.fractal_list : []
    ),
  );

  const total_cards = $derived(entity_list.length);
  const card_step = $derived(Math.max(1.8, Math.min(3.2, 45 / Math.max(1, total_cards))));

  let cursor_x = $state(0);
  let scroll_angle = $state(0);

  $effect(() => {
    if (is_open) {
      cursor_x = 0;
      scroll_angle = 0;
    }
  });

  const max_fan_tilt = $derived(motion.is_reduced ? 0 : Math.min(35, Math.max(10, total_cards * 1.4)));
  const fan_rotation = $derived(motion.is_reduced ? 0 : -cursor_x * max_fan_tilt + scroll_angle);

  /** @param {PointerEvent} e */
  function handle_pointer_move(e) {
    if (!is_open || motion.is_reduced) return;
    const width = window.innerWidth || 1000;
    cursor_x = Math.max(-1, Math.min(1, (e.clientX / width) * 2 - 1));
  }

  /** @param {WheelEvent} e */
  function handle_wheel(e) {
    if (!is_open || motion.is_reduced) return;
    const delta = e.deltaY || e.deltaX;
    if (delta) {
      scroll_angle = Math.max(-45, Math.min(45, scroll_angle + (delta > 0 ? 3 : -3)));
    }
  }

  const first_card_angle = $derived(-((total_cards - 1) / 2) * card_step);
  const create_angle = $derived(first_card_angle - card_step);
  const import_angle = $derived(create_angle - card_step);

  /** @type {Record<string, string>} */
  const TITLES = {
    ai: "Select AI Character",
    user: "Select User Persona",
    fractal: "Select Fractal",
  };

  let hand_title = $derived((card_hand_type ? TITLES[card_hand_type] : null) ?? "Select Entity");

  /**
   * Returns the reason why an entity cannot be selected, or null if available.
   * @param {any} entity
   * @returns {string | null}
   */
  function get_unavailable_reason(entity) {
    if (!entity || !card_hand_type) return null;

    if (entity.id != null && app.claimed_entity_ids.has(String(entity.id))) {
      return "This entity is already in an active story";
    }

    if (card_hand_type === "ai") {
      if (app.selected_ai?.id === entity.id) return "This entity is already selected as AI Character";
      if (app.selected_user?.id === entity.id) return "This entity is already selected as User Persona";
    }
    if (card_hand_type === "user") {
      if (app.selected_user?.id === entity.id) return "This entity is already selected as User Persona";
      if (app.selected_ai?.id === entity.id) return "This entity is already selected as AI Character";
    }
    if (card_hand_type === "fractal") {
      if (app.selected_fractal?.id === entity.id) return "This entity is already selected as Fractal";
    }

    return null;
  }

  /**
   * @param {any} entity
   * @returns {boolean}
   */
  function is_disabled(entity) {
    return get_unavailable_reason(entity) !== null;
  }

  async function handle_create_new() {
    const type = card_hand_type === "fractal" ? "fractal" : "character";
    const plan = create_new(type, {
      name: `New ${type === "character" ? "Character" : "Fractal"}`,
    });

    try {
      const saved = await repository.upsert(type, plan);
      await app.load_entities();
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

    const source = /** @type {HTMLElement | null} */ (document.querySelector(`[data-entity-id="${CSS.escape(String(entity.id))}"] [data-card-root]`));
    const target = /** @type {HTMLElement | null} */ (
      document.querySelector(`[data-slot-type="${card_hand_type}"] [data-card-root]`) ||
        document.querySelector(`[data-slot-type="${card_hand_type}"]`)
    );
    if (!source || !target) {
      app.select_entity(card_hand_type, entity);
      app.close_card_hand();
      return;
    }
    fly_card_to_slot(entity, source, target);
  }

  /**
   * 🛫 THE HAND-TO-SLOT FLIGHT
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

    source.style.transition = "none";
    source.style.opacity = "0";

    /** @type {HTMLElement | null} */
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

<svelte:window onkeydown={handle_keydown} onpointermove={handle_pointer_move} onwheel={handle_wheel} />

{#snippet card_skeleton()}
  <div class="relative isolate h-full min-h-50 w-full overflow-hidden rounded-xl border border-solid border-white/10 bg-zinc-900/40 backdrop-blur-sm">
    <Shimmer color="rgba(255, 255, 255, 0.4)" />
  </div>
{/snippet}

<!-- STORYBOARD TITLE HEADER -->
{#if app.entities_loaded}
  <header class="pointer-events-none z-30 flex justify-center {header_class}">
    <div class="flex w-full justify-center">
      <h2
        class="
          pointer-events-none
          z-40
          inline-block
          max-w-[90vw]
          cursor-text
          px-4
          text-center
          text-[clamp(1.5rem,3.2vw,2.6rem)]
          font-normal
          text-balance
          transition-[background-color,box-shadow]
          duration-300
          select-none

          hover:rounded-md
          hover:bg-white/5

          focus:rounded-md
          focus:bg-black/20
          focus:shadow-md
          focus:outline-none

          [&>span]:pointer-events-auto
        "
        style="font-family: Satisfy, cursive;"
        use:tooltip={{ text: "Double-click to regenerate title" }}
        contenteditable="true"
        aria-label="Story Title"
        oninput={handle_input}
        ondblclick={handle_reset}
      >
        {#if is_custom}
          <span
            class="text-shadow-[0_var(--spacing-pixel)_var(--spacing-pixel)_var(--color-void-black),0_0_var(--spacing-unit)_var(--color-void-black)]"
            >{custom_title}</span
          >
        {:else}
          {#each title_parts as part, i (i)}
            {#if part.color}
              <span
                class="
                inline
                px-2
                font-['Satisfy',cursive]
                whitespace-nowrap
                text-(--signature-color)
                [text-shadow:0_var(--spacing-pixel)_var(--spacing-pixel)_var(--color-void-black),0_0_var(--spacing-unit)_var(--signature-color),0_0_calc(var(--spacing-unit)*4)_rgb(from_var(--signature-color)_r_g_b/var(--opacity-whisper))]
              "
                style:--signature-color={part.color}>{part.text}</span
              >
            {:else}
              <span
                class="
              inline
              px-2
              font-['Satisfy',cursive]
              whitespace-normal
              text-shadow-[0_var(--spacing-pixel)_var(--spacing-pixel)_var(--color-void-black),0_0_var(--spacing-unit)_var(--color-void-black)]
            ">{part.text}</span
              >
            {/if}
          {/each}
        {/if}
      </h2>
    </div>
  </header>
{/if}

<!-- LEFT SLOT: AI CHARACTER -->
<aside class="relative z-10 flex min-h-0 flex-col justify-center {left_class}">
  {#if !app.entities_loaded}
    {@render card_skeleton()}
  {:else}
    {@const entity = app.selected_ai || runtime.active_ai}
    <div class="flex h-full w-full items-center justify-center" data-slot-type="ai">
      <EntityCard
        variant={entity ? "panel" : "slot"}
        type="ai"
        {entity}
        role_label="AI Character"
        actions={ai_actions}
        on_select={() => {
          if (entity) {
            app.toggle_profile(true, entity);
          } else {
            app.open_card_hand("ai");
          }
        }}
      />
    </div>
  {/if}
</aside>

<!-- CENTER SLOT: FRACTAL -->
<section class="pointer-events-none relative z-10 flex min-h-0 flex-col justify-center {center_class}">
  {#if !app.entities_loaded}
    {@render card_skeleton()}
  {:else}
    {@const entity = app.selected_fractal || runtime.active_fractal}
    <div class="flex h-full w-full items-center justify-center" data-slot-type="fractal">
      <EntityCard
        variant={entity ? "panel" : "slot"}
        type="fractal"
        {entity}
        role_label="Fractal"
        actions={fractal_actions}
        on_select={() => {
          if (entity) {
            app.toggle_profile(true, entity);
          } else {
            app.open_card_hand("fractal");
          }
        }}
      />
    </div>
  {/if}
</section>

<!-- RIGHT SLOT: USER PERSONA -->
<aside class="relative z-10 flex min-h-0 flex-col justify-center {right_class}">
  {#if !app.entities_loaded}
    {@render card_skeleton()}
  {:else}
    {@const entity = app.selected_user || runtime.active_user}
    <div class="flex h-full w-full items-center justify-center" data-slot-type="user" data-panel-card="user">
      <EntityCard
        variant={entity ? "panel" : "slot"}
        type="user"
        {entity}
        role_label="User Persona"
        actions={user_actions}
        on_select={() => {
          if (entity) {
            app.toggle_profile(true, entity);
          } else {
            app.open_card_hand("user");
          }
        }}
      />
    </div>
  {/if}
</aside>

<!-- CARD HAND OVERLAY -->
{#if app.entities_loaded}
  {#if is_open}
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
        transition-[transform,opacity]
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
      <header class="pointer-events-auto z-20 -mb-4 text-center">
        <h4 id="hand-title" class="m-0 font-bold tracking-widest text-slate-600 uppercase text-shadow-(--shadow-ambient)">
          {hand_title}
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
          transition-transform
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
          style:transform="rotate({import_angle + fan_rotation}deg) translateY(0)"
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
              transition-transform
              duration-300
              ease-in-out
              will-change-transform
            "
            style:transform={hovered_index === -2
              ? `rotate(${-(import_angle + fan_rotation)}deg) translateY(calc(var(--spacing-row-unit) * -0.6)) scale(1.08)`
              : "none"}
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
          style:transform="rotate({create_angle + fan_rotation}deg) translateY(0)"
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
              transition-transform
              duration-300
              ease-in-out
              will-change-transform
            "
            style:transform={hovered_index === -1
              ? `rotate(${-(create_angle + fan_rotation)}deg) translateY(calc(var(--spacing-row-unit) * -0.6)) scale(1.08)`
              : "none"}
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
            style:transform="rotate({dynamic_angle + fan_rotation}deg) translateY(0)"
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
                transition-[transform,filter,opacity]
                duration-300
                ease-in-out
                will-change-transform

                {is_disabled(entity)
                ? `
                  opacity-85
                  grayscale-[0.6]
                `
                : ''}
                {hovered_index !== null && !is_hovered && !is_disabled(entity)
                ? `
                  blur-[1px]
                  brightness-[0.35]
                  grayscale-[0.4]
                `
                : ''}"
              use:tooltip={get_unavailable_reason(entity)}
              style:transform={is_hovered && !is_disabled(entity)
                ? `rotate(${-(dynamic_angle + fan_rotation)}deg) translateY(calc(var(--spacing-row-unit) * -0.85)) scale(1.18)`
                : "none"}
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

  <Modal
    bind:open={show_import_modal}
    variant="bare"
    z_index="1000"
    class="relative max-h-[92vh] w-[clamp(26rem,92vw,44rem)] max-w-2xl overflow-y-auto rounded-2xl bg-glass-elevated p-4 shadow-[0_16px_48px_rgba(0,0,0,0.8)] [backdrop-filter:var(--blur-mist)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(--noise-url) before:opacity-10 before:mix-blend-overlay before:content-['']"
    on_close={() => {
      show_import_modal = false;
      import_error_message = "";
    }}
  >
    <div class="flex h-full flex-col gap-4 font-sans">
      <div class="flex items-center justify-between">
        <h5 class="m-0 text-xs font-bold tracking-widest text-slate-300 uppercase">Import Entity</h5>
        <div class="flex items-center gap-4 font-mono text-xs text-slate-300">
          <Toggle label="Character" bind:value={import_character} disabled={import_loading} />
          <Toggle label="Fractal" bind:value={import_fractal} disabled={import_loading} />
        </div>
      </div>

      <div class="flex flex-1 flex-col">
        {#if import_error_message}
          <div class="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
            {import_error_message}
          </div>
        {/if}

        <SourceField
          bind:value={import_raw_text}
          bind:image_data={import_image_data}
          type={import_fetch_type}
          disabled={import_loading}
          on_source={handle_import_source}
        />
      </div>

      <div class="flex items-center justify-between">
        <span class="text-[10px] text-slate-500 italic">
          Native RPGlitch JSON imports directly; character cards and prose are structured by the AI sorter.
        </span>

        <Button
          variant="primary"
          size="small"
          onclick={execute_entity_import}
          busy={import_loading}
          disabled={import_loading || (!import_character && !import_fractal)}
        >
          <svg viewBox="0 0 24 24" class="size-3.5 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span class="text-xs font-bold tracking-widest uppercase">Import Entity</span>
        </Button>
      </div>
    </div>
  </Modal>
{/if}

<style>
  /* Ensure Satisfy loads even if index.html is bypassed */
  @import "https://fonts.googleapis.com/css2?family=Satisfy&display=swap";
</style>
