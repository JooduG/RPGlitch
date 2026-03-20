import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { sanitize, LlmService } from "./LlmService.js"
import { app } from "@state/app.svelte.js"
import { ERROR_MESSAGES } from "@core/engine/config.js"

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


describe("LlmService - generate", () => {
    let originalWindowAi

    beforeEach(() => {
        // Save original window.ai
        originalWindowAi = window.ai
        // Mock app streaming methods
        vi.spyOn(app, "start_stream").mockImplementation(() => {})
        vi.spyOn(app, "update_stream").mockImplementation(() => {})
        vi.spyOn(app, "end_stream").mockImplementation(() => {})

        // Suppress console.error and console.warn during tests
        vi.spyOn(console, "error").mockImplementation(() => {})
        vi.spyOn(console, "warn").mockImplementation(() => {})
    })

    afterEach(() => {
        // Restore original window.ai
        window.ai = originalWindowAi
        vi.restoreAllMocks()
    })

    it("should throw an error if window.ai is not available", async () => {
        window.ai = undefined
        await expect(LlmService.generate({ messages: [] }, { silent: true })).rejects.toThrow(
            "Perchance AI plugin not available."
        )
    })

    it("should correctly format conversation history", () => {
        const messages = [
            { role: "user", text: "Hello" },
            { role: "ai", content: "Hi there", character_name: "Assistant" },
            { role: "system", content: "You are helpful." }
        ]
        const formatted = LlmService._format_history(messages)
        expect(formatted).toBe("User: Hello\n\nAssistant: Hi there\n\nCharacter: You are helpful.")
    })

    it("should call window.ai with correct instruction assembly", async () => {
        window.ai = vi.fn().mockResolvedValue("Mocked response")

        const payload = {
            system: "System prompt",
            startWith: "Start with this",
            messages: [{ role: "user", text: "Hello" }]
        }

        await LlmService.generate(payload, { silent: true, raw: true })

        const expectedInstruction = "System prompt\n\n\n\n[CONVERSATION HISTORY]\nUser: Hello\n\n\n\n[START RESPONSE WITH]\nStart with this"

        expect(window.ai).toHaveBeenCalledWith(expectedInstruction, expect.any(Object))
    })

    it("should handle streaming callbacks and update app state", async () => {
        const mockResponse = "Chunk1Chunk2"

        window.ai = vi.fn().mockImplementation(async (instruction, options) => {
            options.onToken("Chunk1")
            options.onToken("Chunk2")
            return mockResponse
        })

        const onTokenSpy = vi.fn()
        const payload = { node_id: "test-node", messages: [] }

        await LlmService.generate(payload, { onToken: onTokenSpy, silent: false, raw: true })

        expect(app.start_stream).toHaveBeenCalledWith("test-node")
        expect(app.update_stream).toHaveBeenNthCalledWith(1, "Chunk1")
        expect(app.update_stream).toHaveBeenNthCalledWith(2, "Chunk2")
        expect(app.end_stream).toHaveBeenCalled()
        expect(onTokenSpy).toHaveBeenCalledTimes(2)
        expect(onTokenSpy).toHaveBeenLastCalledWith("Chunk2")
    })

    it("should handle options.silent and not update app streaming state", async () => {
        window.ai = vi.fn().mockImplementation(async (instruction, options) => {
            options.onToken("Chunk")
            return "Chunk"
        })

        const payload = { messages: [] }

        await LlmService.generate(payload, { silent: true, raw: true })

        expect(app.start_stream).not.toHaveBeenCalled()
        expect(app.update_stream).not.toHaveBeenCalled()
        // end_stream is not called on success if silent is true based on the code:
        // if (!options.silent) app.end_stream()
        expect(app.end_stream).not.toHaveBeenCalled()
    })

    it("should sanitize output by default", async () => {
        window.ai = vi.fn().mockResolvedValue("```\nHere is the response\n```")

        const payload = { messages: [] }

        const result = await LlmService.generate(payload, { silent: true })

        expect(result).toBe("Here is the response")
    })

    it("should not sanitize output if options.raw is true", async () => {
        window.ai = vi.fn().mockResolvedValue("```\nHere is the response\n```")

        const payload = { messages: [] }

        const result = await LlmService.generate(payload, { silent: true, raw: true })

        expect(result).toBe("```\nHere is the response\n```")
    })

    it("should handle timeout/keep alive network errors", async () => {
        window.ai = vi.fn().mockRejectedValue(new Error("stream keep alive timeout"))

        const payload = { messages: [] }

        await expect(LlmService.generate(payload, { silent: false })).rejects.toThrow(ERROR_MESSAGES.CONNECTION_LOST)

        expect(app.end_stream).toHaveBeenCalled()
        expect(console.error).toHaveBeenCalled()
    })

    it("should rethrow generic errors when silent is true", async () => {
        const error = new Error("Generic error")
        window.ai = vi.fn().mockRejectedValue(error)

        const payload = { messages: [] }

        await expect(LlmService.generate(payload, { silent: true })).rejects.toThrow("Generic error")
        expect(console.warn).toHaveBeenCalled()
    })

    it("should execute enhance correctly", async () => {
        window.ai = vi.fn().mockResolvedValue("```\nEnhanced response\n```")

        const payload = { messages: [] }

        const result = await LlmService.enhance(payload)

        expect(result).toBe("Enhanced response")
        // Called with raw: true inside enhance, then sanitized explicitly
        expect(window.ai).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            silent: true
        }))
    })
})
