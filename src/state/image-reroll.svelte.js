/**
 * @file image-reroll.svelte.js
 * 🎲 Image Reroll State — manages the 3-candidate reroll picker.
 * Svelte 5 module-level runes state.
 */

/** @typedef {{ url: string, metadata: any, signature_color: string | null }} Candidate */

/** @type {{ active: boolean, loading: boolean, candidates: Candidate[], selected_index: number | null, on_select: ((c: Candidate, index: number) => void) | null, signature_color: string | null, error: string | null }} */
let state = $state({
  active: false,
  loading: false,
  candidates: [],
  selected_index: null,
  on_select: null,
  signature_color: null,
  error: null,
});

export const imageReroll = {
  get active() {
    return state.active;
  },
  get loading() {
    return state.loading;
  },
  get candidates() {
    return state.candidates;
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
};

/**
 * Opens the reroll picker in loading state.
 * @param {{ on_select: (c: Candidate, index: number) => void, signature_color?: string | null }} opts
 */
export function openRerollPicker(opts) {
  state.active = true;
  state.loading = true;
  state.candidates = [];
  state.selected_index = null;
  state.on_select = opts.on_select ?? null;
  state.signature_color = opts.signature_color ?? null;
  state.error = null;
}

/**
 * Delivers the generated candidates to the picker.
 * @param {Candidate[]} candidates
 */
export function deliverCandidates(candidates) {
  state.candidates = candidates;
  state.loading = false;
  state.error = null;
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
  setTimeout(() => closeRerollPicker(), 400);
}

/**
 * Closes the reroll picker immediately.
 */
export function closeRerollPicker() {
  state.active = false;
  state.loading = false;
  state.candidates = [];
  state.selected_index = null;
  state.on_select = null;
  state.error = null;
}

/**
 * Reports an error to the picker.
 * @param {string} msg
 */
export function setRerollError(msg) {
  state.error = msg;
  state.loading = false;
}
