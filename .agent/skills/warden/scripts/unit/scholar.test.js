import { beforeEach, describe, expect, test, vi } from "vitest"

// Mock LLM Service
vi.mock("@core/llm/service.js", () => {
    return {
        LlmService: {
            generate: vi.fn(),
        },
    }
})

// Import after mocks
import { LlmService } from "@core/llm/service.js"
import { ContextBuilder } from "@core/prompts/context.js"
import { Echo } from "@core/prompts/echo.js"

describe("Echo System (Memory Consolidation)", () => {
    let echo

    beforeEach(() => {
        vi.clearAllMocks()
        echo = new Echo()
    })

    test("memorize() processes history and returns structured updates", async () => {
        // Mock LLM to return structured memory update
        LlmService.generate.mockResolvedValue({
            generatedText: JSON.stringify({
                past_update: "New Memory",
                state: { mental: "Enlightened" },
            }),
        })

        const mockEntity = { name: "Test Character" }
        const mockHistory = [{ role: "user", content: "Hello" }]

        const result = await echo.memorize(mockEntity, mockHistory, "character")

        expect(result).toEqual({
            past_update: "New Memory",
            state: { mental: "Enlightened" },
        })
        expect(LlmService.generate).toHaveBeenCalled()
    })

    test("memorize() handles JSON parsing errors gracefully", async () => {
        // Mock LLM to return invalid JSON
        LlmService.generate.mockResolvedValue({
            generatedText: "Invalid JSON response",
        })

        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {})
        const result = await echo.memorize({ name: "Test" }, [], "character")
        consoleSpy.mockRestore()

        expect(result).toBeNull()
    })

    test("memorize() returns null for missing entity", async () => {
        const result = await echo.memorize(null, [], "character")
        expect(result).toBeNull()
        expect(LlmService.generate).not.toHaveBeenCalled()
    })
})

describe("ContextBuilder (Scholar Prompts)", () => {
    let builder

    beforeEach(() => {
        vi.clearAllMocks()
        builder = new ContextBuilder("test-story")
    })

    test("buildScholarPrompt() creates enhancement prompt for field", () => {
        const result = builder.buildScholarPrompt(
            "past",
            "Old memories of childhood",
            { name: "Hero", type: "character" }
        )

        // Should return a prompt structure
        expect(result).toBeDefined()
        expect(typeof result).toBe("object")
    })

    test("buildScholarEchoPrompt() creates memory consolidation prompt", async () => {
        const mockEntity = {
            name: "Test Character",
            timeline: { past: "Old past" },
        }
        const mockHistory = [
            { role: "user", content: "What happened?" },
            { role: "assistant", content: "Something important." },
        ]

        const result = await builder.buildScholarEchoPrompt(
            mockEntity,
            mockHistory,
            "character"
        )

        // Should return prompt payload
        expect(result).toBeDefined()
        expect(typeof result).toBe("object")
    })
})
