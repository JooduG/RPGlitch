import { describe, it, expect } from "vitest";
import { compile_prompt } from "./prompts.js";
import { verify_compiled_prompt } from "./verifier.js";
import { create_contract_fixtures } from "../intelligence/prompt-verification.js";

describe("src/engine/prompts.js — 11-Block Spatial Spine & 4 Purpose Cores", () => {
  const { entities, history } = create_contract_fixtures();

  it("compiles character prompt matching invariant 11-block spine", () => {
    const prompt = compile_prompt({
      core: "character",
      round: 1,
      entities,
      history,
      memories: ["Alice remembers the rain."],
      input: "Let's check the perimeter.",
    });

    const expected_tags = [
      "SYSTEM",
      "AXIOMATIC_CONSTITUTION",
      "PROTOCOLS",
      "REALITY",
      "CHARACTERS",
      "MAIN_CHARACTER",
      "COUNTERPART",
      "SCENARIO",
      "TRAJECTORY",
      "HISTORY",
      "MEMORIES",
      "RECENT",
      "TASK",
    ];

    const result = verify_compiled_prompt(prompt, { expected_tags });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("compiles director core with structured JSON staging task", () => {
    const prompt = compile_prompt({
      core: "director",
      round: 1,
      entities,
      history,
      input: "Move silently.",
    });

    const result = verify_compiled_prompt(prompt, {
      expected_tags: ["SYSTEM", "REALITY", "CHARACTERS", "SCENARIO", "TRAJECTORY", "HISTORY", "TASK"],
    });

    expect(result.valid).toBe(true);
    expect(prompt).toContain('OUTPUT_FORMAT mode="json"');
    expect(prompt).toContain("directors_note");
  });

  it("compiles caretaker core with structured brackets task", () => {
    const prompt = compile_prompt({
      core: "caretaker",
      round: 1,
      entities,
    });

    const result = verify_compiled_prompt(prompt);
    expect(result.valid).toBe(true);
    expect(prompt).toContain('OUTPUT_FORMAT mode="json"');
    expect(prompt).toContain('"eternal_physical"');
    expect(prompt).toContain('"eternal_non_physical"');
    expect(prompt).toContain('"present_physical"');
    expect(prompt).toContain('"present_non_physical"');
    expect(prompt).toContain('"future"');
    expect(prompt).toContain('"past"');
  });

  it("compiles visualizer core with diffusion prompt directives", () => {
    const prompt = compile_prompt({
      core: "visualizer",
      round: 1,
      entities,
    });

    const result = verify_compiled_prompt(prompt);
    expect(result.valid).toBe(true);
    expect(prompt).toContain("negative_prompt");
  });

  it("omits empty child tags and supports isolated 1-entity prompt generation", () => {
    const single_entity_prompt = compile_prompt({
      core: "character",
      round: 1,
      entities: {
        AI: {
          id: "solo_ai",
          name: "Viper",
          eternal: { non_physical: "Stoic, analytical." },
        },
      },
    });

    // Valid XML structure
    const result = verify_compiled_prompt(single_entity_prompt);
    expect(result.valid).toBe(true);

    // AI is present with only non-empty tags
    expect(single_entity_prompt).toContain('<MAIN_CHARACTER id="solo_ai" name="Viper">');
    expect(single_entity_prompt).toContain("### Personality\n      Stoic, analytical.");
    expect(single_entity_prompt).not.toContain("### State of Mind");
    expect(single_entity_prompt).not.toContain("### Appearance");

    // Absent entities & empty blocks are omitted cleanly
    expect(single_entity_prompt).not.toContain("<COUNTERPART");
    expect(single_entity_prompt).not.toContain("<REALITY>");
    expect(single_entity_prompt).not.toContain("<SCENARIO");
    expect(single_entity_prompt).not.toContain("<TRAJECTORY>");
    expect(single_entity_prompt).not.toContain("<MEMORIES>");
    expect(single_entity_prompt).not.toContain("<RECENT");
  });

  it("includes Continuation Directive and additive pacing budget when task_options.is_continuation is true", () => {
    const prompt = compile_prompt({
      core: "character",
      round: 1,
      entities,
      history,
      task_options: { turn_tempo: 3, is_continuation: true },
    });

    expect(prompt).toContain("Continuation Directive");
    expect(prompt).toContain("Append 3 additional beat(s) beyond the prefilled text");
  });
});
