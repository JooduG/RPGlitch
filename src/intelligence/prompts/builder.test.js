/**
 * src/intelligence/prompts/builder.test.js
 * 🛠️ UNIT TESTS: PROMPT BUILDER FACADE SERVICE
 */

import { describe, expect, it, vi } from "vitest";
import { prompt_builder } from "./builder.js";

const _mock_app = {
  settings: { narrative_style: "default" },
};

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    state_bridge: {
      get app() {
        return _mock_app;
      },
      get runtime() {
        return { active_fractal: null };
      },
    },
  };
});

describe("Prompt Builder Facade (builder.js)", () => {
  const mock_payload = {
    round: 1,
    entities: {
      AI: {
        name: "Viper",
        present: { non_physical: "Viper Present" },
        eternal: { non_physical: "Viper Eternal" },
        past: [{ directive: "Viper past 1" }],
        future: "Viper future 1",
      },
      USER: {
        name: "Ghost",
        present: { non_physical: "Ghost Present" },
        eternal: { non_physical: "Ghost Eternal" },
        past: [{ directive: "Ghost past 1" }],
        future: "",
      },
      FRACTAL: {
        name: "Void",
        present: { non_physical: "Void Present" },
        eternal: { non_physical: "Void Eternal" },
        past: [{ directive: "Void past 1" }],
        future: "Void future 1",
      },
    },
    simulation_log: [],
    input: "Check the door.",
  };

  const mock_snapshot = {
    ai: { dynamics: {} },
    fractal: { dynamics: {} },
    flags: {},
  };

  it("build_scoring_context() combines input with recent log content", () => {
    const log = [
      { role: "user", content: "I open the door.", character_name: "Ghost" },
      { role: "assistant", text: "The hinges creak.", character_name: "Viper" },
    ];
    const result = prompt_builder.build_scoring_context("Hello", log);
    expect(result).toContain("Hello");
    expect(result).toContain("I open the door.");
    expect(result).toContain("The hinges creak.");
  });

  it("build_scoring_context() only includes the last 10 entries and tolerates empty input", () => {
    const log = Array.from({ length: 14 }, (_, i) => ({ role: "user", content: `Message ${i}` }));
    const result = prompt_builder.build_scoring_context("", log);
    expect(result).toContain("Message 4");
    expect(result).toContain("Message 13");
    expect(result).not.toContain("Message 0");
    expect(result).not.toContain("Message 3");
    expect(prompt_builder.build_scoring_context("", [])).toBe("");
  });

  it("build_prologue() delegates correctly to story prompts", () => {
    const result = prompt_builder.build_prologue(mock_payload, mock_snapshot);
    expect(result.system).toContain("<SYSTEM");
    expect(result.system).toContain('<AI_CHARACTER name="Viper">');
    expect(result.system).toContain("<POV_DIRECTIVE>");
  });

  it("build_epilogue() delegates correctly to story prompts", () => {
    const result = prompt_builder.build_epilogue(mock_payload.entities, { ai: {}, fractal: {} }, []);
    expect(result.system).toContain('<ROLE name="Void" mode="EPILOGUE">');
  });

  it("build_memory() delegates correctly to memory prompts", () => {
    const result = prompt_builder.build_memory({ AI_CHARACTER: { name: "Viper" }, FRACTAL: { name: "Void" } }, [], {
      target_key: "AI_CHARACTER",
    });
    expect(result.system).toContain('<SYSTEM role="CONTINUUM_CARETAKER" target="AI_CHARACTER" name="Viper">');
  });

  it("build_profile_sorting() delegates correctly to profile prompts", () => {
    const result = prompt_builder.build_profile_sorting("Raw text", "character");
    expect(result.system).toContain('role="NARRATIVE_STRUCTURER"');
    expect(result.messages[0].text).toBe("Raw text");
  });

  it("build_enhancement() delegates correctly to profile prompts", () => {
    const result = prompt_builder.build_enhancement("eternal.physical", "Content", "Viper", "character");
    expect(result.system).toContain('enhancing="Permanent Appearance"');
  });
});
