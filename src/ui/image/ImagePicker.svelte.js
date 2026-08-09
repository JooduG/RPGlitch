/**
 * @file src/ui/image/ImagePicker.svelte.js
 * 🎲 Image Regenerate State — manages the 3-candidate regenerate flow.
 * Two phases: "regenerating" (placeholder shows "Regenerating...") then
 * "picker" (3-card modal opens when user clicks "Select Image").
 * Svelte 5 module-level runes state.
 */

/** @typedef {{ url: string, metadata: any, signature_color: string | null }} Candidate */

// Plain module-level variables for prompt persistence — COMPLETELY outside Svelte's $state proxy.
// This bypasses any reactivity/proxy issues that may clear values between regeneration rounds.
let _persisted_prompt = "";
let _persisted_mode = "character";
let _persisted_negative = "";

/** @type {{ regenerating_key: string | null, candidates_ready: boolean, candidates: Candidate[], picker_open: boolean, selected_index: number | null, on_select: ((c: Candidate, index: number) => void) | null, signature_color: string | null, error: string | null }} */
let state = $state({
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
    return state.regenerating_key;
  },
  get candidates_ready() {
    return state.candidates_ready;
  },
  get candidates() {
    return state.candidates;
  },
  get picker_open() {
    return state.picker_open;
  },
  get selected_index() {
    return state.selected_index;
  },
  get on_select() {
    return state.on_select;
  },
  get signature_color() {
    return state.signature_color;
  },
  get error() {
    return state.error;
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

  /**
   * Is this specific attachment currently being regenerated (generating)?
   * @param {string} key — `${log_id}:${attach_idx}`
   * @returns {boolean}
   */
  isRegenerating(key) {
    return state.regenerating_key === key && !state.candidates_ready && !state.error;
  },

  /**
   * Are candidates ready for this attachment (waiting for user to pick)?
   * @param {string} key — `${log_id}:${attach_idx}`
   * @returns {boolean}
   */
  isReady(key) {
    return state.regenerating_key === key && state.candidates_ready && !state.error;
  },

  /**
   * Is there an error for this attachment's regenerate?
   * @param {string} key — `${log_id}:${attach_idx}`
   * @returns {boolean}
   */
  hasError(key) {
    return state.regenerating_key === key && !!state.error;
  },
};

/**
 * Begins regenerating an attachment. The placeholder will show "Regenerating..."
 * until deliver_candidates() is called.
 * @param {string} key — `${log_id}:${attach_idx}`
 * @param {{ on_select: (c: Candidate, index: number) => void, signature_color?: string | null }} opts
 */
export function start_regenerate(key, opts) {
  state.regenerating_key = key;
  state.candidates_ready = false;
  state.candidates = [];
  state.picker_open = false;
  state.selected_index = null;
  state.on_select = opts.on_select ?? null;
  state.signature_color = opts.signature_color ?? null;
  state.error = null;
}

/**
 * Delivers the generated candidates. The placeholder becomes a "Select Image" button.
 * @param {Candidate[]} candidates
 * @param {{ prompt?: string, mode?: string, negative_prompt?: string }} [meta]
 */
export function deliver_candidates(candidates, meta) {
  state.candidates = candidates;
  state.candidates_ready = true;
  state.error = null;
  if (meta) {
    if (meta.prompt) {
      _persisted_prompt = meta.prompt;
    }
    if (meta.mode) _persisted_mode = meta.mode;
    if (meta.negative_prompt) _persisted_negative = meta.negative_prompt;
  }
}

/**
 * Opens the 3-card picker modal. Only works if candidates are ready.
 */
export function open_picker() {
  if (state.candidates_ready && state.candidates.length >= 2) {
    state.picker_open = true;
    state.selected_index = null;
  }
}

/**
 * Marks a candidate as selected (for visual feedback) then closes after a brief delay.
 * The actual on_select callback fires immediately.
 * @param {number} index
 */
export function select_candidate(index) {
  if (index < 0 || index >= state.candidates.length) return;
  state.selected_index = index;
  const candidate = state.candidates[index];
  if (typeof state.on_select === "function") {
    state.on_select(candidate, index);
  }
  setTimeout(() => close_regenerate(), 400);
}

/**
 * Re-runs the regenerate flow IN PLACE while keeping the 3-card picker modal open.
 * The modal drops back to the "Generating..." state, and the next
 * deliver_candidates() call fills it with the fresh round of cards.
 * Keeps regenerating_key, on_select, signature_color, and the persisted
 * prompt/mode/negative intact so the regenerating_key context survives.
 * (The opposite of close_picker, which hides the modal.)
 */
export function begin_picker_regeneration() {
  // Capture prompt from the current candidates BEFORE clearing them, as a safety net
  if (state.candidates.length > 0 && state.candidates[0]?.metadata?.prompt && !_persisted_prompt) {
    _persisted_prompt = state.candidates[0].metadata.prompt;
    _persisted_mode = state.candidates[0].metadata.mode || _persisted_mode;
    _persisted_negative = state.candidates[0].metadata.negative_prompt || _persisted_negative;
  }
  state.candidates_ready = false;
  state.candidates = [];
  state.selected_index = null;
  state.error = null;
  // NOTE: deliberately does NOT touch state.picker_open — the modal stays open
  // and shows the "Generating..." state until the next deliver_candidates().
}

/**
 * Closes the picker modal but keeps regenerating_key, on_select, signature_color,
 * and persisted prompt/mode/negative for subsequent regenerations.
 * The inline message placeholder will show the "regenerating" loading state.
 */
export function close_picker() {
  // Capture prompt from candidates BEFORE clearing them, as a safety net
  if (state.candidates.length > 0 && state.candidates[0]?.metadata?.prompt && !_persisted_prompt) {
    _persisted_prompt = state.candidates[0].metadata.prompt;
    _persisted_mode = state.candidates[0].metadata.mode || _persisted_mode;
    _persisted_negative = state.candidates[0].metadata.negative_prompt || _persisted_negative;
  }
  state.picker_open = false;
  state.candidates_ready = false;
  state.candidates = [];
  state.selected_index = null;
  state.error = null;
}

/**
 * Clears all regenerate state entirely. Does NOT clear persisted prompt
 * (it's a plain variable, persists naturally).
 */
export function close_regenerate() {
  state.regenerating_key = null;
  state.candidates_ready = false;
  state.candidates = [];
  state.picker_open = false;
  state.selected_index = null;
  state.on_select = null;
  state.signature_color = null;
  state.error = null;
}

/**
 * Reports an error. The placeholder will show the error message.
 * @param {string} msg
 */
export function set_regenerate_error(msg) {
  state.error = msg;
  state.candidates_ready = false;
}

/**
 * Returns the persisted prompt metadata as a plain object.
 * Useful for callers that want to read all three values at once.
 * @returns {{ prompt: string, mode: string, negative_prompt: string }}
 */
export function get_persisted_meta() {
  return {
    prompt: _persisted_prompt,
    mode: _persisted_mode,
    negative_prompt: _persisted_negative,
  };
}
