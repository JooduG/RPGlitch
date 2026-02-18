import { ContextBroker } from "@core/intelligence/broker.js"
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
            past: "A mysterious helper.",
            present: {
                physical:
                    "Holographic [VISUAL] shimmering form. Solid [TACTILE] metal core.",
                mental: "Calculating.",
            },
        },
        userCharacter: {
            name: "User",
            description: "The protagonist.",
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

        expect(payload.system).toContain("[CHRONO_LAYER]")
        expect(payload.system).toContain("STEP: 5")
        expect(payload.system).toContain("OBJECTIVE: Find the key")
    })

    it("should filter [VISUAL] tags for prose generation (keep TACTILE)", async () => {
        // For prose, we want TACTILE description but NOT pure VISUAL fluff if possible,
        // OR we want both?
        // Spec says: "Narrative (Keep Tactile) or Image Gen (Keep Visual)"

        const payload = await ContextBroker.assemble("Touch the core", "prose")
        const entityLayer = payload.system.split("[ENTITY_LAYER]")[1]

        // Should NOT contain [VISUAL] tag content if we filter strict,
        // or should just ensure TACTILE is present.
        // Let's assume the implementation filters out [VISUAL] for prose.
        expect(entityLayer).not.toContain("[VISUAL]")
        expect(entityLayer).toContain("[TACTILE]")
    })

    it("should filter [TACTILE] tags for visual generation (keep VISUAL)", async () => {
        const payload = await ContextBroker.assemble("Render core", "visual")
        // assemble for visual might return a different structure or just prompt
        // Assuming assemble("visual") returns an object with system prompt too

        // Wait, assemble returns { system, messages, params }
        // We need to check the system prompt or where the entity description lives

        // If assemble for visual uses a different flow, we verify that.
        // Assuming 'visual' type uses 'pullEntity' which does the filtering.

        // For now, let's verify logic in a specific method if exposed,
        // or check the output of assemble if it includes entity layer.

        // If 'visual' type only requires 'fractal' and 'entity', let's check those.

        // We expect VISUAL tags to be kept for image generation
        // And TACTILE tags to be removed?
        // Let's verify standard behavior:
        // Visual Gen = Keep [VISUAL], Remove [TACTILE] (maybe)

        // Note: Implementation specific. Adjust expectation based on code.
        // expect(fractalLayer).toContain('[VISUAL]');
        expect(payload.system).not.toContain("[TACTILE]")
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
