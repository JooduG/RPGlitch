/**
 * src/core/engine/config.js
 * The Single Source of Truth for the Simulation.
 * Merges legacy constants.js and physics/config.js.
 */

export const APP_VERSION = "0.2.0 (Coronation)"

export const CONFIG = {
    // --- ENTITY TYPES ---
    ENTITIES: {
        AI: "ai_character",
        USER: "user_persona",
        FRACTAL: "fractal",
    },

    // --- ROLES ---
    ROLES: {
        USER: "user",
        AI: "ai",
        FRACTAL: "fractal",
        SYSTEM: "system",
    },

    // --- DYNAMICS HEARTBEAT ---
    DYNAMICS: {
        // DYNAMICS LAW THRESHOLDS (Post-Gravity Calibration)
        LAW_HIGH: 90,
        SIGNAL_HIGH: 70,
        SIGNAL_LOW: 30,
        LAW_LOW: 10,

        // DYNAMICS LAW EFFECTS (Values derived from Tests)
        ADRENALINE_OVERDRIVE_PERMEABILITY: -10,
        ADRENALINE_OVERDRIVE_RESONANCE: -5,
        STOP_RESONANCE: 10,
        STOP_ENTROPY: -5,
        REALITY_CORRUPTION_RESONANCE: -5,
        REALITY_CORRUPTION_VELOCITY: 10,
        PERFECT_LOGIC_PERMEABILITY: -10,
        PERFECT_LOGIC_VELOCITY: -5,
        MANIC_OBSESSION_ENTROPY: -10,
        MANIC_OBSESSION_PERMEABILITY: -5,
        TOTAL_APATHY_VELOCITY: -10,
        TOTAL_APATHY_ENTROPY: 5,

        // FLAG MODIFIERS (Multipliers)
        MODIFIER_EXPOSED_VULNERABILITY_ENTROPY: 2.0,
        MODIFIER_IRON_BUNKER_RESONANCE: 0.5,
        MODIFIER_RESONANCE_CASCADE_ENTROPY: 0,

        // SPECIAL THRESHOLDS
        RESONANCE_CASCADE_THRESHOLD_RESONANCE: 80,
        RESONANCE_CASCADE_THRESHOLD_ENTROPY: 20,
        EVENT_HORIZON_THRESHOLD_VELOCITY: 20,
        EVENT_HORIZON_THRESHOLD_PERMEABILITY: 80,

        // DYNAMICS_GRAVITY
        DYNAMICS_GRAVITY_STRENGTH: 0.25,
        DYNAMICS_GRAVITY_BASELINE: 50,

        // REFLEX DELTAS
        REFLEX_IMPACT_VELOCITY: 10,
        REFLEX_BREATHER_VELOCITY: -10,

        REFLEX_GLITCH_ENTROPY: 10,
        REFLEX_CALCULATION_ENTROPY: -10,

        REFLEX_DEFENSE_PERMEABILITY: -10,

        REFLEX_EXPOSURE_PERMEABILITY: 5,
        REFLEX_EXPOSURE_RESONANCE: 5,

        REFLEX_EMPATHY_RESONANCE: 10,
        REFLEX_EXAMINATION_RESONANCE: -10,

        // LLM VISUAL
        VISUAL_TEMP_DEFAULT: 0.45,
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
        REFUSAL_TRIGGERS: ["i cannot", "i can't", "cannot generate", "policy", "guidelines", "sorry, but"],
    },
}

// Re-export specific groups for easier destructuring if needed
export const { ROLES, ENTITIES, PALETTE, MESSAGES, DEFAULT_COLORS } = CONFIG
export const ERROR_MESSAGES = MESSAGES

export const IMG_RESOLUTION = CONFIG.VISUALS.RESOLUTION

export const PROFILE_PICTURE_PLACEHOLDERS = {
    // [VISUALS PLACEHOLDER] Should eventually use ImageGeneration
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
