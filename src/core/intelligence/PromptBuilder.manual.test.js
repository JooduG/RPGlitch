import { describe, expect, it } from "vitest"
import { PromptBuilder } from "./PromptBuilder.js"

describe("PromptBuilder Visual & Contextual Verification", () => {
    it("collapses double newlines and renders contextual resonance", () => {
        const entities = {
            AI: {
                name: "AI",
                layers: {
                    ETERNAL: [{ type: "Physical", text: "Metallic skin." }],
                    PRESENT: [{ type: "Non-Physical", text: "Ready to help." }],
                },
            },
            USER: { name: "User", layers: { ETERNAL: [], PRESENT: [] } },
            FRACTAL: { name: "Fractal", layers: { ETERNAL: [], PRESENT: [] } },
            simulation_log: "Pre-rendered log lines.",
        }

        const payload = {
            type: "simulation",
            entities,
            input: "Hello there!",
            rawMessages: [{ role: "user", content: "Hello!" }],
        }

        const snapshot = {
            turn: 5,
            behaviors: ["Focus on sensory details."],
            protocols: "HYGIENE",
            simulation_log: "Snapshot log",
        }

        const result = PromptBuilder.synthesize(payload, snapshot)

        console.log("--- SYNTHESIZED SYSTEM PROMPT (VISUAL CHECK) ---\n")
        console.log(result.system)

        // 1. Check newline collapse
        expect(result.system).not.toContain("\n\n")
    })
})
