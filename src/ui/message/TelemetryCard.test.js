import { describe, expect, test } from "vitest";

import { process_entity_blocks, resolve_entity_name, vector_label } from "./telemetry.js";

describe("TelemetryCard Telemetry Logic", () => {
  test("reads the updates shape into per-entity blocks (dynamics + present_mutations + new vectors)", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      updates: {
        AI_CHARACTER: {
          name: "Lord Benedict Silvers",
          present_mutations: {
            physical: "[EXPRESSION: predatory curiosity]",
            non_physical: "He feels a flicker of genuine interest.",
          },
          eternal_mutations: { physical: "", non_physical: "" },
          vectors: {
            new: [{ id: "valerius-f3", content: "Corner Glitch against the sterile walls.", type: "future", emotional_weight: 8 }],
            retrieval: [
              { id: "valerius-p1", content: "He was exiled from the Ashenweald court.", type: "past", emotional_weight: 10, _relevance: 10.9 },
            ],
          },
          dynamics: [
            { axis: "chaos", old_value: 46, new_value: 48, diff: 2 },
            { axis: "affinity", old_value: 54, new_value: 55, diff: 1 },
          ],
        },
        USER_PERSONA: {
          name: "Glitch",
          present_mutations: { physical: "[EXPRESSION: wide-eyed realization]", non_physical: "His heart hammers against his ribs." },
          vectors: { new: [{ content: "Attempt to hack the blast doors open.", type: "future", emotional_weight: 6 }] },
        },
      },
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["ai", "user"]);

    const ai = blocks[0];
    expect(ai.name).toBe("Lord Benedict Silvers");
    expect(ai.dynamics).toEqual([
      { axis: "chaos", value: 48, old_value: 46, new_value: 48, diff: 2, has_delta: true },
      { axis: "affinity", value: 55, old_value: 54, new_value: 55, diff: 1, has_delta: true },
    ]);
    expect(ai.physical).toBe("[EXPRESSION: predatory curiosity]");
    expect(ai.non_physical).toBe("He feels a flicker of genuine interest.");
    expect(ai.new_vectors).toEqual([{ type: "future", weight: 8, id: "valerius-f3", content: "Corner Glitch against the sterile walls." }]);

    const user = blocks[1];
    expect(user.name).toBe("Glitch");
    expect(user.dynamics).toEqual([]);
    expect(user.new_vectors).toEqual([{ type: "future", weight: 6, content: "Attempt to hack the blast doors open." }]);
  });

  test("updates shape: an entity with only new vectors still gets a block", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      updates: {
        FRACTAL: {
          name: "Project Tartarus",
          present_mutations: { physical: "[ALARM: red strobe]", non_physical: "" },
          vectors: { new: [{ content: "A pheromone gas leaks into the corridor.", type: "future", emotional_weight: 7 }] },
        },
      },
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["fractal"]);
    expect(blocks[0].dynamics).toEqual([]);
    expect(blocks[0].new_vectors).toEqual([{ type: "future", weight: 7, content: "A pheromone gas leaks into the corridor." }]);
    expect(blocks[0].retrieval).toEqual([]);
  });

  test("updates shape: eternal mutations map to the block and count as mods", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      updates: {
        FRACTAL: {
          name: "Project Tartarus",
          present_mutations: { physical: "", non_physical: "" },
          eternal_mutations: { physical: "[SCAR: rune-etched sigil]", non_physical: "The machine now speaks in a fractured dialect." },
          vectors: { new: [] },
        },
      },
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["fractal"]);
    expect(blocks[0].eternal_physical).toBe("[SCAR: rune-etched sigil]");
    expect(blocks[0].eternal_non_physical).toBe("The machine now speaks in a fractured dialect.");
    expect(blocks[0].physical).toBe("");
    expect(blocks[0].has_mods).toBe(true);
  });

  test("updates shape: new vectors carry their generated id through to the block", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      updates: {
        AI_CHARACTER: {
          name: "Lord Benedict Silvers",
          present_mutations: { physical: "", non_physical: "" },
          vectors: {
            new: [{ id: "valerius-f3", content: "Corner Glitch against the sterile walls.", type: "future", emotional_weight: 8 }],
          },
        },
      },
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks[0].new_vectors).toEqual([{ type: "future", weight: 8, id: "valerius-f3", content: "Corner Glitch against the sterile walls." }]);
  });

  test("updates shape: retrieval vectors expose their source type (past vs future)", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      updates: {
        AI_CHARACTER: {
          name: "Lord Benedict Silvers",
          present_mutations: { physical: "", non_physical: "" },
          vectors: {
            new: [],
            retrieval: [
              { id: "valerius-p1", content: "He was exiled from the Ashenweald court.", type: "past", emotional_weight: 10, _relevance: 10.9 },
              { id: "valerius-f3", content: "Corner Glitch against the sterile walls.", type: "future", emotional_weight: 8, _relevance: 8.1 },
            ],
          },
        },
      },
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["ai"]);
    expect(blocks[0].retrieval).toEqual([
      { type: "past", id: "valerius-p1", content: "He was exiled from the Ashenweald court.", relevance: 10.9 },
      { type: "future", id: "valerius-f3", content: "Corner Glitch against the sterile walls.", relevance: 8.1 },
    ]);
  });

  test("updates shape: omits entities with no content", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      updates: {
        AI_CHARACTER: { name: "Vesper", present_mutations: { physical: "", non_physical: "" }, vectors: { new: [] } },
        FRACTAL: { name: "Orb" },
      },
    };

    expect(process_entity_blocks(meta)).toEqual([]);
  });

  test("updates shape: dynamics use old_value/new_value with deltas flagged", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      updates: {
        AI_CHARACTER: {
          name: "Vesper",
          present_mutations: { physical: "", non_physical: "" },
          vectors: { new: [] },
          dynamics: [{ axis: "openness", old_value: 42, new_value: 38, diff: -4 }],
        },
      },
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks[0].dynamics).toEqual([{ axis: "openness", value: 38, old_value: 42, new_value: 38, diff: -4, has_delta: true }]);
  });

  test("resolves telemetry entity keys to display names from runtime", () => {
    const runtime = { active_ai: { name: "Kestrel" }, active_fractal: { name: "Hollow" }, active_user: { name: "Rook" } };
    expect(resolve_entity_name("AI_CHARACTER", runtime)).toBe("Kestrel");
    expect(resolve_entity_name("FRACTAL", runtime)).toBe("Hollow");
    expect(resolve_entity_name("USER_PERSONA", runtime)).toBe("Rook");
    expect(resolve_entity_name("ai", runtime)).toBe("Kestrel");
    expect(resolve_entity_name("fractal", runtime)).toBe("Hollow");
    expect(resolve_entity_name("user", runtime)).toBe("Rook");
    expect(resolve_entity_name("unknown-key", runtime)).toBe("unknown-key");
  });

  test("resolves entity keys to static labels when runtime is empty", () => {
    expect(resolve_entity_name("AI_CHARACTER")).toBe("AI CHARACTER");
    expect(resolve_entity_name("FRACTAL")).toBe("FRACTAL");
    expect(resolve_entity_name("USER_PERSONA")).toBe("USER PERSONA");
    expect(resolve_entity_name("ai")).toBe("AI CHARACTER");
  });

  test("labels future/past vector types with their human-readable names", () => {
    expect(vector_label("future", "future")).toBe("FUTURE VECTOR");
    expect(vector_label("past", "past")).toBe("PAST MEMORY");
    expect(vector_label(undefined, "future")).toBe("FUTURE VECTOR");
    expect(vector_label(undefined, "past")).toBe("PAST MEMORY");
    expect(vector_label("present", "past")).toBe("PRESENT");
    expect(vector_label("PROPHECY", "future")).toBe("PROPHECY");
  });

  test("MEMORY_FORMATION metadata includes future trajectory and consolidated present state", () => {
    const meta = {
      type: "MEMORY_FORMATION",
      target: "AI_CHARACTER",
      future: "He plans to corner Glitch in the lower sector.",
      present: { non_physical: "Reinvigorated focus", physical: "[POSTURE: dominant stance]" },
      memories: [],
      turns_count: 8,
    };
    expect(meta.future).toBe("He plans to corner Glitch in the lower sector.");
    expect(meta.present.non_physical).toBe("Reinvigorated focus");
    expect(meta.memories).toEqual([]);
    expect(meta.turns_count).toBe(8);
  });
});
