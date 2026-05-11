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
  if (trimmed.startsWith("--")) return trimmed;
  const match = trimmed.match(/^var\s*\(\s*(--[^,)\s]+)/);
  return match ? match[1] : null;
}

/** @type {HTMLElement | null} */
let sharedMeasureEl = null;

/**
 * Ensures the shared measurement element exists in the DOM.
 * @returns {HTMLElement | null}
 */
function get_measure_el() {
  if (!sharedMeasureEl && typeof document !== "undefined") {
    sharedMeasureEl = document.createElement("div");
    sharedMeasureEl.style.position = "absolute";
    sharedMeasureEl.style.visibility = "hidden";
    sharedMeasureEl.style.pointerEvents = "none";
    sharedMeasureEl.style.zIndex = "-9999";
    // Using a display: flex container allows us to resolve unitless numbers via flex-grow
    sharedMeasureEl.style.display = "flex";
    document.body.appendChild(sharedMeasureEl);
  }
  return sharedMeasureEl;
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

  // 2. Variable resolution via context (Manual Lookup)
  const varName = get_var_name(trimmed);
  if (context && varName) {
    const style = window.getComputedStyle(context);
    const resolved = style.getPropertyValue(varName).trim();
    if (resolved && resolved !== trimmed) {
      return resolve_px(resolved, fallback, context);
    }
  }

  const cssValue = varName ? `var(${varName})` : trimmed;

  const el = get_measure_el();
  if (el) {
    const targetParent = context || document.body;
    if (el.parentElement !== targetParent) {
      targetParent.appendChild(el);
    }

    // Pass the raw value to the mock/browser via dataset for easier resolution in test environments
    if (typeof el.dataset !== "undefined") {
      el.dataset.resolveValue = String(cssValue);
    }
    el.style.paddingTop = "0px";
    el.style.paddingTop = cssValue;
    const computed = window.getComputedStyle(el).paddingTop;
    const result = parseFloat(computed);
    if (isNaN(result)) return fallback;
    // If we got 0 but the input wasn't 0, it likely failed to resolve
    if (result === 0 && !trimmed.startsWith("0") && !trimmed.includes("(0")) return fallback;

    return result;
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
  if (context && varName) {
    const style = window.getComputedStyle(context);
    const resolved = style.getPropertyValue(varName).trim();
    if (resolved && resolved !== trimmed) {
      return resolve_ms(resolved, fallback, context);
    }
  }

  // 3. Measure using dummy element
  const cssValue = varName ? `var(${varName})` : trimmed;

  const el = get_measure_el();
  if (el) {
    const targetParent = context || document.body;
    if (el.parentElement !== targetParent) {
      targetParent.appendChild(el);
    }

    // Pass the raw value to the mock/browser via dataset
    if (typeof el.dataset !== "undefined") {
      el.dataset.resolveValue = String(cssValue);
    }
    el.style.transitionDuration = cssValue;
    const computed = window.getComputedStyle(el).transitionDuration;

    const compMatch = computed.match(/([-.\d]+)(s|ms)/);
    if (compMatch) {
      const [_, val, unit] = compMatch;
      const res = unit === "ms" ? parseFloat(val) : parseFloat(val) * 1000;
      // Handle invalid resolution returning 0
      if (res === 0 && !trimmed.startsWith("0") && !trimmed.includes("(0")) return fallback;
      return res;
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
  if (context && varName) {
    const style = window.getComputedStyle(context);
    const resolved = style.getPropertyValue(varName).trim();
    if (resolved && resolved !== trimmed) {
      return resolve_number(resolved, fallback, context);
    }
  }

  // 3. Measure using dummy element
  const cssValue = varName ? `var(${varName})` : trimmed;

  const el = get_measure_el();
  if (el) {
    const targetParent = context || document.body;
    if (el.parentElement !== targetParent) {
      targetParent.appendChild(el);
    }

    // Pass the raw value to the mock/browser via dataset
    if (typeof el.dataset !== "undefined") {
      el.dataset.resolveValue = String(cssValue);
    }
    el.style.flexGrow = cssValue;
    const result = parseFloat(window.getComputedStyle(el).flexGrow);

    if (isNaN(result)) return fallback;
    if (result === 0 && !trimmed.startsWith("0") && !trimmed.includes("(0")) return fallback;

    return result;
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

  // 1. If it's not a variable or var() call, it's a raw string
  const varName = get_var_name(trimmed);
  if (!varName) return trimmed;

  // 2. Resolve via context
  if (context) {
    const style = window.getComputedStyle(context);
    const resolved = style.getPropertyValue(varName).trim();
    if (resolved && resolved !== trimmed) {
      return resolve_string(resolved, fallback, context);
    }
  }

  // 3. Fallback to dummy
  const cssValue = `var(${varName})`;
  const el = get_measure_el();
  if (el) {
    const targetParent = context || document.body;
    if (el.parentElement !== targetParent) {
      targetParent.appendChild(el);
    }

    // Pass the raw value to the mock/browser via dataset
    if (typeof el.dataset !== "undefined") {
      el.dataset.resolveValue = String(cssValue);
    }
    el.style.setProperty("--proxy", cssValue);
    const resolved = window.getComputedStyle(el).getPropertyValue("--proxy").trim();
    if (resolved && resolved !== "initial") return resolved.replace(/['"]/g, "");
  }

  return fallback;
}

/**
 * @deprecated Use resolve_ms instead.
 * Parses CSS time strings into raw milliseconds.
 */
export const parse_ms = resolve_ms;
