import { ContextBroker } from "@core/intelligence/broker.js"
import { describe, expect, it, vi } from "vitest"

// Mock dependencies
vi.mock("@state/runtime.svelte.js", () => ({
    runtime: {
        aiCharacter: {
            name: "AI",
            role: "Narrator",
            timeline: { past: "Found a key." },
            present: { physical: "Standing by the door" },
            eternal: { mental: "Calm" },
        },
        userCharacter: { name: "Player", description: "A curious traveler" },
        storyFractal: { name: "Lobby", description: "A dark room." },
    },
}))

vi.mock("@state/app.svelte.js", () => ({
    app: {
        simulation: {
            turn: 5,
            chrono: {
                activeObjective: "Find the door",
                currentConflict: "High Tension",
            },
        },
    },
}))

vi.mock("@core/engine/bus.js", () => ({
    state: {
        story: { activeId: "test-story" },
        messages: {
            byStoryId: {
                "test-story": [
                    { role: "user", text: "Hello", characterName: "Player" },
                    { role: "ai", text: "Welcome", characterName: "AI" },
                ],
            },
        },
    },
}))

describe("ContextBroker", () => {
    it("should assemble a prose prompt with all layers", async () => {
        const payload = await ContextBroker.assemble("Look around", "prose")

        expect(payload.system).toContain("[CHRONO_LAYER]")
        expect(payload.system).toContain("STEP: 5")
        expect(payload.system).toContain("OBJECTIVE: Find the door")

        expect(payload.system).toContain("[ENTITY_LAYER]")
        expect(payload.system).toContain("ACTOR: AI (Narrator)")
        expect(payload.system).toContain("Found a key")

        expect(payload.system).toContain("[NARRATIVE_SNAPSHOT]")
        expect(payload.system).toContain("[Player]: Hello")
        expect(payload.system).toContain("[AI]: Welcome")
    })

    it("should prioritize fragments based on objective", () => {
        const fragments = ["I like apples", "I need to find the door now"]
        const objective = "Find the door"
        const filtered = ContextBroker.LexicalFilter(fragments, objective)

        expect(filtered[0]).toContain("find the door")
    })

    it("should condense text with PunchyTransformer", () => {
        const longText =
            "This is a very long string of text that should definitely be condensed by the transformer utility to keep the prompt lean and efficient."
        const shortText = ContextBroker.PunchyTransformer(longText, 20)

        expect(shortText.length).toBeLessThan(longText.length)
        expect(shortText).toContain("...")
    })
})
