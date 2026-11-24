/**
 * @file src/ui/organisms/ImagePreview.svelte.js
 * Reactive lightbox preview and 3-candidate image regeneration picker controller.
 */
import { generate_image_candidates, refine_image_prompt } from "@engine";
import { session } from "@state";

/** @typedef {{ url: string, metadata: any, signature_color: string | null }} Candidate */

let _request_id = 0;
let _last_story_id = null;
let _reset_queued = false;
let _persisted_prompt = "";
let _persisted_negative = "";

let preview_state = $state({
  active: false,
  src: /** @type {string | null} */ (null),
  canvas: /** @type {HTMLCanvasElement | null} */ (null),
  caption: "",
  metadata: /** @type {any} */ (null),
  on_regenerate: /** @type {Function | null} */ (null),
  on_delete: /** @type {Function | null} */ (null),
});

let picker_state = $state({
  regenerating_key: /** @type {string | null} */ (null),
  candidates_ready: false,
  candidates: /** @type {Candidate[]} */ ([]),
  picker_open: false,
  selected_index: /** @type {number | null} */ (null),
  on_select: /** @type {((c: Candidate, index: number) => void) | null} */ (null),
  signature_color: /** @type {string | null} */ (null),
  error: /** @type {string | null} */ (null),
  last_mode: "character",
  request_id: 0,
});

function is_story_stale() {
  const current_id = session?.active_id ?? null;
  return _last_story_id !== null && current_id !== _last_story_id;
}

/** Deferred cleanup for getter reads - avoids Svelte 5 state_unsafe_mutation during render. */
function schedule_story_reset() {
  if (_reset_queued) return;
  _reset_queued = true;
  queueMicrotask(() => {
    _reset_queued = false;
    check_story_reset();
  });
}

function check_story_reset() {
  const current_id = session?.active_id ?? null;
  if (_last_story_id !== null && current_id !== _last_story_id) {
    close_image_preview();
    close_regenerate();
  }
  _last_story_id = current_id;
}

export const image_preview = {
  get active() {
    if (is_story_stale()) {
      schedule_story_reset();
      return false;
    }
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
};

export function open_image_preview(options, caption = "") {
  check_story_reset();
  const opts = typeof options === "string" ? { src: options, caption } : options || {};
  preview_state.active = true;
  preview_state.src = opts.src || null;
  preview_state.canvas = opts.canvas || null;
  preview_state.caption = opts.caption || caption || "";
  preview_state.metadata = opts.metadata || null;
  preview_state.on_regenerate = opts.on_regenerate || null;
  preview_state.on_delete = opts.on_delete || null;
}

export function close_image_preview() {
  preview_state.active = false;
}

export const image_picker = {
  get regenerating_key() {
    if (is_story_stale()) {
      schedule_story_reset();
      return null;
    }
    return picker_state.regenerating_key;
  },
  get candidates_ready() {
    return picker_state.candidates_ready;
  },
  get candidates() {
    return picker_state.candidates;
  },
  get picker_open() {
    if (is_story_stale()) {
      schedule_story_reset();
      return false;
    }
    return picker_state.picker_open;
  },
  get selected_index() {
    return picker_state.selected_index;
  },
  get error() {
    return picker_state.error;
  },
  get last_mode() {
    return picker_state.last_mode;
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
    return picker_state.regenerating_key === key && Boolean(picker_state.error);
  },
};

export function open_picker() {
  if (picker_state.candidates_ready && picker_state.candidates.length >= 2) {
    picker_state.picker_open = true;
    picker_state.selected_index = null;
  }
}

export function select_candidate(index) {
  if (picker_state.selected_index !== null || index < 0 || index >= picker_state.candidates.length) return;
  picker_state.selected_index = index;
  const req_id = picker_state.request_id;
  const candidate = picker_state.candidates[index];
  picker_state.on_select?.(candidate, index);
  setTimeout(() => {
    if (picker_state.request_id === req_id) close_regenerate();
  }, 400);
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
  const mode = options.mode || (in_picker ? picker_state.last_mode : "story_character");
  const prompt = options.prompt ?? (in_picker ? _persisted_prompt : "");
  const negative_prompt = options.negative_prompt ?? (in_picker ? _persisted_negative : "");

  if (in_picker) {
    const first_meta = picker_state.candidates[0]?.metadata;
    if (first_meta?.prompt && !_persisted_prompt) {
      _persisted_prompt = first_meta.prompt;
      picker_state.last_mode = first_meta.mode || picker_state.last_mode;
      _persisted_negative = first_meta.negative_prompt || _persisted_negative;
    }
    picker_state.candidates_ready = false;
    picker_state.candidates = [];
    picker_state.selected_index = null;
    picker_state.error = null;
    picker_state.request_id = current_req;
  } else if (key) {
    picker_state.regenerating_key = key;
    picker_state.candidates_ready = false;
    picker_state.candidates = [];
    picker_state.picker_open = false;
    picker_state.selected_index = null;
    picker_state.on_select = options.on_select ?? null;
    picker_state.signature_color = signature_color ?? null;
    picker_state.error = null;
    picker_state.request_id = current_req;
  }

  if (!prompt) {
    set_regenerate_error("No prompt found for this image. Cannot regenerate.");
    return;
  }

  try {
    let final_prompt = prompt;
    let final_negative = negative_prompt;

    const is_unrefined = prompt.length < 30 || prompt.includes("<image_prompt>") || prompt.startsWith("RAW photograph or structured artistic rendering of");
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
        if (in_picker) console.warn("[ImagePreview] Prompt envision refinement failed, using original prompt:", envision_err);
      }
    }

    const candidates = await generate_image_candidates(final_prompt, { mode, negative_prompt: final_negative, count: 3, min_success: 2 });
    if (current_req !== _request_id) return;

    if (candidates.length < 2) {
      set_regenerate_error("Not enough images generated. Please try again.");
      return;
    }

    picker_state.candidates = candidates.map((c) => ({ url: c.url, metadata: { ...c.metadata, prompt: final_prompt, mode }, signature_color }));
    picker_state.candidates_ready = true;
    picker_state.error = null;
    _persisted_prompt = final_prompt;
    picker_state.last_mode = mode;
    _persisted_negative = final_negative;
  } catch (err) {
    if (current_req !== _request_id) return;
    console.error("[Regenerate Error]", err);
    set_regenerate_error(`Regenerate failed: ${err.message || err}`);
  }
}

export async function regenerate_image(ctx) {
  const { prompt, negative_prompt, mode = "story_character", log_id, attach_idx = 0, signature_color, regenerate_count = 0 } = ctx;
  await run_image_regeneration({
    key: `${log_id}:${attach_idx}`,
    prompt,
    negative_prompt,
    mode,
    signature_color,
    regenerate_count,
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
