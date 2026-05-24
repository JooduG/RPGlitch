/**
 * src/state/app.svelte.js
 * UI: Interface State (Simulation & Gamemaster)
 * Manages modals, view states, and visual feedback using storyboard/storymode terminology.
 * ZERO NESTING - Flattened Schema only.
 */
import { KV_SETTINGS_KEY } from "@engine/constants.js";
import { log as engineLog } from "@engine/logger.svelte.js";
import { normalize } from "@data/normalizer.js";
import { db } from "@data/db.js";
import { entities } from "@data/repository.js";
import { visual_engine } from "@media/visual.svelte.js";
import { generateUUID } from "@ui/components/render-helpers.js";
import { resolve_px } from "@ui/components/dom-helpers.js";
import { closeImagePreview, openImagePreview } from "@atoms/ImagePreview.svelte";
import { runtime } from "@state/runtime.svelte.js";
import { simulationState, uiState } from "@state/status.svelte.js";

/** @typedef {import('./control.svelte.js').AppSettings} AppSettings */
/** @typedef {import('./control.svelte.js').DrawerState} DrawerState */
/** @typedef {import('./control.svelte.js').SimulationControl} SimulationControl */
/** @typedef {import('./control.svelte.js').FateSystem} FateSystem */

/************************************************************************************
 * [SECTION: STATE DEFINITIONS]
 * ----------------------------------------------------------------------------------
 * Core reactive state for the application.
 ************************************************************************************/
// Static formatter to avoid 'new Date()' mutable instance warnings in reactive contexts
const logTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
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
  viewport = $state({
    mini: false,
    mobile: false,
    tablet: false,
    desktop: false,
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
  /** @type {DrawerState} */
  drawer = $state({
    open: false,
    type: null, // 'ai' | 'user' | 'fractal'
    reroll_count: 0,
  });
  // --- NARRATIVE CONFIG ---
  prologue = $state(""); // Starting directions/context
  /** @type {SimulationControl} */
  simulation = {
    get loading() {
      return uiState.loading;
    },
    set loading(val) {
      uiState.set_loading(val);
    },
  };
  /** @type {FateSystem} */
  fate = $state({
    active: false,
    hand: [],
    selected: null,
  });
  // --- UI TENSION (Reactive Intensity) ---
  tension = $derived(
    simulationState.phase === "generating" || simulationState.phase === "locked" ? 1 : 0,
  );
  /** @type {AppSettings} */
  settings = $state({
    sound: true,
    call_mode: false,
    stream_text: true,
    auto_scroll: true,
    dev_mode: false,
    dev_grid_visible: false,
  });
  // --- SENSORY ENGINES ---
  visual = visual_engine;
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
    return simulationState.phase;
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
  selected_count = $derived(
    (this.selected_ai ? 1 : 0) + (this.selected_user ? 1 : 0) + (this.selected_fractal ? 1 : 0),
  );
  is_ready = $derived.by(() => {
    const ready =
      this.settings.dev_mode ||
      (this.selected_ai !== null && this.selected_user !== null && this.selected_fractal !== null);

    return ready;
  });
  /** Legacy alias for storyboard readiness */
  get storyboard_ready() {
    return this.is_ready;
  }
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
      id: generateUUID(),
      timestamp: logTimeFormatter.format(Date.now()),
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
      const entry = await db.kv_settings.get(KV_SETTINGS_KEY);
      if (entry && entry.value) {
        this.settings = { ...this.settings, ...entry.value };
      }
    } catch (e) {
      console.error("[Security] Settings Hydration Failed:", e);
    }
  }

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
    const getBreakpoint = (/** @type {string} */ name) => {
      const px = resolve_px(`--breakpoint-${name}`, 0);
      return px ? `${px}px` : null;
    };

    const queries = {
      mini: `(max-width: ${getBreakpoint("mini") || "30rem"})`,
      mobile: `(max-width: ${getBreakpoint("mobile") || "48rem"})`,
      tablet: `(max-width: ${getBreakpoint("tablet") || "64rem"})`,
      desktop: `(max-width: ${getBreakpoint("desktop") || "80rem"})`,
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
      const [characters, fractals] = await Promise.all([
        entities.list("character"),
        entities.list("fractal"),
      ]);
      this.ai_list = characters;
      this.user_list = characters;
      this.fractal_list = fractals;
      this.entities_loaded = true;
    } catch (e) {
      console.error("[AppStore] Failed to load lobby entities:", e);
    }
  }
  save_settings = async () => {
    if (typeof window === "undefined" || !this.settings) return;
    try {
      await db.kv_settings.put({
        key: KV_SETTINGS_KEY,
        value: $state.snapshot(this.settings),
      });
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
  // --- LLM STREAMING ---
  /** @type {{ active: boolean, content: string, text: string, node_id: string | null, nodeId: string | null, role: "ai" | "user" | "fractal" | "system" | null, abort_controller: AbortController | null }} */
  streaming = $state({
    active: false,
    content: "",
    get text() {
      return this.content;
    },
    set text(val) {
      this.content = val;
    },
    node_id: null,
    get nodeId() {
      return this.node_id;
    },
    set nodeId(val) {
      this.node_id = val;
    },
    role: "ai",
    abort_controller: null,
  });
  /************************************************************************************
   * [SECTION: UI ACTIONS]
   * ----------------------------------------------------------------------------------
   * Methods for modifying UI state and triggering events.
   ************************************************************************************/
  toggle_control_panel = () => {
    this.control_panel_open = !this.control_panel_open;
  };
  set_view = (/** @type {string} */ view) => {
    this.view = view;
  };
  open_drawer = (/** @type {'ai' | 'user' | 'fractal' | null} */ type) => {
    this.drawer.type = type;
    this.drawer.open = true;
  };
  close_drawer = () => {
    this.drawer.open = false;
  };
  close_image_preview = () => {
    closeImagePreview();
  };
  /**
   * Selects an entity for the current session.
   * Automatically normalizes the object to ensure a flattened schema.
   */
  select_entity = (
    /** @type {'ai' | 'user' | 'fractal' | null} */ type,
    /** @type {any} */ entity,
  ) => {
    const clean = normalize(entity);
    if (type === "ai") this.selected_ai = clean;
    else if (type === "user") this.selected_user = clean;
    else if (type === "fractal") this.selected_fractal = clean;
    this.drawer.open = false;
  };
  /** @type {any} */
  editing_entity = $state(null);
  /**
   * Toggles the profile modal and prepares the target entity for editing.
   * @param {boolean | null} force_state
   * @param {any} entity
   */
  toggle_profile = (force_state = null, entity = null) => {
    if (force_state !== null) this.profile_open = force_state;
    else this.profile_open = !this.profile_open;
    if (entity) {
      this.editing_entity = normalize(entity);
    }
  };
  close_profile = () => {
    this.profile_open = false;
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
    this.streaming.nodeId = id;
    this.streaming.role = role;
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
    this.streaming.nodeId = null;
    this.streaming.role = "ai";
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
    openImagePreview(src, caption);
  };
  reroll_title = () => {
    this.drawer.reroll_count++;
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
  window.visual = app.visual;
}
