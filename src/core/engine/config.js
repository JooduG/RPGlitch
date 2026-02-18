/**
 * src/js/gamemaster/config.js
 * The Single Source of Truth for the Simulation.
 * Merges legacy constants.js and physics/config.js.
 */

export const APP_VERSION = "0.2.0 (Coronation)"

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
        "Crimson Red": "#ef4444",
        "Sunset Orange": "#f97316",
        "Pumpkin Amber": "#fbbf24",
        "Lemon Yellow": "#fde047",
        "Lime Green": "#84cc16",
        "Forest Green": "#15803d",
        "Emerald Green": "#10b981",
        "Neon Teal": "#14b8a6",
        "Electric Cyan": "#11aecc",
        "Ocean Blue": "#3b82f6",
        "Deep Indigo": "#818cf8",
        "Twilight Violet": "#c084fc",
        "Royal Purple": "#a855f7",
        "Hot Pink": "#ec4899",
        "Coral Rose": "#fb7185",
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
}

// Re-export specific groups for easier destructuring if needed
export const { ROLES, ENTITIES, PALETTE, MESSAGES, DEFAULT_COLORS } = CONFIG
export const ERROR_MESSAGES = MESSAGES

export const IMG_RESOLUTION = CONFIG.VISUALS.RESOLUTION

export const PROFILE_PICTURE_PLACEHOLDERS = {
    default:
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTEyIDhhNCA0IDAgMSAwIDAtOCA0IDQgMCAwIDAgMCA4eiIvPjxwYXRoIGQ9Ik02IDIxdi0yYTYgNiAwIDAgMSAxMiAweiIvPjwvc3ZnPg==",
}

export const RGB_MAP = {
    "Crimson Red": "239, 68, 68",
    "Sunset Orange": "249, 115, 22",
    "Pumpkin Amber": "251, 191, 36",
    "Lemon Yellow": "253, 224, 71",
    "Lime Green": "132, 204, 22",
    "Forest Green": "21, 128, 61",
    "Emerald Green": "16, 185, 129",
    "Neon Teal": "20, 184, 166",
    "Electric Cyan": "17, 174, 204",
    "Ocean Blue": "59, 130, 246",
    "Deep Indigo": "129, 140, 248",
    "Twilight Violet": "192, 132, 252",
    "Royal Purple": "168, 85, 247",
    "Hot Pink": "236, 72, 153",
    "Coral Rose": "251, 113, 133",
    default: "168, 85, 247",
}
