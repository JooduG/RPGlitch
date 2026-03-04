import { PromptBuilder } from "./src/core/intelligence/PromptBuilder.js"

function test_synthesis() {
    console.log("🚀 FINAL VISUAL INSPECTION\n")

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
        associated_entities: [
            {
                name: "The City",
                fragments: [{ type: "Location", text: "Neon lights and rain." }],
            },
        ],
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

    console.log("--- SYNTHESIZED SYSTEM PROMPT ---\n")
    console.log(result.system)
    console.log("\n--- END OF PROMPT ---")

    const newline_check = result.system.includes("\n\n")
    console.log("\nContains double newlines:", newline_check)

    if (!newline_check) {
        console.log("✅ Newline collapse SUCCESS (No double newlines found).")
    } else {
        console.log("❌ Newline collapse FAILED (Double newlines still present).")
    }

    if (result.system.includes("CONTEXTUAL_RESONANCE") && result.system.includes("The City")) {
        console.log("✅ Contextual Resonance SUCCESS.")
    } else {
        console.log("❌ Contextual Resonance FAILED.")
    }
}

test_synthesis()
