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
