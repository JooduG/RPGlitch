import { describe, it, expect, vi, afterEach } from "vitest";
import { normalize_entity, create_entity, birth_entity_core } from "./entities.js";

describe("src/storage/entities.js — 4-Quadrant Entity Model & Model", () => {
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

  describe("normalize_entity & Legacy Model", () => {
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

    it("wraps bare prose past/future strings in canonical brackets", () => {
      const row = {
        id: "plain",
        name: "Plain",
        type: "character",
        past: "survived the fall",
        future: "Escape the city",
      };

      const normalized = normalize_entity(row);
      expect(normalized.past).toBe("[MEMORY: survived the fall]");
      expect(normalized.future).toBe("[AGENDA: Escape the city]");
    });

    it("treats non-string past shapes as empty, with no legacy adaptation", () => {
      const row = {
        id: "odd",
        name: "Odd",
        type: "character",
        past: [{ key: "ORIGIN", text: "escaped cyber lab", is_origin: true, weight: 10 }],
        memories: [{ text: "survived the fall", is_origin: true }],
        future: ["not", "a", "string"],
      };

      const normalized = normalize_entity(row);
      expect(normalized.past).toBe("");
      expect(normalized.future).toBe("");
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
