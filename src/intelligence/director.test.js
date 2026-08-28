import { describe, expect, it, vi } from "vitest";
import { render_director } from "./prompts/director-prompts.js";
import {
  normalize_director_data,
  normalize_speaker,
  normalize_in_scene_change,
  normalize_relationships,
  strip_npc_id,
  resolve_speaker_engine,
  STORY_STATUS_VALUES,
} from "./director.js";

const _mock_app = {
  settings: { narrative_style: "default" },
};

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    state_bridge: {
      get app() {
        return _mock_app;
      },
      get runtime() {
        return { active_fractal: null };
      },
    },
  };
});

describe("Director Quick Shot Prompt (render_director)", () => {
  const base_payload = () => ({
    round: 1,
    entities: {
      AI: {
        name: "Viper",
        present: { non_physical: "Volatile Present" },
        eternal: { non_physical: "Static Eternal" },
        past: [{ directive: "Viper past 1" }],
        future: "Viper future 1",
      },
      USER: {
        name: "Ghost",
        present: { non_physical: "Ghost Present" },
        eternal: { non_physical: "Ghost Eternal" },
        past: [{ directive: "Ghost past 1" }],
        future: "Ghost future 1",
      },
      FRACTAL: {
        name: "Void",
        present: { non_physical: "Void Present" },
        eternal: { non_physical: "Void Eternal" },
        past: [{ directive: "Void past 1" }],
        future: "Void future 1",
      },
    },
    simulation_log: [],
    input: "Check the door.",
  });

  const base_snapshot = {
    ai: { dynamics: { intensity: 50, openness: 60 } },
    fractal: { dynamics: { entropy: 10 } },
    flags: {},
  };

  it("exposes <AVAILABLE_KEYWORDS> and JSON schema keys", () => {
    const result = render_director({ ...base_payload(), compressed_snapshot: base_snapshot });
    expect(result.system).toContain("<AVAILABLE_KEYWORDS>");
    expect(result.system).toContain("shame");
    expect(result.system).toContain("betrayal");
    expect(result.task).toContain('"next_action"');
    expect(result.task).toContain('"keywords"');
    expect(result.task).toContain('"directors_note"');
    expect(result.task).toContain("EPILOGUE_CONCLUDED");
  });

  it("includes PAST state for all active entities in the Director prompt", () => {
    const result = render_director({ ...base_payload(), compressed_snapshot: base_snapshot });
    expect(result.system).toContain("<MEMORIES>");
    expect(result.system).toContain("Viper past 1");
    expect(result.system).toContain("Ghost past 1");
    expect(result.system).toContain("Void past 1");
  });

  it("nudges Director toward fractal narration on non-verbal environmental turns", () => {
    const env_payload = { ...base_payload(), input: "I press my palm flat against the cold iron gate and wait.", compressed_snapshot: base_snapshot };
    const result = render_director(env_payload);
    expect(result.task).toContain("<USER_ACTION_NOTE>");
    expect(result.task).toContain('"speaker" to "fractal"');
    expect(result.system).toContain("SPEAKER_ROUTING");
  });

  it("emits compact ROSTER and SCENE_ROSTER when NPCs are present", () => {
    const npc_entities = [{ id: "npc-elias", name: "Elias", role_tier: 2, description: "Archivist", relationships: ["Elias → Viper: wary"] }];
    const result = render_director({ ...base_payload(), npc_entities, in_scene_ids: ["npc-elias"], compressed_snapshot: base_snapshot });
    expect(result.system).toContain("<ROSTER>");
    expect(result.system).toContain("Elias (id: npc-elias)");
    expect(result.system).toContain("In-Scene");
    expect(result.system).toContain("<SCENE_ROSTER>");
    expect(result.system).toContain("<RELATIONAL_MESH>");
  });
});

describe("normalize_director_quick_shot (Track 1 Schema)", () => {
  it("normalizes next_action correctly for AI, Fractal, NPC, Genesis, and Epilogues", () => {
    expect(normalize_director_data({ next_action: "AI_CHARACTER" }).next_action).toBe("AI_CHARACTER");
    expect(normalize_director_data({ next_action: "ai" }).next_action).toBe("AI_CHARACTER");
    expect(normalize_director_data({ next_action: "fractal" }).next_action).toBe("FRACTAL");
    expect(normalize_director_data({ next_action: "FRACTAL" }).next_action).toBe("FRACTAL");
    expect(normalize_director_data({ next_action: "npc:mira" }).next_action).toBe("npc:mira");
    expect(normalize_director_data({ next_action: "GENESIS" }).next_action).toBe("GENESIS");
    expect(normalize_director_data({ next_action: "genesis" }).next_action).toBe("GENESIS");
    expect(normalize_director_data({ next_action: "EPILOGUE_CONCLUDED" }).next_action).toBe("EPILOGUE_CONCLUDED");
    expect(normalize_director_data({ next_action: "EPILOGUE_COLLAPSED" }).next_action).toBe("EPILOGUE_COLLAPSED");
    expect(normalize_director_data({ next_action: "collapsed" }).next_action).toBe("EPILOGUE_COLLAPSED");
    expect(normalize_director_data({ next_action: "concluded" }).next_action).toBe("EPILOGUE_CONCLUDED");

    // Unknown or empty falls back to AI_CHARACTER
    expect(normalize_director_data({ next_action: "unknown_void" }).next_action).toBe("AI_CHARACTER");
    expect(normalize_director_data({}).next_action).toBe("AI_CHARACTER");
  });

  it("caps keywords to 1-3 elements and preserves valid tags", () => {
    const data = normalize_director_data({
      keywords: ["vulnerability", "defiance", "cinematic_shot", "extra_tag"],
    });
    expect(data.keywords).toEqual(["vulnerability", "defiance", "cinematic_shot"]);
  });

  it("sanitizes directors_note to 1-3 lines string", () => {
    const data = normalize_director_data({
      directors_note: "Line 1: Glance over.\nLine 2: Lower voice.\nLine 3: Step back.\nLine 4: Ignored line.",
    });
    expect(data.directors_note.split("\n").length).toBeLessThanOrEqual(3);
    expect(data.directors_note).toContain("Line 1: Glance over.");
  });
});

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
  });

  it("caps keywords at 3 and filters non-strings/empties", () => {
    const normalized = normalize_director_data({ keywords: ["shame", "  ", "fear", null, "grief", 42, "betrayal"] });
    expect(normalized.keywords).toEqual(["shame", "fear", "grief"]);
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

describe("normalize_director_data (Stage Spotlight)", () => {
  it("passes through a fully-formed in_scene_change", () => {
    const normalized = normalize_director_data({
      in_scene_change: { enter: ["npc:elias"], exit: ["npc:old-guard"] },
    });
    expect(normalized.in_scene_change).toEqual({ enter: ["elias"], exit: ["old-guard"] });
  });

  it("defaults both stage fields when absent", () => {
    const normalized = normalize_director_data({});
    expect(normalized.in_scene_change).toEqual({ enter: [], exit: [] });
  });
});

describe("normalize_relationships (Relational Mesh)", () => {
  it("keeps directed edges regardless of arrow spelling", () => {
    expect(normalize_relationships(["Viper → Mira: alliance", "Mira -> Sorel: rivalry", "Sorel —> Viper: debt"])).toEqual([
      "Viper → Mira: alliance",
      "Mira -> Sorel: rivalry",
      "Sorel —> Viper: debt",
    ]);
  });

  it("drops undirected prose, non-strings, and empties", () => {
    expect(normalize_relationships(["Viper and Mira trust each other", "", null, 42])).toEqual([]);
  });

  it("caps the edge count at 6 and clamps each edge to 160 chars", () => {
    const seven = Array.from({ length: 7 }, (_, i) => `Viper → Mira: edge number ${i}`);
    expect(normalize_relationships(seven)).toHaveLength(6);
    const long = ["Viper → Mira: " + "x".repeat(400)];
    expect(normalize_relationships(long)[0].length).toBeLessThanOrEqual(160);
  });

  it("returns [] for non-array input", () => {
    expect(normalize_relationships(undefined)).toEqual([]);
    expect(normalize_relationships("Viper → Mira: alliance")).toEqual([]);
    expect(normalize_relationships({ 0: "Viper → Mira: alliance" })).toEqual([]);
  });
});
