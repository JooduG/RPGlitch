/**
 * src/core/constants.js
 * 🗝️ SYSTEM CONSTANTS
 * Central registry for application-wide keys and identifiers.
 */

export const DB_NAME = "rpglitch";
export const KV_SETTINGS_KEY = "rpg_settings";
export const SESSION_ID_KEY = "active_session_id";

export const ROLES = {
  USER: "user",
  AI: "assistant",
  SYSTEM: "system",
};

export const TURN_TYPES = {
  USER: "USER_TURN",
  AI: "AI_TURN",
  SYSTEM: "SYSTEM_TURN",
};
