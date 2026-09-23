/**
 * src/utils/ui-helpers.js
 * 🛠️ UI & CSS COMPUTED RESOLUTION ENGINE
 *
 * Core Responsibilities:
 * - Dynamic CSS Token Resolution: Evaluates raw variables (`--token`), `var(--token)`, `calc()`,
 *   and relative units (`rem`, `ms`, `s`) into typed computed values (pixels, ms, unitless, strings).
 * - Browser Blob Downloads (`download_text_file`, `download_json_file`): Generates temporary object URLs,
 *   simulates anchor clicks, and cleans up object URLs after download.
 * - Guarded View Transitions (`guarded_transition`): Provides single-flight lock protection around
 *   `document.startViewTransition()`, with synchronous fallback when transitions are active or unsupported.
 *
 * Exports:
 * - `resolve_px(value, fallback?, context?)` — Resolves CSS value → pixel number.
 * - `resolve_ms(value, fallback?, context?)` — Resolves CSS duration → millisecond number.
 * - `resolve_number(value, fallback?, context?)` — Resolves CSS unitless value → number.
 * - `resolve_string(value, fallback?, context?)` — Resolves CSS variable → raw string.
 * - `download_text_file(filename, text, mime?)` — Downloads a text blob.
 * - `download_json_file(filename, value)` — Downloads a JSON blob.
 * - `guarded_transition(callback, options?)` — Single-flight view transition wrapper.
 *
 * Consumed by:
 * - `src/state/interface.svelte.js` (View transition navigation & layout measuring).
 * - `src/ui/entity/EntityCard.svelte` (Transition animations).
 * - `src/ui/story/StoryManager.svelte` (Story export downloads).
 * - `src/ui/motion/kinetic.svelte.js` (WAAPI animation timing & spring physics parameters).
 * - `src/ui/primitives/Dialog.svelte` (Transition duration tokens).
 */

// ============================================================================
// [SECTION 1: PRIVATE CSS VARIABLE TRAVERSAL HELPER]
// ============================================================================

/**
 * Walks the element tree upward resolving a single CSS custom property name.
 * Falls back to `.style` directly for JSDOM environments where `getComputedStyle`
 * does not surface inline custom properties.
 *
 * @param {string} var_name - The CSS custom property name (e.g. `"--my-token"`).
 * @param {HTMLElement | null} context - Starting element (defaults to `document.body`).
 * @returns {string} The resolved raw string value, or `""` if not found.
 */
function _resolve_css_var(var_name, context) {
  if (typeof window === "undefined" || typeof document === "undefined") return "";
  const target_el = context || document.body || document.documentElement;
  try {
    let cur = target_el;
    while (cur) {
      const computed = window.getComputedStyle(cur).getPropertyValue(var_name).trim();
      if (computed !== "") return computed;
      const inline = /** @type {HTMLElement} */ (cur).style?.getPropertyValue?.(var_name)?.trim() ?? "";
      if (inline !== "") return inline;
      cur = cur.parentElement;
    }
  } catch (_) {
    // Fall through
  }
  return "";
}

// ============================================================================
// [SECTION 2: TYPED CSS RESOLVERS]
// ============================================================================

/**
 * Resolves a CSS value (numeric, px string, rem string, calc, or CSS variable) to a pixel number.
 * Reads computed styles directly without injecting temporary measurement DOM nodes.
 *
 * @param {string | number | undefined} value - The CSS value, variable name (`--name`), or `var(--name)`.
 * @param {number} [fallback=0] - Fallback value if resolution fails.
 * @param {HTMLElement | null} [context=null] - Optional element context for variable resolution.
 * @returns {number} Resolved pixel number.
 */
export function resolve_px(value, fallback = 0, context = null) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return Number.isNaN(value) ? fallback : value;

  const raw = String(value).trim();
  if (!raw) return fallback;

  // 1. Direct numeric or px match (e.g. "20", "20px", "-5.5px")
  const px_match = raw.match(/^([-.\d]+)(?:px)?$/);
  if (px_match) {
    const num = parseFloat(px_match[1]);
    return Number.isNaN(num) ? fallback : num;
  }

  // 2. Direct rem match (1rem = root font-size or 16px baseline)
  const rem_match = raw.match(/^([-.\d]+)rem$/);
  if (rem_match) {
    const rem = parseFloat(rem_match[1]);
    if (Number.isNaN(rem)) return fallback;
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const root_font = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
      return rem * (Number.isNaN(root_font) || root_font <= 0 ? 16 : root_font);
    }
    return rem * 16;
  }

  // 3. Variable resolution: bare "--token" or "var(--token, fallback)"
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    let var_name = "";
    let var_fallback = "";

    if (raw.startsWith("--")) {
      var_name = raw;
    } else {
      const var_match = raw.match(/^var\((--[^,)]+)(?:,\s*([^)]+))?\)$/);
      if (var_match) {
        var_name = var_match[1].trim();
        var_fallback = var_match[2]?.trim() || "";
      }
    }

    if (var_name) {
      const resolved = _resolve_css_var(var_name, context);
      if (resolved) return resolve_px(resolved, fallback, context);
      if (var_fallback) return resolve_px(var_fallback, fallback, context);
    }

    // 4. Simple calc() evaluation (e.g. calc(10px + 5px), calc(var(--a) + var(--b)))
    // NOTE: Operators MUST be whitespace-delimited per CSS spec (avoids splitting on hyphens in var names).
    if (raw.startsWith("calc(") && raw.endsWith(")")) {
      const inner = raw.slice(5, -1).trim();
      const additive_match = inner.match(/^(.+?)\s+([+-])\s+(.+)$/);
      if (additive_match) {
        const left = resolve_px(additive_match[1].trim(), NaN, context);
        const op = additive_match[2];
        const right = resolve_px(additive_match[3].trim(), NaN, context);
        if (!Number.isNaN(left) && !Number.isNaN(right)) {
          return op === "+" ? left + right : left - right;
        }
      }
      const mult_match = inner.match(/^(.+?)\s*([*/])\s*(.+)$/);
      if (mult_match) {
        const left = resolve_px(mult_match[1].trim(), NaN, context);
        const op = mult_match[2];
        const right = parseFloat(mult_match[3]);
        if (!Number.isNaN(left) && !Number.isNaN(right)) {
          return op === "*" ? left * right : right !== 0 ? left / right : fallback;
        }
      }
    }
  }

  return fallback;
}

/**
 * Resolves a CSS duration value (`ms` / `s` string, or CSS variable) to milliseconds.
 * Rejects unitless non-zero numbers as ambiguous — only `0`, `Nms`, or `Ns` are valid.
 *
 * @param {string | number | undefined} value - The CSS duration, variable name, or `var(--name)`.
 * @param {number} [fallback=0] - Fallback value if resolution fails.
 * @param {HTMLElement | null} [context=null] - Optional element context for variable resolution.
 * @returns {number} Resolved duration in milliseconds.
 */
export function resolve_ms(value, fallback = 0, context = null) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return Number.isNaN(value) ? fallback : value;

  const raw = String(value).trim();
  if (!raw) return fallback;

  // Direct ms (e.g. "200ms", "0ms")
  const ms_match = raw.match(/^([-.\d]+)ms$/);
  if (ms_match) {
    const num = parseFloat(ms_match[1]);
    return Number.isNaN(num) ? fallback : num;
  }

  // Direct seconds (e.g. "1s", "0.5s")
  const s_match = raw.match(/^([-.\d]+)s$/);
  if (s_match) {
    const num = parseFloat(s_match[1]);
    return Number.isNaN(num) ? fallback : num * 1000;
  }

  // Zero without unit is unambiguously 0ms
  if (raw === "0") return 0;

  // Variable resolution: bare "--token" or "var(--token, fallback)"
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    let var_name = "";
    let var_fallback = "";

    if (raw.startsWith("--")) {
      var_name = raw;
    } else {
      const var_match = raw.match(/^var\((--[^,)]+)(?:,\s*([^)]+))?\)$/);
      if (var_match) {
        var_name = var_match[1].trim();
        var_fallback = var_match[2]?.trim() || "";
      }
    }

    if (var_name) {
      const resolved = _resolve_css_var(var_name, context);
      if (resolved) return resolve_ms(resolved, fallback, context);
      if (var_fallback) return resolve_ms(var_fallback, fallback, context);
    }
  }

  return fallback;
}

/**
 * Resolves a CSS value (unitless number or CSS variable) to a plain number.
 * Rejects values with units — use `resolve_px` or `resolve_ms` for those.
 *
 * @param {string | number | undefined} value - The CSS unitless value, variable name, or `var(--name)`.
 * @param {number} [fallback=0] - Fallback value if resolution fails.
 * @param {HTMLElement | null} [context=null] - Optional element context for variable resolution.
 * @returns {number} Resolved unitless number.
 */
export function resolve_number(value, fallback = 0, context = null) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return Number.isNaN(value) ? fallback : value;

  const raw = String(value).trim();
  if (!raw) return fallback;

  // Direct unitless numeric (rejects anything with a unit suffix like px, ms, rem)
  if (/^[-.\d]+$/.test(raw)) {
    const num = parseFloat(raw);
    return Number.isNaN(num) ? fallback : num;
  }

  // Variable resolution: bare "--token" or "var(--token, fallback)"
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    let var_name = "";
    let var_fallback = "";

    if (raw.startsWith("--")) {
      var_name = raw;
    } else {
      const var_match = raw.match(/^var\((--[^,)]+)(?:,\s*([^)]+))?\)$/);
      if (var_match) {
        var_name = var_match[1].trim();
        var_fallback = var_match[2]?.trim() || "";
      }
    }

    if (var_name) {
      const resolved = _resolve_css_var(var_name, context);
      if (resolved) return resolve_number(resolved, fallback, context);
      if (var_fallback) return resolve_number(var_fallback, fallback, context);
    }
  }

  return fallback;
}

/**
 * Resolves a CSS variable to its raw string value without any unit conversion.
 * Returns the trimmed value directly, or literal string passthrough for non-variable inputs.
 *
 * @param {string | undefined} value - The CSS variable name (`--name`), `var(--name)`, or literal string.
 * @param {string} [fallback=""] - Fallback string if resolution fails.
 * @param {HTMLElement | null} [context=null] - Optional element context for variable resolution.
 * @returns {string} Resolved string value.
 */
export function resolve_string(value, fallback = "", context = null) {
  if (value === undefined || value === null) return fallback;

  const raw = String(value).trim();
  if (!raw) return fallback;

  // Variable resolution: bare "--token" or "var(--token, fallback)"
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    let var_name = "";
    let var_fallback = "";

    if (raw.startsWith("--")) {
      var_name = raw;
    } else {
      const var_match = raw.match(/^var\((--[^,)]+)(?:,\s*([^)]+))?\)$/);
      if (var_match) {
        var_name = var_match[1].trim();
        var_fallback = var_match[2]?.trim() || "";
      }
    }

    if (var_name) {
      const resolved = _resolve_css_var(var_name, context);
      if (resolved) return resolved;
      if (var_fallback) return var_fallback;
      return fallback;
    }
  }

  // Literal string passthrough
  return raw || fallback;
}

// ============================================================================
// [SECTION 3: BROWSER DOWNLOAD UTILITIES]
// ============================================================================

/**
 * Triggers a browser download of a Blob or string payload.
 * Returns false outside of browser DOM environments.
 * @param {string} filename - Target file name.
 * @param {string | Blob} content - File payload.
 * @param {string} [mime="application/octet-stream"] - MIME type.
 * @returns {boolean} True if download was initiated.
 */
const download_blob = (filename, content, mime = "application/octet-stream") => {
  if (typeof document === "undefined") return false;
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
};

/**
 * Downloads a text payload as a local file.
 * @param {string} filename - Output file name.
 * @param {string} text - Text content.
 * @param {string} [mime="text/plain;charset=utf-8"] - MIME type.
 * @returns {boolean}
 */
export const download_text_file = (filename, text, mime = "text/plain;charset=utf-8") => download_blob(filename, text, mime);

/**
 * Downloads a JSON-serializable value as an indented `.json` file.
 * @param {string} filename - Output file name.
 * @param {any} value - Value to serialize.
 * @returns {boolean}
 */
export const download_json_file = (filename, value) => download_blob(filename, JSON.stringify(value, null, 2), "application/json;charset=utf-8");

// ============================================================================
// [SECTION 4: GUARDED VIEW TRANSITION PIPELINE]
// ============================================================================

/**
 * @typedef {Object} TransitionOptions
 * @property {string} [className] - Optional CSS class applied to document root during transition.
 */

/** @type {{ active: boolean }} */
const _transition_state = { active: false };

/**
 * Safely wraps `document.startViewTransition()` with a single-flight concurrency guard.
 * If View Transitions API is unavailable or a transition is already in progress,
 * the callback executes synchronously with instant DOM updates.
 *
 * @param {() => void | Promise<void>} callback - DOM mutation callback to animate.
 * @param {TransitionOptions} [options={}] - Transition configuration.
 * @returns {Promise<any>}
 */
export function guarded_transition(callback, options = {}) {
  // Graceful fallback: no API or already active → run synchronously
  if (typeof document === "undefined" || !document.startViewTransition || _transition_state.active) {
    callback();
    return Promise.resolve();
  }

  _transition_state.active = true;

  if (options.className) {
    document.documentElement.classList.add(options.className);
  }

  const transition = document.startViewTransition(async () => {
    try {
      await callback();
    } catch (err) {
      console.error("[TransitionGuard] Callback error during view transition:", err);
    }
  });

  // Always release the lock when the transition settles
  const done_promise = transition.finished.finally(() => {
    if (options.className) {
      document.documentElement.classList.remove(options.className);
    }
    _transition_state.active = false;
  });

  // Suppress transition lifecycle promise rejections (e.g. AbortError on fast user navigation)
  transition.finished.catch(() => {});
  transition.ready.catch(() => {});
  transition.updateCallbackDone.catch(() => {});

  return done_promise;
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-09-24 (rev 2): Restored resolve_ms, resolve_number, resolve_string — they are live consumers
 *   in kinetic.svelte.js (WAAPI timing) and Dialog.svelte (transition duration). Extracted private
 *   _resolve_css_var helper so the DOM traversal loop is defined once and shared by all four typed resolvers.
 * - 2026-09-24 (rev 1): Pruned heavy invisible measurement element harness. Simplified resolve_px to
 *   compute directly via getComputedStyle without injecting DOM nodes.
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured 5 clear section dividers, added typed JSDoc schemas (ResolveSpec, TransitionOptions),
 *   and verified 100% test pass.
 * - 2026-06-15: Initial UI helpers implementation for CSS resolution, file downloads, and view transitions.
 */
