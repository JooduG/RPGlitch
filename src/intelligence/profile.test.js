/**
 * src/intelligence/profile.test.js
 * 📇 UNIT TESTS: PROFILE DOMAIN (Structuring, Entity Mapping, Field Enhancement & Spawning)
 */

import { describe, expect, it, vi } from "vitest";
import { apply_profile_to_entity } from "./profile.js";
import { compile_prompt } from "./prompts.js";
import { TASK_LIBRARY } from "./modules/task.js";
import { get_output_format, OUTPUT_FORMATS } from "./modules/output.js";
import { PROMPTS } from "./prompts.js";
import { PROTOCOL_LIBRARY } from "./modules/protocols.js";

// ── 1. Protocols & Schema Specifications ──────────────────────────────────────

describe("Profile Domain (profile.js)", () => {
  describe("profile protocol primitives", () => {
    it("are frozen and expose a valid schema and formats", () => {
      expect(Object.isFrozen(PROTOCOL_LIBRARY.MACROS)).toBe(true);
      expect(Object.isFrozen(TASK_LIBRARY.SORTING)).toBe(true);
      expect(Object.isFrozen(PROMPTS.sorting.format)).toBe(true);

      const profile_schema = get_output_format(PROMPTS.sorting.format, { entity_type: "character" });
      expect(profile_schema).toContain('"name"');
      expect(profile_schema).toContain('"eternal"');
      expect(profile_schema).toContain('"present"');
      expect(profile_schema).toContain('"past"');
      expect(profile_schema).toContain('"future"');

      expect(OUTPUT_FORMATS.PROSE).toBeDefined();
      expect(get_output_format(PROMPTS.director.format)).toBeDefined();
      expect(profile_schema).toBeDefined();
      expect(get_output_format(PROMPTS.continuum.format)).toBeDefined();
    });
  });

  // ── 2. Field Enhancement Compilers ──────────────────────────────────────────

  describe("enhancement via compile_prompt()", () => {
    it("formats physical properties to XML correctly", () => {
      const entity = {
        present: { physical: '{"eyeColor": "blue", "hair": "black"}' },
      };
      const result = compile_prompt("enhancement", {
        field_id: "present.non_physical",
        content: "Content",
        label: "Mood",
        directive: "Enhance look.",
        enhancer: "AESTHETICS",
        entity,
      });
      expect(result.system).toContain("<CURRENT_LOOK>");
      expect(result.system).toContain("<eyeColor>blue</eyeColor>");
      expect(result.system).toContain("<hair>black</hair>");
    });

    it("injects MACRO_PROTOCOL correctly for characters vs fractals", () => {
      const char_result = compile_prompt("enhancement", {
        field_id: "eternal.non_physical",
        content: "Content",
        label: "Personality",
        directive: "Enhance.",
        entity_type: "character",
      });
      expect(char_result.system).toContain("Use placeholder macros for entities: '@ME' / '@SPEAKER' (self, actor)");
      expect(char_result.system).not.toContain("'@USER' (user persona), '@CHAR' (AI character)");

      const fractal_result = compile_prompt("enhancement", {
        field_id: "eternal.non_physical",
        content: "Content",
        label: "Lore",
        directive: "Enhance.",
        entity_type: "fractal",
      });
      expect(fractal_result.system).toContain("'@USER' (user persona), '@CHAR' (AI character)");
      expect(fractal_result.system).not.toContain("'@ME' / '@SPEAKER' (self, actor)");
    });

    it("injects the same-layer sibling + eternal baseline (no whole-profile bleed)", () => {
      const entity = {
        eternal: { physical: "Eternal body.", non_physical: "Eternal psyche." },
        present: { physical: "Present outfit.", non_physical: "Present mood." },
        past: [{ id: "p1", content: "Old memory anchor", type: "past", emotional_weight: 5 }],
        future: "Impending prophecy",
      };
      const result = compile_prompt("enhancement", {
        field_id: "present.non_physical",
        content: "Present mood.",
        label: "Mood",
        directive: "Enhance.",
        entity,
        entity_type: "character",
      });
      expect(result.system).toContain("Present mood.");
      expect(result.system).toContain("Present outfit.");
      expect(result.system).toContain("Eternal psyche.");
      expect(result.system).not.toContain("Eternal body.");
      expect(result.system).not.toContain("Old memory anchor");
      expect(result.system).not.toContain("Impending prophecy");
    });
  });

  describe("sorting via compile_prompt()", () => {
    it("renders valid schema, macros, and focus directive", () => {
      const char_result = compile_prompt("sorting", { entity_type: "character", options: { ingestion: true } });
      expect(char_result.system).toContain('<SYSTEM mode="sorting"');
      expect(char_result.system).toContain("FOCUS: Extracting data for an individual CHARACTER.");
      expect(char_result.system).toContain("SOURCE OF TRUTH & INGESTION RULES:");

      const fractal_result = compile_prompt("sorting", { entity_type: "fractal", options: { redistribute: true } });
      expect(fractal_result.system).toContain("FOCUS: Extracting data for a FRACTAL");
      expect(fractal_result.system).toContain("REDISTRIBUTE: The source profile may have content");
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

    it("merges past prose onto Veil string pools without type flips", () => {
      const entity = { past: "[ORION: wary]" };
      apply_profile_to_entity(entity, { past: ["[MIRA: trusts him.]"] });
      expect(typeof entity.past).toBe("string");
      expect(entity.past).toContain("[ORION: wary]");
      expect(entity.past).toContain("[MIRA: trusts him.]");
    });

    it("accepts a flat past string onto array pools as one pinned vector", () => {
      const entity = { past: [] };
      apply_profile_to_entity(entity, { past: "[SOLO: lone wolf.]" });
      expect(entity.past).toHaveLength(1);
      expect(entity.past[0].content).toBe("[SOLO: lone wolf.]");
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
 * - 2026-09-23: Assertion follows the single `mode` discriminator (`<SYSTEM mode="sorting"`).
 * - 2026-09-16: Updated primitive protocol assertions from SORTING_DIRECTIVES to TASK_LIBRARY.SORTING following catalog unification in task.js.
 * - 2026-09-12: Updated protocol tests to assert the 7 unified SCREAMING_SNAKE_CASE OUTPUT_FORMATS.
 * - 2026-09-12: Updated imports for PROFILE_SCHEMA and OUTPUT_FORMATS from modules/format.js.
 * - 2026-09-11: Pointed the profile-protocol assertions at the primitives (PROFILE_SCHEMA / SORTING_DIRECTIVES / OUTPUT_FORMATS / MACRO_DIRECTIVES) after PROFILE_PROTOCOLS was pruned.
 * - 2026-09-11: Consolidated unit tests into profile.test.js matching profile.js domain module.
 */
