/**
 * src/js/gamemaster/config.js
 * The Single Source of Truth for the Simulation.
 * Merges legacy constants.js and physics/config.js.
 */

export const APP_VERSION = "0.2.0 (Coronation)";

export const CONFIG = {
  // --- ENTITY TYPES ---
  ENTITIES: {
    AI: "ai_character",
    USER: "user_character",
    FRACTAL: "fractal",
  },

  // --- ROLES ---
  ROLES: {
    USER: "user",
    AI: "ai",
    FRACTAL: "fractal",
    SYSTEM: "system",
  },

  // --- PHYSICS HEARTBEAT ---
  PHYSICS: {
    HEARTBEAT_RATE: 5,
    ECHO_RATE: 10,

    // LAW THRESHOLDS
    LAW_HIGH: 90,
    LAW_LOW: 10,

    // LAW EFFECTS (Values derived from Tests)
    ADRENALINE_PERM: -10,
    ADRENALINE_RES: -5,
    DEEP_BREATH_RES: 10,
    DEEP_BREATH_ENT: -5,
    FOG_RES: -5,
    FOG_VEL: 10,
    CRYSTAL_PERM: -10,
    CRYSTAL_VEL: -5,
    OBSESSION_ENT: -10,
    OBSESSION_PERM: -5,
    APATHY_VEL: -10,
    APATHY_ENT: 5,

    // SPECIAL THRESHOLDS
    ECHO_THRESHOLD_RES: 80,
    ECHO_THRESHOLD_ENT: 20,
    VENUS_THRESHOLD_VEL: 20,
    VENUS_THRESHOLD_PERM: 80,

    // GRAVITY
    GRAVITY_STRENGTH: 0.25,
    GRAVITY_BASELINE: 50,

    // REFLEX DELTAS
    REFLEX_VIOLENCE_VELOCITY: 20,
    REFLEX_INTIMACY_PERMEABILITY: 20,
    REFLEX_INTIMACY_RESONANCE: 20,
    REFLEX_FEAR_ENTROPY: 20,
    REFLEX_SYNCHRONY_RESONANCE: 15,
    REFLEX_STASIS_VELOCITY: -20,
    REFLEX_SHIELDED_PERMEABILITY: -20,
    REFLEX_ORDERED_ENTROPY: -15,
    REFLEX_DETACHED_RESONANCE: -15,

    // LLM VISUAL
    VISUAL_TEMP_DEFAULT: 0.45,
  },

  // --- LIMITS ---
  LIMITS: {
    NAME_LEN: 50,
    DESC_LEN: 500,
    TAGS_LEN: 5,
    HISTORY_WINDOW: 30, // For Context
  },

  // --- THRESHOLDS (Symmetric Model) ---
  THRESHOLDS: {
    LAW_HIGH: 90,
    SIGNAL_HIGH: 70,
    SIGNAL_LOW: 30,
    LAW_LOW: 10,
    ECHO_RES: 80,
    ECHO_ENT: 20,
    VENUS_VEL: 20,
    VENUS_PERM: 80,
  },

  // --- LLM GENERATION PARAMS ---
  LLM: {
    TEMP_BASE: 0.7,
    TEMP_ENTROPY_WEIGHT_AI: 0.8,
    TEMP_ENTROPY_WEIGHT_FRACTAL: 0.2,
    VISUAL_TEMP_DEFAULT: 0.45,
    PENALTY_BASE: 1.05,
    TOP_P_BASE: 0.85,
  },

  // --- VISUAL DYNAMICS ---
  VISUALS: {
    RESOLUTION: "512x768",
    GUIDANCE_BASE: 7,
    GUIDANCE_MIN: 4,
    GUIDANCE_MAX: 10,
  },

  // --- COLORS (Vibrant Mix) ---
  PALETTE: {
    red: "#ef4444",
    rose: "#f43f5e",
    orange: "#f97316",
    amber: "#f59e0b",
    yellow: "#eab308",
    lime: "#84cc16",
    emerald: "#10b981",
    cyan: "#06b6d4",
    sky: "#0ea5e9",
    indigo: "#6366f1",
    violet: "#8b5cf6",
    purple: "#a855f7",
    pink: "#ec4899",
    stone: "#78716c",
    zinc: "#71717a",
    default: "#a855f7",
  },

  DEFAULT_COLORS: {
    USER: "#aecbfa",
    AI: "#fde293",
    FRACTAL: "#e8eaed",
    SYSTEM: "#f28b82",
  },

  // --- MESSAGES ---
  MESSAGES: {
    CONNECTION_LOST: "Connection lost with AI server.",
    REFUSAL_TRIGGERS: [
      "i cannot",
      "i can't",
      "cannot generate",
      "policy",
      "guidelines",
      "sorry, but",
    ],
  },
};

// Re-export specific groups for easier destructuring if needed
export const { ROLES, ENTITIES, PALETTE, MESSAGES } = CONFIG;
export const ERROR_MESSAGES = MESSAGES;

export const IMG_RESOLUTION = CONFIG.VISUALS.RESOLUTION;

export const PROFILE_PICTURE_PLACEHOLDERS = {
  default:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTEyIDhhNCA0IDAgMSAwIDAtOCA0IDQgMCAwIDAgMCA4eiIvPjxwYXRoIGQ9Ik02IDIxdi0yYTYgNiAwIDAgMSAxMiAweiIvPjwvc3ZnPg==",
};

export const RGB_MAP = {
  red: "239, 68, 68",
  rose: "244, 63, 94",
  orange: "249, 115, 22",
  amber: "245, 158, 11",
  yellow: "234, 179, 8",
  lime: "132, 204, 22",
  emerald: "16, 185, 129",
  cyan: "6, 182, 212",
  sky: "14, 165, 233",
  indigo: "99, 102, 241",
  violet: "139, 92, 246",
  purple: "168, 85, 247",
  pink: "236, 72, 153",
  stone: "120, 113, 108",
  zinc: "113, 113, 122",
  default: "168, 85, 247",
};
