import { describe, expect, test } from "vitest";
import { parse_message, wrap_dialogue } from "./ChatBubble.svelte";
import { clean_text_debris, get_telemetry_label, process_entity_blocks, resolve_entity_name, vector_label } from "./DevBubble.svelte";

describe("DevBubble Telemetry & ChatBubble Format Logic", () => {
  test("wrap_dialogue wraps double-quoted text spans with dialogue class", () => {
    const out = wrap_dialogue('<p>He whispered "hello there" softly.</p>');
    expect(out).toContain('<span class="dialogue">&ldquo;hello there&rdquo;</span>');
  });

  test("parse_message extracts think blocks and wraps dialogue", () => {
    const res = parse_message('<think>plotting</think>She smiled and said "Good evening."');
    expect(res.think).toContain("plotting");
    expect(res.displayText).toContain('<span class="dialogue">&ldquo;Good evening.&rdquo;</span>');
  });

  test("reads the updates shape into per-entity blocks (dynamics + present_mutations + new vectors)", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      updates: {
        AI_CHARACTER: {
          name: "Lord Benedict Silvers",
          present_mutations: { physical: "[EXPRESSION: predatory curiosity]", non_physical: "He feels a flicker of genuine interest." },
          eternal_mutations: { physical: "", non_physical: "" },
          vectors: {
            new: [{ id: "valerius-f3", content: "Corner Glitch against the sterile walls.", type: "future", emotional_weight: 8 }],
            retrieval: [{ id: "valerius-p1", content: "He was exiled from the Ashenweald court.", type: "past", emotional_weight: 10, _relevance: 10.9 }],
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

  test("updates shape: omits entities with no content", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      updates: { AI_CHARACTER: { name: "Vesper", present_mutations: { physical: "", non_physical: "" }, vectors: { new: [] } }, FRACTAL: { name: "Orb" } },
    };

    expect(process_entity_blocks(meta)).toEqual([]);
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

  test("labels past memory and present vector types with their human-readable names", () => {
    expect(vector_label("past", "past")).toBe("PAST");
    expect(vector_label("memory", "memory")).toBe("PAST");
    expect(vector_label(undefined, "memory")).toBe("PAST");
    expect(vector_label(undefined, "past")).toBe("PAST");
    expect(vector_label("present", "past")).toBe("PRESENT");
    expect(vector_label("future", "future")).toBe("FUTURE");
    expect(vector_label("PROPHECY", "memory")).toBe("PROPHECY");
  });

  test("computes dynamic telemetry card titles (Caretaker turn and Director turn)", () => {
    const runtime = { active_ai: { name: "Lord Benedict Silvers" }, active_user: { name: "Glitch" }, active_fractal: { name: "Project Tartarus" } };

    expect(get_telemetry_label({ type: "CONTINUUM_FORMATION", target: "AI_CHARACTER", turns_count: 2 }, runtime)).toBe(
      "Caretaker turn: AI_CHARACTER from 2 turns",
    );
    expect(get_telemetry_label({ type: "CONTINUUM_FORMATION", target: "user" }, runtime)).toBe("Caretaker turn: USER");
    expect(get_telemetry_label({ type: "DYNAMICS_DELTA" }, runtime)).toBe("Director turn");
    expect(get_telemetry_label({}, runtime)).toBe("Director turn");
  });

  test("cleans up comma debris and leading/trailing punctuation in prose strings", () => {
    expect(clean_text_debris(", , [CIRCULATING: low rumble]")).toBe("[CIRCULATING: low rumble]");
    expect(clean_text_debris(", , ,  ")).toBe("");
    expect(clean_text_debris("   [MOOD: intense]  , ")).toBe("[MOOD: intense]");
  });
});
