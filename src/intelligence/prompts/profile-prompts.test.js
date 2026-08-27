/**
 * src/intelligence/prompts/profile-prompts.test.js
 * 📇 UNIT TESTS: PROFILE PIPELINE & FIELD ENHANCEMENT PROMPT COMPILER
 */

import { describe, expect, it } from "vitest";
import { render_enhancement, render_profile_sorting } from "./profile-prompts.js";

describe("Profile Prompts (profile-prompts.js)", () => {
  describe("render_enhancement()", () => {
    it("formats physical properties to XML correctly", () => {
      const entity = {
        eternal: { physical: '{"eyeColor": "blue", "hair": "black"}' },
      };
      const result = render_enhancement({
        _field_id: "eternal.physical",
        content: "Content",
        label: "Appearance",
        directive: "Enhance look.",
        enhancer: "AESTHETICS",
        entity,
      });
      expect(result).toContain("<PERMANENT_APPEARANCE>");
      expect(result).toContain("<eyeColor>blue</eyeColor>");
      expect(result).toContain("<hair>black</hair>");
    });

    it("injects MACRO_PROTOCOL correctly for characters vs fractals", () => {
      const char_result = render_enhancement({
        _field_id: "eternal.non_physical",
        content: "Content",
        label: "Personality",
        directive: "Enhance.",
        entity_type: "character",
      });
      expect(char_result).toContain("Use placeholder macros for entities: '{{me}}' (self)");
      expect(char_result).not.toContain("'{{user}}' (user persona), '{{char}}' (AI character)");

      const fractal_result = render_enhancement({
        _field_id: "eternal.non_physical",
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
        _field_id: "present.non_physical",
        content: "Present mood.",
        label: "Mood",
        directive: "Enhance.",
        entity,
        entity_type: "character",
      });
      expect(result).toContain("Present mood.");
      expect(result).toContain("Present outfit."); // same-layer sibling
      expect(result).toContain("Eternal psyche."); // eternal baseline for the same sub
      expect(result).not.toContain("Eternal body."); // no cross-sub baseline
      expect(result).not.toContain("Old memory anchor"); // no past bleed
      expect(result).not.toContain("Impending prophecy"); // no future bleed
    });

    it("labels the field, layer, and canonical contract", () => {
      const result = render_enhancement({
        _field_id: "eternal.non_physical",
        content: "Content",
        label: "Personality, Behaviour & Traits",
        directive: "Enhance.",
        layer_key: "ETERNAL",
        entity: { eternal: { non_physical: "Current psyche" } },
      });
      expect(result).toContain('enhancing="Personality, Behaviour &amp; Traits"');
      expect(result).toContain("<LAYER>ETERNAL</LAYER>");
      expect(result).toContain('field="eternal.non_physical"');
      expect(result).toContain("TEMPORAL LAYER CONTRACT");
    });

    it("uses the agenda format for future and single-array format for patch_single", () => {
      const future_result = render_enhancement({
        _field_id: "future",
        content: "Chase the horizon.",
        label: "Agenda",
        directive: "Enhance.",
        entity: { future: "Chase the horizon." },
      });
      expect(future_result).toContain("active future tense");

      const single_memory = render_enhancement({
        _field_id: "past",
        content: "Found the key.",
        label: "Memory",
        directive: "Enhance.",
        is_array_field: true,
        array_mode: "patch_single",
      });
      expect(single_memory).toContain("Rewrite exactly this ONE memory");
      expect(single_memory).not.toContain("Generate 3-5");

      const append_memory = render_enhancement({
        _field_id: "past",
        content: "Found the key.",
        label: "Memory",
        directive: "Enhance.",
        is_array_field: true,
        array_mode: "append_new",
      });
      expect(append_memory).toContain("Generate 3-5");
    });
  });

  describe("render_profile_sorting()", () => {
    it("injects sorting instructions correctly for characters and fractals", () => {
      const char_result = render_profile_sorting("character");
      expect(char_result).toContain("FOCUS: Extracting data for an individual CHARACTER");
      expect(char_result).toContain("Use placeholder macros for entities: '{{me}}' (self)");

      const fractal_result = render_profile_sorting("fractal");
      expect(fractal_result).toContain("FOCUS: Extracting data for a FRACTAL");
      expect(fractal_result).toContain("Use placeholder macros for entities: '{{user}}' (user persona), '{{char}}'");
    });

    it("omits ingestion directive by default and appends it when ingestion: true", () => {
      const default_res = render_profile_sorting("character");
      expect(default_res).not.toContain("INGESTION_DIRECTIVE");

      const ingest_res = render_profile_sorting("character", { ingestion: true });
      expect(ingest_res).toContain("<INGESTION_DIRECTIVE");
      expect(ingest_res).toContain("SOURCE_OF_TRUTH");
      expect(ingest_res).toContain("NO_NULL_FABRICATION");
    });
  });
});
