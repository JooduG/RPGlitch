/**
 * src/utils/catalog.js
 * ============================================================================
 * 🗝️ CATALOG COMPILER CORE — Dotted-Key Atoms & Token Interpolation
 * ============================================================================
 *
 * Single owner of dotted-catalog resolution for every intelligence module
 * (constitution, entities, history, output, protocols, reflex, sheets,
 * style, system, task): one exact `{token}` interpolation plus one
 * dotted-path walker with uppercase, defaults, and fallback-key policies.
 * Pure dependency-free functions — safe for every layer (@utils never
 * imports upward).
 *
 * Architecture & Modification Rules:
 * - The interpolation class is byte-exact: lowercase/numbers/underscore
 *   only. Widening it would change which prompt substrings interpolate.
 * - Non-leaf branches resolve to "" (never "[object Object]").
 * - `{tag, body}` records pass through with an interpolated body so
 *   record-aware delegates (reflex enveloping) keep their metadata.
 * ============================================================================
 */

/**
 * Exact token pattern shared by every catalog compiler.
 * @type {RegExp}
 */
const TOKEN_PATTERN = /\{([a-z0-9_]+)\}/g;

/**
 * Interpolates `{token}` placeholders from the values bag. Missing slots
 * resolve to "" (never "undefined").
 * @param {string|null|undefined} template
 * @param {Record<string, any>} [values={}]
 * @returns {string}
 */
export function interpolate_tokens(template, values = {}) {
  return String(template ?? "").replace(TOKEN_PATTERN, (match, token) => (values[token] != null ? String(values[token]) : ""));
}

/**
 * Resolves one dotted catalog key to its interpolated leaf.
 * Strings return interpolated text; `{tag, body}` records return a copy
 * with an interpolated body; branch objects and missing keys return "".
 * @param {Record<string, any>|null|undefined} catalog - Frozen catalog record
 * @param {string|null|undefined} key - Dotted path (e.g. "PROSE.CHARACTER.BASE")
 * @param {Record<string, any>} [values={}] - Interpolation bag
 * @param {Object} [options={}]
 * @param {boolean} [options.uppercase=false] - Uppercase the key before walking
 * @param {Record<string, any>|null} [options.defaults=null] - Underlay merged under values (spread: explicit null wins)
 * @param {string|null} [options.fallback_key=null] - Second key tried when the first misses
 * @returns {string|Record<string, any>}
 * Modules Ground Refactor Phase 1 — created: single dotted-catalog compiler core (interpolate_tokens + resolve_catalog_atom).
 */
export function resolve_catalog_atom(catalog, key, values = {}, options = {}) {
  const { uppercase = false, defaults = null, fallback_key = null } = options || {};
  const normalize_key = (raw) => {
    const text = String(raw ?? "").trim();
    return uppercase ? text.toUpperCase() : text;
  };
  const walk = (dotted) =>
    normalize_key(dotted)
      .split(".")
      .reduce((node, part) => node?.[part], catalog);
  let atom = walk(key);
  if (atom == null && fallback_key != null) atom = walk(fallback_key);
  if (atom == null) return "";
  const bag = { ...(defaults || {}), ...(values || {}) };
  if (typeof atom === "string") return interpolate_tokens(atom, bag);
  if (atom && typeof atom === "object" && typeof atom.body === "string") {
    return { ...atom, body: interpolate_tokens(atom.body, bag) };
  }
  return "";
}
