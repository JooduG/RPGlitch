import { describe, expect, it } from "vitest"
import { PromptBuilder } from "./PromptBuilder.js"

describe("PromptBuilder Visual & Contextual Verification", () => {
    it("collapses double newlines and renders contextual resonance", () => {
        const entities = {
            AI: {
                name: "AI",
                properties: {
                    eternal: { physical: "Metallic skin.", non_physical: "" },
                    present: { physical: "", non_physical: "Ready to help." },
                },
            },
            USER: { name: "User", properties: { eternal: { physical: "", non_physical: "" }, present: { physical: "", non_physical: "" } } },
            FRACTAL: { name: "Fractal", properties: { eternal: { physical: "", non_physical: "" }, present: { physical: "", non_physical: "" } } },
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
