/**
 * src/utils/ui-helpers.js
 * 🛠️ UI & CSS COMPUTED RESOLUTION ENGINE
 *
 * Core Responsibilities:
 * - Dynamic CSS Token Resolution: Evaluates raw variables (`--token`), `var(--token)`, `calc()`,
 *   and relative units (`rem`, `em`, `s`, `ms`) into computed numbers, pixels, milliseconds, or strings.
 * - Measurement Element Pipeline (`#shared-measure-el`): Injects an invisible measurement element into the DOM
 *   to allow the browser's native CSS engine to evaluate computed styles with sentinels for failure detection.
 * - Browser Blob Downloads (`download_text_file`, `download_json_file`): Generates temporary object URLs, simulates
 *   anchor clicks, and cleans up object URLs after download.
 * - Guarded View Transitions (`guarded_transition`): Provides single-flight lock protection around
 *   `document.startViewTransition()`, with synchronous fallback when transitions are active or unsupported.
 *
 * Consumed by:
 * - `src/state/app-store.svelte.js` (View transition navigation & layout measuring).
 * - `src/ui/entity/EntityCard.svelte` (Transition animations).
 * - `src/ui/story/StoryManager.svelte` (Story export downloads).
 */

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & SPEC TYPES]
// ============================================================================

/**
 * @typedef {Object} ResolveSpec
 * @property {string} prop - The CSS property to probe on the measure element.
 * @property {string} sentinel - Sentinel value injected to detect resolution failure.
 * @property {(computed: string) => (number | string | null)} parseComputed - Parses browser computed value into target type.
 * @property {(raw: string) => (number | string | null)} parseDirect - Parses raw non-variable input string directly.
 * @property {(direct: string) => (number | string | null)} parseResolvedVar - Parses value resolved from a CSS variable.
 */

/**
 * @typedef {Object} TransitionOptions
 * @property {string} [className] - Optional CSS class applied to document root during transition.
 */

// ============================================================================
// [SECTION 2: COMPUTED STYLE RESOLUTION & MEASUREMENT]
// ============================================================================

/**
 * Prepares a CSS value for measurement, wrapping raw variables in var().
 * @param {string | number} value
 * @returns {string}
 */
function get_css_value(value) {
  const trimmed = String(value).trim();
  return trimmed.startsWith("--") ? `var(${trimmed})` : trimmed;
}

/**
 * Tries to resolve a variable directly from a context element's computed style.
 * @param {string} trimmed - Trimmed variable name or var() expression.
 * @param {HTMLElement | null} context - Element context.
 * @returns {string | null} Resolved variable value, or null.
 */
function try_direct_var_resolve(trimmed, context) {
  if (!context || typeof window === "undefined") return null;

  const is_var = trimmed.startsWith("--") || (trimmed.startsWith("var(") && trimmed.endsWith(")"));
  if (!is_var) return null;

  const var_name = trimmed.startsWith("--") ? trimmed : trimmed.slice(4, -1).trim();
  if (var_name.includes(",")) return null; // Skip complex fallbacks for fast path

  try {
    return window.getComputedStyle(context).getPropertyValue(var_name).trim();
  } catch (_) {
    return null;
  }
}

/** @type {HTMLElement | null} */
let shared_measure_el = null;

/**
 * Ensures the shared measurement element exists in the DOM and is parented correctly.
 * @param {HTMLElement | null} [context=null] - Optional element context for parenting.
 * @returns {HTMLElement | null}
 */
function get_measure_el(context = null) {
  if (typeof document === "undefined") return null;

  if (!shared_measure_el) {
    shared_measure_el = document.createElement("div");
    shared_measure_el.id = "shared-measure-el";
    shared_measure_el.style.position = "absolute";
    shared_measure_el.style.visibility = "hidden";
    shared_measure_el.style.pointerEvents = "none";
    shared_measure_el.style.zIndex = "-9999";
    shared_measure_el.style.display = "flex";
    document.body.appendChild(shared_measure_el);
  }

  const can_accept_children =
    context &&
    context.nodeType === 1 &&
    !/^(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr|textarea|template|svg)$/i.test(context.tagName);
  const target_parent = can_accept_children ? context : document.body;
  if (shared_measure_el.parentElement !== target_parent) {
    target_parent.appendChild(shared_measure_el);
  }

  return shared_measure_el;
}

/**
 * Prepares the measurement element with a value and sentinel for failure detection.
 * @param {string} value
 * @param {string} prop
 * @param {string} sentinel
 * @param {HTMLElement | null} context
 * @returns {HTMLElement | null}
 */
function prepare_measure(value, prop, sentinel, context) {
  const el = get_measure_el(context);
  if (!el) return null;

  const css_value = get_css_value(value);
  if (typeof el.dataset !== "undefined") {
    el.dataset.resolveValue = css_value;
  }

  // 1. Proxy resolution to detect valid vs invalid variables (handles 0 vs undefined)
  el.style.setProperty("--proxy", "SENTINEL");
  el.style.setProperty("--proxy", css_value);
  const resolved = window.getComputedStyle(el).getPropertyValue("--proxy").trim();

  // If it stayed at SENTINEL, the browser rejected the value.
  // If it became empty string, it was a var() that resolved to nothing.
  if (resolved === "SENTINEL" || (resolved === "" && css_value !== "")) {
    return null;
  }

  // 2. Set actual property for unit resolution (e.g. rem -> px)
  /** @type {any} */ (el.style)[prop] = sentinel;
  /** @type {any} */ (el.style)[prop] = css_value;

  return el;
}

/**
 * Core CSS-value resolver shared by all typed variants (px/ms/number/string).
 * Pipeline: null/number shortcut -> direct parse -> fast variable resolve -> browser measure -> fallback.
 *
 * @param {string | number | undefined} value - The CSS value or variable name.
 * @param {number | string} fallback - Fallback value if resolution fails.
 * @param {HTMLElement | null} context - Element context for variable resolution.
 * @param {ResolveSpec} spec - Type-specific parse/probe configuration.
 * @returns {number | string}
 */
function resolve_css(value, fallback, context, spec) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return value;

  const trimmed = String(value).trim();
  if (!trimmed) return fallback;

  // 1. Try direct parse for simple values (skip if variable/calc present)
  if (!trimmed.includes("var") && !trimmed.includes("calc")) {
    const direct = spec.parseDirect(trimmed);
    if (direct !== null && direct !== undefined) return direct;
  }

  // 2. Fast Path: Direct Variable Resolution from context
  const fast_resolved = try_direct_var_resolve(trimmed, context);
  if (fast_resolved && !fast_resolved.includes("calc") && !fast_resolved.includes("var")) {
    const parsed = spec.parseResolvedVar(fast_resolved);
    if (parsed !== null && parsed !== undefined) return parsed;
  }

  // 3. Browser Resolution (Measurement Element)
  const el = prepare_measure(trimmed, spec.prop, spec.sentinel, context);
  if (el) {
    const style = window.getComputedStyle(el);
    const computed = spec.prop.startsWith("--") ? style.getPropertyValue(spec.prop).trim() : /** @type {any} */ (style)[spec.prop];

    if (typeof computed === "string") {
      // Detect failure: if it stayed at sentinel, it definitely failed.
      if (parseFloat(computed) === parseFloat(spec.sentinel)) {
        return fallback;
      }
      const result = spec.parseComputed(computed);
      if (result !== null && result !== undefined) return result;
    }
  }

  return fallback;
}

// ============================================================================
// [SECTION 3: TYPED CSS RESOLVERS (PX / MS / NUMBER / STRING)]
// ============================================================================

/**
 * Resolves a CSS value (variables, rem/em, clamp, calc) to pixels.
 * @param {string | number | undefined} value - The CSS value or variable name.
 * @param {number} [fallback=0] - Fallback value if resolution fails.
 * @param {HTMLElement | null} [context=null] - Optional element context.
 * @returns {number} Resolved pixel number.
 */
export function resolve_px(value, fallback = 0, context = null) {
  const px_regex = /^([-.\d]+)(px)?$/;
  const parse_px = (/** @type {string} */ s) => {
    const m = s.match(px_regex);
    return m ? parseFloat(m[1]) : null;
  };
  return /** @type {number} */ (
    resolve_css(value, fallback, context, {
      prop: "paddingTop",
      sentinel: "1.234px",
      parseDirect: parse_px,
      parseResolvedVar: parse_px,
      parseComputed: (c) => {
        const n = parseFloat(c);
        return isNaN(n) ? null : n;
      },
    })
  );
}

/**
 * Resolves a CSS duration value (variables, ms, s) to milliseconds.
 * @param {string | number | undefined} value - The CSS duration or variable name.
 * @param {number} [fallback=0] - Fallback value if resolution fails.
 * @param {HTMLElement | null} [context=null] - Optional element context.
 * @returns {number} Resolved duration in milliseconds.
 */
export function resolve_ms(value, fallback = 0, context = null) {
  const to_ms = (/** @type {string} */ val, /** @type {string | undefined} */ unit) => {
    const numeric = parseFloat(val);
    if (!unit) return numeric === 0 ? 0 : null;
    return unit === "ms" ? numeric : numeric * 1000;
  };
  const parse_ms = (/** @type {string} */ s) => {
    const m = s.match(/^([-.\d]+)(ms|s)?$/);
    return m ? to_ms(m[1], m[2]) : null;
  };
  return /** @type {number} */ (
    resolve_css(value, fallback, context, {
      prop: "transitionDuration",
      sentinel: "1.234s",
      parseDirect: parse_ms,
      parseResolvedVar: parse_ms,
      parseComputed: (c) => {
        const m = c.match(/([-.\d]+)(s|ms)/);
        return m ? to_ms(m[1], m[2]) : null;
      },
    })
  );
}

/**
 * Resolves a unitless CSS numeric value (variables, flex-grow, line-height).
 * @param {string | number | undefined} value - The CSS value or variable name.
 * @param {number} [fallback=0] - Fallback value if resolution fails.
 * @param {HTMLElement | null} [context=null] - Optional element context.
 * @returns {number} Resolved numeric value.
 */
export function resolve_number(value, fallback = 0, context = null) {
  const parse_num = (/** @type {string} */ s) => {
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };
  return /** @type {number} */ (
    resolve_css(value, fallback, context, {
      prop: "flexGrow",
      sentinel: "1.234",
      parseDirect: parse_num,
      parseResolvedVar: parse_num,
      parseComputed: (c) => parse_num(c),
    })
  );
}

/**
 * Resolves a CSS string value (easings, color tokens, font names).
 * @param {string | undefined} value - The CSS value or variable name.
 * @param {string} [fallback=""] - Fallback value if resolution fails.
 * @param {HTMLElement | null} [context=null] - Optional element context.
 * @returns {string} Resolved string value.
 */
export function resolve_string(value, fallback = "", context = null) {
  const clean_str = (/** @type {string} */ s) => s.replace(/['"]/g, "");
  const parse_var = (/** @type {string} */ s) => (s && s !== "SENTINEL" && !s.includes("var(") ? clean_str(s) : null);

  return /** @type {string} */ (
    resolve_css(value, fallback, context, {
      prop: "--proxy",
      sentinel: "SENTINEL",
      parseDirect: () => null,
      parseResolvedVar: parse_var,
      parseComputed: (c) => (c && c !== "SENTINEL" ? clean_str(c) : null),
    })
  );
}

// ============================================================================
// [SECTION 4: BROWSER DOWNLOAD UTILITIES]
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
// [SECTION 5: GUARDED VIEW TRANSITION PIPELINE]
// ============================================================================

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
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured 5 clear section dividers, added typed JSDoc schemas (ResolveSpec, TransitionOptions),
 *   and verified 100% test pass.
 * - 2026-06-15: Initial UI helpers implementation for CSS resolution, file downloads, and view transitions.
 */
