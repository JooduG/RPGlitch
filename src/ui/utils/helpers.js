/**
 * src/ui/utils/helpers.js
 * 🛠️ PURE UTILITIES
 * Stateless helper functions for the RPGlitch engine.
 */

/**
 * Generates a standard UUID v4.
 */
export const generateUUID = () => {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error(
      "crypto.randomUUID is not available in this environment. Ensure you are in a secure context (HTTPS).",
    );
  }
  return globalThis.crypto.randomUUID();
};

/**
 * Generates a secure random seed up to a specified limit.
 */
export const generateSecureSeed = (limit = 1000000) => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error(
      "crypto.getRandomValues is not available in this environment. Ensure you are in a secure context (HTTPS).",
    );
  }
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return array[0] % limit;
};

/**
 * Picks a random element from an array securely.
 */
export const pickRandom = (array) => {
  if (!Array.isArray(array) || array.length === 0) return null;
  const index = generateSecureSeed(array.length);
  return array[index];
};

/**
 * Standard debounce implementation.
 */
export const debounce = (fn, wait = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
};

/**
 * Clamps a number between min and max.
 */
export const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));

/**
 * Exposes mock implementations for Perchance plugins in local development.
 */
export const mockPlugins = () => {
  if (!window["pluginAi"]) window["pluginAi"] = async () => "Mock AI Response";
  if (!window["pluginTextToImage"])
    window["pluginTextToImage"] = async () => "https://via.placeholder.com/512x768";
  if (!window["pluginRemember"]) window["pluginRemember"] = { get: () => null, set: () => {} };
  if (!window["pluginSuperFetch"])
    window["pluginSuperFetch"] = async () => ({ text: async () => "" });
  if (!window["pluginUpload"])
    window["pluginUpload"] = async (data) => "https://via.placeholder.com/150";
};

/**
 * Safely accesses Perchance lists injected from the Left Panel.
 * Handles both raw arrays and stringified JSON arrays.
 */
export const getRpgList = (key) => {
  if (typeof window !== "undefined" && window.rpgLists && window.rpgLists[key]) {
    let list = window.rpgLists[key];
    // Check if the first element is a stringified JSON array (Perchance quirk)
    if (Array.isArray(list) && typeof list[0] === "string" && list[0].startsWith("[")) {
      if (list[0].length > 65536) {
        console.warn(`[Helpers] getRpgList: JSON string for key '${key}' exceeds 64KB safety limit.`);
        return list;
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
