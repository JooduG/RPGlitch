/**
 * src/utils/ui-helpers.js
 * 🛠️ UI & CSS RESOLUTION HELPERS
 * Standardized methods for resolving/measuring CSS values and handling Perchance lists.
 */

/**
 * Prepares a CSS value for measurement, wrapping raw variables in var().
 * @param {string} value
 * @returns {string}
 */
function get_css_value(value) {
  const trimmed = String(value).trim();
  return trimmed.startsWith("--") ? `var(${trimmed})` : trimmed;
}

/**
 * Tries to resolve a variable directly from a context element.
 * @param {string} trimmed
 * @param {HTMLElement | null} context
 * @returns {string | null}
 */
function try_direct_var_resolve(trimmed, context) {
  if (!context || typeof window === "undefined") return null;

  const is_var = trimmed.startsWith("--") || (trimmed.startsWith("var(") && trimmed.endsWith(")"));
  if (!is_var) return null;

  const var_name = trimmed.startsWith("--") ? trimmed : trimmed.slice(4, -1).trim();
  if (var_name.includes(",")) return null; // Skip complex fallbacks

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
 * @param {HTMLElement | null} [context] - Optional element context for parenting
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
 * Helper to prepare the measurement element with a value and sentinel for failure detection.
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
  // If it became empty string, it was a var() that resolved to nothing (invalid at compute time).
  if (resolved === "SENTINEL" || (resolved === "" && css_value !== "")) {
    return null;
  }

  // 2. Set actual property for unit resolution (e.g. rem -> px)
  /** @type {any} */ (el.style)[prop] = sentinel;
  /** @type {any} */ (el.style)[prop] = css_value;

  return el;
}

/**
 * @typedef {Object} ResolveSpec
 * @property {string} prop - The CSS property to probe on the measure element.
 * @property {string} sentinel - Sentinel value injected to detect resolution failure.
 * @property {(computed: string) => (number | string | null)} parseComputed - Parses the browser's computed value into the target type.
 * @property {(raw: string) => (number | string | null)} parseDirect - Parses a raw (non-variable) input string directly.
 * @property {(direct: string) => (number | string | null)} parseResolvedVar - Parses a value already resolved from a CSS variable.
 */

/**
 * Core CSS-value resolver shared by all typed variants (px/ms/number/string).
 * Pipeline: null/number shortcut -> direct parse -> fast variable resolve -> browser measure -> fallback.
 *
 * @param {string | number | undefined} value - The CSS value or variable name (e.g., "--my-var" or "var(--my-var)" or "1rem")
 * @param {number | string} fallback - Value to return if resolution fails
 * @param {HTMLElement | null} context - Optional element context for variable resolution
 * @param {ResolveSpec} spec - Type-specific parse/probe configuration
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

/**
 * Resolves a CSS value (handles variables, units like rem/em, clamp, etc.) to pixels.
 * Uses a dummy element to let the browser resolve the computed value.
 *
 * @param {string | number | undefined} value - The CSS value or variable name (e.g., "--my-var" or "var(--my-var)" or "1rem")
 * @param {number} fallback - Value to return if resolution fails
 * @param {HTMLElement | null} [context] - Optional element context for variable resolution
 * @returns {number}
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
 * Resolves a CSS duration value (handles variables, ms, s, etc.) to milliseconds.
 *
 * @param {string | number | undefined} value - The CSS duration or variable name
 * @param {number} fallback - Value to return if resolution fails
 * @param {HTMLElement | null} [context] - Optional element context for variable resolution
 * @returns {number}
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
 * Resolves a unitless CSS numeric value (handles variables, etc.).
 *
 * @param {string | number | undefined} value - The CSS value or variable name
 * @param {number} fallback - Value to return if resolution fails
 * @param {HTMLElement | null} [context] - Optional element context for variable resolution
 * @returns {number}
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
 * Resolves a CSS string value (handles variables).
 * Useful for easings, colors (as strings), or other non-numeric tokens.
 *
 * @param {string | undefined} value - The CSS value or variable name
 * @param {string} fallback - Value to return if resolution fails
 * @param {HTMLElement | null} [context] - Optional element context for variable resolution
 * @returns {string}
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

/**
 * Safely accesses Perchance lists from window.lists.
 * Handles both raw arrays and stringified JSON arrays.
 * @param {string} key
 * @returns {any[]}
 */
export const get_rpg_list = (key) => {
  const global_lists = typeof window !== "undefined" && /** @type {any} */ (window).lists ? /** @type {any} */ (window).lists : null;
  if (global_lists && global_lists[key]) {
    let list = global_lists[key];
    if (Array.isArray(list) && typeof list[0] === "string" && list[0].startsWith("[")) {
      if (list[0].length > 65536) {
        console.warn(`[Helpers] get_rpg_list: JSON string for key '${key}' exceeds 64KB safety limit.`);
        return [];
      }
      try {
        return JSON.parse(list[0]);
      } catch (e) {
        console.warn(`[Helpers] get_rpg_list: Failed to parse JSON for key '${key}'.`, e);
        return list;
      }
    }
    return Array.isArray(list) ? list : [];
  }
  return [];
};

/**
 * Triggers a browser download of a Blob or string payload.
 * No-op (returns false) outside the DOM.
 * @param {string} filename
 * @param {string | Blob} content
 * @param {string} [mime]
 * @returns {boolean}
 */
export const download_blob = (filename, content, mime = "application/octet-stream") => {
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
 * Downloads a text payload as a file.
 * @param {string} filename
 * @param {string} text
 * @param {string} [mime]
 * @returns {boolean}
 */
export const download_text_file = (filename, text, mime = "text/plain;charset=utf-8") => download_blob(filename, text, mime);

/**
 * Downloads a JSON-serializable value as an indented .json file.
 * @param {string} filename
 * @param {any} value
 * @returns {boolean}
 */
export const download_json_file = (filename, value) => download_blob(filename, JSON.stringify(value, null, 2), "application/json;charset=utf-8");

/** @type {{ active: boolean }} */
const _transition_state = { active: false };

/**
 * Safely wraps document.startViewTransition with a single-flight guard.
 *
 * If the View Transitions API is unavailable or a transition is already in
 * progress, the callback executes synchronously (instant DOM update, no
 * animation, no error).
 *
 * @param {() => void | Promise<void>} callback - The DOM mutation to animate.
 * @param {{ className?: string }} [options] - Optional configuration for the transition.
 * @returns {Promise<any>}
 */
export function guarded_transition(callback, options = {}) {
  // Graceful fallback: no API or already active → run synchronously, no error
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

  // Always release the lock when the transition settles, regardless of outcome.
  // finished may reject if the browser aborts the transition (AbortError) —
  // we suppress that too, as it is a normal browser lifecycle event.
  const done_promise = transition.finished.finally(() => {
    if (options.className) {
      document.documentElement.classList.remove(options.className);
    }
    _transition_state.active = false;
  });

  // Suppress any rejection from the transition lifecycle promises
  // to prevent unhandled promise rejection warnings in the browser console.
  transition.finished.catch(() => {});
  transition.ready.catch(() => {});
  transition.updateCallbackDone.catch(() => {});

  return done_promise;
}
