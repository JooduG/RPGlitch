import { vi, describe, expect, it, beforeEach, afterEach } from "vitest"
import { sanitize, LlmService } from "./LlmService.js"
import { ERROR_MESSAGES } from "@core/engine/config.js"

// Mock app state
vi.mock("@state/app.svelte.js", () => {
    return {
        app: {
            start_stream: vi.fn(),
            update_stream: vi.fn(),
            end_stream: vi.fn(),
            streaming: { active: false }
        }
    }
})

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


describe("LlmService - generate network errors", () => {
    const payload = { system: "Test system prompt" }

    beforeEach(() => {
        vi.clearAllMocks()
        // Reset window.ai mock
        global.window = { ai: vi.fn() }

        // Mock console.error to avoid test output noise
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("should throw Perchance AI plugin not available if window.ai is missing", async () => {
        delete global.window.ai
        await expect(LlmService.generate(payload)).rejects.toThrow("Perchance AI plugin not available.")
    })

    it("should transform 'stream keep alive' errors into CONNECTION_LOST", async () => {
        global.window.ai.mockRejectedValueOnce(new Error("Failed to fetch: stream keep alive"))
        await expect(LlmService.generate(payload)).rejects.toThrow(ERROR_MESSAGES.CONNECTION_LOST)
    })

    it("should transform 'timeout' errors into CONNECTION_LOST", async () => {
        global.window.ai.mockRejectedValueOnce(new Error("Request timeout exceeded"))
        await expect(LlmService.generate(payload)).rejects.toThrow(ERROR_MESSAGES.CONNECTION_LOST)
    })

    it("should re-throw unrecognized errors without modification", async () => {
        const customError = new Error("Some arbitrary JSON parsing error")
        global.window.ai.mockRejectedValueOnce(customError)
        await expect(LlmService.generate(payload)).rejects.toThrow("Some arbitrary JSON parsing error")
    })

    it("should throw the original error if options.silent is true", async () => {
        const networkError = new Error("stream keep alive")
        global.window.ai.mockRejectedValueOnce(networkError)
        await expect(LlmService.generate(payload, { silent: true })).rejects.toThrow(networkError)
    })
})
