/**
 * src/data/content_normaliser.js
 * 🧪 CONTENT NORMALISATION LOGIC
 * Enforces the "Temporal Hybrid 6" data structure across the app.
 */

import { PALETTE } from "@core/engine/config.js"
import { Security } from "@core/security.js"

const sanitizeHtml = Security.sanitize

/**
 * Utility to safely access the palette for a random signature key.
 */
export const getRandomSignatureKey = () => {
    const keys = Object.keys(PALETTE).filter((k) => k !== "default")
    return keys[Math.floor(Math.random() * keys.length)]
}

export const STORAGE_VERSION = 3

/**
 * Main Normalizer
 * Enforces the structural integrity of entities within the simulation.
 */
export const normalize = (base = {}) => {
    const { name = "", description = "", icon = null, type = "", eternal = {}, present = {}, past = null, future = null, tags = [], visuals = null, simulation = null, dynamics = null, voiceId = null, _backupState = null, _lastUpdateMsgId = null, customData = {} } = base

    const safeTags = (Array.isArray(tags) ? tags : String(tags || "").split(",")).map((s) => sanitizeHtml(String(s).trim())).filter(Boolean)

    const existingAvatar = (visuals && (visuals.profilePicture || visuals.profilePictureUrl)) || base.profilePicture || base.profilePictureUrl || ""

    return {
        // ========================================
        // CORE METADATA
        // ========================================
        name: sanitizeHtml(name).trim(),
        description: sanitizeHtml(description).trim(),
        profilePicture: sanitizeHtml(existingAvatar).trim(),
        icon,
        type: type,
        tags: safeTags,

        // ========================================
        // TEMPORAL HYBRID (6-Field System)
        // ========================================
        eternal: {
            physical: sanitizeHtml(eternal.physical || base.appearance || "").trim(),
            non_physical: sanitizeHtml(eternal.non_physical || eternal.mental || base.identity || "").trim(),
        },
        present: {
            physical: sanitizeHtml(present.physical || base.outfit || "").trim(),
            non_physical: sanitizeHtml(present.non_physical || present.mental || base.status || "").trim(),
        },
        past: (() => {
            const raw = Array.isArray(past) ? past : past?.vectors || past?.memories || past?.essence || (typeof past === "string" ? past : "")
            const arr = Array.isArray(raw) ? raw : String(raw || "").split("\n")
            return arr
                .map((item) => {
                    if (typeof item === "object" && item !== null) {
                        return {
                            ...item,
                            text: sanitizeHtml(item.text || item.summary || "").trim(),
                        }
                    }
                    return sanitizeHtml(String(item).trim())
                })
                .filter(Boolean)
        })(),
        future: (() => {
            const raw = Array.isArray(future) ? future : future?.vectors || future?.essence || (typeof future === "string" ? future : "")
            const arr = Array.isArray(raw) ? raw : String(raw || "").split("\n")
            return arr
                .map((item) => {
                    if (typeof item === "object" && item !== null) {
                        return {
                            ...item,
                            text: sanitizeHtml(item.text || item.summary || "").trim(),
                        }
                    }
                    return sanitizeHtml(String(item).trim())
                })
                .filter(Boolean)
        })(),

        // ========================================
        // DYNAMICS (Physics Sliders)
        // ========================================
        dynamics: {
            entropy: 10,
            velocity: 10,
            permeability: 50,
            resonance: 50,
            ...(dynamics || {}),
        },

        // ========================================
        // VISUALS (Appearance & Theming)
        // ========================================
        visuals: {
            flipped: visuals?.flipped || false,
            profilePicture: existingAvatar,
            signatureColor: (() => {
                const color = sanitizeHtml(String(visuals?.signatureColor || "")).trim()
                return color || getRandomSignatureKey()
            })(),
        },

        // ========================================
        // VOICE (TTS Configuration)
        // ========================================
        voice: {
            uri: voiceId || "",
            rate: base.voiceRate !== undefined ? parseFloat(base.voiceRate) : 1.0,
            pitch: base.voicePitch !== undefined ? parseFloat(base.voicePitch) : 1.0,
        },

        // ========================================
        // CUSTOM DATA & INTERNAL STATE
        // ========================================
        customData: customData || {},
        simulation,
        _backupState,
        _lastUpdateMsgId,
    }
}

/**
 * Formats a premade entity for storage injection.
 */
export const formatPremade = (entity, type) => {
    const flattenedEntity = {
        ...entity,
        ...(entity.sections || {}),
    }
    delete flattenedEntity.sections

    return {
        ...flattenedEntity,
        type: type,
        isPremade: 1,
        isCustom: 0,
        version: STORAGE_VERSION,
        ...normalize(flattenedEntity),
        updatedAt: 0,
    }
}
