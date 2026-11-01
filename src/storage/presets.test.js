import { describe, it, expect } from "vitest";
import {
  PREMADE_CHARACTERS,
  PREMADE_FRACTALS,
  ALL_PREMADES,
  NARRATIVE_PRESETS,
  get_starter_entities,
  get_starter_entity_by_id,
  get_narrative_preset,
} from "./presets.js";

describe("src/storage/presets.js — Premade Archetypes & Author Narrative Presets", () => {
  describe("Premade Entities (10 Archetypes)", () => {
    it("preserves exactly 7 characters and 3 fractals", () => {
      expect(PREMADE_CHARACTERS).toHaveLength(7);
      expect(PREMADE_FRACTALS).toHaveLength(3);
      expect(ALL_PREMADES).toHaveLength(10);
    });

    it("includes all 10 canonical IDs", () => {
      const ids = ALL_PREMADES.map((e) => e.id);
      expect(ids).toContain("orion");
      expect(ids).toContain("glitch");
      expect(ids).toContain("silvers");
      expect(ids).toContain("hank");
      expect(ids).toContain("elias");
      expect(ids).toContain("julien");
      expect(ids).toContain("beast");
      expect(ids).toContain("nova");
      expect(ids).toContain("ashenweald");
      expect(ids).toContain("tartarus");
    });

    it("verifies all 10 entities conform to canonical 4-quadrant schema", () => {
      for (const entity of ALL_PREMADES) {
        expect(typeof entity.id).toBe("string");
        expect(typeof entity.name).toBe("string");
        expect(["character", "fractal"]).toContain(entity.type);
        expect(typeof entity.eternal.physical).toBe("string");
        expect(typeof entity.eternal.non_physical).toBe("string");
        expect(typeof entity.present.physical).toBe("string");
        expect(typeof entity.present.non_physical).toBe("string");
        expect(typeof entity.future).toBe("string");
        expect(typeof entity.past).toBe("string");
        expect(typeof entity.dynamics).toBe("object");

        // Verify content contains brackets [KEY: VALUE]
        expect(entity.eternal.physical).toContain("[");
        expect(entity.eternal.non_physical).toContain("[");
        expect(entity.present.physical).toContain("[");
        expect(entity.present.non_physical).toContain("[");
        expect(entity.future).toContain("[");
        expect(entity.past).toContain("[");
      }
    });

    it("retrieves starter entities by type or ID", () => {
      const chars = get_starter_entities("character");
      expect(chars).toHaveLength(7);
      const fractals = get_starter_entities("fractal");
      expect(fractals).toHaveLength(3);

      const orion = get_starter_entity_by_id("orion");
      expect(orion?.name).toBe("Orion the Pink Protector");
      const nova = get_starter_entity_by_id("nova");
      expect(nova?.name).toBe("Nova City");
      expect(get_starter_entity_by_id("non_existent")).toBeNull();
    });
  });

  describe("Inlined Author Narrative Presets", () => {
    it("exports NARRATIVE_PRESETS with real author personas", () => {
      expect(NARRATIVE_PRESETS.cormac_mccarthy).toBeDefined();
      expect(NARRATIVE_PRESETS.william_gibson).toBeDefined();
      expect(NARRATIVE_PRESETS.anais_nin).toBeDefined();
      expect(NARRATIVE_PRESETS.david_lynch).toBeDefined();
      expect(NARRATIVE_PRESETS.arthur_morgan).toBeDefined();
    });

    it("validates that author presets contain inlined <NARRATIVE_STYLE> directives", () => {
      for (const [key, preset] of Object.entries(NARRATIVE_PRESETS)) {
        expect(preset.id).toBe(key);
        expect(typeof preset.name).toBe("string");
        expect(typeof preset.description).toBe("string");
        expect(typeof preset.directive).toBe("string");
        expect(preset.directive).toContain(`<NARRATIVE_STYLE id="${key}">`);
        expect(preset.directive).toContain("</NARRATIVE_STYLE>");
      }
    });

    it("get_narrative_preset falls back cleanly to cormac_mccarthy on unknown or null id", () => {
      const default_preset = get_narrative_preset("unknown_author");
      expect(default_preset.id).toBe("cormac_mccarthy");
      expect(default_preset.name).toBe("Cormac McCarthy");

      const null_preset = get_narrative_preset(null);
      expect(null_preset.id).toBe("cormac_mccarthy");

      const gibson = get_narrative_preset("william_gibson");
      expect(gibson.id).toBe("william_gibson");
      expect(gibson.name).toBe("William Gibson");
    });
  });
});
