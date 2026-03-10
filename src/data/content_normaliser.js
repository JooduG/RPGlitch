/**
 * src/data/content_normaliser.js
 * 🧪 CONTENT NORMALISATION LOGIC
 * Enforces the strict "Twin-Cylinder" data structure across the app.
 * ZERO BACKWARDS COMPATIBILITY.
 */

import { PALETTE } from "@core/engine/palette.js"
import { Security } from "@core/security.js"

const sanitizeHtml = Security.sanitize

export const STORAGE_VERSION = 3

/**
 * 🐣 ENTITY TEMPLATES
 * Defines the initial structure for new entities born in the Library.
 * Fields are empty strings so that UI 'placeholder' attributes can work correctly.
 */
export const ENTITY_TEMPLATES = {
    character: {
        name: "New Character",
        type: "character",
        description: "",
        dynamics: {
            chaos: 50,
            intensity: 50,
            openness: 50,
            affinity: 50,
        },
        eternal: { physical: "", non_physical: "" },
        present: { physical: "", non_physical: "" },
        past: [],
        future: [],
    },
    fractal: {
        name: "New Fractal",
        type: "fractal",
        description: "",
        dynamics: {
            velocity: 50,
            entropy: 50,
        },
        eternal: { physical: "", non_physical: "" },
        present: { physical: "", non_physical: "" },
        past: [],
        future: [],
    },
}

/**
 * Utility to safely access the palette for a random signature key.
 */
export const getRandomSignatureKey = () => {
    const keys = Object.keys(PALETTE).filter((k) => k !== "default")
    return keys[Math.floor(Math.random() * keys.length)]
}

/**
 * Main Normalizer
 * Enforces structural integrity and sanitization.
 */
export const normalize = (base = {}) => {
    // [FIX] Destructure id, timestamps, and database flags so they aren't lost
    const {
        id,
        created_at,
        updated_at,
        originId,
        isPremade,
        isCustom,
        name = "",
        description = "",
        type = "character",
        eternal = {},
        present = {},
        past = [],
        future = [],
        tags = [],
        signature_color = "",
        profile_picture = "",
        dynamics = null,
        voice = {},
        customData = {},
        _backupState = null,
        _lastUpdateMsgId = null,
    } = base

    const result = {
        // --- CORE METADATA ---
        name: sanitizeHtml(name).trim(),
        description: sanitizeHtml(description).trim(),
        type: type,
        signature_color: sanitizeHtml(String(signature_color)).trim() || getRandomSignatureKey(),
        profile_picture: sanitizeHtml(String(profile_picture)).trim(),
        tags: (Array.isArray(tags) ? tags : []).map((s) => sanitizeHtml(String(s).trim())).filter(Boolean),

        // --- TEMPORAL HYBRID 6 (PURGED: appearance, identity, outfit, status) ---
        eternal: {
            physical: sanitizeHtml(eternal?.physical ?? "").trim(), // Use ?? "" instead of || ""
            non_physical: sanitizeHtml(eternal?.non_physical ?? "").trim(),
        },
        present: {
            physical: sanitizeHtml(present?.physical ?? "").trim(),
            non_physical: sanitizeHtml(present?.non_physical ?? "").trim(),
        },
        past: Array.isArray(past) ? past : [],
        future: Array.isArray(future) ? future : [],

        // --- DYNAMICS (Physics Sliders) ---
        dynamics: (() => {
            if (dynamics && Object.keys(dynamics).length > 0) return { ...dynamics }
            // Seed from type-template on birth
            return ENTITY_TEMPLATES[type]?.dynamics ? { ...ENTITY_TEMPLATES[type].dynamics } : {}
        })(),

        // --- VOICE ---
        voice: {
            uri: voice?.uri || "",
            rate: voice?.rate || 1.0,
            pitch: voice?.pitch || 1.0,
        },

        // --- INTERNAL ---
        customData: customData || {},
        _backupState,
        _lastUpdateMsgId,
    }

    // [CRITICAL FIX] Preserve database identity and timestamps!
    // Without this, Profile.svelte's `{#if char && char.id}` will fail and remain hidden.
    if (id) result.id = id
    if (created_at) result.created_at = created_at
    if (updated_at) result.updated_at = updated_at
    if (originId) result.originId = originId
    if (isPremade !== undefined) result.isPremade = isPremade
    if (isCustom !== undefined) result.isCustom = isCustom

    return result
}

/**
 * 🏭 THE FACTORY
 * Creates a brand new, fully normalized entity with a RANDOM signature color.
 */
export const createNew = (type = "character", overrides = {}) => {
    const template = ENTITY_TEMPLATES[type] || ENTITY_TEMPLATES.character
    const newEntity = {
        ...template,
        ...overrides,
        signature_color: getRandomSignatureKey(), // Random color on birth
        created_at: Date.now(),
        updated_at: Date.now(),
        id: crypto.randomUUID(),
    }
    return normalize(newEntity)
}

/**
 * Formats a premade entity for storage injection.
 */
export const formatPremade = (entity, type) => {
    return {
        ...entity,
        type: type,
        isPremade: 1,
        version: STORAGE_VERSION,
        ...normalize(entity),
        updated_at: 0,
    }
}
