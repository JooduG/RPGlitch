/**
 * src/state/app.svelte.js
 * 🛠️ UI: Interface State (Simulation & Gamemaster)
 * Manages modals, view states, and visual feedback using storyboard/storymode terminology.
 * ZERO NESTING — Flattened Schema only.
 */
import { db } from "../data/db.js";
import { generateUUID } from "../ui/utils/helpers.js";
import { closeLightbox, openLightbox } from "./lightbox.svelte.js";
import { runtime } from "./runtime.svelte.js";
import { simulationState } from "./status.svelte.js";
import { normalize } from "../data/content-normaliser.js";
import { visual_engine } from "../media/visual-engine.svelte.js";
import { KV_SETTINGS_KEY } from "@core/constants.js";
import { entities } from "../data/repository.js";

/************************************************************************************
 * 🧩 [SECTION: STATE DEFINITIONS]
 * ----------------------------------------------------------------------------------
 * Core reactive state for the application.
 ************************************************************************************/
// Static formatter to avoid 'new Date()' mutable instance warnings in reactive contexts
const logTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
export class AppStore {
  initialized = false;
  // --- NAVIGATION ---
  view = $state("storyboard"); // 'storyboard' | 'storymode'
  control_panel_open = $state(false);
  profile_open = $state(false);
  // --- ENTITY SELECTION STATE (STORYBOARD) ---
  selected_ai = $state(null);
  selected_user = $state(null);
  selected_fractal = $state(null);
  ai_list = $state([]);
  user_list = $state([]);
  fractal_list = $state([]);
  // --- ENTITY DRAWER STATE ---
  drawer = $state({
    open: false,
    type: null, // 'ai' | 'user' | 'fractal'
    reroll_count: 0,
  });
  // --- NARRATIVE CONFIG ---
  prologue = $state(""); // Starting directions/context
  // --- SIMULATION STATE ---
  simulation = $state({
    loading: false, // STASIS: True when Chrono is processing
  });
  // --- FATE SYSTEM ---
  fate = $state({
    active: false,
    hand: [],
    selected: null,
  });
  // --- UI TENSION (Reactive Intensity) ---
  tension = $derived(
    simulationState.phase === "generating" || simulationState.phase === "locked" ? 1 : 0,
  );
  // --- SETTINGS ---
  settings = $state({
    sound: true,
    call_mode: false,
    stream_text: true,
    auto_scroll: true,
    dev_mode: false,
  });
  // --- SENSORY ENGINES ---
  visual = visual_engine;
  get round() {
    return runtime.round;
  }
  set round(val) {
    runtime.round = val;
  }
  get turnType() {
    return runtime.turnType;
  }
  set turnType(val) {
    runtime.turnType = val;
  }
  // --- READINESS (Derived Logic) ---
  selected_count = $derived(
    (this.selected_ai ? 1 : 0) + (this.selected_user ? 1 : 0) + (this.selected_fractal ? 1 : 0),
  );
  is_ready = $derived(
    this.settings.dev_mode || (this.selected_ai && this.selected_user && this.selected_fractal),
  );
  /** Legacy alias for storyboard readiness */
  get storyboard_ready() {
    return this.is_ready;
  }
  // --- TELEMETRY (DevMode HUD) ---
  logs = $state([]);
  /**
   * Records a system event.
   * Uses Intl.format(Date.now()) to satisfy ESLint prefer-svelte-reactivity.
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
    if (this.settings.dev_mode) {
      console.debug(`[Telemetry:${type.toUpperCase()}] ${message}`);
    }
  }
  /************************************************************************************
   * 🧩 [SECTION: LIFECYCLE & PERSISTENCE]
   * ----------------------------------------------------------------------------------
   * Initialization and persistent storage logic.
   ************************************************************************************/
  async init() {
    if (typeof window === "undefined" || this.initialized) return;
    this.initialized = true;
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
  streaming = $state({
    active: false,
    content: "",
    node_id: null,
  });
  /************************************************************************************
   * 🧩 [SECTION: UI ACTIONS]
   * ----------------------------------------------------------------------------------
   * Methods for modifying UI state and triggering events.
   ************************************************************************************/
  toggle_control_panel = () => {
    this.control_panel_open = !this.control_panel_open;
  };
  set_view = (view) => {
    this.view = view;
  };
  open_drawer = (type) => {
    this.drawer.type = type;
    this.drawer.open = true;
  };
  close_drawer = () => {
    this.drawer.open = false;
  };
  close_lightbox = () => {
    closeLightbox();
  };
  /**
   * Selects an entity for the current session.
   * Automatically normalizes the object to ensure a flattened schema.
   */
  select_entity = (type, entity) => {
    const clean = normalize(entity);
    if (type === "ai") this.selected_ai = clean;
    else if (type === "user") this.selected_user = clean;
    else if (type === "fractal") this.selected_fractal = clean;
    this.drawer.open = false;
  };
  editing_entity = $state(null);
  /**
   * Toggles the profile modal and prepares the target entity for editing.
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
  open_profile = (entity) => {
    this.toggle_profile(true, entity);
  };
  profile_target_id = $derived(this.editing_entity?.id || null);
  profile_target_type = $derived(this.editing_entity?.type || null);
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
  start_stream = (id) => {
    this.streaming.active = true;
    this.streaming.content = "";
    this.streaming.node_id = id;
  };
  update_stream = (chunk) => {
    this.streaming.content += chunk;
  };
  end_stream = () => {
    this.streaming.active = false;
    this.streaming.node_id = null;
  };
  open_lightbox = (src, caption = "") => {
    openLightbox(src, caption);
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
