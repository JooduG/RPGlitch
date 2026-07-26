/**
 * @file image-reroll.svelte.js
 * 🎲 Image Reroll State — manages the 3-candidate reroll flow.
 * Svelte 5 module-level runes state.
 */

/** @typedef {{ url: string, metadata: any, signature_color: string | null }} Candidate */

/**
 * @typedef {Object} RerollContext
 * @property {((c: Candidate, index: number) => void) | null} on_select
 * @property {string | null} signature_color
 */

/** @type {{ reroll_log_id: any, reroll_attach_idx: number | null, reroll_status: "rerolling" | "select_ready" | null, candidates: Candidate[], reroll_context: RerollContext | null, picker_active: boolean, selected_index: number | null, error: string | null }} */
let state = $state({
  reroll_log_id: null,
  reroll_attach_idx: null,
  reroll_status: null,
  candidates: [],
  reroll_context: null,
  picker_active: false,
  selected_index: null,
  error: null,
});

export const imageReroll = {
  get reroll_log_id() {
    return state.reroll_log_id;
  },
  get reroll_attach_idx() {
    return state.reroll_attach_idx;
  },
  get reroll_status() {
    return state.reroll_status;
  },
  get candidates() {
    return state.candidates;
  },
  get picker_active() {
    return state.picker_active;
  },
  get selected_index() {
    return state.selected_index;
  },
  get error() {
    return state.error;
  },
};

/**
 * Starts a reroll for a specific attachment — marks it as "rerolling".
 * @param {string | number} log_id
 * @param {number} attach_idx
 * @param {RerollContext & { signature_color?: string | null }} context
 */
export function start_reroll(log_id, attach_idx, context) {
  state.reroll_log_id = log_id;
  state.reroll_attach_idx = attach_idx;
  state.reroll_status = "rerolling";
  state.candidates = [];
  state.reroll_context = context;
  state.error = null;
  state.picker_active = false;
  state.selected_index = null;
}

/**
 * Delivers the generated candidates and marks the attachment as select-ready.
 * @param {Candidate[]} candidates
 */
export function deliver_reroll_candidates(candidates) {
  state.candidates = candidates;
  state.reroll_status = "select_ready";
  state.error = null;
}

/**
 * Opens the 3-card picker modal (candidates must already be delivered).
 */
export function open_reroll_picker() {
  state.picker_active = true;
  state.selected_index = null;
}

/**
 * Marks a candidate as selected (for visual feedback) then closes after a brief delay.
 * The actual on_select callback fires immediately.
 * @param {number} index
 */
export function select_reroll_candidate(index) {
  if (index < 0 || index >= state.candidates.length) return;
  state.selected_index = index;
  const candidate = state.candidates[index];
  const ctx = state.reroll_context;
  if (ctx && typeof ctx.on_select === "function") {
    ctx.on_select(candidate, index);
  }
  setTimeout(() => {
    clear_reroll();
  }, 400);
}

/**
 * Closes the picker modal (without selecting). Reroll state is preserved
 * so the user can reopen the picker via the "Select Image" button.
 */
export function close_reroll_picker() {
  state.picker_active = false;
  state.selected_index = null;
}

/**
 * Clears all reroll state (after selection or cancellation).
 */
export function clear_reroll() {
  state.reroll_log_id = null;
  state.reroll_attach_idx = null;
  state.reroll_status = null;
  state.candidates = [];
  state.reroll_context = null;
  state.picker_active = false;
  state.selected_index = null;
  state.error = null;
}

/**
 * Reports an error in the reroll flow.
 * @param {string} msg
 */
export function set_reroll_error(msg) {
  state.error = msg;
  state.reroll_status = null;
}
