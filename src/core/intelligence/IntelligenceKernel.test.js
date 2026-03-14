import { describe, it, expect, vi } from "vitest"
import { ContextBroker } from "./ContextBroker.js"
import { PromptBuilder } from "./PromptBuilder.js"

// Mock runtime state
vi.mock("@state/runtime.svelte.js", () => ({
    runtime: {
        turn: 42,
        active_vector: vi.fn(() => "Investigation"),
        active_ai: { 
            name: "Glitch", 
            fragments: [
                { text: "A digital ghost.", type: "Philosophy", section: "Eternal", layer: "ETERNAL" },
                { text: "The deep web.", type: "History", section: "Eternal", layer: "ETERNAL" }
            ] 
        },
        active_user: { 
            name: "Operator", 
            fragments: [
                { text: "A curious observer.", type: "Philosophy", section: "Eternal", layer: "ETERNAL" }
            ] 
        },
        active_fractal: { 
            name: "The Void", 
            fragments: [
                { text: "An endless expanse.", type: "Nature", section: "Eternal", layer: "ETERNAL" }
            ] 
        }
    }
}))


describe("Intelligence Kernel Integration", () => {
    it("should hydrate context and synthesize a valid system prompt", async () => {
        // 1. Hydrate via ContextBroker (Input, Type, Log)
        const payload = await ContextBroker.hydrate(
            "What is it?",
            "simulation",
            [
                { role: "character", content: "I see something in the shadows." },
                { role: "user", content: "What is it?" }
            ]
        )

        expect(payload.entities.AI.name).toBe("Glitch")
        expect(payload.turn).toBe(42)

        // 2. Synthesize via PromptBuilder
        const snapshot = {
            log: [
                { role: "character", content: "I see something in the shadows." },
                { role: "user", content: "What is it?" }
            ],
            behaviors: ["Direct and cold narrative style."],
            dynamics: {},
            flags: {}
        }

        const prompt = PromptBuilder.synthesize(payload, snapshot)

        // 4. Verify prompt structure
        expect(prompt.system).toContain("<SYSTEM")
        expect(prompt.system).toContain("<YOUR_IDENTITY")
        expect(prompt.system).toContain("Glitch")
        expect(prompt.system).toContain("A digital ghost.")
        expect(prompt.system).toContain("<SIMULATION_LOG>")
        expect(prompt.system).toContain("I see something in the shadows.")
        expect(prompt.system).toContain("<NARRATIVE_STYLE>")
        expect(prompt.system).toContain("Direct and cold")
    })
})

