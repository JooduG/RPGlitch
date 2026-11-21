/**
 * @file src/utils/field-path.js
 * Prototype-safe dot-path object getters and setters.
 */

/**
 * Prototype-member keys that dot-paths must never traverse or mutate.
 * @type {ReadonlySet<string>}
 */
export const UNSAFE_PATH_KEYS = Object.freeze(new Set(["__proto__", "prototype", "constructor"]));

/**
 * Retrieves a value from a nested object via dot-string path traversal.
 * @param {Record<string, any> | null | undefined} obj
 * @param {string} path
 * @returns {any} Value at path, or `""` if missing/undefined/unsafe.
 */
export function get_value(obj, path) {
  if (!obj || !path || typeof path !== "string") return "";

  let current = obj;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object" || UNSAFE_PATH_KEYS.has(part)) {
      return "";
    }
    current = current[part];
  }

  return current !== undefined && current !== null ? current : "";
}

/**
 * Sets a value in a nested object via dot-string path traversal, creating intermediate objects.
 * @param {Record<string, any>} obj
 * @param {string} path
 * @param {any} value
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
