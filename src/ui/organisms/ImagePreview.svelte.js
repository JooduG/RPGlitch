/**
 * @file src/ui/organisms/ImagePreview.svelte.js
 * Reactive lightbox preview and 3-candidate image regeneration picker controller.
 */

import { generate_image_candidates, refine_image_prompt } from "@engine";
import { session } from "@state";

/** @typedef {{ url: string, metadata: any, signature_color: string | null }} Candidate */

let _request_id = 0;
let _last_story_id = null;

function check_story_reset() {
  const current_id = session?.active_id ?? null;
  if (_last_story_id !== null && current_id !== _last_story_id) {
    close_image_preview();
    close_regenerate();
  }
  _last_story_id = current_id;
}

let preview_state = $state({
  active: false,
  src: /** @type {string | null} */ (null),
  canvas: /** @type {HTMLCanvasElement | null} */ (null),
  caption: "",
  metadata: /** @type {any} */ (null),
  on_regenerate: /** @type {Function | null} */ (null),
  on_delete: /** @type {Function | null} */ (null),
  signature_color: /** @type {string | null} */ (null),
});

export const image_preview = {
  get active() {
    check_story_reset();
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

export function open_image_preview(options, caption = "") {
  check_story_reset();
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
}

export function close_image_preview() {
  preview_state.active = false;
}

// --- REGENERATION CANDIDATES & PICKER STATE ---
let _persisted_prompt = "";
let _persisted_mode = "character";
let _persisted_negative = "";

let picker_state = $state({
  regenerating_key: /** @type {string | null} */ (null),
  candidates_ready: false,
  candidates: /** @type {Candidate[]} */ ([]),
  picker_open: false,
  selected_index: /** @type {number | null} */ (null),
  on_select: /** @type {((c: Candidate, index: number) => void) | null} */ (null),
  signature_color: /** @type {string | null} */ (null),
  error: /** @type {string | null} */ (null),
  request_id: 0,
});

export const image_picker = {
  get regenerating_key() {
    check_story_reset();
    return picker_state.regenerating_key;
  },
  get candidates_ready() {
    return picker_state.candidates_ready;
  },
  get candidates() {
    return picker_state.candidates;
  },
  get picker_open() {
    check_story_reset();
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
  get last_mode() {
    return _persisted_mode;
  },
  get request_id() {
    return picker_state.request_id;
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

function start_regenerate(key, opts, req_id) {
  picker_state.regenerating_key = key;
  picker_state.candidates_ready = false;
  picker_state.candidates = [];
  picker_state.picker_open = false;
  picker_state.selected_index = null;
  picker_state.on_select = opts.on_select ?? null;
  picker_state.signature_color = opts.signature_color ?? null;
  picker_state.error = null;
  picker_state.request_id = req_id;
}

function deliver_candidates(candidates, meta) {
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

function begin_picker_regeneration(req_id) {
  if (picker_state.candidates.length > 0 && picker_state.candidates[0]?.metadata?.prompt && !_persisted_prompt) {
    _persisted_prompt = picker_state.candidates[0].metadata.prompt;
    _persisted_mode = picker_state.candidates[0].metadata.mode || _persisted_mode;
    _persisted_negative = picker_state.candidates[0].metadata.negative_prompt || _persisted_negative;
  }
  picker_state.candidates_ready = false;
  picker_state.candidates = [];
  picker_state.selected_index = null;
  picker_state.error = null;
  picker_state.request_id = req_id;
}

export function close_regenerate() {
  _request_id += 1;
  picker_state.regenerating_key = null;
  picker_state.candidates_ready = false;
  picker_state.candidates = [];
  picker_state.picker_open = false;
  picker_state.selected_index = null;
  picker_state.on_select = null;
  picker_state.signature_color = null;
  picker_state.error = null;
  picker_state.request_id = _request_id;
}

function set_regenerate_error(msg) {
  picker_state.error = msg;
  picker_state.candidates_ready = false;
}

export async function run_image_regeneration(options = {}) {
  check_story_reset();
  const { in_picker = false } = options;

  const key = options.key || picker_state.regenerating_key;
  if (!key && !in_picker) {
    set_regenerate_error("No image context available to regenerate.");
    return;
  }

  _request_id += 1;
  const current_req = _request_id;

  const signature_color = options.signature_color ?? picker_state.signature_color;
  const regenerate_count = options.regenerate_count ?? 0;
  const mode = options.mode || (in_picker ? _persisted_mode : "story_character");
  const prompt = options.prompt ?? (in_picker ? _persisted_prompt : "");
  const negative_prompt = options.negative_prompt ?? (in_picker ? _persisted_negative : "");

  if (in_picker) {
    begin_picker_regeneration(current_req);
  } else if (key) {
    start_regenerate(key, { signature_color, on_select: options.on_select || (() => {}) }, current_req);
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

    const refiner = typeof options.refine_prompt === "function" ? options.refine_prompt : refine_image_prompt;
    if ((in_picker || regenerate_count >= 1 || is_unrefined) && typeof refiner === "function") {
      try {
        const refined = await refiner(prompt, mode);
        if (current_req !== _request_id) return;
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

    const candidates = await generate_image_candidates(final_prompt, { mode, negative_prompt: final_negative, count: 3, min_success: 2 });
    if (current_req !== _request_id) return;

    if (candidates.length < 2) {
      set_regenerate_error("Not enough images generated. Please try again.");
      return;
    }

    deliver_candidates(
      candidates.map((c) => ({ url: c.url, metadata: { ...c.metadata, prompt: final_prompt, mode }, signature_color })),
      { prompt: final_prompt, mode, negative_prompt: final_negative },
    );
  } catch (err) {
    if (current_req !== _request_id) return;
    console.error("[Regenerate Error]", err);
    set_regenerate_error(`Regenerate failed: ${err.message || err}`);
  }
}

/**
 * Regenerate orchestration - generates 3 candidates in the background and updates log attachment on select.
 * @param {{ prompt: string, negative_prompt?: string, mode?: string, log_id?: string|number, attach_idx?: number, signature_color?: string, regenerate_count?: number }} ctx
 */
export async function regenerate_image(ctx) {
  const { prompt, negative_prompt, mode = "story_character", log_id, attach_idx = 0, signature_color, regenerate_count = 0 } = ctx;
  const key = `${log_id}:${attach_idx}`;

  await run_image_regeneration({
    key,
    prompt,
    negative_prompt,
    mode,
    signature_color,
    regenerate_count,
    refine_prompt: refine_image_prompt,
    on_select: (candidate) => {
      if (log_id) {
        session.update_attachment(String(log_id), attach_idx, {
          src: candidate.url,
          metadata: { ...candidate.metadata, regenerate_count: regenerate_count + 1 },
        });
      }
    },
  });
}
