import { describe, expect, test, vi } from "vitest"
import { Security } from "./security.js"

const sanitizeHtml = Security.sanitize
const sanitizeToFragment = Security.sanitizeToFragment

// Mock DOMPurify for sanitizeHtml tests
vi.mock("dompurify", () => ({
    default: {
        sanitize: vi.fn((input, options) => {
            let str = typeof input !== "string" ? String(input || "") : input
            // Simple mock logic for stripping script tags and onerror in unit tests
            str = str.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "").replace(/onerror\s*=\s*["']?([^"']+)["']?/gim, "")

            if (options && options.RETURN_DOM_FRAGMENT) {
                // Mock a document fragment with some simple properties for tests
                return {
                    nodeType: 11, // DocumentFragment
                    textContent: str,
                    __isMockFragment: true,
                }
            }
            return str
        }),
    },
}))

describe("validation.js", () => {
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

    describe("sanitizeToFragment()", () => {
        test("returns a DocumentFragment-like object", () => {
            const input = "<p>Hello</p>"
            const output = sanitizeToFragment(input)
            expect(output.nodeType).toBe(11) // DocumentFragment nodeType
            expect(output.__isMockFragment).toBe(true)
        })

        test("removes script tags in fragment text content", () => {
            const input = '<p>Hello</p><script>alert("XSS")</script>'
            const output = sanitizeToFragment(input)
            expect(output.textContent).not.toContain("<script>")
            expect(output.textContent).toContain("<p>Hello</p>")
        })
    })
})
