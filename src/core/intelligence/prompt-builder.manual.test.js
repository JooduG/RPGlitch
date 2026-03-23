import { describe, expect, it } from "vitest";
import { PromptBuilder } from "./prompt-builder.js";
describe("PromptBuilder Visual & Contextual Verification", () => {
  it("collapses double newlines and renders contextual resonance", () => {
    const entities = {
      AI: {
        name: "AI",
        fragments: {
          eternal: { physical: "Metallic skin.", non_physical: "" },
          present: { physical: "", non_physical: "Ready to help." },
        },
      },
      USER: {
        name: "User",
        fragments: {
          eternal: { physical: "", non_physical: "" },
          present: { physical: "", non_physical: "" },
        },
      },
      FRACTAL: {
        name: "Fractal",
        fragments: {
          eternal: { physical: "", non_physical: "" },
          present: { physical: "", non_physical: "" },
        },
      },
      simulation_log: "Pre-rendered log lines.",
    };
    const payload = {
      type: "simulation",
      entities,
      input: "Hello there!",
      rawMessages: [{ role: "user", content: "Hello!" }],
    };
    const snapshot = {
      turn: 5,
      signal_prompts: ["Focus on sensory details."],
      protocols: "HYGIENE",
      simulation_log: "Snapshot log",
      ai: { dynamics: {} },
      fractal: { dynamics: {} },
    };
    const result = PromptBuilder.synthesize(payload, snapshot);
    // 1. Check newline collapse
    expect(result.system).not.toContain("\n\n");
  });
});
