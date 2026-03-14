/**
 * Unit tests for ThemeStore and Color Generation logic
 * Ported from legacy entities.test.js
 */

import { themeStore } from "@theme/palette.svelte.js"
import { describe, expect, test } from "vitest"

describe("ThemeStore Color Generation", () => {
    const get_signature = (e) => themeStore.get_signature_color(e)

    describe("Modern entities with signature_color", () => {
        test("returns hex value for entity with signature_color", () => {
            const entity = { signature_color: "Electric Cyan" }
            const result = get_signature(entity)
            expect(result).toBe("var(--signature-cyan)")
        })

        test("returns hex value for entity with pink signature_color", () => {
            const entity = { signature_color: "Hot Pink" }
            const result = get_signature(entity)
            expect(result).toBe("var(--signature-pink)")
        })

        test("returns hex value for entity with emerald signature_color", () => {
            const entity = { signature_color: "Emerald Green" }
            const result = get_signature(entity)
            expect(result).toBe("var(--signature-emerald)")
        })
    })

    describe("Deterministic color generation fallback", () => {
        test("generates deterministic color for entity with name only", () => {
            const entity = { name: "Aether Blade" }
            const result = get_signature(entity)
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })

        test("generates deterministic color for entity with name and tags", () => {
            const entity = {
                name: "Mystic Bard",
                tags: ["magic", "music"],
            }
            const result = get_signature(entity)
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })

        test("generates consistent color for same entity data", () => {
            const entity1 = { name: "Clockwork Rogue", tags: ["stealth"] }
            const entity2 = { name: "Clockwork Rogue", tags: ["stealth"] }
            const result1 = get_signature(entity1)
            const result2 = get_signature(entity2)
            expect(result1).toBe(result2)
        })

        test("generates different colors for different entity data", () => {
            const entity1 = { name: "Entity A" }
            const entity2 = { name: "Entity B" }
            const result1 = get_signature(entity1)
            const result2 = get_signature(entity2)
            expect(result1).not.toBe(result2)
        })

        test("uses id as fallback seed when name is empty", () => {
            const entity = { id: "char-123", name: "" }
            const result = get_signature(entity)
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })

        test("uses kind as fallback seed when name and id are empty", () => {
            const entity = { kind: "character", name: "", id: "" }
            const result = get_signature(entity)
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })

        test("handles completely empty entity gracefully", () => {
            const entity = {}
            const result = get_signature(entity)
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })
    })

    describe("Edge cases and robustness", () => {
        test("handles undefined entity parameter", () => {
            const result = get_signature()
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })

        test("handles null entity parameter", () => {
            const result = get_signature(null)
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })

        test("handles entity with empty signature_color string", () => {
            const entity = { signature_color: "" }
            const result = get_signature(entity)
            // Empty string is falsy, should fall through
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })

        test("handles entity with empty palette object", () => {
            const entity = { palette: {} }
            const result = get_signature(entity)
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })

        test("handles entity with null palette.brand", () => {
            const entity = { palette: { brand: null } }
            const result = get_signature(entity)
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })

        test("handles entity with empty tags array", () => {
            const entity = { name: "Test", tags: [] }
            const result = get_signature(entity)
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })

        test("handles entity with undefined tags", () => {
            const entity = { name: "Test", tags: undefined }
            const result = get_signature(entity)
            expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/)
        })
    })
})
