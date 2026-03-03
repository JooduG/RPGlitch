import { ContextBroker } from "@core/intelligence/intelligence_broker.js"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies
vi.mock("@state/app.svelte.js", () => ({
    app: {
        simulation: {
            turn: 5,
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
            future: {
                vectors: [{ id: "1", text: "Find the key", priority: "PRIMARY" }],
            },
        },
        // Universal Vector API Mocks
        activeVector: vi.fn((role) => (role === "FRACTAL" ? "Find the key" : null)),
        activeEchoes: vi.fn(() => []),
    },
}))

describe("ContextBroker", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should assemble simulation context with Dynamics layer", async () => {
        const payload = await ContextBroker.assemble("Look around", "simulation")

        expect(payload.system).toMatch(/<STATE[^>]*turn="5"[^>]*>/)
    })

    it("should exclude enhancer and directive metadata in simulation mode", async () => {
        const payload = await ContextBroker.assemble("Who am I?", "simulation")

        expect(payload.system).not.toContain('enhancer="')
        expect(payload.system).not.toContain('directive="')
    })

    it("should prioritize fragments based on objective", () => {
        const fragments = ["I like apples", "I need to find the door now"]
        const objective = "Find the door"
        const filtered = ContextBroker.lexical_filter(fragments, objective)

        expect(filtered[0]).toContain("find the door")
    })

    it("should punchy transform text", () => {
        const input = "   Too   much    whitespace   "
        const output = ContextBroker.clean_text(input)
        expect(output).toBe("Too much whitespace")
    })
})
