/**
 * src/ui/utils/dom.js
 * DOM & CSS UTILITIES
 * Standardized methods for resolving and measuring CSS values in the RPGlitch engine.
 */

/**
 * Extracts the variable name from a string like "var(--name)" or "--name".
 * @param {string} value
 * @returns {string | null}
 */
function get_var_name(value) {
  const trimmed = String(value).trim();
  if (trimmed.startsWith("--")) return trimmed.split(",")[0].trim();
  const match = trimmed.match(/^var\s*\(\s*(--[^,)\s]+)/);
  return match ? match[1] : null;
}

/**
 * Prepares a CSS value for measurement, wrapping raw variables in var().
 * @param {string} value
 * @returns {string}
 */
function get_css_value(value) {
  const trimmed = String(value).trim();
  return trimmed.startsWith("--") ? `var(${trimmed})` : trimmed;
}

/** @type {HTMLElement | null} */
let sharedMeasureEl = null;

/**
 * Ensures the shared measurement element exists in the DOM and is parented correctly.
 * @param {HTMLElement | null} [context] - Optional element context for parenting
 * @returns {HTMLElement | null}
 */
function get_measure_el(context = null) {
  if (typeof document === "undefined") return null;

  if (!sharedMeasureEl) {
    sharedMeasureEl = document.createElement("div");
    sharedMeasureEl.id = "shared-measure-el";
    sharedMeasureEl.style.position = "absolute";
    sharedMeasureEl.style.visibility = "hidden";
    sharedMeasureEl.style.pointerEvents = "none";
    sharedMeasureEl.style.zIndex = "-9999";
    sharedMeasureEl.style.display = "flex";
    document.body.appendChild(sharedMeasureEl);
  }

  const canAcceptChildren = context && context.nodeType === 1 && !/^(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr|textarea)$/i.test(context.tagName);
  const targetParent = canAcceptChildren ? context : document.body;
  if (sharedMeasureEl.parentElement !== targetParent) {
    targetParent.appendChild(sharedMeasureEl);
  }

  return sharedMeasureEl;
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

  const cssValue = get_css_value(value);
  if (typeof el.dataset !== "undefined") {
    el.dataset.resolveValue = cssValue;
  }

  // 1. Proxy resolution to detect valid vs invalid variables (handles 0 vs undefined)
  el.style.setProperty("--proxy", "SENTINEL");
  el.style.setProperty("--proxy", cssValue);
  const resolved = window.getComputedStyle(el).getPropertyValue("--proxy").trim();

  // If it stayed at SENTINEL, the browser rejected the value.
  // If it became empty string, it was a var() that resolved to nothing (invalid at compute time).
  if (resolved === "SENTINEL" || (resolved === "" && cssValue !== "")) {
    return null;
  }

  // 2. Set actual property for unit resolution (e.g. rem -> px)
  // @ts-ignore - Dynamic property access
  el.style[prop] = sentinel;
  // @ts-ignore - Dynamic property access
  el.style[prop] = cssValue;

  return el;
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
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return value;

  const trimmed = String(value).trim();
  if (!trimmed) return fallback;

  // 1. Try direct parse for simple pixel values or raw numbers
  const match = trimmed.match(/^([-.\d]+)(px)?$/);
  if (match && !trimmed.includes("var") && !trimmed.includes("calc")) {
    const direct = parseFloat(match[1]);
    if (!isNaN(direct)) return direct;
  }

  // 2. Variable resolution via context (Manual Lookup - only for simple variables)
  const varName = get_var_name(trimmed);
  const isSimpleVar = !trimmed.includes(",");
  if (context && varName && isSimpleVar) {
    const style = window.getComputedStyle(context);
    const resolved = style.getPropertyValue(varName).trim();
    if (resolved && resolved !== trimmed) {
      return resolve_px(resolved, fallback, context);
    }
  }

  // 3. Browser Resolution
  const sentinel = "1.234px";
  const el = prepare_measure(trimmed, "paddingTop", sentinel, context);
  if (el) {
    const computed = window.getComputedStyle(el).paddingTop;

    // Detect failure: if it stayed at sentinel, it definitely failed.
    // (Note: prepare_measure already does proxy detection for variables)
    if (computed === sentinel) {
      return fallback;
    }

    const result = parseFloat(computed);
    return isNaN(result) ? fallback : result;
  }

  return fallback;
}

/**
 * Resolves a CSS duration value (handles variables, ms, s, etc.) to milliseconds.
 *
 * @param {string | number | undefined} value - The CSS duration or variable name (e.g., "--duration-fast")
 * @param {number} fallback - Value to return if resolution fails
 * @param {HTMLElement | null} [context] - Optional element context for variable resolution
 * @returns {number}
 */
export function resolve_ms(value, fallback = 0, context = null) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return value;

  const trimmed = String(value).trim();
  if (!trimmed) return fallback;

  // 1. Try direct parse for simple ms/s values or raw numbers
  const match = trimmed.match(/^([-.\d]+)(ms|s)?$/);
  if (match && !trimmed.includes("var") && !trimmed.includes("calc")) {
    const [_, val, unit] = match;
    if (!unit) return parseFloat(val); // Treat unitless as ms
    return unit === "ms" ? parseFloat(val) : parseFloat(val) * 1000;
  }

  // 2. Variable resolution via context
  const varName = get_var_name(trimmed);
  const isSimpleVar = !trimmed.includes(",");
  if (context && varName && isSimpleVar) {
    const style = window.getComputedStyle(context);
    const resolved = style.getPropertyValue(varName).trim();
    if (resolved && resolved !== trimmed) {
      return resolve_ms(resolved, fallback, context);
    }
  }

  // 3. Browser Resolution
  const sentinel = "1.234ms";
  const el = prepare_measure(trimmed, "transitionDuration", sentinel, context);
  if (el) {
    const computed = window.getComputedStyle(el).transitionDuration;

    // Detect failure: if it stayed at sentinel, it definitely failed.
    if (computed === sentinel) {
      return fallback;
    }

    const compMatch = computed.match(/([-.\d]+)(s|ms)/);
    if (compMatch) {
      const [_, val, unit] = compMatch;
      return unit === "ms" ? parseFloat(val) : parseFloat(val) * 1000;
    }
  }

  return fallback;
}

/**
 * Resolves a unitless CSS numeric value (handles variables, etc.).
 *
 * @param {string | number | undefined} value - The CSS value or variable name (e.g., "--my-scale")
 * @param {number} fallback - Value to return if resolution fails
 * @param {HTMLElement | null} [context] - Optional element context for variable resolution
 * @returns {number}
 */
export function resolve_number(value, fallback = 0, context = null) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return value;

  const trimmed = String(value).trim();
  if (!trimmed) return fallback;

  // 1. Try direct parse for simple numbers
  const direct = parseFloat(trimmed);
  if (!isNaN(direct) && !trimmed.includes("var") && !trimmed.includes("calc")) return direct;

  // 2. Variable resolution via context
  const varName = get_var_name(trimmed);
  const isSimpleVar = !trimmed.includes(",");
  if (context && varName && isSimpleVar) {
    const style = window.getComputedStyle(context);
    const resolved = style.getPropertyValue(varName).trim();
    if (resolved && resolved !== trimmed) {
      return resolve_number(resolved, fallback, context);
    }
  }

  // 3. Browser Resolution
  const sentinel = "1.234";
  const el = prepare_measure(trimmed, "flexGrow", sentinel, context);
  if (el) {
    const computed = window.getComputedStyle(el).flexGrow;

    if (computed === sentinel) {
      return fallback;
    }

    const result = parseFloat(computed);
    return isNaN(result) ? fallback : result;
  }

  return fallback;
}

/**
 * Resolves a CSS string value (handles variables).
 * Useful for easings, colors (as strings), or other non-numeric tokens.
 *
 * @param {string | undefined} value - The CSS value or variable name (e.g., "--ease-out")
 * @param {string} fallback - Value to return if resolution fails
 * @param {HTMLElement | null} [context] - Optional element context for variable resolution
 * @returns {string}
 */
export function resolve_string(value, fallback = "", context = null) {
  if (value === undefined || value === null) return fallback;

  const trimmed = String(value).trim();
  if (!trimmed) return fallback;

  // 1. Variable resolution via context
  const varName = get_var_name(trimmed);
  const isSimpleVar = !trimmed.includes(",");
  if (context && varName && isSimpleVar) {
    const style = window.getComputedStyle(context);
    const resolved = style.getPropertyValue(varName).trim();
    if (resolved && resolved !== trimmed) {
      return resolve_string(resolved, fallback, context);
    }
  }

  // 2. Browser Resolution
  const cssValue = get_css_value(trimmed);
  const el = get_measure_el(context);
  if (el) {
    if (typeof el.dataset !== "undefined") {
      el.dataset.resolveValue = cssValue;
    }
    el.style.setProperty("--proxy", "SENTINEL");
    el.style.setProperty("--proxy", cssValue);
    const resolved = window.getComputedStyle(el).getPropertyValue("--proxy").trim();

    // If it's valid, it should be different from SENTINEL and not empty (unless original was empty)
    if (resolved && resolved !== "SENTINEL") {
      return resolved.replace(/['"]/g, "");
    }
  }

  return fallback;
}

/**
 * @deprecated Use resolve_ms instead.
 * Parses CSS time strings into raw milliseconds.
 */
export const parse_ms = resolve_ms;
