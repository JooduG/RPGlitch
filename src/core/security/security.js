import DOMPurify from "dompurify"

/**
 * src/core/security/security.js
 * 🛡️ SECURITY: The Shield
 * Zero-Trust enforcement and data sanitization.
 */

// 1. Sanitize HTML (Zero-Trust)
export const sanitize = (dirty) => {
    if (typeof window === "undefined") return dirty
    return DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: false }) // String output
}

// 2. Escape Logic
export const escape = (str) => {
    if (!str) return ""
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

// Stub for now, can be expanded
export const checkRefusal = (text) => false
export const clean = (text) => (text ? text.trim() : "")
export const Security = {
    sanitize,
    escape,
    checkRefusal,
    clean,

    // Physics & Authorization
    authorizeVisuals: (prompt, options) => true,

    // [DEPRECATED] Physics now handled by src/core/narrative/engine.js
    applyLaws: (input) => input,

    /**
     * [DEPRECATED] Process an action through the Shield's security & physics checks.
     * Logic moved to NarrativeEngine.
     */
    process: async (input, character, fractalState) => {
        return {
            causality: { result: "success" },
            reflex: null,
        }
    },
}

// Backward Compatibility Alias
export const Shield = Security
export const Warden = Security

export default {
    Security,
}
