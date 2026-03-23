import { describe, expect, it } from "vitest";
import { prompt_builder } from "./prompt-builder.js";

describe("prompt_builder Visual & Contextual Verification", () => {
  it("synthesize() correctly integrates all core XML blocks", () => {
    const payload = {
      round: 5,
      entities: {
        AI: {
          name: "Viper",
          fragments: { present: { non_physical: "Present" }, eternal: { non_physical: "Eternal" } },
          past: [],
          future: [],
        },
        USER: {
          name: "Ghost",
          fragments: {
            present: { non_physical: "User Present" },
            eternal: { non_physical: "User Eternal" },
          },
          past: [],
          future: [],
        },
        FRACTAL: {
          name: "Void",
          fragments: {
            present: { non_physical: "Void Present" },
            eternal: { non_physical: "Void Eternal" },
          },
          past: [],
          future: [],
        },
      },
      simulation_log: [],
      input: "Check the console.",
    };

    const snapshot = {
      ai: { dynamics: {} },
      fractal: { dynamics: {} },
      flags: {},
      signal_prompts: ["STYLE: Grit"],
    };

    const result = prompt_builder.synthesize(payload, snapshot);

    // Verify presence of tags without strict whitespace dependency
    expect(result.system).toContain('<SYSTEM role="Viper" round="5"');
    expect(result.system).toContain('<YOUR_IDENTITY name="Viper">');
    expect(result.system).toContain('<USER_PERSONA name="Ghost">');
    expect(result.system).toContain('<FRACTAL name="Void">');
    expect(result.system).toContain("<SIMULATION_LOG>");
    expect(result.system).toContain("STYLE: Grit");
    expect(result.system).toContain("<PROTOCOLS>");
    expect(result.system).toContain("<TASK_INSTRUCTION>");
    expect(result.system).toContain("<INPUT_COMMAND>Check the console.</INPUT_COMMAND>");
  });
});
