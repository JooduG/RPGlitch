/**
 * src/state/app-store.svelte.js
 * UI: Interface State (Simulation & Gamemaster)
 * Manages modals, view states, and visual feedback using storyboard/storymode terminology.
 * ZERO NESTING - Flattened Schema only.
 */
import { flushSync } from "svelte";
import { SvelteSet } from "svelte/reactivity";
import { resolve_px, stories_bridge, guarded_transition } from "@utils";
import { db, entities, stories, normalize } from "@data";
import { visual_engine, get_signature_color, Audio } from "@media";
import { embeddings_engine } from "@intelligence";
import { runtime } from "./runtime.svelte.js";
import { streaming as streaming_store } from "./streaming.svelte.js";
import { dev_log } from "./dev-log.svelte.js";
import { simulation_state, ui_state } from "./status.svelte.js";
import { install_freeze_watchdog } from "./freeze-watchdog.js";

/**
 * Image preview bridge: The state layer cannot import from @primitives (UI layer).
 * Instead, the UI layer registers its open/close handlers here at boot time.
 * These stubs delegate to the registered handlers if available.
 * @type {{ open: ((src: any, caption?: string) => void) | null, close: (() => void) | null }}
 */
const _image_preview_bridge = { open: null, close: null };
export function register_image_preview_handlers(open, close) {
  _image_preview_bridge.open = open;
  _image_preview_bridge.close = close;
}
const close_image_preview = () => _image_preview_bridge.close?.();
const open_image_preview = (src, caption = "") => _image_preview_bridge.open?.(src, caption);

/**
 * @typedef {Object} AppSettings
 * @property {boolean} sound - Whether audio feedback and notification sounds are enabled.
 * @property {boolean} call_mode - Toggles the immersive 'Call' UI overlay for focus.
 * @property {boolean} stream_text - Toggles the character text streaming/typing animation.
 * @property {boolean} auto_scroll - Toggles automatic log scrolling to the bottom of the stack.
 * @property {boolean} dev_mode - Enables the Telemetry HUD and system debug overrides.
 * @property {boolean} dev_grid_visible - Toggles the visual chess grid overlay.
 * @property {string} [narrative_style] - The active narrative writing style profile in the session.
 * @property {string} [visual_style] - The global default visual style for image generation. Defaults to "photo".
 */

/**
 * @typedef {Object} CardHandState
 * @property {boolean} open - Whether the card hand is currently visible.
 * @property {'ai' | 'user' | 'fractal' | null} type - The target category for entity selection.
 * @property {number} regenerate_count - The number of times the current selection pool has been shuffled.
 */

/**
 * @typedef {Object} SimulationControl
 * @property {boolean} loading - STASIS: True when the Chrono Engine is processing a turn.
 */

/************************************************************************************
 * [SECTION: STATE DEFINITIONS]
 * ----------------------------------------------------------------------------------
 * Core reactive state for the application.
 ************************************************************************************/
/**
 *
 */
export class AppStore {
  initialized = false;
  /** @type {Array<() => void>} */
  _viewport_cleanup = [];
  // --- NAVIGATION ---
  view = $state("storyboard"); // 'storyboard' | 'storymode'
  control_panel_open = $state(false);
  profile_open = $state(false);
  transitioning_profile = $state(false);
  /** @type {string | null} */
  transition_target_id = $state(null);
  /** @type {string | number | null} Active pinned message header id */
  pinned_message_id = $state(null);
  viewport = $state({
    mobile: false,
    is_touch: false,
  });
  // --- ENTITY SELECTION STATE (STORYBOARD) ---
  /** @type {any | null} */
  selected_ai = $state(null);
  /** @type {any | null} */
  selected_user = $state(null);
  /** @type {any | null} */
  selected_fractal = $state(null);
  /**
   * Storyboard selections stashed right before a story is inspected, so the
   * story's cast (which hijacks the slots during runtime.sync) can be released
   * on return without wiping the user's own pre-selections.
   * @type {{ ai: any | null, user: any | null, fractal: any | null } | null}
   */
  stashed_storyboard_selection = $state(null);
  /** True while the begin-story flight into the prologue is pending. */
  begin_story_pending = $state(false);
  /** Suppresses card-slot view-transition morphs during the begin-story flip. */
  suppress_card_transitions = $state(false);
  /** Non-reactive holder for the begin-flight clones/rects. */
  _begin_flight_assets = null;
  /**
   * @type {string | any[]}
   */
  ai_list = $state([]);
  /**
   * @type {any[]}
   */
  user_list = $state([]);
  /**
   * @type {string | any[]}
   */
  fractal_list = $state([]);
  entities_loaded = $state(false);
  /**
   * Entity ids currently claimed by active (non-concluded) stories. Claimed
   * entities are excluded from the storyboard lists and their profiles are
   * locked for editing unless DevMode is enabled. Reactive SvelteSet, mutated
   * in place by load_entities().
   */
  claimed_entity_ids = new SvelteSet();
  /** @type {CardHandState} */
  card_hand = $state({
    open: false,
    type: null, // 'ai' | 'user' | 'fractal'
    regenerate_count: 0,
  });
  // --- NARRATIVE CONFIG ---
  prologue = $state(""); // Starting directions/context
  story_title = $state(""); // Synchronized generated or custom title
  story_title_parts = $state([]); // Structured title parts with per-entity colors
  /** @type {SimulationControl} */
  simulation = {
    get loading() {
      return ui_state.loading;
    },
    set loading(val) {
      ui_state.set_loading(val);
    },
  };
  // --- UI TENSION (Reactive Intensity) ---
  get tension() {
    return simulation_state.phase === "generating" || simulation_state.phase === "locked" ? 1 : 0;
  }
  /** @type {AppSettings} */
  settings = $state({
    sound: true,
    call_mode: false,
    stream_text: true,
    auto_scroll: true,
    dev_mode: false,
    dev_grid_visible: false,
    narrative_style: "default",
    visual_style: "none",
  });
  ghostwrite_request = $state(0);
  is_ghostwriting = $state(false);
  /** Bumped whenever the story archive changes (create/update/conclude/delete)
   * so the Library can refresh even while the control panel stays open. */
  stories_version = $state(0);
  /** @type {((ctx: any) => void) | null} */
  regenerate_image_handler = $state(null);
  /** Resolution status of the active story ('CONCLUDED' | 'COLLAPSED' | null). */
  get conclusion_status() {
    return runtime.active_story?.conclusion_status || null;
  }
  // --- SENSORY ENGINES ---
  get visual() {
    return visual_engine;
  }
  get busy() {
    return ui_state.loading;
  }
  set busy(val) {
    ui_state.set_loading(val);
  }
  /**
   *
   */
  get round() {
    return runtime.round;
  }
  /**
   * Environment detection for UI signaling.
   * @returns {'DEV' | 'PROD'}
   */
  get env() {
    return import.meta.env.DEV ? "DEV" : "PROD";
  }
  /**
   * Current simulation phase.
   * @returns {'idle' | 'generating' | 'locked'}
   */
  get sim_phase() {
    return simulation_state.phase;
  }
  get is_processing() {
    return simulation_state.phase === "generating" || this.streaming.active;
  }
  get voice_suppressed() {
    return simulation_state.phase === "generating" && !this.streaming.active;
  }
  /**
   *
   */
  set round(val) {
    runtime.round = val;
  }
  /**
   *
   */
  get turn_type() {
    return runtime.turn_type;
  }
  /**
   *
   */
  set turn_type(val) {
    runtime.turn_type = val;
  }
  // --- READINESS (Derived Logic) ---
  get selected_count() {
    return (this.selected_ai ? 1 : 0) + (this.selected_user ? 1 : 0) + (this.selected_fractal ? 1 : 0);
  }
  get models_ready() {
    return embeddings_engine.model_ready && Audio.voice.model_ready;
  }
  get models_loading() {
    return embeddings_engine.is_loading || Audio.voice.is_loading;
  }
  get models_progress() {
    if (this.models_ready) return 100;
    const emb_prog = embeddings_engine.model_ready ? 100 : embeddings_engine.load_progress;
    const voice_prog = Audio.voice.model_ready ? 100 : Audio.voice.load_progress;
    return Math.min(99, Math.round((emb_prog + voice_prog) / 2));
  }
  get is_ready() {
    return this.selected_ai !== null && this.selected_user !== null && this.selected_fractal !== null;
  }

  // --- TELEMETRY (DevMode HUD) ---
  /**
   * @type {any[]}
   */
  get logs() {
    return dev_log.entries;
  }
  /**
   * Records a system event. Delegates to the telemetry store.
   * @param {string} message
   */
  log = (message, type = "system") => dev_log.log(message, type);
  /************************************************************************************
   * [SECTION: LIFECYCLE & PERSISTENCE]
   * ----------------------------------------------------------------------------------
   * Initialization and persistent storage logic.
   ************************************************************************************/
  /**
   *
   */
  async init() {
    if (typeof window === "undefined" || this.initialized) return;
    this.initialized = true;

    // Initialize responsive listeners
    this.init_viewport();

    try {
      const entry = await db.kv_settings.get("rpg_settings");
      if (entry && entry.value) {
        this.settings = { ...this.settings, ...entry.value };
      }
    } catch (e) {
      console.error("[Security] Settings Hydration Failed:", e);
    }

    // Hydrate the persisted DevMode telemetry log so history survives reloads.
    await dev_log.hydrate();

    // Freeze watchdog: never let a stuck state machine leave the composer dead.
    install_freeze_watchdog();
  }

  /**
   * Persist app settings to IndexedDB storage.
   */
  save_settings = async () => {
    if (typeof window === "undefined" || !this.settings) return;
    try {
      await db.kv_settings.put({ key: "rpg_settings", value: $state.snapshot(this.settings) });
    } catch (e) {
      console.error("[Security] Settings Save Failed:", e);
    }
  };

  /**
   * Centralized Viewport Observer
   * Syncs with design.css tokens.
   */
  init_viewport() {
    if (typeof window === "undefined") return;

    // Cleanup existing listeners if re-initializing
    if (this._viewport_cleanup) {
      this._viewport_cleanup.forEach((/** @type {() => void} */ cleanup) => cleanup());
    }
    this._viewport_cleanup = [];

    // Retrieve tokens from the central design system
    const get_breakpoint = (/** @type {string} */ name) => {
      const px = resolve_px(`--breakpoint-${name}`, 0);
      return px ? `${px}px` : null;
    };

    const queries = {
      mobile: `(width < ${get_breakpoint("mobile") || "48rem"})`,
    };

    Object.keys(queries).forEach((key) => {
      const k = /** @type {keyof typeof queries} */ (key);
      const query = queries[k];
      const mql = window.matchMedia(query);

      // Initial state
      this.viewport[k] = mql.matches;

      // Listener (Modern API)
      const listener = (/** @type {MediaQueryListEvent} */ e) => {
        this.viewport[k] = e.matches;
        this.log(`Viewport Change: ${k} -> ${e.matches}`, "system");
      };
      mql.addEventListener("change", listener);
      this._viewport_cleanup.push(() => mql.removeEventListener("change", listener));
    });

    // Touch detection
    this.viewport.is_touch = window.ontouchstart !== undefined || navigator.maxTouchPoints > 0;
  }
  /**
   * Stashes the current storyboard slot selections so they survive a story
   * inspection round-trip. Call right BEFORE loading/inspecting a story, since
   * runtime.sync hijacks the slots with the story's cast.
   */
  stash_storyboard_selection() {
    this.stashed_storyboard_selection = {
      ai: this.selected_ai,
      user: this.selected_user,
      fractal: this.selected_fractal,
    };
  }

  /**
   * Returns the storyboard slots to their pre-inspection selections, or clears
   * them if nothing was stashed (e.g. the story was opened from a fresh
   * storyboard, or a brand-new story was begun). One-shot — the stash is
   * consumed so it never leaks across stories.
   */
  restore_storyboard_selection() {
    const stashed = this.stashed_storyboard_selection;
    this.selected_ai = stashed?.ai ?? null;
    this.selected_user = stashed?.user ?? null;
    this.selected_fractal = stashed?.fractal ?? null;
    this.stashed_storyboard_selection = null;
  }

  /**
   * Unselects any storyboard slots whose entities are currently claimed by active stories.
   * Scoped to storyboard lobby view so that active storymode sessions are never stripped during play.
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
   * Claimed entity IDs are tracked so they can be marked unavailable in UI
   * and unselected from lobby slots.
   */
  async load_entities() {
    try {
      const [characters, fractals, claimed] = await Promise.all([entities.list("character"), entities.list("fractal"), stories.active_entity_ids()]);
      this.claimed_entity_ids.clear();
      for (const id of claimed) this.claimed_entity_ids.add(id);
      this.ai_list = characters;
      this.user_list = characters;
      this.fractal_list = fractals;
      this.entities_loaded = true;
      this.clean_claimed_selections();
    } catch (e) {
      console.error("[AppStore] Failed to load lobby entities:", e);
    }
  }
  streaming = streaming_store;
  /************************************************************************************
   * [SECTION: UI ACTIONS]
   * ----------------------------------------------------------------------------------
   * Methods for modifying UI state and triggering events.
   ************************************************************************************/
  toggle_control_panel = () => {
    this.control_panel_open = !this.control_panel_open;
  };
  set_view = async (/** @type {string} */ view) => {
    this.control_panel_open = false;
    if (view === "storyboard") {
      this.restore_storyboard_selection();
      await this.load_entities();
      this.clean_claimed_selections(true);
    }
    guarded_transition(
      () => {
        flushSync(() => {
          this.view = view;
        });
      },
      { className: "is-switching-view" },
    );
  };
  open_card_hand = (/** @type {'ai' | 'user' | 'fractal' | null} */ type) => {
    this.card_hand.type = type;
    this.card_hand.open = true;
  };
  close_card_hand = () => {
    this.card_hand.open = false;
  };
  close_image_preview = () => {
    close_image_preview();
  };
  /**
   * Selects an entity for the current session.
   * Automatically normalizes the object to ensure a flattened schema.
   */
  select_entity = (/** @type {'ai' | 'user' | 'fractal' | null} */ type, /** @type {any} */ entity) => {
    const clean = normalize(entity);
    if (type === "ai") this.selected_ai = clean;
    else if (type === "user") this.selected_user = clean;
    else if (type === "fractal") this.selected_fractal = clean;
    this.card_hand.open = false;
  };
  /** @type {any} */
  editing_entity = $state(null);
  /**
   * Toggles the profile modal and prepares the target entity for editing.
   * @param {boolean | null} force_state
   * @param {any} entity
   */
  toggle_profile = async (force_state = null, entity = null) => {
    const target_entity = entity || this.editing_entity;
    if (target_entity) {
      const signature_color = get_signature_color(target_entity);
      if (signature_color && typeof document !== "undefined") {
        document.documentElement.style.setProperty("--active-signature-color", signature_color);
      }
    }
    const is_opening = force_state !== null ? force_state : !this.profile_open;
    let active_type = "user"; // Default fallback
    if (target_entity) {
      if (target_entity.id === this.selected_ai?.id || target_entity.id === runtime.active_ai?.id) active_type = "ai";
      else if (target_entity.id === this.selected_user?.id || target_entity.id === runtime.active_user?.id) active_type = "user";
      else if (target_entity.id === this.selected_fractal?.id || target_entity.id === runtime.active_fractal?.id) active_type = "fractal";
      else active_type = "none";
    }
    if (target_entity) {
      this.transition_target_id = target_entity.id;
    }
    // Force Svelte to flush state changes so inactive cards lose their view-transition-names
    // synchronously in the DOM before startViewTransition takes its old snapshot.
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
      this.transitioning_profile = false;
      this.transition_target_id = null;
    });
  };
  close_profile = () => {
    this.toggle_profile(false);
  };
  open_profile = (/** @type {any} */ entity) => {
    this.toggle_profile(true, entity);
  };

  /**
   *
   */
  get profile_target_id() {
    return this.editing_entity?.id || null;
  }

  /**
   *
   */
  get profile_target_type() {
    return this.editing_entity?.type || null;
  }

  // SETTINGS MUTATORS
  toggle_sound = () => {
    this.settings.sound = !this.settings.sound;
    this.save_settings();
  };
  toggle_call_mode = () => {
    this.settings.call_mode = !this.settings.call_mode;
    this.save_settings();
  };
  toggle_stream_text = () => {
    this.settings.stream_text = !this.settings.stream_text;
    this.save_settings();
  };
  toggle_auto_scroll = () => {
    this.settings.auto_scroll = !this.settings.auto_scroll;
    this.save_settings();
  };
  toggle_dev_mode = () => {
    this.settings.dev_mode = !this.settings.dev_mode;
    this.save_settings();
  };
  // STREAMING CONTROL — delegates to the streaming store (streaming.svelte.js)
  // so the engine + UI keep one stable API while the implementation lives with
  // its audio/role orchestration next to the state it manages.
  start_stream = (id, role = "ai") => streaming_store.start_stream(id, role);
  update_stream = (chunk) => streaming_store.update_stream(chunk);
  end_stream = () => streaming_store.end_stream();
  trigger_interrupt = () => streaming_store.trigger_interrupt();
  open_image_preview = (/** @type {any} */ src, caption = "") => {
    open_image_preview(src, caption);
  };
  regenerate_title = () => {
    this.card_hand.regenerate_count++;
  };
  /**
   * DEBUG: Force Storymode Entry
   * Bypasses storyboard selection checks.
   */
  force_start = () => {
    this.log("FORCING STORYMODE START (Manual Override)", "system");
    this.view = "storymode";
  };
}
export const app = new AppStore();
stories_bridge.register_bump(() => {
  app.stories_version++;
});
if (typeof window !== "undefined") {
  window.app = app;
  window.rpgApp = app;
  window.state = app;
  // @ts-ignore
  Object.defineProperty(window, "visual", { get: () => app.visual, configurable: true });
}
