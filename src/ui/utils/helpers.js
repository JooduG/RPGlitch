/**
 * src/ui/utils/helpers.js
 * PURE UTILITIES
 * Stateless helper functions for the RPGlitch engine.
 */

import { generateUUID, generateSecureSeed, pickRandom, debounce, clamp } from "@core/utils.js";

export { generateUUID, generateSecureSeed, pickRandom, debounce, clamp };

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
