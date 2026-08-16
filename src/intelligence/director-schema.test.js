import { describe, expect, it } from "vitest";
import {
  normalize_director_data,
  normalize_speaker,
  normalize_in_scene_change,
  normalize_promotions,
  strip_npc_id,
  resolve_speaker_engine,
  STORY_STATUS_VALUES,
} from "./director-schema.js";

describe("normalize_speaker", () => {
  it("maps ai variants to ai", () => {
    for (const raw of ["ai", "AI", "AI_CHARACTER", "character", "ai_character", "  ai  "]) {
      expect(normalize_speaker(raw)).toBe("ai");
    }
  });

  it("maps fractal/world variants to fractal", () => {
    for (const raw of ["fractal", "FRACTAL", "world", "narrator", "environment"]) {
      expect(normalize_speaker(raw)).toBe("fractal");
    }
  });

  it("maps npc identifiers to npc", () => {
    expect(normalize_speaker("npc")).toBe("npc");
    expect(normalize_speaker("npc:lord-benedict")).toBe("npc");
    expect(normalize_speaker("NPC:123")).toBe("npc");
  });

  it("degrades unknown, empty, and non-string values to ai", () => {
    for (const raw of [undefined, null, "", "   ", 42, "director", "system"]) {
      expect(normalize_speaker(raw)).toBe("ai");
    }
  });
});

describe("normalize_director_data", () => {
  it("applies defensive fallbacks when the new schema fields are missing", () => {
    const normalized = normalize_director_data({ _thought_process: "quiet turn" });
    expect(normalized.speaker).toBe("ai");
    expect(normalized.keywords).toEqual([]);
    expect(normalized.story_status).toBe("IN_PROGRESS");
    expect(normalized._thought_process).toBe("quiet turn");
  });

  it("preserves valid speaker/keywords/story_status values", () => {
    const normalized = normalize_director_data({
      speaker: "fractal",
      keywords: ["shame", "stoic_pain"],
      story_status: "CONCLUDED",
    });
    expect(normalized.speaker).toBe("fractal");
    expect(normalized.keywords).toEqual(["shame", "stoic_pain"]);
    expect(normalized.story_status).toBe("CONCLUDED");
    expect(normalized.in_scene_change).toEqual({ enter: [], exit: [] });
    expect(normalized.promotions).toEqual([]);
  });

  it("caps keywords at 2 and filters non-strings/empties", () => {
    const normalized = normalize_director_data({ keywords: ["shame", "  ", "fear", null, "grief", 42, "betrayal"] });
    expect(normalized.keywords).toEqual(["shame", "fear"]);
  });

  it("drops out-of-range story_status values to IN_PROGRESS", () => {
    expect(normalize_director_data({ story_status: "RESOLVED" }).story_status).toBe("IN_PROGRESS");
    expect(normalize_director_data({ story_status: "COLLAPSED" }).story_status).toBe("COLLAPSED");
  });

  it("is safe on null/non-object payloads", () => {
    for (const bad of [null, undefined, 42, "raw prose"]) {
      const normalized = normalize_director_data(bad);
      expect(normalized.speaker).toBe("ai");
      expect(normalized.keywords).toEqual([]);
      expect(normalized.story_status).toBe("IN_PROGRESS");
    }
  });

  it("accepts only the canonical story-status enum", () => {
    for (const status of STORY_STATUS_VALUES) {
      expect(STORY_STATUS_VALUES).toContain(status);
    }
  });
});

describe("resolve_speaker_engine", () => {
  it("maps ai → character, fractal → narrator, npc → npc", () => {
    expect(resolve_speaker_engine("ai")).toBe("character");
    expect(resolve_speaker_engine("fractal")).toBe("narrator");
    expect(resolve_speaker_engine("npc")).toBe("npc");
    expect(resolve_speaker_engine()).toBe("character");
  });
});

describe("strip_npc_id", () => {
  it("strips the npc: prefix from ids", () => {
    expect(strip_npc_id("npc:lord-benedict")).toBe("lord-benedict");
    expect(strip_npc_id("NPC:123")).toBe("123");
  });

  it("leaves bare ids untouched and rejects non-strings", () => {
    expect(strip_npc_id("lord-benedict")).toBe("lord-benedict");
    expect(strip_npc_id(null)).toBe("");
    expect(strip_npc_id(42)).toBe("");
    expect(strip_npc_id(undefined)).toBe("");
  });
});

describe("normalize_in_scene_change", () => {
  it("cleans enter/exit lists and strips npc: prefixes", () => {
    expect(
      normalize_in_scene_change({
        enter: ["npc:elias", "  ", null, "mira"],
        exit: ["NPC:old-guard", 42],
      }),
    ).toEqual({ enter: ["elias", "mira"], exit: ["old-guard"] });
  });

  it("returns empty lists for missing or malformed payloads", () => {
    expect(normalize_in_scene_change(undefined)).toEqual({ enter: [], exit: [] });
    expect(normalize_in_scene_change(null)).toEqual({ enter: [], exit: [] });
    expect(normalize_in_scene_change("raw")).toEqual({ enter: [], exit: [] });
    expect(normalize_in_scene_change({ enter: "not-an-array" })).toEqual({ enter: [], exit: [] });
  });
});

describe("normalize_promotions", () => {
  it("coerces bare-string entries to tier 2", () => {
    expect(normalize_promotions(["npc:elias", "mira"])).toEqual([
      { id: "elias", tier: 2 },
      { id: "mira", tier: 2 },
    ]);
  });

  it("clamps tiers to the 2|3 range and strips prefixes", () => {
    expect(normalize_promotions([{ id: "npc:elias", tier: 3 }, { id: "mira", tier: 4 }, { id: "nobody", tier: 1 }])).toEqual([
      { id: "elias", tier: 3 },
      { id: "mira", tier: 3 },
      { id: "nobody", tier: 2 },
    ]);
  });

  it("accepts npc_id aliases and filters entries without ids", () => {
    expect(normalize_promotions([{ npc_id: "NPC:sorel", tier: 2 }, { tier: 3 }, null, "  "])).toEqual([{ id: "sorel", tier: 2 }]);
  });

  it("returns [] for non-array input", () => {
    expect(normalize_promotions(undefined)).toEqual([]);
    expect(normalize_promotions({ id: "elias", tier: 3 })).toEqual([]);
  });
});

describe("normalize_director_data (Stage Spotlight)", () => {
  it("passes through a fully-formed in_scene_change and promotions", () => {
    const normalized = normalize_director_data({
      in_scene_change: { enter: ["npc:elias"], exit: ["npc:old-guard"] },
      promotions: [{ id: "npc:elias", tier: 3 }],
    });
    expect(normalized.in_scene_change).toEqual({ enter: ["elias"], exit: ["old-guard"] });
    expect(normalized.promotions).toEqual([{ id: "elias", tier: 3 }]);
  });

  it("defaults both stage fields when absent", () => {
    const normalized = normalize_director_data({});
    expect(normalized.in_scene_change).toEqual({ enter: [], exit: [] });
    expect(normalized.promotions).toEqual([]);
  });
});
