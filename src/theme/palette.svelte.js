/**
 * src/theme/palette.svelte.js
 * 🎨 THEME STORE (REACTIVE)
 * Centralized management for Signature Colors using Svelte 5 Runes.
 * Flattened for the Twin-Cylinder architecture.
 */

import { DEFAULT_COLORS, PALETTE, PALETTE_VARS } from "@core/engine/palette.js"
import { normalize } from "@data/content_normaliser.js"

class ThemeStore {
    /************************************************************************************
     * 🧩 [SECTION: CORE PARSERS & HELPERS]
     * ----------------------------------------------------------------------------------
     * Raw string and hex manipulation utilities.
     ************************************************************************************/

    /**
     * Helper to convert Hex to RGB triplet
     * @param {string} hex - "#RRGGBB"
     * @returns {string} - "R, G, B" (Updated to use comma separation for CSS variables)
     */
    hex_to_rgb(hex) {
        if (!hex) return "168, 85, 247" // Default purple (Vibrant Violet)
        const shorthand_regex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
        hex = hex.replace(shorthand_regex, (m, r, g, b) => r + r + g + g + b + b)
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "168, 85, 247"
    }

    /************************************************************************************
     * 🧩 [SECTION: ENTITY RESOLUTION]
     * ----------------------------------------------------------------------------------
     * Determining base aesthetic states from entity data.
     ************************************************************************************/

    /**
     * Delegates to the central normalizer to ensure strict data structure.
     * ZERO backwards compatibility; ignores nested 'visuals' object.
     */
    normalize_entity(entity) {
        if (!entity) return null
        return normalize(entity)
    }

    /**
     * Gets a deterministic color from a seed if no explicit color is set.
     */
    get_deterministic_color(seed) {
        const final_seed = seed || "default"
        let hash = 0
        for (let i = 0; i < final_seed.length; i++) {
            hash = final_seed.charCodeAt(i) + ((hash << 5) - hash)
        }
        const hue = Math.abs(hash) % 360
        return `hsl(${hue}, 40%, 60%)`
    }

    resolve_token(color) {
        if (!color) return null
        if (color.startsWith("var(")) return color
        return PALETTE_VARS[color] || null
    }

    /**
     * Resolves the actual color value (Hex, HSL, or Token) for an entity.
     * Looks at the flattened signature_color property.
     */
    get_signature_color(entity) {
        if (entity) {
            const color = entity.signature_color

            if (color) {
                // 1. Check if it's already a token or a mapped hex
                const token = this.resolve_token(color)
                if (token) return token

                // 2. Check if it's a named palette key (e.g., "Hot Pink")
                if (PALETTE[color]) {
                    const hex = PALETTE[color]
                    return this.resolve_token(hex) || hex
                }

                return color // Fallback to raw hex string
            }
        }

        // Fallback to deterministic color based on name/tags
        const seed = [entity?.name || "", ...(entity?.tags || [])].filter(Boolean).join(",")
        return this.get_deterministic_color(seed || entity?.id || "")
    }

    /************************************************************************************
     * 🧩 [SECTION: CONTRAST & MATH]
     * ----------------------------------------------------------------------------------
     * Luminosity calculations and dynamic color adjustments.
     ************************************************************************************/

    /**
     * Calculates the best contrast color (black or white) for a background.
     */
    get_contrast_color(hex) {
        if (!hex || typeof hex !== "string" || hex.startsWith("hsl")) return "var(--white)"

        let color = hex.replace("#", "")
        if (color.length === 3) {
            color = color
                .split("")
                .map((c) => c + c)
                .join("")
        }

        if (color.length !== 6 || !/^[0-9a-f]{6}$/i.test(color)) return "var(--white)"

        const r = parseInt(color.substr(0, 2), 16)
        const g = parseInt(color.substr(2, 2), 16)
        const b = parseInt(color.substr(4, 2), 16)
        const yiq = (r * 299 + g * 587 + b * 114) / 1000
        return yiq >= 128 ? "var(--black)" : "var(--white)"
    }

    /**
     * Simple darkening utility for borders or hover states.
     */
    darken_color(hex, amount = 20) {
        if (!hex || hex.startsWith("var") || hex.startsWith("hsl")) return hex
        let color = hex.replace("#", "")
        const num = parseInt(color, 16)
        let r = (num >> 16) - amount
        let g = ((num >> 8) & 0x00ff) - amount
        let b = (num & 0x0000ff) - amount
        return "#" + (((r < 0 ? 0 : r) << 16) | ((g < 0 ? 0 : g) << 8) | (b < 0 ? 0 : b)).toString(16).padStart(6, "0")
    }

    /************************************************************************************
     * 🧩 [SECTION: UI FALLBACKS]
     * ----------------------------------------------------------------------------------
     * Generating aesthetic fallbacks for missing assets.
     ************************************************************************************/

    /**
     * Generates initials for avatar fallbacks.
     * Safely strips all punctuation and symbols before extracting letters.
     */
    get_initials(name) {
        if (!name) return "?"

        // 1. Strip everything that is not a letter or a space (removes ', ", -, etc.)
        const clean_name = name.replace(/[^a-zA-Z\s]/g, "")

        const stop_words = new Set(["the", "a", "an", "of", "in", "and", "or", "for", "to", "at", "by", "with"])

        // 2. Split into words
        const words = clean_name.trim().split(/\s+/)

        // 3. Filter stopwords (unless the name *is* just a stopword)
        let filtered_words = words.filter((w) => !stop_words.has(w.toLowerCase()))
        if (filtered_words.length === 0) filtered_words = words

        // 4. Extract first letter of up to 3 words
        return (
            filtered_words
                .slice(0, 3)
                .map((w) => w.charAt(0))
                .join("")
                .toUpperCase() || "?"
        ) // Fallback if name was entirely symbols
    }
}

export const themeStore = new ThemeStore()
export { DEFAULT_COLORS, PALETTE }
