import { describe, expect, it } from "vitest";
import { compile_prompt, PURPOSE_CORES, resolve_image_resolution, resolve_portrait_visual_style_key, verify_compiled_prompt } from "./prompts.js";

describe("compile_prompt", () => {
  const entities = {
    AI: { id: "A", name: "Al", type: "character", eternal: {}, present: {}, dynamics: {} },
    USER: { id: "U", name: "Us", type: "character", eternal: {}, present: {}, dynamics: {} },
    FRACTAL: { id: "F", name: "Wo", type: "fractal", eternal: {}, present: {}, dynamics: {} },
  };
  it("compiles all cores to a closed envelope", () => {
    for (const core of ["director", "character", "caretaker", "visualizer"]) {
      const compiled = compile_prompt({ core, round: 1, entities, history: [] });
      expect(compiled).toContain("<SYSTEM");
      expect(compiled).toContain("</SYSTEM>");
    }
  });
  it("wires RAG memories when memories == null", () => {
    const with_past = { ...entities, AI: { ...entities.AI, past: "[EVENT: the gate fell | is_origin]" } };
    const compiled = compile_prompt({ core: "character", round: 1, entities: with_past, history: [], memories: null });
    expect(compiled).toContain("MEMORIES");
  });
  it("uppercases unknown cores into the CHARACTER fallback (still returns)", () => {
    const compiled = compile_prompt({ core: "nope", round: 1, entities, history: [] });
    expect(typeof compiled).toBe("string");
    expect(compiled).toContain("</SYSTEM>");
  });
  it("verifier passes a compiled prompt", () => {
    const compiled = compile_prompt({ core: "character", round: 1, entities, history: [] });
    expect(verify_compiled_prompt(compiled).valid).toBe(true);
  });
  it("strips | hide non_physical brackets from COUNTERPART across the Epistemic Wall", () => {
    const guarded = {
      ...entities,
      AI: { ...entities.AI, present: { non_physical: "[SECRET_AI: own hidden thought | hide]" } },
      USER: {
        ...entities.USER,
        eternal: { non_physical: "[WOUND: hidden user trauma | hide]" },
        present: { non_physical: "[PLOT: betray @A | hide], [MOOD: calm | show]" },
      },
    };
    const compiled = compile_prompt({ core: "character", round: 1, entities: guarded, history: [] });
    expect(compiled).toContain("own hidden thought");
    expect(compiled).not.toContain("hidden user trauma");
    expect(compiled).not.toContain("betray @A");
    expect(compiled).toContain("[MOOD: calm]");
  });
  it("preserves memory bracket keys in <MEMORIES> and injects active cast @IDs for CARETAKER", () => {
    const with_past = { ...entities, AI: { ...entities.AI, past: "[BREACH: infiltrated @F | show]" } };
    const char_prompt = compile_prompt({ core: "character", round: 1, entities: with_past, history: [], memories: null });
    expect(char_prompt).toContain("[BREACH: infiltrated @F]");
    const caretaker_prompt = compile_prompt({ core: "caretaker", round: 1, entities: with_past, history: [] });
    expect(caretaker_prompt).toContain("Active cast @IDs: @A (Al), @U (Us), @F (Wo).");
  });
});

describe("purpose cores + portrait", () => {
  it("exposes all four cores", () => {
    for (const core of ["DIRECTOR", "CHARACTER", "CARETAKER", "VISUALIZER"]) expect(PURPOSE_CORES[core]).toBeTruthy();
  });
  it("portrait resolver is pure (entity + explicit app value)", () => {
    expect(resolve_portrait_visual_style_key({ visual_style: "x" }, null)).toBe("none");
  });

  it("resolve_image_resolution resolves dimensions across objects, strings, and fallbacks", () => {
    expect(resolve_image_resolution("story_scene")).toEqual({ width: 768, height: 512 });
    expect(resolve_image_resolution({ mode: "solo_entity" })).toEqual({ width: 512, height: 768 });
    expect(resolve_image_resolution(null, "story_scene")).toEqual({ width: 768, height: 512 });
  });
});
