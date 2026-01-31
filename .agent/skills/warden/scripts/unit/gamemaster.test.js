import { EVENTS } from "@core/session/bus.js"
import { GameMaster } from "@core/session/index.js"
import { beforeEach, describe, expect, test, vi } from "vitest"

// --- MOCKS ---

vi.mock("@core/session/session.js", () => ({
    Session: {
        addAiMessage: vi.fn(),
        requireActive: vi.fn().mockReturnValue("story-1"),
    },
}))

vi.mock("@core/llm/service.js", () => ({
    LlmService: {
        generate: vi.fn(),
    },
}))

vi.mock("@core/llm/broker.js", () => ({
    ContextBroker: {
        assemble: vi.fn(),
    },
}))

vi.mock("@core/session/bus.js", () => ({
    events: {
        dispatchEvent: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    },
    EVENTS: {
        GENERATION_STARTED: "gen:started",
        GENERATION_COMPLETED: "gen:completed",
        ENTITY_UPDATED: "entity:updated",
        STATE_CHANGED: "state:changed",
    },
    state: {},
}))

vi.mock("@state/runtime.svelte.js", () => ({
    runtime: {
        aiCharacter: { name: "AI" },
        _initListeners: vi.fn(),
    },
}))

// Import mocks to inspect
import { ContextBroker } from "@core/llm/broker.js"
import { LlmService } from "@core/llm/service.js"
import { events } from "@core/session/bus.js"
import { Session } from "@core/session/session.js"

describe("GameMaster Facade", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("generateAiResponse", () => {
        test("should orchestrate generation flow successfully", async () => {
            // Setup
            const mockPayload = { system: "prompt", messages: [] }
            const mockResponse = "Hello World"
            ContextBroker.assemble.mockResolvedValue(mockPayload)
            LlmService.generate.mockResolvedValue(mockResponse)

            // Execute
            await GameMaster.generateAiResponse("story-1", { input: "Hi" })

            // Verify
            expect(ContextBroker.assemble).toHaveBeenCalledWith("Hi", "prose")
            expect(events.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({ type: EVENTS.GENERATION_STARTED })
            )
            expect(LlmService.generate).toHaveBeenCalledWith(mockPayload)
            expect(Session.addAiMessage).toHaveBeenCalledWith(
                mockResponse,
                "AI"
            )
            expect(events.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({ type: EVENTS.GENERATION_COMPLETED })
            )
        })

        test("should handle errors and dispatch completion event", async () => {
            ContextBroker.assemble.mockRejectedValue(
                new Error("Assembly Failed")
            )

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {})

            await expect(
                GameMaster.generateAiResponse("story-1", { input: "Fail" })
            ).rejects.toThrow("Assembly Failed")

            expect(events.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({ type: EVENTS.GENERATION_COMPLETED })
            )

            consoleSpy.mockRestore()
        })
    })
})
