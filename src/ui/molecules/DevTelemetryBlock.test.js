import { describe, expect, test } from "vitest";

/**
 * Mirror of DevTelemetryBlock's dynamic filtering logic for unit testing.
 * @param {any} meta
 */
function process_telemetry_meta(meta = {}) {
  const ai = meta.ai || meta.dynamics || meta.snapshot?.ai || {};
  const fractal = meta.fractal || meta.fractal_dynamics || meta.snapshot?.fractal || {};
  const deltas = meta.deltas || [];

  const get_delta = (target, axis) => {
    return deltas.find((d) => d?.target === target && d?.axis === axis);
  };

  const has_explicit_deltas = Array.isArray(meta.deltas) || meta.type === "DYNAMICS_DELTA";

  const changed_ai = Object.entries(ai).filter(([axis]) => {
    if (!has_explicit_deltas) return true;
    const delta = get_delta("ai", axis);
    return delta && delta.diff !== 0;
  });

  const changed_fractal = Object.entries(fractal).filter(([axis]) => {
    if (!has_explicit_deltas) return true;
    const delta = get_delta("fractal", axis);
    return delta && delta.diff !== 0;
  });

  const has_any_dynamics_changes = changed_ai.length > 0 || changed_fractal.length > 0;

  return {
    changed_ai,
    changed_fractal,
    has_any_dynamics_changes,
  };
}

/**
 * Mirror of DevTelemetryBlock's signal_prompts normalization.
 * @param {any} meta
 */
function process_signal_prompts(meta = {}) {
  const raw = meta.signal_prompts;
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((s, i) => ({
      key: typeof s === "object" ? s?.key || s?.id || `prompt-${i}` : `prompt-${i}`,
      text: typeof s === "object" ? s?.prompt || s?.text || JSON.stringify(s) : String(s),
    }));
  }
  return Object.entries(raw).map(([k, v]) => ({
    key: k,
    text: typeof v === "object" ? v?.prompt || v?.text || JSON.stringify(v) : String(v),
  }));
}

/**
 * Mirror of DevTelemetryBlock's entity-name resolution.
 * @param {string} key
 * @param {any} [meta]
 * @param {any} [runtime]
 */
function resolve_entity_name(key, meta = {}, runtime = {}) {
  if (key === "ai" || key === "AI_CHARACTER") return meta.ai_name || meta.snapshot?.ai?.name || runtime.active_ai?.name || "AI CHARACTER";
  if (key === "fractal" || key === "FRACTAL") return meta.fractal_name || meta.snapshot?.fractal?.name || runtime.active_fractal?.name || "FRACTAL";
  if (key === "user" || key === "USER_PERSONA") return meta.user_name || meta.snapshot?.user?.name || runtime.active_user?.name || "USER PERSONA";
  return key;
}

/**
 * Mirror of DevTelemetryBlock's per-entity state-change grouping.
 * @param {any} meta
 */
function process_entity_blocks(meta = {}) {
  const ai = meta.ai || meta.dynamics || meta.snapshot?.ai || {};
  const fractal = meta.fractal || meta.fractal_dynamics || meta.snapshot?.fractal || {};
  const mutations = meta.mutations || null;
  const deltas = meta.deltas || [];
  const has_explicit_deltas = Array.isArray(meta.deltas) || meta.type === "DYNAMICS_DELTA";

  const get_delta = (target, axis) => deltas.find((d) => d?.target === target && d?.axis === axis);

  const changed = (obj, target) =>
    Object.entries(obj).filter(([axis]) => {
      if (!has_explicit_deltas) return true;
      const delta = get_delta(target, axis);
      return delta && delta.diff !== 0;
    });

  const mutation_keys = { ai: "AI_CHARACTER", fractal: "FRACTAL", user: "USER_PERSONA" };
  const blocks = [];
  const consider = (key, entries) => {
    const mods = mutations?.[mutation_keys[key]] || null;
    const has_mods = mods && (mods.present_append_physical?.trim() || mods.present_append_non_physical?.trim());
    if (entries.length > 0 || has_mods) blocks.push({ key, entries, mods: has_mods ? mods : null });
  };
  consider("ai", changed(ai, "ai"));
  consider("fractal", changed(fractal, "fractal"));
  consider("user", []);
  return blocks;
}

describe("DevTelemetryBlock Telemetry Logic", () => {
  test("filters out unchanged dynamics when deltas are present", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      ai: { chaos: 58, intensity: 60, openness: 42, affinity: 44 },
      fractal: { velocity: 56, entropy: 54 },
      deltas: [{ target: "ai", axis: "intensity", old_val: 55, new_val: 60, diff: 5 }],
    };

    const res = process_telemetry_meta(meta);
    expect(res.has_any_dynamics_changes).toBe(true);
    expect(res.changed_ai).toEqual([["intensity", 60]]);
    expect(res.changed_fractal).toEqual([]);
  });

  test("flags no dynamics changes when deltas array is empty", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      ai: { chaos: 58, intensity: 60, openness: 42, affinity: 44 },
      fractal: { velocity: 56, entropy: 54 },
      deltas: [],
    };

    const res = process_telemetry_meta(meta);
    expect(res.has_any_dynamics_changes).toBe(false);
    expect(res.changed_ai).toEqual([]);
    expect(res.changed_fractal).toEqual([]);
  });

  test("falls back to all dynamics when meta has no explicit deltas and not DYNAMICS_DELTA type", () => {
    const meta = {
      type: "CUSTOM_SNAPSHOT",
      ai: { chaos: 50, intensity: 50 },
      fractal: { velocity: 50 },
    };

    const res = process_telemetry_meta(meta);
    expect(res.has_any_dynamics_changes).toBe(true);
    expect(res.changed_ai).toEqual([
      ["chaos", 50],
      ["intensity", 50],
    ]);
    expect(res.changed_fractal).toEqual([["velocity", 50]]);
  });

  test("normalizes signal_prompts from an array of strings", () => {
    const res = process_signal_prompts({ signal_prompts: ["STYLE: Grit", "ATMOSPHERE: Rain"] });
    expect(res).toEqual([
      { key: "prompt-0", text: "STYLE: Grit" },
      { key: "prompt-1", text: "ATMOSPHERE: Rain" },
    ]);
  });

  test("normalizes signal_prompts from an object map", () => {
    const res = process_signal_prompts({
      signal_prompts: { STYLE: "Grit", "TOPOGRAPHY.weeping-orb": "Rain" },
    });
    expect(res).toEqual([
      { key: "STYLE", text: "Grit" },
      { key: "TOPOGRAPHY.weeping-orb", text: "Rain" },
    ]);
  });

  test("returns empty signal_prompts when absent", () => {
    expect(process_signal_prompts({})).toEqual([]);
    expect(process_signal_prompts({ signal_prompts: [] })).toEqual([]);
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

  test("groups dynamics and amendments per entity", () => {
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
    expect(blocks[0].entries).toEqual([["intensity", 60]]);
    expect(blocks[0].mods.present_append_physical).toBe("wearing a torn coat");
    expect(blocks[1].entries).toEqual([]);
    expect(blocks[1].mods.present_append_non_physical).toBe("holds a grudge");
  });

  test("entity blocks omit entities with no changes and no amendments", () => {
    const meta = { type: "DYNAMICS_DELTA", ai: { intensity: 60 }, fractal: { entropy: 54 }, deltas: [] };
    expect(process_entity_blocks(meta)).toEqual([]);
  });

  test("entity blocks fall back to all dynamics for snapshot telemetry without deltas", () => {
    const meta = { type: "CUSTOM_SNAPSHOT", ai: { chaos: 50, intensity: 50 }, fractal: { velocity: 50 } };
    const blocks = process_entity_blocks(meta);
    expect(blocks.map((b) => b.key)).toEqual(["ai", "fractal"]);
    expect(blocks[0].entries).toEqual([
      ["chaos", 50],
      ["intensity", 50],
    ]);
    expect(blocks[1].entries).toEqual([["velocity", 50]]);
  });
});
