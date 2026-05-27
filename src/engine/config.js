/**
 * src/core/engine/config.js
 * ⚔️ The Single Source of Truth for Global Architecture.
 * Aligning with the Chalk Regime (Nordic Collection).
 */
import { TOKENS } from "@media";

export const APP_VERSION = "0.3.0 (Chalk Regime)";

export const CONFIG = {
  // --- ENTITY TYPES ---
  // Used by ContextBroker and Database to know what we are fetching
  ENTITIES: {
    AI: "ai_character",
    USER: "user_persona",
    FRACTAL: "fractal",
  },

  // --- ROLES ---
  // Used by the chat log and PromptBuilder to format the LLM payload
  ROLES: {
    USER: "user",
    AI: "ai",
    FRACTAL: "fractal",
    SYSTEM: "system",
  },

  // --- VIEW STATES ---
  // Core navigation phases of the Chalk Regime
  VIEWS: {
    STORYBOARD: "storyboard", // Entity selection & setup
    STORYMODE: "storymode", // Live narrative simulation
  },

  // --- DYNAMICS ---
  DYNAMICS: {
    // RELEVANCE SCORING (VectorEngine.js)
    RELEVANCE_DYNAMICS_BONUS: 1,
    RELEVANCE_TRIGGER_BONUS: 2,
    RELEVANCE_VECTOR_BONUS: 3,

    // LLM VISUAL / TEMPERATURE
    VISUAL_TEMP_DEFAULT: 0.45,
    NARRATIVE_TEMP_DEFAULT: 0.7,

    // TEXT STREAMING
    STREAM_SPEED_MS: 30,
  },

  // --- MESSAGES & GUARDRAILS ---
  MESSAGES: {
    CONNECTION_LOST: "Connection lost with the Abyss.",
    REFUSAL_TRIGGERS: [
      "i cannot",
      "i can't",
      "cannot generate",
      "policy",
      "guidelines",
      "sorry, but",
    ],
  },

  THEME: {
    // @ts-ignore
    get GRID_UNITS() {
      return parseInt(TOKENS["column-unit"] || "12");
    },
    get ANIMATION_STANDARD() {
      return TOKENS["duration-standard"];
    },
    get EASE_STANDARD() {
      return TOKENS["ease-standard"];
    },
  },
};

// Re-export specific groups for easier destructuring across the app
export const { ROLES, ENTITIES, MESSAGES, VIEWS, THEME } = CONFIG;
export const ERROR_MESSAGES = MESSAGES;
