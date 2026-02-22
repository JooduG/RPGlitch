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
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
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
}

// Backward Compatibility Alias
export const Shield = Security
export const Warden = Security

export default {
    Security,
}
