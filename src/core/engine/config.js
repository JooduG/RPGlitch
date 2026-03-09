/**
 * src/core/engine/config.js
 * The Single Source of Truth for Global Architecture.
 * Visual constants (PALETTE, RGB_MAP, etc.) live in palette.js.
 */

export const APP_VERSION = "0.2.0 (Coronation)"

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

    // --- GLOBAL DYNAMICS METRICS ---
    DYNAMICS: {
        // UNIVERSAL THRESHOLDS
        LAW_HIGH: 90,
        SIGNAL_HIGH: 70,
        DYNAMICS_GRAVITY_BASELINE: 50,
        SIGNAL_LOW: 30,
        LAW_LOW: 10,

        // RELEVANCE SCORING (Used exclusively by vector_engine.js for memory RAG)
        RELEVANCE_DYNAMICS_BONUS: 1,
        RELEVANCE_TRIGGER_BONUS: 2,
        RELEVANCE_VECTOR_BONUS: 3,

        // SEMANTIC WEIGHTS (1-10)
        WEIGHT_BASELINE: 3,
        WEIGHT_SIGNIFICANT_THRESHOLD: 7,
        WEIGHT_MAJOR_THRESHOLD: 8,
        WEIGHT_CORE_THRESHOLD: 10,

        // LLM VISUAL
        VISUAL_TEMP_DEFAULT: 0.45,
    },

    // --- MESSAGES & GUARDRAILS ---
    MESSAGES: {
        CONNECTION_LOST: "Connection lost with AI server.",
        REFUSAL_TRIGGERS: ["i cannot", "i can't", "cannot generate", "policy", "guidelines", "sorry, but"],
    },
}

// Re-export specific groups for easier destructuring across the app
export const { ROLES, ENTITIES, MESSAGES } = CONFIG
export const ERROR_MESSAGES = MESSAGES
