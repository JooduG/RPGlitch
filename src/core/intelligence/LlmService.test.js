import { describe, expect, it } from "vitest"
import { sanitize } from "./LlmService.js"

describe("LlmService - sanitize", () => {
    it("should remove outer quotes", () => {
        expect(sanitize('"Hello World"')).toBe("Hello World")
        expect(sanitize("'Hello World'")).toBe("Hello World")
    })

    it("should remove conversational fillers up to a colon", () => {
        // original regex: /^(here is|sure|certainly|i can help|enhanced text:|the enhanced text).*?:/i

        expect(sanitize("Sure: Hello World")).toBe("Hello World")
        expect(sanitize("Certainly: Hello World")).toBe("Hello World")
        expect(sanitize("I can help: Hello World")).toBe("Hello World")
        expect(sanitize("here is the requested text: Hello World")).toBe("Hello World") // matches 'here is'
        expect(sanitize("enhanced text:: Hello World")).toBe("Hello World")
        expect(sanitize("the enhanced text: Hello World")).toBe("Hello World")
    })

    it("should remove code fences", () => {
        expect(sanitize("```\nHello World\n```")).toBe("Hello World")
        expect(sanitize("```javascript\nHello World\n```")).toBe("Hello World")
    })

    it("should trim the result", () => {
        expect(sanitize("  Hello World  ")).toBe("Hello World")
        expect(sanitize("\nHello World\n")).toBe("Hello World")
    })
})
