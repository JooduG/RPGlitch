import { describe, expect, it } from "vitest";
import { compose_story_beat_prompt, compile_prompt, extract_aesthetic_traits, PURPOSE_CORES, resolve_image_resolution } from "./prompts.js";

function assert_balanced_xml_and_hygiene(prompt) {
  expect(typeof prompt).toBe("string");
  const trimmed = prompt.trim();
  expect(trimmed.startsWith("<SYSTEM")).toBe(true);
  expect(trimmed.endsWith("</SYSTEM>")).toBe(true);
  expect(prompt).not.toMatch(/\{\{([a-zA-Z0-9_-]+)\}\}/);

  const tag_regex = /<\/?([A-Za-z0-9_-]+)(?:\s+[^>]*)?\/?>/g;
  const stack = [];
  let match;
  while ((match = tag_regex.exec(prompt)) !== null) {
    const raw = match[0];
    const name = match[1];
    if (raw.endsWith("/>")) continue;
    if (raw.startsWith("</")) {
      expect(stack.pop()).toBe(name);
    } else {
      stack.push(name);
    }
  }
  expect(stack).toEqual([]);
}

describe("compile_prompt", () => {
  const entities = {
    AI: { id: "A", name: "Al", type: "character", eternal: {}, present: {}, dynamics: {} },
    USER: { id: "U", name: "Us", type: "character", eternal: {}, present: {}, dynamics: {} },
    FRACTAL: { id: "F", name: "Wo", type: "fractal", eternal: {}, present: {}, dynamics: {} },
  };
  it("compiles all cores to a closed, balanced envelope", () => {
    for (const core of ["director", "character", "caretaker", "visualizer"]) {
      const compiled = compile_prompt({ core, round: 1, entities, history: [] });
      expect(compiled).toContain("</SYSTEM>");
      assert_balanced_xml_and_hygiene(compiled);
    }
  });
  it("wires RAG memories when memories == null", () => {
    const with_past = { ...entities, AI: { ...entities.AI, past: "[EVENT: the gate fell | is_origin]" } };
    const compiled = compile_prompt({ core: "character", round: 1, entities: with_past, history: [], memories: null });
    expect(compiled).toContain("MEMORIES");
  });
  it("uppercases unknown cores into the CHARACTER fallback (still returns)", () => {
    const compiled = compile_prompt({ core: "nope", round: 1, entities, history: [] });
    expect(compiled).toContain("</SYSTEM>");
    assert_balanced_xml_and_hygiene(compiled);
  });
  it("honors task_options.target_name when entities is empty", () => {
    const compiled = compile_prompt({
      core: "CARETAKER",
      round: 1,
      entities: {},
      task_options: { target_name: "New Character", target_type: "character", input_data: "wary scout" },
    });
    expect(compiled).toContain('target entity "New Character"');
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

describe("purpose cores + optics", () => {
  it("exposes all four cores", () => {
    for (const core of ["DIRECTOR", "CHARACTER", "CARETAKER", "VISUALIZER"]) expect(PURPOSE_CORES[core]).toBeTruthy();
  });

  it("extract_aesthetic_traits strips VISUAL_EXCLUDED_KEYS and applies bare clothing override", () => {
    const traits = extract_aesthetic_traits({
      eternal: { physical: "[HAIR: auburn], [SHIRT: linen], [INVENTORY: brass key]" },
      present: { physical: "[SHIRT: bare], [SECRET: hidden dagger | hide]" },
      visual_style: "none",
    });
    expect(traits).toContain('"HAIR": "auburn"');
    expect(traits).not.toContain("INVENTORY");
    expect(traits).not.toContain("SECRET");
    expect(traits).not.toContain("SHIRT");
  });

  it("compose_story_beat_prompt prepends style tokens and strips template braces", () => {
    const composed = compose_story_beat_prompt("Neon alley {rain|fog} @ORION", "noir", "watermark");
    expect(composed.prompt).toContain("silver gelatin film print");
    expect(composed.prompt).toContain("ORION");
    expect(composed.prompt).not.toMatch(/[{}@]/);
    expect(composed.negative_prompt).toContain("watermark");
  });

  it("resolve_image_resolution resolves dimensions across objects, strings, and fallbacks", () => {
    expect(resolve_image_resolution("story_scene")).toEqual({ width: 768, height: 512 });
    expect(resolve_image_resolution({ mode: "solo_entity" })).toEqual({ width: 512, height: 768 });
    expect(resolve_image_resolution(null, "story_scene")).toEqual({ width: 768, height: 512 });
  });
});
