/**
 * ============================================================================
 * RPGlitch State Layer: Application Interface & Navigation Store
 * ============================================================================
 *
 * @file src/state/interface.svelte.js
 * @description Central application interface & UI interaction store (Rank 3, state).
 * Moved from `src/ui/interface.svelte.js` plus the reactive image lightbox /
 * picker state from `src/ui/ImagePreview.svelte` so `@state` never imports
 * `.svelte` UI components.
 * navigation (storyboard vs storymode), control panel, modal overlays, storyboard
 * entity slot selection, responsive viewport observers, and persistent settings.
 *
 * Core Responsibilities:
 * - Manages top-level application navigation (`storyboard` vs `storymode`), control panel, and modals.
 * - Owns reactive Storyboard slot selections (`selected_ai`, `selected_user`, `selected_fractal`, `card_hand`).
 * - Manages entity lobby lists and claimed entity tracking (`claimed_entity_ids`) for active story locking.
 * - Handles viewport media query listeners and touch capabilities synced with design system tokens.
 * - Owns persistent application user settings (`sound`, `call_mode`, `stream_text`, `auto_scroll`, `developer_mode`, `dev_grid_visible`, styles).
 * - Bridges image preview modal requests to the UI layer without violating layer boundaries.
 * - Delegates streaming and telemetry calls to their respective stores (`status.svelte.js`, `log.svelte.js`).
 *
 * Layer & Dependency Invariants:
 * - `src/state/` MUST NEVER import from `src/ui/`.
 * - UI modals register callbacks into `register_image_preview_handlers` at boot.
 * - Downward imports permitted: `@utils`, `@data`, `@media`, `@platform`.
 *
 * ============================================================================
 */

import { db, entities, normalize_entity as normalize, on_stories_changed, stories } from "@data";
import { visual_engine } from "@media";
import { embeddings_engine, get_signature_color, guarded_transition, resolve_px } from "@utils";
import { flushSync } from "svelte";
import { SvelteSet } from "svelte/reactivity";
import { developer_log } from "./devlog.svelte.js";
import { register_runtime_app_sink, runtime } from "./runtime.svelte.js";
import { install_freeze_watchdog, simulation_state, ui_state } from "./status.svelte.js";
import { streaming as streaming_store } from "./streaming.svelte.js";

// ============================================================================
// Bridges & JSDoc Type Definitions
// ============================================================================

/**
 * @typedef {Object} AppSettings
 * @property {boolean} sound - Whether audio feedback and notification sounds are enabled.
 * @property {boolean} call_mode - Toggles the immersive 'Call' UI overlay for focus.
 * @property {boolean} stream_text - Toggles the character text streaming/typing animation.
 * @property {boolean} auto_scroll - Toggles automatic log scrolling to the bottom of the stack.
 * @property {boolean} dev_mode - Enables the Telemetry HUD and system debug overrides.
 * @property {boolean} dev_grid_visible - Toggles the visual chess grid overlay.
 * @property {string} [narrative_style] - The active narrative writing style profile in the session.
 * @property {string} [visual_style] - The global default visual style for image generation.
 */

/**
 * @typedef {Object} CardHandState
 * @property {boolean} open - Whether the card hand modal is currently visible.
 * @property {'ai' | 'user' | 'fractal' | null} type - The target category for entity selection.
 * @property {number} regenerate_count - The number of times the current selection pool has been shuffled.
 */

/**
 * @typedef {Object} SimulationControl
 * @property {boolean} loading - STASIS: True when the Chrono Engine is processing a turn.
 */

// ============================================================================
// Interface Store Class Initialization & Reactive State
// ============================================================================

export class InterfaceStore {
  initialized = false;
  /** @type {Array<() => void>} */
  _viewport_cleanup = [];

  // --- NAVIGATION & MODAL STATE ---
  /** @type {'storyboard' | 'storymode'} */
  view = $state("storyboard");
  control_panel_open = $state(false);
  profile_open = $state(false);
  transitioning_profile = $state(false);
  /** @type {string | null} */
  transition_target_id = $state(null);
  /** @type {string | number | null} Active pinned message header id */
  pinned_message_id = $state(null);
  viewport = $state({ mobile: false, is_touch: false });

  // --- STORYBOARD ENTITY SELECTION STATE ---
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

  /** @type {any[]} */
  ai_list = $state([]);
  /** @type {any[]} */
  user_list = $state([]);
  /** @type {any[]} */
  fractal_list = $state([]);
  entities_loaded = $state(false);

  /**
   * Entity ids currently claimed by active (non-concluded) stories. Claimed
   * entities are excluded from the storyboard lists and their profiles are
   * locked for editing unless DevMode is enabled.
   */
  claimed_entity_ids = new SvelteSet();

  /** @type {CardHandState} */
  card_hand = $state({ open: false, type: null, regenerate_count: 0 });

  // --- NARRATIVE CONFIG & ACTIVE PROPS ---
  prologue = $state("");
  story_title = $state("");
  story_title_parts = $state([]);

  /** @type {SimulationControl} */
  simulation = {
    get loading() {
      return ui_state.loading;
    },
    set loading(val) {
      ui_state.set_loading(val);
    },
  };

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

  /**
   * Bumped whenever the story archive changes (create/update/conclude/delete)
   * so the Library can refresh even while the control panel stays open.
   */
  stories_version = $state(0);

  /** @type {((ctx: any) => void) | null} */
  regenerate_image_handler = $state(null);

  /** @type {((subject: string, prompt: string, kind?: string, target_entity?: any) => Promise<void>) | null} */
  take_photo_handler = $state(null);

  /** @type {any} */
  editing_entity = $state(null);

  streaming = streaming_store;

  // ============================================================================
  // Derived State, Readiness & Status Proxies
  // ============================================================================

  get tension() {
    return simulation_state.phase === "generating" || simulation_state.phase === "locked" ? 1 : 0;
  }

  get conclusion_status() {
    return runtime.active_story?.conclusion_status || null;
  }

  get visual() {
    return visual_engine;
  }

  get busy() {
    return ui_state.loading;
  }

  set busy(val) {
    ui_state.set_loading(val);
  }

  get round() {
    return runtime.round;
  }

  set round(val) {
    runtime.round = val;
  }

  get env() {
    return import.meta.env.DEV ? "DEV" : "PROD";
  }

  get sim_phase() {
    return simulation_state.phase;
  }

  get is_processing() {
    return simulation_state.phase === "generating" || this.streaming.active;
  }

  get voice_suppressed() {
    return simulation_state.phase === "generating" && !this.streaming.active;
  }

  get turn_type() {
    return runtime.turn_type;
  }

  set turn_type(val) {
    runtime.turn_type = val;
  }

  get selected_count() {
    return (this.selected_ai ? 1 : 0) + (this.selected_user ? 1 : 0) + (this.selected_fractal ? 1 : 0);
  }

  get models_ready() {
    return embeddings_engine.model_ready;
  }

  get models_loading() {
    return embeddings_engine.is_loading;
  }

  get models_progress() {
    if (this.models_ready) return 100;
    return Math.min(99, Math.round(embeddings_engine.load_progress));
  }

  get is_ready() {
    return this.selected_ai !== null && this.selected_user !== null && this.selected_fractal !== null;
  }

  get logs() {
    return developer_log.entries;
  }

  get profile_target_id() {
    return this.editing_entity?.id || null;
  }

  get profile_target_type() {
    return this.editing_entity?.type || null;
  }

  /**
   * Records a system event into the telemetry store.
   * @param {string} message
   * @param {string} [type='system']
   */
  log = (message, type = "system") => developer_log.log(message, type);

  // ============================================================================
  // Lifecycle, Hydration & Viewport Observer
  // ============================================================================

  /**
   * Initializes the application store, hydrates settings and telemetry, and installs watchdogs.
   */
  async init() {
    if (typeof window === "undefined" || this.initialized) return;
    this.initialized = true;

    this.init_viewport();

    try {
      const entry = await db.kv_settings.get("rpg_settings");
      if (entry && entry.value) {
        this.settings = { ...this.settings, ...entry.value };
      }
    } catch (e) {
      console.error("[Security] Settings Hydration Failed:", e);
    }

    await developer_log.hydrate();
    install_freeze_watchdog();
  }

  /**
   * Persists application settings to IndexedDB storage.
   */
  save_settings = async () => {
    if (typeof window === "undefined" || !this.settings) return;
    try {
      await db.kv_settings.put({ key: "rpg_settings", value: $state.snapshot(this.settings) });
    } catch (save_error) {
      if (save_error?.name !== "DatabaseClosedError") {
        console.error("[Security] Settings Save Failed:", save_error);
      }
    }
  };

  /**
   * Centralized Viewport Observer synced with CSS design tokens.
   */
  init_viewport() {
    if (typeof window === "undefined") return;

    if (this._viewport_cleanup) {
      this._viewport_cleanup.forEach((cleanup) => cleanup());
    }
    this._viewport_cleanup = [];

    const get_breakpoint = (/** @type {string} */ name) => {
      const px = resolve_px(`--breakpoint-${name}`, 0);
      return px ? `${px}px` : null;
    };

    const queries = { mobile: `(width < ${get_breakpoint("mobile") || "48rem"})` };

    Object.keys(queries).forEach((key) => {
      const k = /** @type {keyof typeof queries} */ (key);
      const query = queries[k];
      const mql = window.matchMedia(query);

      this.viewport[k] = mql.matches;

      const listener = (/** @type {MediaQueryListEvent} */ e) => {
        this.viewport[k] = e.matches;
        this.log(`Viewport Change: ${k} -> ${e.matches}`, "system");
      };
      mql.addEventListener("change", listener);
      this._viewport_cleanup.push(() => mql.removeEventListener("change", listener));
    });

    this.viewport.is_touch = window.ontouchstart !== undefined || navigator.maxTouchPoints > 0;
  }

  // ============================================================================
  // Storyboard Selection & Entity Lobby Management
  // ============================================================================

  /**
   * Stashes the current storyboard slot selections before a story inspection round-trip.
   */
  stash_storyboard_selection() {
    this.stashed_storyboard_selection = { ai: this.selected_ai, user: this.selected_user, fractal: this.selected_fractal };
  }

  /**
   * Restores storyboard slots to pre-inspection state and clears the one-shot stash.
   */
  restore_storyboard_selection() {
    const stashed = this.stashed_storyboard_selection;
    this.selected_ai = stashed?.ai ?? null;
    this.selected_user = stashed?.user ?? null;
    this.selected_fractal = stashed?.fractal ?? null;
    this.stashed_storyboard_selection = null;
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
      for (const id of claimed) this.claimed_entity_ids.add(id);
      this.ai_list = characters;
      this.user_list = characters;
      this.fractal_list = fractals;
      this.entities_loaded = true;
      this.clean_claimed_selections();
    } catch (e) {
      console.error("[InterfaceStore] Failed to load lobby entities:", e);
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

  regenerate_title = () => {
    this.card_hand.regenerate_count++;
  };

  // ============================================================================
  // View Navigation & Profile Transitions
  // ============================================================================

  toggle_control_panel = () => {
    this.control_panel_open = !this.control_panel_open;
  };

  /**
   * Switches the active top-level view with a view transition.
   * @param {'storyboard' | 'storymode'} view
   */
  set_view = async (view) => {
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
        // Entering storymode must surface the ACTIVE story's title. The
        // storyboard writes `app.story_title` from the draft slot selections
        // while it is mounted, so re-assert the authoritative value once the
        // view has actually flipped (and the storyboard has unmounted).
        if (view === "storymode") {
          runtime.restore_story_title?.();
        }
      },
      { className: "is-switching-view" },
    );
  };

  /**
   * Toggles the profile modal and prepares the target entity for editing.
   * @param {boolean | null} [force_state=null]
   * @param {any} [entity=null]
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
    let active_type = "user";
    if (target_entity) {
      if (target_entity.id === this.selected_ai?.id || target_entity.id === runtime.active_ai?.id) active_type = "ai";
      else if (target_entity.id === this.selected_user?.id || target_entity.id === runtime.active_user?.id) active_type = "user";
      else if (target_entity.id === this.selected_fractal?.id || target_entity.id === runtime.active_fractal?.id) active_type = "fractal";
      else active_type = "none";
    }
    if (target_entity) {
      this.transition_target_id = target_entity.id;
    }

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

  // ============================================================================
  // Settings Mutators & Streaming Proxies
  // ============================================================================

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

  // STREAMING CONTROL - delegates to status.svelte.js (StreamingStore)
  start_stream = (id, role = "ai") => streaming_store.start_stream(id, role);
  update_stream = (chunk) => streaming_store.update_stream(chunk);
  end_stream = () => streaming_store.end_stream();
  trigger_interrupt = () => streaming_store.trigger_interrupt();

  close_image_preview = () => {
    close_image_preview();
  };

  open_image_preview = (/** @type {any} */ src, caption = "") => {
    open_image_preview(src, caption);
  };

  /**
   * DEBUG: Force Storymode Entry bypassing storyboard selection checks.
   */
  force_start = () => {
    this.log("FORCING STORYMODE START (Manual Override)", "system");
    this.view = "storymode";
  };
}

// ============================================================================
// Singleton Instance & Global Exposure
// ============================================================================

// ============================================================================
// Image Lightbox & Candidate Picker State (moved from ImagePreview.svelte)
// ============================================================================

/** @typedef {{ url: string, metadata: any, signature_color: string | null }} Candidate */

// --- LIGHTBOX STATE ---
/** @type {{ active: boolean, src: string | null, canvas: HTMLCanvasElement | null, caption: string, metadata: any, on_regenerate: Function | null, on_delete: Function | null, signature_color: string | null }} */
let preview_state = $state({
  active: false,
  src: null,
  canvas: null,
  caption: "",
  metadata: null,
  on_regenerate: null,
  on_delete: null,
  signature_color: null,
});

export const image_preview = {
  get active() {
    return preview_state.active;
  },
  get src() {
    return preview_state.src;
  },
  get canvas() {
    return preview_state.canvas;
  },
  get caption() {
    return preview_state.caption;
  },
  get metadata() {
    return preview_state.metadata;
  },
  get on_regenerate() {
    return preview_state.on_regenerate;
  },
  get on_delete() {
    return preview_state.on_delete;
  },
  get signature_color() {
    return preview_state.signature_color;
  },
};

export const open_image_preview = (options, caption = "") => {
  preview_state.active = true;
  if (typeof options === "string") {
    preview_state.src = options;
    preview_state.caption = caption;
    preview_state.canvas = null;
    preview_state.metadata = null;
    preview_state.on_regenerate = null;
    preview_state.on_delete = null;
    preview_state.signature_color = null;
  } else if (options) {
    preview_state.src = options.src || null;
    preview_state.canvas = options.canvas || null;
    preview_state.caption = options.caption || caption || "";
    preview_state.metadata = options.metadata || null;
    preview_state.on_regenerate = options.on_regenerate || null;
    preview_state.on_delete = options.on_delete || null;
    preview_state.signature_color = options.signature_color || null;
  }
};

export const close_image_preview = () => (preview_state.active = false);

// --- REGENERATION CANDIDATES & PICKER STATE ---
let _persisted_prompt = "";
let _persisted_mode = "character";
let _persisted_negative = "";

/** @type {{ regenerating_key: string | null, candidates_ready: boolean, candidates: Candidate[], picker_open: boolean, selected_index: number | null, on_select: ((c: Candidate, index: number) => void) | null, signature_color: string | null, error: string | null }} */
let picker_state = $state({
  regenerating_key: null,
  candidates_ready: false,
  candidates: [],
  picker_open: false,
  selected_index: null,
  on_select: null,
  signature_color: null,
  error: null,
});

export const image_picker = {
  get regenerating_key() {
    return picker_state.regenerating_key;
  },
  get candidates_ready() {
    return picker_state.candidates_ready;
  },
  get candidates() {
    return picker_state.candidates;
  },
  get picker_open() {
    return picker_state.picker_open;
  },
  get selected_index() {
    return picker_state.selected_index;
  },
  get on_select() {
    return picker_state.on_select;
  },
  get signature_color() {
    return picker_state.signature_color;
  },
  get error() {
    return picker_state.error;
  },
  get last_prompt() {
    return _persisted_prompt;
  },
  get last_mode() {
    return _persisted_mode;
  },
  get last_negative() {
    return _persisted_negative;
  },

  isRegenerating(key) {
    return picker_state.regenerating_key === key && !picker_state.candidates_ready && !picker_state.error;
  },

  isReady(key) {
    return picker_state.regenerating_key === key && picker_state.candidates_ready && !picker_state.error;
  },

  hasError(key) {
    return picker_state.regenerating_key === key && !!picker_state.error;
  },
};

export function start_regenerate(key, opts) {
  picker_state.regenerating_key = key;
  picker_state.candidates_ready = false;
  picker_state.candidates = [];
  picker_state.picker_open = false;
  picker_state.selected_index = null;
  picker_state.on_select = opts.on_select ?? null;
  picker_state.signature_color = opts.signature_color ?? null;
  picker_state.error = null;
}

export function deliver_candidates(candidates, meta) {
  picker_state.candidates = candidates;
  picker_state.candidates_ready = true;
  picker_state.error = null;
  if (meta) {
    if (meta.prompt) _persisted_prompt = meta.prompt;
    if (meta.mode) _persisted_mode = meta.mode;
    if (meta.negative_prompt) _persisted_negative = meta.negative_prompt;
  }
}

export function open_picker() {
  if (picker_state.candidates_ready && picker_state.candidates.length >= 2) {
    picker_state.picker_open = true;
    picker_state.selected_index = null;
  }
}

export function select_candidate(index) {
  if (index < 0 || index >= picker_state.candidates.length) return;
  picker_state.selected_index = index;
  const candidate = picker_state.candidates[index];
  if (typeof picker_state.on_select === "function") {
    picker_state.on_select(candidate, index);
  }
  setTimeout(() => close_regenerate(), 400);
}

export function begin_picker_regeneration() {
  if (picker_state.candidates.length > 0 && picker_state.candidates[0]?.metadata?.prompt && !_persisted_prompt) {
    _persisted_prompt = picker_state.candidates[0].metadata.prompt;
    _persisted_mode = picker_state.candidates[0].metadata.mode || _persisted_mode;
    _persisted_negative = picker_state.candidates[0].metadata.negative_prompt || _persisted_negative;
  }
  picker_state.candidates_ready = false;
  picker_state.candidates = [];
  picker_state.selected_index = null;
  picker_state.error = null;
}

export function close_picker() {
  if (picker_state.candidates.length > 0 && picker_state.candidates[0]?.metadata?.prompt && !_persisted_prompt) {
    _persisted_prompt = picker_state.candidates[0].metadata.prompt;
    _persisted_mode = picker_state.candidates[0].metadata.mode || _persisted_mode;
    _persisted_negative = picker_state.candidates[0].metadata.negative_prompt || _persisted_negative;
  }
  picker_state.picker_open = false;
  picker_state.candidates_ready = false;
  picker_state.candidates = [];
  picker_state.selected_index = null;
  picker_state.error = null;
}

export function close_regenerate() {
  picker_state.regenerating_key = null;
  picker_state.candidates_ready = false;
  picker_state.candidates = [];
  picker_state.picker_open = false;
  picker_state.selected_index = null;
  picker_state.on_select = null;
  picker_state.signature_color = null;
  picker_state.error = null;
}

export function set_regenerate_error(msg) {
  picker_state.error = msg;
  picker_state.candidates_ready = false;
}

export function get_persisted_meta() {
  return { prompt: _persisted_prompt, mode: _persisted_mode, negative_prompt: _persisted_negative };
}

export async function run_image_regeneration(options = {}) {
  const { in_picker = false } = options;

  let key = options.key || picker_state.regenerating_key;
  if (!key && !in_picker) {
    set_regenerate_error("No image context available to regenerate.");
    return;
  }

  const persisted = get_persisted_meta();
  const signature_color = options.signature_color ?? picker_state.signature_color;
  const regenerate_count = options.regenerate_count ?? 0;
  const mode = options.mode || (in_picker ? persisted.mode : "story_character");
  const prompt = options.prompt ?? (in_picker ? persisted.prompt : "");
  const negative_prompt = options.negative_prompt ?? (in_picker ? persisted.negative_prompt : "");

  if (in_picker) {
    begin_picker_regeneration();
  } else if (key) {
    start_regenerate(key, { signature_color, on_select: options.on_select || (() => {}) });
  }

  if (!prompt) {
    set_regenerate_error("No prompt found for this image. Cannot regenerate.");
    return;
  }

  try {
    let final_prompt = prompt;
    let final_negative = negative_prompt;

    const is_unrefined =
      !prompt || prompt.length < 30 || prompt.includes("<image_prompt>") || prompt.startsWith("RAW photograph or structured artistic rendering of");

    if ((in_picker || regenerate_count >= 1 || is_unrefined) && typeof options.refine_prompt === "function") {
      try {
        const refined = await options.refine_prompt(prompt, mode);
        if (refined?.prompt) {
          final_prompt = refined.prompt;
          final_negative = refined.negative_prompt || negative_prompt;
        }
      } catch (envision_err) {
        if (in_picker) {
          console.warn("[ImagePreview] Prompt envision refinement failed, using original prompt:", envision_err);
        }
      }
    }

    if (final_prompt.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(final_prompt.trim());
        if (parsed.prompt && typeof parsed.prompt === "string") {
          final_prompt = parsed.prompt;
          if (parsed.negative_prompt) final_negative = parsed.negative_prompt;
        }
      } catch (_e) {
        const prompt_match = final_prompt.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
        if (prompt_match && prompt_match[1]) {
          final_prompt = prompt_match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
        }
      }
    }

    const candidates = await visual_engine.generate_candidates(final_prompt, { mode, negative_prompt: final_negative, count: 3, min_success: 2 });

    if (candidates.length < 2) {
      set_regenerate_error("Not enough images generated. Please try again.");
      return;
    }

    deliver_candidates(
      candidates.map((c) => ({ url: c.url, metadata: { ...c.metadata, prompt: final_prompt, mode }, signature_color })),
      { prompt: final_prompt, mode, negative_prompt: final_negative },
    );
  } catch (err) {
    console.error("[Regenerate Error]", err);
    set_regenerate_error(`Regenerate failed: ${err.message || err}`);
  }
}

export const app = new InterfaceStore();
register_runtime_app_sink(app);

on_stories_changed(() => {
  app.stories_version++;
});

if (typeof window !== "undefined") {
  // @ts-ignore
  window.app = app;
  // @ts-ignore
  Object.defineProperty(window, "visual", { get: () => app.visual, configurable: true });
}
