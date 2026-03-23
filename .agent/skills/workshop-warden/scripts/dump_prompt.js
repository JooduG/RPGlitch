/**
 * @file .agent/skills/simulation-strategy/scripts/dump_prompt.js
 *
 * Renders the full v5.0 simulation prompt using the ACTUAL source files.
 *
 * NOTE: This script is executed via Vitest to handle Svelte/ESM dependencies.
 * Run with: npx vitest run .agent/skills/simulation-strategy/scripts/dump_prompt.js
 */
import { ContextBroker } from "../../../../src/core/intelligence/context-broker.js";
import { DynamicsEngine } from "../../../../src/core/intelligence/dynamics-engine.js";
import { PromptBuilder } from "../../../../src/core/intelligence/prompt-builder.js";
import { runtime } from "../../../../src/state/runtime.svelte.js";
import { describe, it } from "vitest";

describe("v5.0 Prompt Audit (LIVE SOURCE)", () => {
  it("renders a full simulation prompt for manual audit", async () => {
    runtime._debug_inject({
      ai: {
        name: "Viper",
        eternal: {
          physical: "Metallic eyes.",
          non_physical: "Analytical mind.",
        },
        present: { physical: "Flickering.", non_physical: "Searching data." },
        past: [],
        future: [{ text: "Wants to be free.", timestamp: Date.now() }],
        dynamics: { intensity: 50, chaos: 50, openness: 50, affinity: 50 },
      },
      user: {
        name: "Freelancer",
        eternal: { physical: "Scars on arm.", non_physical: "Determined." },
        present: { physical: "Heavy breathing.", non_physical: "Fearful." },
        past: [],
        future: [{ text: "Seeking revenge.", timestamp: Date.now() }],
        dynamics: { intensity: 50, chaos: 50, openness: 50, affinity: 50 },
      },
      fractal: {
        name: "Hollow Market",
        description: "Rain slicked streets.",
        eternal: {
          physical: "Shattered crystals.",
          non_physical: "A place of secrets.",
        },
        present: {
          physical: "Smog and neon.",
          non_physical: "Tense atmosphere.",
        },
        past: [],
        future: [{ text: "Destined for collapse.", timestamp: Date.now() }],
        dynamics: { velocity: 50, entropy: 50 },
      },
    });

    // 1. Setup Mock State in Runtime
    runtime.log_turn("Locate the merchant in the Hollow Market.", "Narrator", "ai");
    const input = "I watch the merchant stall from the shadows.";

    // 2. Phase 1: Hydration
    const history = []; // Mock history for now
    const payload = await ContextBroker.hydrate(input, "simulation", history);

    // 3. Phase 2: Simulation
    const snapshot = DynamicsEngine.simulate(payload);

    // 4. Phase 3: Synthesis
    const { system } = PromptBuilder.synthesize(payload, snapshot);

    const SEPARATOR = "=".repeat(72);
    const output = `
${SEPARATOR}
  v5.0 PROMPT RENDER - SOURCE AUDIT
${SEPARATOR}
[PHASE 1: HYDRATED PAYLOAD]
Type: ${payload.type}
Entities: ${Object.keys(payload.entities).join(", ")}
${SEPARATOR}
[PHASE 2: SIMULATION SNAPSHOT]
Signal Prompts: ${snapshot.signal_prompts.join(", ") || "None"}
Flags: ${snapshot.flags.join(", ") || "None"}
Dynamics: ${JSON.stringify({ ai: snapshot.ai?.dynamics, fractal: snapshot.fractal?.dynamics })}
${SEPARATOR}
[PHASE 3: SYNTHESIZED XML PROMPT]
${system}
${SEPARATOR}
`;
    console.log(output);

    // Also write to a file for easy reading
    import("fs").then((fs) => {
      fs.writeFileSync("prompt_dump_test.txt", output);
    });
  });
});
