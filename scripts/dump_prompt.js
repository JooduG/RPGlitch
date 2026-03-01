/**
 * @file scripts/dump_prompt.js
 *
 * Renders the full v5.0 simulation prompt using the ACTUAL source files.
 *
 * NOTE: This script is executed via Vitest to handle Svelte/ESM dependencies.
 * Run with: npx vitest run scripts/dump_prompt.js
 */

import { ContextBroker } from "../src/core/intelligence/intelligence_broker.js"
import { PromptBuilder, SYSTEM_PROMPTS } from "../src/core/intelligence/intelligence_logic.js"
import { runtime } from "../src/state/runtime.svelte.js"

import { describe, it } from "vitest"

describe("v5.0 Prompt Audit (LIVE SOURCE)", () => {
    it("renders a full simulation prompt for manual audit", async () => {
        // 1. Setup Mock State in Runtime
        runtime.addThread("Locate the merchant in the Hollow Market.", true)

        runtime._debugInject({
            ai: {
                name: "The Broker",
                eternal: { physical: "Metallic eyes.", non_physical: "Analytical mind." },
                present: { physical: "Flickering.", non_physical: "Searching data." },
                past: { essence: "Born in a silicon lab." },
                future: { essence: "Wants to be free." },
            },
            user: {
                name: "Freelancer",
                eternal: { physical: "Scars on arm.", non_physical: "Determined." },
                present: { physical: "Heavy breathing.", non_physical: "Fearful." },
                past: { essence: "Lost everything in the Glitch." },
                future: { essence: "Seeking revenge." },
            },
            fractal: {
                name: "Hollow Market",
                description: "Rain slicked streets.",
                eternal: { physical: "Shattered crystals.", non_physical: "A place of secrets." },
                present: { physical: "Smog and neon.", non_physical: "Tense atmosphere." },
                past: { essence: "Once a vibrant hub." },
                future: { essence: "Destined for collapse." },
            },
        })

        // 2. Use the Broker to pull entities (this tests the Universal Entity enhancement)
        const entity_state = await ContextBroker.pullEntities("simulation")

        // Manual override for turn since we can't easily set it on runtime singleton without a setter
        entity_state.turn = 7

        const tone = {
            label: "Cyberpunk/Atmospheric",
            style: "Gritty Noir",
            instructions: ["The air is thick with neon and rain.", "Every shadow hides a secret."],
        }

        const full_prompt = SYSTEM_PROMPTS.simulation({
            tone,
            state: { entity: entity_state },
            input: "I watch the merchant stall from the shadows.",
            visualsAuthorized: true,
        })

        // 3. Test buildImagePrompt (Visual Mode)
        const builder = new PromptBuilder(null)
        const imagePayload = await builder.buildImagePrompt("scene")

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
