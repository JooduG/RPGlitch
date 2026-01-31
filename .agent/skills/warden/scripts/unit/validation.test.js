import { Security } from "@core/physics/index.js"
import { describe, expect, test, vi } from "vitest"

const sanitizeHtml = Security.sanitize

// Mock DOMPurify for sanitizeHtml tests
vi.mock("dompurify", async () => {
    const mockModule = await import("../mocks/dompurify.js")
    return mockModule
})

describe("validation.js", () => {
    // [REMOVED] isValidImageUrl and extractImageUrl tests (Functions deprecated/moved)

    // ============================================================================
    // sanitizeHtml() Tests
    // ============================================================================
    describe("sanitizeHtml()", () => {
        test("removes script tags", () => {
            const input = '<p>Hello</p><script>alert("XSS")</script>'
            const output = sanitizeHtml(input)
            expect(output).not.toContain("<script>")
            expect(output).toContain("<p>Hello</p>")
        })

        test("removes inline event handlers", () => {
            const input = '<img src="x" onerror="alert(1)">'
            const output = sanitizeHtml(input)
            expect(output).not.toContain("onerror")
        })

        test("preserves safe HTML", () => {
            const input = "<p>Hello <strong>World</strong></p>"
            const output = sanitizeHtml(input)
            expect(output).toBe(input)
        })

        test("handles non-string input gracefully", () => {
            expect(sanitizeHtml(123)).toBe("123")
            expect(sanitizeHtml(null)).toBe("")
            expect(sanitizeHtml(undefined)).toBe("")
        })

        test("handles empty string", () => {
            expect(sanitizeHtml("")).toBe("")
        })
    })

    // [REMOVED] Color tests moved to theme.test.js or covered by entities.test.js
})
