/**
 * src/ui/components/ui-helpers.js
 * UNIFIED UI & DOM UTILITIES
 * Standardized methods for resolving/measuring CSS values, handling Perchance
 * lists and environments, and re-exporting stateless engine logic.
 */

import { generateUUID, generateSecureSeed, pickRandom, debounce, clamp } from "@engine/utils.js";

// Re-export pure engine utilities
export { generateUUID, generateSecureSeed, pickRandom, debounce, clamp };

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

  const isVar = trimmed.startsWith("--") || (trimmed.startsWith("var(") && trimmed.endsWith(")"));
  if (!isVar) return null;

  const varName = trimmed.startsWith("--") ? trimmed : trimmed.slice(4, -1).trim();
  if (varName.includes(",")) return null; // Skip complex fallbacks

  try {
    return window.getComputedStyle(context).getPropertyValue(varName).trim();
  } catch {
    return null;
  }
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

  const canAcceptChildren =
    context &&
    context.nodeType === 1 &&
    !/^(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr|textarea|template|svg)$/i.test(
      context.tagName,
    );
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

  // 2. Fast Path: Direct Variable Resolution from context
  const fastResolved = try_direct_var_resolve(trimmed, context);
  if (fastResolved) {
    const match = fastResolved.match(/^([-.\d]+)(px)?$/);
    if (match && !fastResolved.includes("calc") && !fastResolved.includes("var")) {
      return parseFloat(match[1]);
    }
  }

  // 3. Browser Resolution (Measurement Element)
  const sentinel = "1.234px";
  const el = prepare_measure(trimmed, "paddingTop", sentinel, context);
  if (el) {
    const computed = window.getComputedStyle(el).paddingTop;

    // Detect failure: if it stayed at sentinel, it definitely failed.
    // (Note: prepare_measure already does proxy detection for variables)
    if (parseFloat(computed) === parseFloat(sentinel)) {
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
    const numeric = parseFloat(val);
    if (!unit) {
      // CSS durations (except 0) require a unit.
      return numeric === 0 ? 0 : fallback;
    }
    return unit === "ms" ? numeric : numeric * 1000;
  }

  // 2. Fast Path: Direct Variable Resolution from context
  const direct = try_direct_var_resolve(trimmed, context);
  if (direct) {
    const compMatch = direct.match(/^([-.\d]+)(s|ms)?$/);
    if (compMatch && !direct.includes("calc") && !direct.includes("var")) {
      const [_, val, unit] = compMatch;
      const numeric = parseFloat(val);
      if (!unit) return numeric === 0 ? 0 : fallback;
      return unit === "ms" ? numeric : numeric * 1000;
    }
  }

  // 3. Browser Resolution
  const sentinel = "1.234s";
  const el = prepare_measure(trimmed, "transitionDuration", sentinel, context);
  if (el) {
    const computed = window.getComputedStyle(el).transitionDuration;

    // Detect failure: if it stayed at sentinel, it definitely failed.
    if (parseFloat(computed) === parseFloat(sentinel)) {
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

  // 2. Fast Path: Direct Variable Resolution from context
  const fastResolved = try_direct_var_resolve(trimmed, context);
  if (fastResolved) {
    const numeric = parseFloat(fastResolved);
    if (!isNaN(numeric) && !fastResolved.includes("calc") && !fastResolved.includes("var")) {
      return numeric;
    }
  }

  // 3. Browser Resolution
  const sentinel = "1.234";
  const el = prepare_measure(trimmed, "flexGrow", sentinel, context);
  if (el) {
    const computed = window.getComputedStyle(el).flexGrow;

    if (parseFloat(computed) === parseFloat(sentinel)) {
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

  // 1. Fast Path: Direct Variable Resolution from context
  const direct = try_direct_var_resolve(trimmed, context);
  if (direct && direct !== "SENTINEL" && !direct.includes("var(")) {
    return direct.replace(/['"]/g, "");
  }

  // 2. Browser Resolution (Measurement Element)
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

/**
 * Exposes mock implementations for Perchance plugins in local development.
 */
export const mockPlugins = () => {
  const w = /** @type {any} */ (window);
  if (!w["pluginAi"]) w["pluginAi"] = async () => "Mock AI Response";
  if (!w["pluginTextToImage"])
    w["pluginTextToImage"] = async () => "https://via.placeholder.com/512x768";
  if (!w["pluginRemember"]) w["pluginRemember"] = { get: () => null, set: () => {} };
  if (!w["pluginSuperFetch"]) w["pluginSuperFetch"] = async () => ({ text: async () => "" });
  if (!w["pluginUpload"]) w["pluginUpload"] = async () => "https://via.placeholder.com/150";
};

/**
 * Safely accesses Perchance lists injected from the Left Panel.
 * Handles both raw arrays and stringified JSON arrays.
 * @param {string} key
 * @returns {any[]}
 */
export const getRpgList = (key) => {
  const w = /** @type {any} */ (window);
  if (typeof window !== "undefined" && w.rpgLists && w.rpgLists[key]) {
    let list = w.rpgLists[key];
    // Check if the first element is a stringified JSON array (Perchance quirk)
    if (Array.isArray(list) && typeof list[0] === "string" && list[0].startsWith("[")) {
      if (list[0].length > 65536) {
        console.warn(
          `[Helpers] getRpgList: JSON string for key '${key}' exceeds 64KB safety limit.`,
        );
        return [];
      }
      try {
        return JSON.parse(list[0]);
      } catch (e) {
        console.warn(`[Helpers] getRpgList: Failed to parse JSON for key '${key}'.`, e);
        return list;
      }
    }
    return Array.isArray(list) ? list : [];
  }
  return [];
};
