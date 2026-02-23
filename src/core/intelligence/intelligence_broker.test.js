import { ContextBroker } from "@core/intelligence/intelligence_broker.js"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies
vi.mock("@state/app.svelte.js", () => ({
    app: {
        simulation: {
            chrono: {
                currentConflict: "Guards are alert",
            },
            turn: 5,
        },
    },
}))

vi.mock("@state/runtime.svelte.js", () => ({
    runtime: {
        aiCharacter: {
            name: "AI",
            role: "Assistant",
            fragments: [
                { tier: "STATIC", text: "A mysterious helper." },
                { tier: "TEMPORAL", text: "Solid [TACTILE] metal core." },
                { tier: "TEMPORAL", text: "Holographic [VISUAL] shimmering form." },
            ],
        },
        userCharacter: {
            name: "User",
            fragments: [{ tier: "STATIC", text: "The protagonist." }],
        },
        storyFractal: {
            name: "The City",
            description: "A neon metropolis.",
        },
        // Narrative State Mocks
        vanguard: "Find the key",
        echoes: [],
    },
}))

vi.mock("@core/engine/bus.js", () => ({
    state: {
        story: { activeId: "test-story" },
        messages: {
            byStoryId: {
                "test-story": [
                    { role: "user", text: "Hello" },
                    { role: "ai", text: "Hi", characterName: "AI" },
                ],
            },
        },
    },
}))

describe("ContextBroker", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should assemble prose context with Chrono layer", async () => {
        const payload = await ContextBroker.assemble("Look around", "prose")

        expect(payload.system).toContain("<WORLD_LAYER")
        expect(payload.system).toContain('turn="5"')
        expect(payload.system).toContain("<OBJECTIVE>Find the key</OBJECTIVE>")
    })

    it("should filter [VISUAL] tags for prose generation (keep TACTILE)", async () => {
        const payload = await ContextBroker.assemble("Touch the core", "prose")

        expect(payload.system).toContain("<ENTITY_LAYER>")
        // Check for text without the [STATIC] tier prefix
        expect(payload.system).toContain("A mysterious helper.")
        expect(payload.system).toContain("Solid [TACTILE] metal core")
        expect(payload.system).not.toContain("Holographic [VISUAL] shimmering form")
    })

    it("should filter [TACTILE] tags for visual generation (keep VISUAL)", async () => {
        const payload = await ContextBroker.assemble("Render core", "visual")

        expect(payload.system).toContain("<ENTITY_LAYER>")
        expect(payload.system).toContain("Holographic [VISUAL] shimmering form")
        expect(payload.system).not.toContain("Solid [TACTILE] metal core")
    })

    it("should prioritize fragments based on objective", () => {
        const fragments = ["I like apples", "I need to find the door now"]
        const objective = "Find the door"
        const filtered = ContextBroker.LexicalFilter(fragments, objective)

        expect(filtered[0]).toContain("find the door")
    })

    it("should punchy transform text", () => {
        const input = "   Too   much    whitespace   "
        const output = ContextBroker.PunchyTransformer(input)
        expect(output).toBe("Too much whitespace")
    })
})
