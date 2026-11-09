import { describe, expect, it } from "vitest";
import { create_contract_fixtures } from "./fixtures.test-util.js";
import { compile_prompt, PURPOSE_CORES } from "./prompts.js";
import { verify_compiled_prompt } from "./verifier.js";

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
    expect(prompt).not.toContain('"_thought_process"');
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
    expect(prompt).not.toContain('"_thought_process"');
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
    expect(prompt).not.toContain('"_thought_process"');
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

  it("compiles character core with Character Immersion thinking mode and inlined directors note", () => {
    const prompt = compile_prompt({
      core: "character",
      round: 3,
      entities,
      history,
      task_options: {
        directors_note: "Keep your hand near your holster.",
      },
    });

    expect(prompt).toContain('<TASK round="3">');
    expect(prompt).toContain('<SYSTEM identity="character">');
    expect(prompt).not.toContain('<SYSTEM round="3"');
    expect(prompt).toContain("[Role Immersion Requirement]");
    expect(prompt).not.toContain("### Stage Direction");
    expect(prompt).not.toContain("(inner voice: ...)");
    expect(prompt).toContain("Write raw first-person thoughts inside parentheses");
    expect(prompt).toContain("Appraise, Do Not Restate");
    expect(prompt).toContain("Commit to one concrete physical tell");
    expect(prompt).toContain("Never pre-draft spoken dialogue");

    const check = verify_compiled_prompt(prompt);
    expect(check.valid).toBe(true);

    // Verify start_with seeds <think> with note verbatim
    const start_token = PURPOSE_CORES.character.start_with({
      is_character: true,
      directors_note: "Keep your hand near your holster.",
    });
    expect(start_token).toBe("<think>Keep your hand near your holster.\n(");

    // Verify 3rd person POV enforces pivot rule
    const prompt_3rd = compile_prompt({
      core: "character",
      round: 3,
      entities: {
        ...entities,
        AI: { ...entities.AI, pov: "3rd_person" },
      },
      history,
    });
    expect(prompt_3rd).toContain("Pivot immediately to third-person perspective");
    expect(verify_compiled_prompt(prompt_3rd).valid).toBe(true);
  });

  it("compiles fractal world turn with Pure Analysis thinking mode", () => {
    const fractal_prompt = compile_prompt({
      core: "character",
      round: 2,
      entities: {
        AI: { id: "fractal_world", name: "The Citadel", type: "fractal" },
        USER: entities.USER,
        FRACTAL: entities.FRACTAL,
      },
      history,
    });

    expect(fractal_prompt).toContain("[Thinking Mode Requirement]");
    expect(fractal_prompt).toContain("no roleplay-style inner acting");
    expect(fractal_prompt).toContain("Physical causality & spatial resistance");
    expect(fractal_prompt).toContain("Atmospheric shift & environmental reaction");
    expect(fractal_prompt).toContain("Sensory hook for protagonist agency");
    expect(fractal_prompt).not.toContain("[Role Immersion Requirement]");

    const check_fractal = verify_compiled_prompt(fractal_prompt);
    expect(check_fractal.valid).toBe(true);
  });

  it("compiles director core with Pure Analysis thinking mode", () => {
    const director_prompt = compile_prompt({
      core: "director",
      round: 2,
      entities,
      history,
    });

    expect(director_prompt).toContain("[Thinking Mode Requirement]");
    expect(director_prompt).toContain("Causality & stakes");
    expect(director_prompt).toContain("Dynamics deltas & tension");
    expect(director_prompt).toContain("Speaker routing & staging");
    expect(director_prompt).toContain('<TASK round="2">');
    expect(director_prompt).toContain('<SYSTEM identity="director">');
    expect(director_prompt).not.toContain('<SYSTEM round="2"');

    const check_director = verify_compiled_prompt(director_prompt);
    expect(check_director.valid).toBe(true);
  });
});
