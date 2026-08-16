/**
 * src/utils/field-path.js
 * Dot-path accessors for nested objects — used by the profile editor's form
 * field binding and the intelligence layer's entity field traversal.
 * Reads return "" for missing values; writes create intermediate objects.
 */

/** Prototype-member keys that dot-paths must never traverse: reads resolve to
 * nothing and writes are refused, keeping inherited members (and the risk of
 * prototype pollution) out of field binding. */
const UNSAFE_PATH_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/**
 * Gets a value from a nested object via a dot-string path.
 * @param {Object} obj - The object to traverse.
 * @param {string} path - The dot-path (e.g., 'profile.bio').
 * @returns {*} The value at the path or an empty string.
 */
export function get_value(obj, path) {
  if (!obj || !path) return "";
  /** @type {any} */
  const result = path
    .split(".")
    .reduce(
      (acc, part) =>
        acc && !UNSAFE_PATH_KEYS.has(part) && /** @type {any} */ (acc)[part] !== undefined ? /** @type {any} */ (acc)[part] : undefined,
      obj,
    );
  return result ?? "";
}

/**
 * Sets a value in a nested object via a dot-string path.
 * Mutates the object. Refuses paths containing prototype-member keys.
 * @param {Object} obj - The object to mutate.
 * @param {string} path - The dot-path (e.g., 'profile.bio').
 * @param {*} val - The value to set.
 */
export function set_value(obj, path, val) {
  if (!obj || !path) return;
  const keys = path.split(".");
  if (keys.some((key) => UNSAFE_PATH_KEYS.has(key))) return;
  const last = keys.pop();
  /** @type {any} */
  const target = keys.reduce((acc, key) => {
    /** @type {any} */ (acc)[key] = /** @type {any} */ (acc)[key] || {};
    return /** @type {any} */ (acc)[key];
  }, obj);
  if (last) /** @type {any} */ (target)[last] = val;
}
