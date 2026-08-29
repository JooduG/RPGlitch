/**
 * src/utils/field-path.js
 * 🧭 DOT-PATH TRAVERSAL ENGINE: Safe Nested Object Field Accessors
 *
 * Core Responsibilities:
 * - Traverses nested objects via dot-separated path strings (e.g., `'eternal.physical'`, `'profile.bio'`).
 * - Provides safe getters (`get_value`) returning empty string fallback on missing/undefined paths.
 * - Provides mutating setters (`set_value`) dynamically allocating intermediate object nodes.
 * - Defense-in-depth security: strictly blocks traversal and assignment targeting prototype-pollution
 *   keys (`__proto__`, `prototype`, `constructor`).
 *
 * Used by:
 * - Profile Editor form field bindings (`src/ui/profile/`).
 * - Intelligence layer prompt compilation & entity field traversal.
 */

// ============================================================================
// [SECTION 1: CONSTANTS & SECURITY BOUNDARIES]
// ============================================================================

/**
 * Prototype-member keys that dot-paths must never traverse or mutate.
 * Protects against Prototype Pollution vulnerabilities.
 * @type {ReadonlySet<string>}
 */
export const UNSAFE_PATH_KEYS = Object.freeze(new Set(["__proto__", "prototype", "constructor"]));

// ============================================================================
// [SECTION 2: PATH GETTER ENGINE]
// ============================================================================

/**
 * Retrieves a value from a nested object via dot-string path traversal.
 * Refuses paths containing prototype pollution keys.
 * @param {Record<string, any> | null | undefined} obj - The object to traverse.
 * @param {string} path - Dot-separated path string (e.g. `'eternal.physical'`).
 * @returns {any} The value at the path, or an empty string `""` if missing/undefined.
 */
export function get_value(obj, path) {
  if (!obj || !path || typeof path !== "string") return "";

  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (!current || typeof current !== "object" || UNSAFE_PATH_KEYS.has(part)) {
      return "";
    }
    current = current[part];
  }

  return current !== undefined && current !== null ? current : "";
}

// ============================================================================
// [SECTION 3: PATH SETTER ENGINE]
// ============================================================================

/**
 * Sets a value in a nested object via dot-string path traversal, creating intermediate objects.
 * Refuses paths containing prototype pollution keys.
 * @param {Record<string, any>} obj - The target object to mutate.
 * @param {string} path - Dot-separated path string.
 * @param {any} value - The value to assign.
 */
export function set_value(obj, path, value) {
  if (!obj || typeof obj !== "object" || !path || typeof path !== "string") return;

  const keys = path.split(".");
  if (keys.some((key) => UNSAFE_PATH_KEYS.has(key))) return;

  const last_key = keys.pop();
  if (!last_key) return;

  let current = obj;
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  current[last_key] = value;
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported frozen UNSAFE_PATH_KEYS set, optimized traversal loops,
 *   and added dedicated test suite.
 * - 2026-06-15: Added prototype pollution guards (__proto__, prototype, constructor).
 */
