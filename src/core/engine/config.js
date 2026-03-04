/**
 * src/core/engine/config.js
 * The Single Source of Truth for the Simulation.
 * Visual constants (PALETTE, RGB_MAP, etc.) live in palette.js.
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
        ADRENALINE_OVERDRIVE_OPENNESS: -10,
        ADRENALINE_OVERDRIVE_AFFINITY: -5,
        STOP_AFFINITY: 10,
        STOP_CHAOS: -5,
        REALITY_CORRUPTION_AFFINITY: -5,
        REALITY_CORRUPTION_INTENSITY: 10,
        PERFECT_LOGIC_OPENNESS: -10,
        PERFECT_LOGIC_INTENSITY: -5,
        MANIC_OBSESSION_CHAOS: -10,
        MANIC_OBSESSION_OPENNESS: -5,
        TOTAL_APATHY_INTENSITY: -10,
        TOTAL_APATHY_CHAOS: 5,

        // FLAG MODIFIERS (Multipliers)
        MODIFIER_EXPOSED_VULNERABILITY_CHAOS: 2.0,
        MODIFIER_IRON_GUARDED_AFFINITY: 0.5,
        MODIFIER_AFFINITY_CASCADE_CHAOS: 0,

        // SPECIAL THRESHOLDS
        AFFINITY_CASCADE_THRESHOLD_AFFINITY: 80,
        AFFINITY_CASCADE_THRESHOLD_CHAOS: 20,
        EVENT_HORIZON_THRESHOLD_INTENSITY: 20,
        EVENT_HORIZON_THRESHOLD_OPENNESS: 80,

        // DYNAMICS_GRAVITY
        DYNAMICS_GRAVITY_STRENGTH: 0.25,
        DYNAMICS_GRAVITY_BASELINE: 50,

        // NAIVETY INDEX
        NAIVETY_THRESHOLD: 0.6,
        NAIVETY_P_E_GIVEN_TRUST: 0.8,
        NAIVETY_P_E_GIVEN_DISTRUST: 0.3,

        // REFLEX DELTAS
        REFLEX_IMPACT_INTENSITY: 10,
        REFLEX_BREATHER_INTENSITY: -10,

        REFLEX_GLITCH_CHAOS: 10,
        REFLEX_CALCULATION_CHAOS: -10,

        REFLEX_DEFENSE_OPENNESS: -10,

        REFLEX_EXPOSURE_OPENNESS: 5,
        REFLEX_EXPOSURE_AFFINITY: 5,

        REFLEX_EMPATHY_AFFINITY: 10,
        REFLEX_EXAMINATION_AFFINITY: -10,

        REFLEX_BETRAYAL_CHAOS: 15,
        REFLEX_BETRAYAL_OPENNESS: -15,

        REFLEX_REVELATION_CHAOS: 10,
        REFLEX_REVELATION_OPENNESS: 10,

        // MNOTION Narrative Weight Map (W=1-10)
        // Maps reflex IDs → Emotional Weight tier.
        // Composite rule: GLITCH + IMPACT → W=10 (handled in DynamicsEngine.evaluate_weight)
        REFLEX_WEIGHT_MAP: {
            BETRAYAL: 9, // Betrayal, deception — Major
            REVELATION: 9, // Confession, sacrifice — Major
            GLITCH: 8, // Nightmare, existential dread — Major
            EXPOSURE: 7, // Intimacy, vulnerability — Significant
            IMPACT: 7, // Violence, conflict — Significant
            EMPATHY: 6, // Connection, vows — Significant
            DEFENSE: 4, // Guarding, resistance — Minor
            EXAMINATION: 3, // Clinical, analytical — Baseline
            BREATHER: 3, // Calm, rest — Baseline
            CALCULATION: 3, // Logic — Baseline
        },

        // LLM VISUAL
        VISUAL_TEMP_DEFAULT: 0.45,
    },

    // --- MESSAGES ---
    MESSAGES: {
        CONNECTION_LOST: "Connection lost with AI server.",
        REFUSAL_TRIGGERS: ["i cannot", "i can't", "cannot generate", "policy", "guidelines", "sorry, but"],
    },
}

// Re-export specific groups for easier destructuring
export const { ROLES, ENTITIES, MESSAGES } = CONFIG
export const ERROR_MESSAGES = MESSAGES
