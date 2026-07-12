/**
 * src/core/engine/config.js
 * ⚔️ The Single Source of Truth for Global Architecture.
 */

export const APP_VERSION = "0.3.0";
export const SESSION_ID_KEY = "active_session_id";

export const CONFIG = {
  ENTITIES: {
    AI: "ai_character",
    USER: "user_persona",
    FRACTAL: "fractal",
  },
  ROLES: {
    USER: "user",
    AI: "ai",
    FRACTAL: "fractal",
    SYSTEM: "system",
  },
  VIEWS: {
    STORYBOARD: "storyboard",
    STORYMODE: "storymode",
  },
};

export const { ROLES, ENTITIES, VIEWS } = CONFIG;
