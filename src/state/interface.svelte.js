/**
 * @file src/state/interface.svelte.js
 * Central application interface, navigation, viewport, settings, and storyboard
 * staging store (Rank 3, state). Leaf store with zero sibling `@state` imports.
 */

import { db, entities, normalize_entity as normalize, stories } from "@data";
import { get_signature_color, guarded_transition, resolve_px } from "@utils";
import { flushSync } from "svelte";
import { SvelteSet } from "svelte/reactivity";

/**
 * @typedef {Object} AppSettings
 * @property {boolean} call_mode - Toggles the immersive 'Call' UI overlay for focus.
 * @property {boolean} auto_scroll - Toggles automatic log scrolling to the bottom of the stack.
 * @property {boolean} dev_mode - Enables the Telemetry HUD and system debug overrides.
 * @property {boolean} dev_grid_visible - Toggles the visual chess grid overlay.
 * @property {string} [visual_style] - The global default visual style for image generation.
 */

/**
 * @typedef {Object} CardHandState
 * @property {boolean} open - Whether the card hand modal is currently visible.
 * @property {'ai' | 'user' | 'fractal' | null} type - The target category for entity selection.
 * @property {number} regenerate_count - The number of times the current selection pool has been shuffled.
 */

export class InterfaceStore {
  initialized = false;
  /** @type {Array<() => void>} */
  #viewport_cleanup = [];
  /** @type {string | null} */
  #active_story_title = null;
  /** @type {any[] | null} */
  #active_story_title_parts = null;
  #profile_transition_seq = 0;

  // --- NAVIGATION & MODAL STATE ---
  /** @type {'storyboard' | 'storymode'} */
  view = $state("storyboard");
  control_panel_open = $state(false);
  profile_open = $state(false);
  transitioning_profile = $state(false);
  /** @type {string | null} */
  transition_target_id = $state(null);
  viewport = $state({ mobile: false, is_touch: false });

  // --- STORYBOARD ENTITY SELECTION STATE ---
  /** @type {any | null} */
  selected_ai = $state(null);
  /** @type {any | null} */
  selected_user = $state(null);
  /** @type {any | null} */
  selected_fractal = $state(null);

  /** True while the begin-story flight into the prologue is pending. */
  begin_story_pending = $state(false);
  /** Suppresses card-slot view-transition morphs during the begin-story flip. */
  suppress_card_transitions = $state(false);
  /** True once the begin-story flight effect has captured and claimed DOM flight assets. */
  begin_flight_claimed = false;

  /** @type {any[]} */
  characters = $state([]);
  /** @type {any[]} */
  fractal_list = $state([]);
  entities_loaded = $state(false);

  /** Entity IDs currently claimed by active (non-concluded) stories. */
  claimed_entity_ids = new SvelteSet();

  /** User draft input bound to Console composer textarea across views and ghostwriting. */
  composer_draft = $state("");

  /** @type {CardHandState} */
  card_hand = $state({ open: false, type: null, regenerate_count: 0 });

  // --- NARRATIVE CONFIG & SHELL SIGNALS ---
  prologue = $state("");
  story_title = $state("");
  story_title_parts = $state([]);

  /** @type {AppSettings} */
  settings = $state({ call_mode: false, auto_scroll: true, dev_mode: false, dev_grid_visible: false, visual_style: "none" });

  ghostwrite_request = $state(0);
  stories_version = $state(0);

  /** @type {any} */
  editing_entity = $state(null);

  /**
   * Initializes viewport listeners and hydrates persistent settings from IndexedDB.
   */
  async init() {
    if (this.initialized) return;
    this.initialized = true;

    this.init_viewport();

    try {
      const entry = await db.kv_settings.get("rpg_settings");
      if (entry?.value) {
        this.settings = { ...this.settings, ...entry.value };
      }
    } catch (error) {
      console.error("[InterfaceStore] Settings hydration failed:", error);
    }
  }

  /**
   * Persists application settings to IndexedDB storage.
   */
  save_settings = async () => {
    if (!this.settings) return;
    try {
      await db.kv_settings.put({ key: "rpg_settings", value: $state.snapshot(this.settings) });
    } catch (save_error) {
      if (save_error?.name !== "DatabaseClosedError") {
        console.error("[InterfaceStore] Settings save failed:", save_error);
      }
    }
  };

  /**
   * Centralized viewport observer synced with CSS design tokens.
   */
  init_viewport() {
    this.#viewport_cleanup.forEach((cleanup) => cleanup());
    this.#viewport_cleanup = [];

    const px = resolve_px("--breakpoint-mobile", 0);
    const mobile_breakpoint = px ? `${px}px` : "48rem";
    const mql = window.matchMedia(`(width < ${mobile_breakpoint})`);

    this.viewport.mobile = mql.matches;
    const listener = (/** @type {MediaQueryListEvent} */ event) => {
      this.viewport.mobile = event.matches;
    };
    mql.addEventListener("change", listener);
    this.#viewport_cleanup.push(() => mql.removeEventListener("change", listener));

    this.viewport.is_touch = window.ontouchstart !== undefined || navigator.maxTouchPoints > 0;
  }

  /**
   * Unselects any storyboard slots whose entities are claimed by active stories.
   * @param {boolean} [force=false]
   */
  clean_claimed_selections(force = false) {
    if (!force && this.view !== "storyboard") return;
    if (this.selected_ai?.id != null && this.claimed_entity_ids.has(String(this.selected_ai.id))) {
      this.selected_ai = null;
    }
    if (this.selected_user?.id != null && this.claimed_entity_ids.has(String(this.selected_user.id))) {
      this.selected_user = null;
    }
    if (this.selected_fractal?.id != null && this.claimed_entity_ids.has(String(this.selected_fractal.id))) {
      this.selected_fractal = null;
    }
  }

  /**
   * Hydrates the storyboard lists with characters and fractals.
   */
  async load_entities() {
    try {
      const [characters, fractals, claimed] = await Promise.all([entities.list("character"), entities.list("fractal"), stories.active_entity_ids()]);
      this.claimed_entity_ids.clear();
      for (const id of claimed) this.claimed_entity_ids.add(String(id));
      this.characters = characters;
      this.fractal_list = fractals;
      this.entities_loaded = true;
      this.clean_claimed_selections();
    } catch (error) {
      console.error("[InterfaceStore] Failed to load lobby entities:", error);
    }
  }

  /**
   * Selects an entity for the current storyboard session.
   * @param {'ai' | 'user' | 'fractal' | null} type
   * @param {any} entity
   */
  select_entity = (type, entity) => {
    const clean = normalize(entity);
    if (type === "ai") this.selected_ai = clean;
    else if (type === "user") this.selected_user = clean;
    else if (type === "fractal") this.selected_fractal = clean;
    this.card_hand.open = false;
  };

  open_card_hand = (/** @type {'ai' | 'user' | 'fractal' | null} */ type) => {
    this.card_hand.type = type;
    this.card_hand.open = true;
  };

  close_card_hand = () => {
    this.card_hand.open = false;
  };

  /**
   * Records the active story's authoritative title and updates displayed title state.
   * @param {string} title
   * @param {any[]} [parts=[]]
   */
  set_active_story_title(title, parts = []) {
    this.#active_story_title = title || null;
    this.#active_story_title_parts = parts;
    if (title) {
      this.story_title = title;
      this.story_title_parts = parts;
    }
  }

  /**
   * Clears story title state to prevent title bleed across stories.
   */
  reset_story_title() {
    this.#active_story_title = null;
    this.#active_story_title_parts = null;
    this.story_title = "";
    this.story_title_parts = [];
  }

  /**
   * Switches the active top-level view with a view transition.
   * @param {'storyboard' | 'storymode'} view
   */
  set_view = async (view) => {
    this.control_panel_open = false;
    if (view === "storyboard") {
      await this.load_entities();
      this.clean_claimed_selections(true);
    }
    guarded_transition(
      () => {
        flushSync(() => {
          this.view = view;
        });
        if (view === "storymode" && this.#active_story_title) {
          this.story_title = this.#active_story_title;
          this.story_title_parts = this.#active_story_title_parts || [];
        }
      },
      { className: "is-switching-view" },
    );
  };

  /**
   * Toggles the profile modal and prepares the target entity for editing.
   * @param {boolean | null} [force_state=null]
   * @param {any} [entity=null]
   * @param {'ai' | 'user' | 'fractal' | 'none'} [slot_type='none']
   */
  toggle_profile = async (force_state = null, entity = null, slot_type = "none") => {
    const target_entity = entity || this.editing_entity;
    if (target_entity) {
      const signature_color = get_signature_color(target_entity);
      if (signature_color && typeof document !== "undefined") {
        document.documentElement.style.setProperty("--active-signature-color", signature_color);
      }
    }
    const is_opening = force_state !== null ? force_state : !this.profile_open;
    let active_type = slot_type;
    if (active_type === "none" && target_entity) {
      if (target_entity.id === this.selected_ai?.id) active_type = "ai";
      else if (target_entity.id === this.selected_user?.id) active_type = "user";
      else if (target_entity.id === this.selected_fractal?.id) active_type = "fractal";
    }
    if (target_entity) {
      this.transition_target_id = target_entity.id;
    }

    const seq = ++this.#profile_transition_seq;

    flushSync(() => {
      this.transitioning_profile = true;
    });

    guarded_transition(
      () => {
        this.profile_open = is_opening;
        if (entity) {
          this.editing_entity = normalize(entity);
        }
      },
      { className: is_opening ? `is-profile-opening-${active_type}` : `is-profile-closing-${active_type}` },
    ).finally(() => {
      if (seq !== this.#profile_transition_seq) return;
      this.transitioning_profile = false;
      this.transition_target_id = null;
    });
  };

  /**
   * @param {any} entity
   * @param {'ai' | 'user' | 'fractal' | 'none'} [slot_type='none']
   */
  open_profile = (entity, slot_type = "none") => {
    this.toggle_profile(true, entity, slot_type);
  };
}

export const app = new InterfaceStore();
