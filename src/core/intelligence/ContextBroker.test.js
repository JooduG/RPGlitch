import { beforeEach, describe, expect, it, vi } from "vitest"
import { ContextBroker } from "./ContextBroker.js"

// Mock dependencies
vi.mock("@state/app.svelte.js", () => ({
    app: {
        simulation: {
            dynamics: { velocity: 50, entropy: 50, permeability: 50, resonance: 50 },
        },
    },
}))

vi.mock("@state/runtime.svelte.js", () => ({
    runtime: {
        turn: 5,
        active_ai: {
            name: "AI",
            role: "Assistant",
            fragments: [
                { section: "Eternal", text: "A mysterious helper.", enhancer: "CORE" },
                { section: "Physical", text: "Solid metal core.", enhancer: "PHYSICAL" },
                { section: "Visual", text: "Holographic shimmering form.", enhancer: "PHYSICAL" },
            ],
        },
        active_user: {
            name: "User",
            fragments: [{ section: "Eternal", text: "The protagonist.", enhancer: "USER" }],
        },
        active_fractal: {
            name: "The City",
            description: "A neon metropolis.",
            future: [{ id: "1", text: "Find the key", priority: "PRIMARY" }],
        },
        // Universal Vector API Mocks
        active_vector: vi.fn((role) => (role === "FRACTAL" ? "Find the key" : "EXPLORE")),
        active_echoes: vi.fn(() => []),
    },
}))

describe("ContextBroker (Refactored)", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should hydrate an IntelligencePayload with consistent structure", async () => {
        const payload = await ContextBroker.hydrate("Look around", "simulation")

        expect(payload.turn).toBe(5)
        expect(payload.input).toBe("Look around")
        expect(payload.entities.AI.name).toBe("AI")
        expect(payload.entities.USER.name).toBe("User")
    })

    it("should include physical and visual fields in simulation mode", async () => {
        const payload = await ContextBroker.hydrate("Who am I?", "simulation")

        // Physical and Visual fragments should now be INCLUDED in simulation mode
        const ai_fragments = payload.entities.AI.fragments
        const has_physical = ai_fragments.some((f) => f.section === "Physical" || f.section === "Visual")
        expect(has_physical).toBe(true)
    })

    it("should group fragments by layer key", async () => {
        const payload = await ContextBroker.hydrate("Check layers", "simulation")
        const ai = payload.entities.AI

        // layers object must exist alongside flat fragments
        expect(ai.layers).toBeDefined()
        expect(typeof ai.layers).toBe("object")

        // The mock has Eternal and Physical/Visual fragments, so at least one layer should exist
        const layer_keys = Object.keys(ai.layers)
        expect(layer_keys.length).toBeGreaterThan(0)

        // Each layer value should be an array of fragments
        layer_keys.forEach((key) => {
            expect(Array.isArray(ai.layers[key])).toBe(true)
        })
    })

    it("should prioritize fragments based on objective in lexical_filter", () => {
        const fragments = [{ text: "I like apples" }, { text: "I need to find the door now" }]
        const objective = "Find the door"
        const filtered = ContextBroker.lexical_filter(fragments, objective)

        expect(filtered[0].text).toContain("find the door")
    })

    it("should punchy transform text with clean_text", () => {
        const input = "   Too   much    whitespace   "
        const output = ContextBroker.clean_text(input)
        expect(output).toBe("Too much whitespace")
    })
})
