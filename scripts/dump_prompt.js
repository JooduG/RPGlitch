/**
 * @file scripts/dump_prompt.js
 *
 * Renders the full v5.0 simulation prompt using the ACTUAL source files.
 *
 * NOTE: This script is executed via Vitest to handle Svelte/ESM dependencies.
 * Run with: npx vitest run scripts/dump_prompt.js
 */

import { ContextBroker } from "../src/core/intelligence/intelligence_broker.js"
import { PromptBuilder, SYSTEM_PROMPTS } from "../src/core/intelligence/prompt_builder.js"
import { runtime } from "../src/state/runtime.svelte.js"

import { describe, it } from "vitest"

describe("v5.0 Prompt Audit (LIVE SOURCE)", () => {
    it("renders a full simulation prompt for manual audit", async () => {
        runtime._debugInject({
            ai: {
                name: "The Broker",
                eternal: { physical: "Metallic eyes.", non_physical: "Analytical mind." },
                present: { physical: "Flickering.", non_physical: "Searching data." },
                past: { memories: [] },
                future: { vectors: [{ text: "Wants to be free.", timestamp: Date.now() }] },
            },
            user: {
                name: "Freelancer",
                eternal: { physical: "Scars on arm.", non_physical: "Determined." },
                present: { physical: "Heavy breathing.", non_physical: "Fearful." },
                past: { essence: [] },
                future: { vectors: [{ text: "Seeking revenge.", timestamp: Date.now() }] },
            },
            fractal: {
                name: "Hollow Market",
                description: "Rain slicked streets.",
                eternal: { physical: "Shattered crystals.", non_physical: "A place of secrets." },
                present: { physical: "Smog and neon.", non_physical: "Tense atmosphere." },
                past: { essence: [] },
                future: { vectors: [{ text: "Destined for collapse.", timestamp: Date.now() }] },
            },
        })

        // 1. Setup Mock State in Runtime (AFTER inject to ensure vectors exist)
        runtime.log_turn("Locate the merchant in the Hollow Market.", true)

        // 2. Use the Broker to pull entities (this tests the Universal Entity enhancement)
        const entity_state = ContextBroker.pull_entities("simulation")

        // Manual override for turn since we can't easily set it on runtime singleton without a setter
        entity_state.turn = 7

        const tone = {
            label: "Cyberpunk/Atmospheric",
            style: "Gritty Noir",
            instructions: ["The air is thick with neon and rain.", "Every shadow hides a secret."],
        }

        const full_prompt = SYSTEM_PROMPTS.simulation({
            tone,
            state: {
                entity: entity_state,
                recentMessages: runtime.simulation_log.by_story_id[runtime.story_id || "debug"] || [],
            },
            input: "I watch the merchant stall from the shadows.",
            visualsAuthorized: true,
        })

        // 3. Test buildImagePrompt (Visual Mode)
        const builder = new PromptBuilder()
        const imagePayload = builder.build_image_prompt("scene")

        const SEPARATOR = "=".repeat(72)
        const output = `
${SEPARATOR}
  v5.0 PROMPT RENDER - SOURCE AUDIT
${SEPARATOR}

[SIMULATION PROMPT (SIMULATION MODE)]
${full_prompt}

${SEPARATOR}
[IMAGE PAYLOAD (IMAGE MODE)]
${JSON.stringify(imagePayload, null, 2)}

${SEPARATOR}
`
        console.log(output)

        // Also write to a file for easy reading
        import("fs").then((fs) => {
            fs.writeFileSync("prompt_dump_test.txt", output)
        })
    })
})
