/**
 * src/intelligence/profile.test.js
 * 📇 UNIT TESTS: PROFILE DOMAIN (Structuring, Entity Mapping, Field Enhancement & Spawning)
 */

import { describe, expect, it, vi } from "vitest";
import { apply_profile_to_entity } from "./profile.js";
import { render_enhancement, render_profile_sorting } from "./builder.js";
import { PROFILE_PROTOCOLS } from "./modules/protocols.js";

// ── 1. Protocols & Schema Specifications ──────────────────────────────────────

describe("Profile Domain (profile.js)", () => {
  describe("PROFILE_PROTOCOLS", () => {
    it("is deeply frozen and exports valid schema and formats", () => {
      expect(Object.isFrozen(PROFILE_PROTOCOLS)).toBe(true);
      expect(Object.isFrozen(PROFILE_PROTOCOLS.MACROS)).toBe(true);
      expect(Object.isFrozen(PROFILE_PROTOCOLS.SORTING)).toBe(true);
      expect(Object.isFrozen(PROFILE_PROTOCOLS.OUTPUT_FORMATS)).toBe(true);

      expect(PROFILE_PROTOCOLS.SCHEMA).toContain('"name"');
      expect(PROFILE_PROTOCOLS.SCHEMA).toContain('"personality"');
      expect(PROFILE_PROTOCOLS.SCHEMA).toContain('"appearance"');
      expect(PROFILE_PROTOCOLS.SCHEMA).toContain('"past"');
      expect(PROFILE_PROTOCOLS.SCHEMA).toContain('"future"');

      expect(PROFILE_PROTOCOLS.OUTPUT_FORMATS.PROSE).toBeDefined();
      expect(PROFILE_PROTOCOLS.OUTPUT_FORMATS.BRACKETS).toBeDefined();
      expect(PROFILE_PROTOCOLS.OUTPUT_FORMATS.ARRAY_APPEND).toBeDefined();
      expect(PROFILE_PROTOCOLS.OUTPUT_FORMATS.ARRAY_SINGLE).toBeDefined();
      expect(PROFILE_PROTOCOLS.OUTPUT_FORMATS.JSON_OBJECT).toBeDefined();
    });
  });

  // ── 2. Field Enhancement Compilers ──────────────────────────────────────────

  describe("render_enhancement()", () => {
    it("formats physical properties to XML correctly", () => {
      const entity = {
        eternal: { physical: '{"eyeColor": "blue", "hair": "black"}' },
      };
      const result = render_enhancement({
        field_id: "eternal.physical",
        content: "Content",
        label: "Appearance",
        directive: "Enhance look.",
        enhancer: "AESTHETICS",
        entity,
      });
      expect(result).toContain("<PHYSICAL_APPEARANCE>");
      expect(result).toContain("<eyeColor>blue</eyeColor>");
      expect(result).toContain("<hair>black</hair>");
    });

    it("injects MACRO_PROTOCOL correctly for characters vs fractals", () => {
      const char_result = render_enhancement({
        field_id: "eternal.non_physical",
        content: "Content",
        label: "Personality",
        directive: "Enhance.",
        entity_type: "character",
      });
      expect(char_result).toContain("Use placeholder macros for entities: '{{me}}' (self)");
      expect(char_result).not.toContain("'{{user}}' (user persona), '{{char}}' (AI character)");

      const fractal_result = render_enhancement({
        field_id: "eternal.non_physical",
        content: "Content",
        label: "Lore",
        directive: "Enhance.",
        entity_type: "fractal",
      });
      expect(fractal_result).toContain("'{{user}}' (user persona), '{{char}}' (AI character)");
      expect(fractal_result).not.toContain("'{{me}}' (self)");
    });

    it("injects the same-layer sibling + eternal baseline (no whole-profile bleed)", () => {
      const entity = {
        eternal: { physical: "Eternal body.", non_physical: "Eternal psyche." },
        present: { physical: "Present outfit.", non_physical: "Present mood." },
        past: [{ id: "p1", content: "Old memory anchor", type: "past", emotional_weight: 5 }],
        future: "Impending prophecy",
      };
      const result = render_enhancement({
        field_id: "present.non_physical",
        content: "Present mood.",
        label: "Mood",
        directive: "Enhance.",
        entity,
        entity_type: "character",
      });
      expect(result).toContain("Present mood.");
      expect(result).toContain("Present outfit.");
      expect(result).toContain("Eternal psyche.");
      expect(result).not.toContain("Eternal body.");
      expect(result).not.toContain("Old memory anchor");
      expect(result).not.toContain("Impending prophecy");
    });
  });

  describe("render_profile_sorting()", () => {
    it("renders valid schema, macros, and focus directive", () => {
      const char_result = render_profile_sorting("character", { ingestion: true });
      expect(char_result).toContain('<SYSTEM role="NARRATIVE_STRUCTURER"');
      expect(char_result).toContain("FOCUS: Extracting data for an individual CHARACTER.");
      expect(char_result).toContain("SOURCE OF TRUTH & INGESTION RULES:");

      const fractal_result = render_profile_sorting("fractal", { redistribute: true });
      expect(fractal_result).toContain("FOCUS: Extracting data for a FRACTAL");
      expect(fractal_result).toContain("REDISTRIBUTE: The source profile may have content");
    });
  });

  // ── 3. Profile Structuring & Schema Hydration ────────────────────────────────

  describe("apply_profile_to_entity()", () => {
    it("maps flat appearance/personality keys onto the Twin-Cylinder leaves", () => {
      const entity = { eternal: {}, present: {} };
      apply_profile_to_entity(entity, {
        appearance: "Tall, silver-eyed.",
        personality: "Dry wit, fiercely loyal.",
        current_look: "Worn coat, brass compass.",
        state_of_mind: "Guarded but amused.",
      });
      expect(entity.eternal.physical).toBe("Tall, silver-eyed.");
      expect(entity.eternal.non_physical).toBe("Dry wit, fiercely loyal.");
      expect(entity.present.physical).toBe("Worn coat, brass compass.");
      expect(entity.present.non_physical).toBe("Guarded but amused.");
    });

    it("sets name trimmed and clipped to 80 characters", () => {
      const entity = {};
      apply_profile_to_entity(entity, { name: "  " + "A".repeat(90) + "  " });
      expect(entity.name).toBe("A".repeat(80));
    });

    it("appends past prose entries as pinned memory vectors", () => {
      const entity = { past: [] };
      apply_profile_to_entity(entity, { past: ["Washed ashore at Mournhold.", "Captured a smuggler's trust."] });
      expect(entity.past).toHaveLength(2);
      expect(entity.past[0].content).toBe("Washed ashore at Mournhold.");
      expect(entity.past[0].type).toBe("past");
      expect(entity.past[0].id.startsWith("usr_")).toBe(true);
    });

    it("sets future prose and clips tags to the 30-cap", () => {
      const entity = {};
      const tags = Array.from({ length: 40 }, (_, i) => `tag-${i}`);
      apply_profile_to_entity(entity, { future: "  The long road home.  ", tags });
      expect(entity.future).toBe("The long road home.");
      expect(entity.tags).toHaveLength(30);
    });

    it("shallow-copies string leaves from nested flat objects", () => {
      const entity = {};
      apply_profile_to_entity(entity, { dynamics: { openness: "60", note: "steady" } });
      expect(entity.dynamics).toEqual({ openness: "60", note: "steady" });
    });

    it("skips identity/asset keys and tolerates missing profiles", () => {
      const entity = {};
      apply_profile_to_entity(entity, { profile_picture: "data:img", image: "x", id: "1", type: "character", name: "Vael" });
      expect(entity.profile_picture).toBeUndefined();
      expect(entity.image).toBeUndefined();
      expect(entity.id).toBeUndefined();
      expect(entity.type).toBeUndefined();
      expect(entity.name).toBe("Vael");
      expect(apply_profile_to_entity(entity, null)).toBe(entity);
      expect(apply_profile_to_entity(entity, "nope")).toBe(entity);
    });
  });

  describe("structure_profile()", () => {
    it("structures raw prose via enhance and parses JSON output", async () => {
      const { structure_profile } = await import("./profile.js");
      const { llm_service } = await import("@platform");
      const spy = vi.spyOn(llm_service, "enhance").mockResolvedValue('{"name":"Kael","appearance":"Tall and cloaked."}');

      const result = await structure_profile("Raw character description of Kael...", "character");
      expect(spy).toHaveBeenCalled();
      expect(result).toEqual({ name: "Kael", appearance: "Tall and cloaked." });
      spy.mockRestore();
    });
  });
});

/**
 * CHANGELOG
 * - 2026-09-11: Consolidated unit tests into profile.test.js matching profile.js domain module.
 */
