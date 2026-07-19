/**
 * src/ui/utils/ui-helpers.js
 * UNIFIED UI & DOM UTILITIES
 * Standardized methods for resolving/measuring CSS values and handling Perchance
 * lists and environments.
 */

import { LISTS } from "@data";

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
    !/^(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr|textarea|template|svg)$/i.test(context.tagName);
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
  const fastResolved = try_direct_var_resolve(trimmed, context);
  if (fastResolved && !fastResolved.includes("calc") && !fastResolved.includes("var")) {
    const parsed = spec.parseResolvedVar(fastResolved);
    if (parsed !== null && parsed !== undefined) return parsed;
  }

  // 3. Browser Resolution (Measurement Element)
  const el = prepare_measure(trimmed, spec.prop, spec.sentinel, context);
  if (el) {
    const style = window.getComputedStyle(el);
    const computed = spec.prop.startsWith("--") ? style.getPropertyValue(spec.prop).trim() : style[spec.prop];
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
  const pxRegex = /^([-.\d]+)(px)?$/;
  const parsePx = (s) => {
    const m = s.match(pxRegex);
    return m ? parseFloat(m[1]) : null;
  };
  return /** @type {number} */ (
    resolve_css(value, fallback, context, {
      prop: "paddingTop",
      sentinel: "1.234px",
      parseDirect: parsePx,
      parseResolvedVar: parsePx,
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
 * @param {string | number | undefined} value - The CSS duration or variable name (e.g., "--duration-(--duration-fast)")
 * @param {number} fallback - Value to return if resolution fails
 * @param {HTMLElement | null} [context] - Optional element context for variable resolution
 * @returns {number}
 */
export function resolve_ms(value, fallback = 0, context = null) {
  const toMs = (val, unit) => {
    const numeric = parseFloat(val);
    if (!unit) return numeric === 0 ? 0 : null; // CSS durations (except 0) require a unit
    return unit === "ms" ? numeric : numeric * 1000;
  };
  const parseMs = (s) => {
    const m = s.match(/^([-.\d]+)(ms|s)?$/);
    return m ? toMs(m[1], m[2]) : null;
  };
  return /** @type {number} */ (
    resolve_css(value, fallback, context, {
      prop: "transitionDuration",
      sentinel: "1.234s",
      parseDirect: parseMs,
      parseResolvedVar: parseMs,
      parseComputed: (c) => {
        const m = c.match(/([-.\d]+)(s|ms)/);
        return m ? toMs(m[1], m[2]) : null;
      },
    })
  );
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
  const parseNum = (s) => {
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };
  return /** @type {number} */ (
    resolve_css(value, fallback, context, {
      prop: "flexGrow",
      sentinel: "1.234",
      parseDirect: parseNum,
      parseResolvedVar: parseNum,
      parseComputed: (c) => parseNum(c),
    })
  );
}

/**
 * Resolves a CSS string value (handles variables).
 * Useful for easings, colors (as strings), or other non-numeric tokens.
 *
 * @param {string | undefined} value - The CSS value or variable name (e.g., "--ease-(--ease-out)")
 * @param {string} fallback - Value to return if resolution fails
 * @param {HTMLElement | null} [context] - Optional element context for variable resolution
 * @returns {string}
 */
export function resolve_string(value, fallback = "", context = null) {
  const cleanStr = (s) => s.replace(/['"]/g, "");
  // String path differs slightly: the fast-path guard also rejects "var(" chains and the SENTINEL placeholder.
  const parseVar = (s) => (s && s !== "SENTINEL" && !s.includes("var(") ? cleanStr(s) : null);

  // resolve_string's direct path: only meaningful if the raw value is a plain string (no variable/calc).
  // parseFloat-style parsing doesn't apply; we return the cleaned string only when there's no variable/calc.
  // Reuse resolve_css but with a direct-parse that returns null (so it falls through to measure el).
  return /** @type {string} */ (
    resolve_css(value, fallback, context, {
      prop: "--proxy",
      sentinel: "SENTINEL",
      parseDirect: () => null, // resolve_string has no direct-parse shortcut: raw inputs may be variable names.
      parseResolvedVar: parseVar,
      parseComputed: (c) => (c && c !== "SENTINEL" ? cleanStr(c) : null),
    })
  );
}

/**
 * Safely accesses Perchance lists.
 * Handles both raw arrays and stringified JSON arrays.
 * @param {string} key
 * @returns {any[]}
 */
export const getRpgList = (key) => {
  if (LISTS && LISTS[key]) {
    let list = LISTS[key];
    // Check if the first element is a stringified JSON array (Perchance quirk)
    if (Array.isArray(list) && typeof list[0] === "string" && list[0].startsWith("[")) {
      if (list[0].length > 65536) {
        console.warn(`[Helpers] getRpgList: JSON string for key '${key}' exceeds 64KB safety limit.`);
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
