import { describe, expect, test } from "vitest";

/**
 * Mirror of DevTelemetryBlock's per-entity block normalization. Handles both the
 * new `{ type, updates }` telemetry shape and the legacy flat shapes, producing
 * identical `{ key, name, dynamics, physical, non_physical, new_vectors, ... }`
 * blocks so the component renders both uniformly.
 * @param {any} meta
 */
function process_entity_blocks(meta = {}) {
  const mutation_keys = { ai: "AI_CHARACTER", fractal: "FRACTAL", user: "USER_PERSONA" };

  if (meta.updates && typeof meta.updates === "object") {
    const blocks = [];
    for (const [target, mutation_key] of Object.entries(mutation_keys)) {
      const upd = meta.updates[mutation_key];
      if (!upd) continue;
      const dynamics = (Array.isArray(upd.dynamics) ? upd.dynamics : []).map((d) => ({
        axis: d.axis,
        value: d.new_value,
        old_value: d.old_value,
        new_value: d.new_value,
        diff: d.diff,
        has_delta: true,
      }));
      const new_vectors = (Array.isArray(upd.vectors?.new) ? upd.vectors.new : []).map((v) => ({
        type: v.type || "future",
        weight: v.emotional_weight ?? v.weight ?? 5,
        id: v.id,
        content: v.content || v.directive || "",
      }));
      const retrieval = (Array.isArray(upd.vectors?.retrieval) ? upd.vectors.retrieval : []).map((v) => ({
        type: v.type || "past",
        id: v.id,
        content: v.content || v.directive || "",
        relevance: v._relevance,
      }));
      const physical = upd.present_mutations?.physical || "";
      const non_physical = upd.present_mutations?.non_physical || "";
      const eternal_physical = upd.eternal_mutations?.physical || "";
      const eternal_non_physical = upd.eternal_mutations?.non_physical || "";
      const has_dynamics = dynamics.length > 0;
      const has_mods = !!(
        physical.trim() ||
        non_physical.trim() ||
        eternal_physical.trim() ||
        eternal_non_physical.trim() ||
        new_vectors.length > 0 ||
        retrieval.length > 0
      );
      if (has_dynamics || has_mods) {
        blocks.push({
          key: target,
          name: upd.name,
          dynamics,
          physical,
          non_physical,
          eternal_physical,
          eternal_non_physical,
          new_vectors,
          retrieval,
          has_dynamics,
          has_mods,
        });
      }
    }
    return blocks;
  }

  const ai = meta.entities?.ai?.dynamics || meta.ai || meta.dynamics || meta.snapshot?.ai || {};
  const fractal = meta.entities?.fractal?.dynamics || meta.fractal || meta.fractal_dynamics || meta.snapshot?.fractal || {};
  const deltas = meta.deltas || [];
  const has_explicit_deltas = Array.isArray(meta.deltas) || meta.type === "DYNAMICS_DELTA";
  const find_delta = (target, axis) => deltas.find((d) => d?.target === target && d?.axis === axis);
  const blocks = [];
  const consider = (target, dynamics_map) => {
    const entries = Object.entries(dynamics_map).filter(([axis]) => {
      if (!has_explicit_deltas) return true;
      const d = find_delta(target, axis);
      return d && d.diff !== 0;
    });
    const dynamics = entries.map(([axis, val]) => {
      const d = find_delta(target, axis);
      return { axis, value: val, old_value: d?.old_val, new_value: d ? d.new_val : val, diff: d?.diff, has_delta: !!d };
    });
    const mods = meta.mutations?.[mutation_keys[target]] || null;
    const new_vectors = (Array.isArray(mods?.new_vectors) ? mods.new_vectors : []).map((v) => ({
      type: v.type || "future",
      weight: v.weight ?? v.emotional_weight ?? 5,
      id: v.id,
      content: v.content || v.directive || "",
    }));
    const physical = mods?.present_append_physical || "";
    const non_physical = mods?.present_append_non_physical || "";
    const has_dynamics = dynamics.length > 0;
    const has_mods = !!(physical.trim() || non_physical.trim() || new_vectors.length > 0);
    if (has_dynamics || has_mods)
      blocks.push({
        key: target,
        name: null,
        dynamics,
        physical,
        non_physical,
        eternal_physical: "",
        eternal_non_physical: "",
        new_vectors,
        retrieval: [],
        has_dynamics,
        has_mods,
      });
  };
  consider("ai", ai);
  consider("fractal", fractal);
  consider("user", {});
  return blocks;
}

/**
 * Mirror of DevTelemetryBlock's entity-name resolution.
 * @param {string} key
 * @param {any} [meta]
 * @param {any} [runtime]
 */
function resolve_entity_name(key, meta = {}, runtime = {}) {
  if (key === "ai" || key === "AI_CHARACTER")
    return meta.entities?.ai?.name || meta.ai_name || meta.snapshot?.ai?.name || runtime.active_ai?.name || "AI CHARACTER";
  if (key === "fractal" || key === "FRACTAL")
    return meta.entities?.fractal?.name || meta.fractal_name || meta.snapshot?.fractal?.name || runtime.active_fractal?.name || "FRACTAL";
  if (key === "user" || key === "USER_PERSONA") return meta.user_name || meta.snapshot?.user?.name || runtime.active_user?.name || "USER PERSONA";
  return key;
}

/**
 * Mirror of DevTelemetryBlock's human-readable memory/vector type label.
 * @param {string} [type]
 * @param {string} [fallback]
 */
function vector_label(type, fallback) {
  const t = type || fallback;
  if (t === "future") return "FUTURE VECTOR";
  if (t === "past") return "PAST MEMORY";
  return String(t).toUpperCase();
}

describe("DevTelemetryBlock Telemetry Logic", () => {
  test("reads the updates shape into per-entity blocks (dynamics + present_mutations + new vectors)", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      updates: {
        AI_CHARACTER: {
          name: "Lord Valerius Vance",
          present_mutations: {
            physical: "[EXPRESSION: predatory curiosity]",
            non_physical: "He feels a flicker of genuine interest.",
          },
          eternal_mutations: { physical: "", non_physical: "" },
          vectors: {
            resolved: [],
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
          vectors: { resolved: [], new: [{ content: "Attempt to hack the blast doors open.", type: "future", emotional_weight: 6 }] },
        },
      },
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["ai", "user"]);

    const ai = blocks[0];
    expect(ai.name).toBe("Lord Valerius Vance");
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
          vectors: { resolved: [], new: [{ content: "A pheromone gas leaks into the corridor.", type: "future", emotional_weight: 7 }] },
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
          vectors: { resolved: [], new: [] },
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
          name: "Lord Valerius Vance",
          present_mutations: { physical: "", non_physical: "" },
          vectors: {
            resolved: [],
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
          name: "Lord Valerius Vance",
          present_mutations: { physical: "", non_physical: "" },
          vectors: {
            resolved: [],
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
        AI_CHARACTER: { name: "Vesper", present_mutations: { physical: "", non_physical: "" }, vectors: { resolved: [], new: [] } },
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
          vectors: { resolved: [], new: [] },
          dynamics: [{ axis: "openness", old_value: 42, new_value: 38, diff: -4 }],
        },
      },
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks[0].dynamics).toEqual([{ axis: "openness", value: 38, old_value: 42, new_value: 38, diff: -4, has_delta: true }]);
  });

  test("legacy: filters out unchanged dynamics when deltas are present", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      ai: { chaos: 58, intensity: 60, openness: 42, affinity: 44 },
      fractal: { velocity: 56, entropy: 54 },
      deltas: [{ target: "ai", axis: "intensity", old_val: 55, new_val: 60, diff: 5 }],
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["ai"]);
    expect(blocks[0].dynamics).toEqual([{ axis: "intensity", value: 60, old_value: 55, new_value: 60, diff: 5, has_delta: true }]);
  });

  test("legacy: flags no blocks when the deltas array is empty for DYNAMICS_DELTA", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      ai: { chaos: 58, intensity: 60, openness: 42, affinity: 44 },
      fractal: { velocity: 56, entropy: 54 },
      deltas: [],
    };

    expect(process_entity_blocks(meta)).toEqual([]);
  });

  test("legacy: falls back to all dynamics when meta has no explicit deltas", () => {
    const meta = {
      type: "CUSTOM_SNAPSHOT",
      ai: { chaos: 50, intensity: 50 },
      fractal: { velocity: 50 },
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["ai", "fractal"]);
    expect(blocks[0].dynamics.map((d) => d.axis)).toEqual(["chaos", "intensity"]);
    expect(blocks[0].dynamics[0]).toEqual({ axis: "chaos", value: 50, new_value: 50, has_delta: false });
    expect(blocks[1].dynamics.map((d) => d.axis)).toEqual(["velocity"]);
  });

  test("legacy: groups dynamics and amendments per entity", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      ai: { intensity: 60, chaos: 58 },
      fractal: { entropy: 54 },
      deltas: [{ target: "ai", axis: "intensity", old_val: 55, new_val: 60, diff: 5 }],
      mutations: {
        AI_CHARACTER: { present_append_physical: "wearing a torn coat" },
        USER_PERSONA: { present_append_non_physical: "holds a grudge" },
        FRACTAL: { present_append_physical: "" },
      },
    };

    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["ai", "user"]);
    expect(blocks[0].physical).toBe("wearing a torn coat");
    expect(blocks[0].new_vectors).toEqual([]);
    expect(blocks[1].dynamics).toEqual([]);
    expect(blocks[1].non_physical).toBe("holds a grudge");
  });

  test("legacy: reads entity names and dynamics from the grouped entities payload", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      entities: {
        ai: { name: "Vesper", dynamics: { chaos: 62, intensity: 48, openness: 71, affinity: 35 } },
        fractal: { name: "Weeping Orb", dynamics: { velocity: 44, entropy: 58 } },
      },
      deltas: [{ target: "ai", axis: "chaos", old_val: 58, new_val: 62, diff: 4 }],
    };
    expect(resolve_entity_name("AI_CHARACTER", meta)).toBe("Vesper");
    expect(resolve_entity_name("FRACTAL", meta)).toBe("Weeping Orb");
    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["ai"]);
    expect(blocks[0].dynamics.map((d) => d.axis)).toEqual(["chaos"]);
  });

  test("legacy: includes entities that only add new vectors", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      ai: { chaos: 50 },
      fractal: { entropy: 50 },
      deltas: [],
      mutations: {
        FRACTAL: { new_vectors: [{ content: "A low thrumming begins", type: "future", weight: 4 }] },
      },
    };
    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["fractal"]);
    expect(blocks[0].dynamics).toEqual([]);
    expect(blocks[0].new_vectors).toEqual([{ type: "future", weight: 4, content: "A low thrumming begins" }]);
  });

  test("resolves telemetry entity keys to display names", () => {
    const meta = { ai_name: "Vesper", fractal_name: "Orb", user_name: "You" };
    expect(resolve_entity_name("AI_CHARACTER", meta)).toBe("Vesper");
    expect(resolve_entity_name("FRACTAL", meta)).toBe("Orb");
    expect(resolve_entity_name("USER_PERSONA", meta)).toBe("You");
    expect(resolve_entity_name("ai", meta)).toBe("Vesper");
    expect(resolve_entity_name("unknown-key", meta)).toBe("unknown-key");
  });

  test("resolves entity keys from runtime when meta names are absent", () => {
    const runtime = { active_ai: { name: "Kestrel" }, active_fractal: { name: "Hollow" }, active_user: { name: "Rook" } };
    expect(resolve_entity_name("AI_CHARACTER", {}, runtime)).toBe("Kestrel");
    expect(resolve_entity_name("FRACTAL", {}, runtime)).toBe("Hollow");
    expect(resolve_entity_name("USER_PERSONA", {}, runtime)).toBe("Rook");
    expect(resolve_entity_name("ai", {}, runtime)).toBe("Kestrel");
  });

  test("labels future/past vector types with their human-readable names", () => {
    expect(vector_label("future", "future")).toBe("FUTURE VECTOR");
    expect(vector_label("past", "past")).toBe("PAST MEMORY");
    expect(vector_label(undefined, "future")).toBe("FUTURE VECTOR");
    expect(vector_label(undefined, "past")).toBe("PAST MEMORY");
    expect(vector_label("present", "past")).toBe("PRESENT");
    expect(vector_label("PROPHECY", "future")).toBe("PROPHECY");
  });
});
