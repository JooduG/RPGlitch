/**
 * @file image-regenerate.svelte.js
 * 🎲 Image Regenerate State — manages the 3-candidate regenerate flow.
 * Two phases: "regenerating" (placeholder shows "Regenerating...") then
 * "picker" (3-card modal opens when user clicks "Select Image").
 * Svelte 5 module-level runes state.
 */

/** @typedef {{ url: string, metadata: any, signature_color: string | null }} Candidate */

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

export const imageRegenerate = {
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
 * until deliverCandidates() is called.
 * @param {string} key — `${log_id}:${attach_idx}`
 * @param {{ on_select: (c: Candidate, index: number) => void, signature_color?: string | null }} opts
 */
export function startRegenerate(key, opts) {
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
 */
export function deliverCandidates(candidates) {
  state.candidates = candidates;
  state.candidates_ready = true;
  state.error = null;
}

/**
 * Opens the 3-card picker modal. Only works if candidates are ready.
 */
export function openPicker() {
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
export function selectCandidate(index) {
  if (index < 0 || index >= state.candidates.length) return;
  state.selected_index = index;
  const candidate = state.candidates[index];
  if (typeof state.on_select === "function") {
    state.on_select(candidate, index);
  }
  setTimeout(() => closeRegenerate(), 400);
}

/**
 * Closes the picker modal but keeps regenerate state (for re-opening).
 */
export function closePicker() {
  state.picker_open = false;
  state.selected_index = null;
}

/**
 * Clears all regenerate state entirely.
 */
export function closeRegenerate() {
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
export function setRegenerateError(msg) {
  state.error = msg;
  state.candidates_ready = false;
}
