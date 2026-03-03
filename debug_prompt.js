import fs from "fs"
import { vi } from "vitest"
import { ContextBroker } from "./src/core/intelligence/intelligence_broker.js"

// Mock dependencies
vi.mock("./src/state/app.svelte.js", () => ({
    app: {
        simulation: {
            turn: 5,
        },
    },
}))

vi.mock("./src/state/runtime.svelte.js", () => ({
    runtime: {
        turn: 5,
        activeAI: {
            name: "AI",
            role: "Assistant",
            fragments: [{ section: "Eternal", text: "A mysterious helper.", enhancer: "CORE" }],
        },
        activeUser: {
            name: "User",
            fragments: [{ section: "Eternal", text: "The protagonist.", enhancer: "USER" }],
        },
        activeFractal: {
            name: "The City",
            description: "A neon metropolis.",
            future: {
                vectors: [{ id: "1", text: "Find the key", priority: "PRIMARY" }],
            },
        },
        activeVector: (role) => (role === "FRACTAL" ? "Find the key" : null),
        activeEchoes: () => [],
    },
}))

vi.mock("./src/core/engine/bus.js", () => ({
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

async function run() {
    const payload = await ContextBroker.assemble("Look around", "simulation")
    fs.writeFileSync("debug_prompt.txt", payload.system)
}

run()
