import { describe, expect, it } from "vitest";
import { normalize_director_data, normalize_speaker, resolve_speaker_engine, STORY_STATUS_VALUES } from "./director-schema.js";

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
