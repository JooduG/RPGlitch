/**
 * src/state/app.svelte.js
 * UI: Interface State (Simulation & Gamemaster)
 * Manages modals, view states, and visual feedback using storyboard/storymode terminology.
 * ZERO NESTING - Flattened Schema only.
 */
import { flushSync } from "svelte";
import { generate_uuid, resolve_px } from "@utils";
import { log as engineLog, guarded_transition } from "@engine";
import { db, entities, normalize } from "@data";
import { visual_engine, get_signature_color, Audio } from "@media";
import { embeddings_engine } from "@intelligence";
import { runtime } from "./runtime.svelte.js";
import { simulation_state, ui_state } from "./status.svelte.js";

/**
 * Image preview bridge: The state layer cannot import from @atoms (UI layer).
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

/** @typedef {import('./status.svelte.js').AppSettings} AppSettings */
/** @typedef {import('./status.svelte.js').CardHandState} CardHandState */
/** @typedef {import('./status.svelte.js').SimulationControl} SimulationControl */
/** @typedef {import('./status.svelte.js').FateSystem} FateSystem */

/************************************************************************************
 * [SECTION: STATE DEFINITIONS]
 * ----------------------------------------------------------------------------------
 * Core reactive state for the application.
 ************************************************************************************/
// Static formatter to avoid 'new Date()' mutable instance warnings in reactive contexts
const log_time_formatter = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
class StreamingState {
  /** @type {boolean} */
  active = $state(false);
  /** @type {string} */
  content = $state("");
  /** @type {string | null} */
  node_id = $state(null);
  /** @type {"ai" | "user" | "fractal" | "system" | null} */
  role = $state("ai");
  /** @type {AbortController | null} */
  abort_controller = $state(null);
  /** @type {boolean} */
  errored = $state(false);
  /** @type {string | null} */
  errored_node_id = $state(null);

  get text() {
    return this.content;
  }
  set text(val) {
    this.content = val;
  }
}

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
  /** @type {FateSystem} */
  fate = $state({
    active: false,
    hand: [],
    selected: null,
  });
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
  /** @type {((ctx: any) => void) | null} */
  regenerate_image_handler = $state(null);
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
  get isProcessing() {
    return simulation_state.phase === "generating" || this.streaming.active;
  }
  get voiceSuppressed() {
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
  get turnType() {
    return runtime.turn_type;
  }
  /**
   *
   */
  set turnType(val) {
    runtime.turn_type = val;
  }
  // --- READINESS (Derived Logic) ---
  get selected_count() {
    return (this.selected_ai ? 1 : 0) + (this.selected_user ? 1 : 0) + (this.selected_fractal ? 1 : 0);
  }
  get models_ready() {
    return embeddings_engine.modelReady && Audio.voice.modelReady;
  }
  get models_loading() {
    return embeddings_engine.isLoading || Audio.voice.isLoading;
  }
  get models_progress() {
    if (this.models_ready) return 100;
    const emb_prog = embeddings_engine.modelReady ? 100 : embeddings_engine.loadProgress;
    const voice_prog = Audio.voice.modelReady ? 100 : Audio.voice.loadProgress;
    return Math.min(99, Math.round((emb_prog + voice_prog) / 2));
  }
  get is_ready() {
    return this.settings.dev_mode || (this.selected_ai !== null && this.selected_user !== null && this.selected_fractal !== null);
  }
  /** Legacy alias for storyboard readiness */

  // --- TELEMETRY (DevMode HUD) ---
  /**
   * @type {any[]}
   */
  logs = $state([]);
  /**
   * Records a system event.
   * Uses Intl.format(Date.now()) to satisfy ESLint prefer-svelte-reactivity.
   * @param {string} message
   */
  log(message, type = "system") {
    const entry = {
      id: generate_uuid(),
      timestamp: log_time_formatter.format(Date.now()),
      message,
      type, // 'system' | 'ai' | 'db' | 'error'
    };
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();

    // Call engine-wide logger
    engineLog(`[Telemetry:${type.toUpperCase()}] ${message}`);
  }
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
  }

  /**
   * Persist app settings to IndexedDB storage and sync dev grid visibility.
   */
  save_settings = async () => {
    if (typeof window === "undefined" || !this.settings) return;
    this.settings.dev_grid_visible = this.settings.dev_mode;
    try {
      await db.kv_settings.put({ key: "rpg_settings", value: $state.snapshot(this.settings) });
    } catch (e) {
      console.error("[Security] Settings Save Failed:", e);
    }
    // Global Sync for non-Svelte legacy components
    if (typeof window !== "undefined") {
      window.RPGLITCH_CONFIG = {
        sound: this.settings.sound,
        auto_scroll: this.settings.auto_scroll,
        text_speed: this.settings.stream_text ? 30 : 0,
        dev_mode: this.settings.dev_mode,
      };
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
   * Hydrates the storyboard lists with characters and fractals.
   */
  async load_entities() {
    try {
      const [characters, fractals] = await Promise.all([entities.list("character"), entities.list("fractal")]);
      this.ai_list = characters;
      this.user_list = characters;
      this.fractal_list = fractals;
      this.entities_loaded = true;
    } catch (e) {
      console.error("[AppStore] Failed to load lobby entities:", e);
    }
  }
  streaming = new StreamingState();
  /************************************************************************************
   * [SECTION: UI ACTIONS]
   * ----------------------------------------------------------------------------------
   * Methods for modifying UI state and triggering events.
   ************************************************************************************/
  toggle_control_panel = () => {
    this.control_panel_open = !this.control_panel_open;
  };
  set_view = (/** @type {string} */ view) => {
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
      if (target_entity.id === this.selected_ai?.id) active_type = "ai";
      else if (target_entity.id === this.selected_user?.id) active_type = "user";
      else if (target_entity.id === this.selected_fractal?.id) active_type = "fractal";
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
  // STREAMING CONTROL
  /**
   * @param {string | null} id
   * @param {"ai" | "user" | "fractal" | "system" | null} role
   */
  start_stream = (id, role = "ai") => {
    this.streaming.active = true;
    this.streaming.content = "";
    this.streaming.text = "";
    this.streaming.node_id = id;
    this.streaming.role = role;
    this.streaming.errored = false;
    this.streaming.errored_node_id = null;
  };
  update_stream = (/** @type {string} */ chunk) => {
    this.streaming.content += chunk;
    this.streaming.text = this.streaming.content;
  };
  end_stream = () => {
    this.streaming.active = false;
    this.streaming.content = "";
    this.streaming.text = "";
    this.streaming.node_id = null;
    this.streaming.role = "ai";
  };
  signal_stream_error = (node_id) => {
    this.streaming.errored = true;
    this.streaming.errored_node_id = node_id;
  };
  trigger_interrupt = () => {
    if (this.streaming.abort_controller) {
      try {
        this.streaming.abort_controller.abort();
      } catch (e) {
        console.error("[AppStore] Failed to abort streaming:", e);
      }
    }
  };
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
if (typeof window !== "undefined") {
  window.app = app;
  window.rpgApp = app;
  window.state = app;
  // @ts-ignore
  Object.defineProperty(window, "visual", { get: () => app.visual, configurable: true });
}
