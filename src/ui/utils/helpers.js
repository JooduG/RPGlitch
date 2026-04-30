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
