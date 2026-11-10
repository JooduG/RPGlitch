import { describe, it, expect, vi, afterEach } from "vitest";
import {
  normalize_entity,
  create_entity,
  filter_entity_epistemics,
  serialize_entity_for_export,
  structure_profile,
  birth_entity_core,
} from "./entities.js";

describe("src/storage/entities.js — 4-Quadrant Entity Model & Adapt-on-Read", () => {
  afterEach(() => {
    delete window.generate_text;
    delete window.generateText;
    vi.restoreAllMocks();
  });

  describe("create_entity", () => {
    it("creates a valid fresh character entity with defaults and random UUID", () => {
      const character = create_entity("character", { name: "Aria" });
      expect(character.id).toMatch(/^[0-9a-f-]+$/i);
      expect(character.name).toBe("Aria");
      expect(character.type).toBe("character");
      expect(character.pov).toBe("3rd_person");
      expect(character.dynamics).toEqual({ chaos: 50, intensity: 50, openness: 50, affinity: 50 });
      expect(character.eternal).toEqual({ physical: "", non_physical: "" });
      expect(character.present).toEqual({ physical: "", non_physical: "" });
      expect(character.future).toBe("");
      expect(character.past).toBe("");
      expect(character.created_at).toBeGreaterThan(0);
      expect(character.updated_at).toBeGreaterThan(0);
    });

    it("creates a valid fresh fractal entity with default physics", () => {
      const fractal = create_entity("fractal", { name: "Neon Haven" });
      expect(fractal.type).toBe("fractal");
      expect(fractal.dynamics).toEqual({ velocity: 50, entropy: 50 });
      expect(fractal.eternal).toEqual({ physical: "", non_physical: "" });
      expect(fractal.present).toEqual({ physical: "", non_physical: "" });
      expect(fractal.future).toBe("");
      expect(fractal.past).toBe("");
    });
  });

  describe("normalize_entity & Legacy Adapt-on-Read", () => {
    it("preserves canonical 4-quadrant multiline bracket strings unchanged", () => {
      const canonical = {
        id: "char_1",
        name: "Test",
        type: "character",
        eternal: { physical: "[BUILD: tall]", non_physical: "[CORE: heroic]" },
        present: { physical: "[CHEST: bare]", non_physical: "[MOOD: calm]" },
        future: "[AGENDA: find exit]",
        past: "[ORIGIN: born in vault | is_origin | w: 10]",
        dynamics: { chaos: 60, intensity: 70, openness: 80, affinity: 90 },
      };

      const normalized = normalize_entity(canonical);
      expect(normalized.eternal.physical).toBe("[BUILD: tall]");
      expect(normalized.eternal.non_physical).toBe("[CORE: heroic]");
      expect(normalized.present.physical).toBe("[CHEST: bare]");
      expect(normalized.present.non_physical).toBe("[MOOD: calm]");
      expect(normalized.future).toBe("[AGENDA: find exit]");
      expect(normalized.past).toBe("[ORIGIN: born in vault | is_origin | w: 10]");
      expect(normalized.dynamics).toEqual({ chaos: 60, intensity: 70, openness: 80, affinity: 90 });
    });

    it("adapts legacy object array past/memories into canonical multiline bracket string", () => {
      const legacy_row = {
        id: "legacy_hero",
        name: "Old Hero",
        type: "character",
        eternal: { physical: "[EYES: blue]" },
        present: { non_physical: "[MOOD: grim]" },
        past: [
          { key: "ORIGIN", text: "escaped cyber lab", is_origin: true, weight: 10 },
          { key: "EVENT", text: "lost cybernetic arm", is_origin: false, weight: 8, hide: true },
        ],
        future: "Escape the city",
      };

      const normalized = normalize_entity(legacy_row);
      expect(normalized.eternal.physical).toBe("[EYES: blue]");
      expect(normalized.eternal.non_physical).toBe("");
      expect(normalized.present.physical).toBe("");
      expect(normalized.present.non_physical).toBe("[MOOD: grim]");
      expect(normalized.future).toBe("[AGENDA: Escape the city]");

      // Past must be pure string multiline brackets
      expect(typeof normalized.past).toBe("string");
      expect(normalized.past).toContain("[ORIGIN: escaped cyber lab | is_origin | w: 10]");
      expect(normalized.past).toContain("[EVENT: lost cybernetic arm | hide | w: 8]");
    });

    it("adapts legacy raw string past or legacy memories property", () => {
      const legacy_row = {
        id: "legacy_2",
        name: "Second Hero",
        type: "character",
        memories: [{ text: "survived the fall", is_origin: true }],
      };

      const normalized = normalize_entity(legacy_row);
      expect(normalized.past).toContain("[MEMORY: survived the fall | is_origin]");
    });

    it("ensures dynamics sliders are clamped between 1 and 100", () => {
      const row = {
        type: "character",
        dynamics: { chaos: -10, intensity: 150, openness: 50, affinity: NaN },
      };
      const normalized = normalize_entity(row);
      expect(normalized.dynamics.chaos).toBe(1);
      expect(normalized.dynamics.intensity).toBe(100);
      expect(normalized.dynamics.affinity).toBe(50);
    });
  });

  describe("filter_entity_epistemics", () => {
    it("applies format_clean_brackets across all 4 quadrants", () => {
      const entity = {
        id: "char_secret",
        name: "Agent",
        type: "character",
        eternal: { physical: "[BUILD: tall]", non_physical: "[CORE: spy | hide]" },
        present: { physical: "[GUN: suppressed | hide]", non_physical: "[MOOD: tense]" },
        future: "[AGENDA: meeting contact | hide]",
        past: "[ORIGIN: double agent | hide | w: 10]",
      };

      const filtered = filter_entity_epistemics(entity, { see_hidden: "own", is_counterpart: true });
      expect(filtered.eternal.physical).toBe("[BUILD: tall]");
      expect(filtered.eternal.non_physical).toBe("");
      expect(filtered.present.physical).toBe("");
      expect(filtered.present.non_physical).toBe("[MOOD: tense]");
      expect(filtered.future).toBe("");
      expect(filtered.past).toBe("");
    });
  });

  describe("serialize_entity_for_export", () => {
    it("strips database IDs, transient timestamps, and internal flags for clean export", () => {
      const entity = {
        id: "uuid-12345",
        created_at: 1700000000,
        updated_at: 1700001000,
        origin_id: "parent-uuid",
        name: "Export Hero",
        type: "character",
        eternal: { physical: "[BUILD: muscular]", non_physical: "" },
        present: { physical: "", non_physical: "" },
        future: "",
        past: "",
        dynamics: { chaos: 50, intensity: 50, openness: 50, affinity: 50 },
      };

      const exported = serialize_entity_for_export(entity);
      expect(exported.id).toBeUndefined();
      expect(exported.created_at).toBeUndefined();
      expect(exported.updated_at).toBeUndefined();
      expect(exported.name).toBe("Export Hero");
      expect(exported.eternal.physical).toBe("[BUILD: muscular]");
    });
  });

  describe("structure_profile & birth_entity_core", () => {
    it("structures raw prose via enhance and parses JSON output", async () => {
      const engine_mock = vi.fn().mockResolvedValue('{"name":"Kael","appearance":"Tall and cloaked."}');
      window.generate_text = engine_mock;

      const result = await structure_profile("Raw character description of Kael...", "character");
      expect(engine_mock).toHaveBeenCalled();
      expect(result).toEqual({ name: "Kael", appearance: "Tall and cloaked." });
    }, 15000);

    it("structure_profile produces output that satisfies parse_profile_json and mandatory fields", async () => {
      const mock_response = JSON.stringify({
        _thought_process: "Structuring rogue archetype with stealth abilities.",
        name: "Shadowblade",
        eternal_physical: "[BUILD: wiry], [HAIR: raven]",
        eternal_non_physical: "[CORE: cunning survivor]",
        present_physical: "[CHEST: dark leather tunic]",
        present_non_physical: "[MOOD: watchful]",
        future: "[AGENDA: infiltrate the high citadel]",
        past: "[ORIGIN: born in underground guild | is_origin | w: 9]",
      });

      const engine_mock = vi.fn().mockResolvedValue(mock_response);
      window.generate_text = engine_mock;

      const structured = await structure_profile("Raw notes for Shadowblade...", "character");
      expect(engine_mock).toHaveBeenCalled();
      expect(structured).not.toBeNull();
      expect(typeof structured._thought_process).toBe("string");
      expect(structured.name).toBe("Shadowblade");
      expect(structured.eternal_physical).toContain("[BUILD: wiry]");
      expect(structured.eternal_non_physical).toContain("[CORE: cunning survivor]");
      expect(structured.present_physical).toContain("[CHEST: dark leather tunic]");
      expect(structured.present_non_physical).toContain("[MOOD: watchful]");
      expect(structured.future).toContain("[AGENDA: infiltrate the high citadel]");
      expect(structured.past).toContain("[ORIGIN: born in underground guild");
    });

    it("birth_entity_core persists entity and registers NPC cast via update_cast", async () => {
      const db = await import("./db.js");

      const upsert_spy = vi.spyOn(db, "upsert_entity").mockImplementation(async (ent) => ({
        ...ent,
        id: "npc-777",
      }));

      const get_story_spy = vi.spyOn(db, "get_story").mockResolvedValue({
        id: "story-active",
        npc_ids: ["npc-existing"],
      });

      const update_cast_spy = vi.spyOn(db, "update_cast").mockResolvedValue({
        id: "story-active",
        npc_ids: ["npc-existing", "npc-777"],
      });

      const born = await birth_entity_core(
        "character",
        {
          name: "Lyra",
          description: "A nimble archer.",
        },
        { run_sorter: false, generate_portrait: false, story_id: "story-active" },
      );

      expect(upsert_spy).toHaveBeenCalledWith(expect.objectContaining({ name: "Lyra" }));
      expect(get_story_spy).toHaveBeenCalledWith("story-active");
      expect(update_cast_spy).toHaveBeenCalledWith("story-active", ["npc-existing", "npc-777"]);
      expect(born.id).toBe("npc-777");

      upsert_spy.mockRestore();
      get_story_spy.mockRestore();
      update_cast_spy.mockRestore();
    });

    it("birth_entity_core persists entity and returns canonical record", async () => {
      const db = await import("./db.js");
      const upsert_spy = vi.spyOn(db, "upsert_entity").mockImplementation(async (ent) => ({
        ...ent,
        id: "char-123",
      }));

      const born = await birth_entity_core(
        "character",
        {
          name: "Lyra",
          description: "A nimble archer.",
        },
        { run_sorter: false, generate_portrait: false },
      );

      expect(upsert_spy).toHaveBeenCalledWith(expect.objectContaining({ name: "Lyra" }));
      expect(born.id).toBe("char-123");
      expect(born.name).toBe("Lyra");
      upsert_spy.mockRestore();
    });
  });
});
