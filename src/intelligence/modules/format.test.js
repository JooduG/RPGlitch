/**
 * src/intelligence/modules/format.test.js
 * 🧪 UNIT TESTS: Output Formats, Schemas & State Contracts (Zero Backwards Compatibility)
 */

import { describe, expect, it } from "vitest";
import { OUTPUT_FORMATS, SCHEMA_ATOMS, SCHEMA_FIELD_DESCRIPTORS, get_output_format, render_output_format_xml } from "./format.js";

describe("src/intelligence/modules/format.js", () => {
  describe("SCHEMA_ATOMS", () => {
    it("is frozen and contains streamlined directorial and continuum atoms", () => {
      expect(Object.isFrozen(SCHEMA_ATOMS)).toBe(true);
      expect(SCHEMA_ATOMS._thought_process).toBe("<Tactical intent & state delta>");
      expect(SCHEMA_ATOMS.directors_note).toBe("<1-5 lines staging directives for next speaker, or empty string>");
      expect(SCHEMA_ATOMS.visual_staging).toBe("<optional: camera & lighting directive if scene image shifts>");
      expect(SCHEMA_ATOMS.keywords).toEqual(["<1-5 keywords from AVAILABLE_KEYWORDS>"]);
    });
  });

  describe("SCHEMA_FIELD_DESCRIPTORS", () => {
    it("is frozen and contains concise schema descriptors for character and fractal taxonomies", () => {
      expect(Object.isFrozen(SCHEMA_FIELD_DESCRIPTORS)).toBe(true);
      expect(SCHEMA_FIELD_DESCRIPTORS.character.eternal.physical).toContain("[KEY: value] permanent biometrics");
      expect(SCHEMA_FIELD_DESCRIPTORS.character.present.physical).toContain("[KEY: value] current appearance");
      expect(SCHEMA_FIELD_DESCRIPTORS.fractal.eternal.physical).toContain("[KEY: value] permanent geography");
      expect(SCHEMA_FIELD_DESCRIPTORS.fractal.present.physical).toContain("[KEY: value] atmospheric state");
    });
  });

  describe("OUTPUT_FORMATS", () => {
    it("is frozen and contains exactly the 4 cohesive formats and schemas with SCREAMING_SNAKE_CASE keys", () => {
      expect(Object.isFrozen(OUTPUT_FORMATS)).toBe(true);
      const keys = Object.keys(OUTPUT_FORMATS);
      expect(keys.sort()).toEqual(["CONTINUUM", "DIRECTOR", "PROFILE", "PROSE"]);

      // Primitives
      expect(OUTPUT_FORMATS.PROSE).toContain("plain prose");
      expect(OUTPUT_FORMATS.PROSE).toBe("Emit strictly plain prose. No preamble, commentary, markdown, or structural tags.");

      // Schemas & streamlined token constraints
      expect(OUTPUT_FORMATS.DIRECTOR).toContain("_thought_process");
      expect(OUTPUT_FORMATS.DIRECTOR).toContain("<Tactical intent & state delta>");
      expect(OUTPUT_FORMATS.DIRECTOR).toContain("next_action");
      expect(OUTPUT_FORMATS.DIRECTOR).toContain("<1-5 lines staging directives for next speaker, or empty string>");

      expect(OUTPUT_FORMATS.PROFILE).toContain('"name"');
      expect(OUTPUT_FORMATS.PROFILE).toContain('"eternal"');
      expect(OUTPUT_FORMATS.PROFILE).toContain('"present"');
      expect(OUTPUT_FORMATS.PROFILE).not.toContain("HUMAN EYES ONLY");
      expect(OUTPUT_FORMATS.PROFILE).not.toContain("Max 15 lines");

      expect(OUTPUT_FORMATS.CONTINUUM).toContain("eternal");
      expect(OUTPUT_FORMATS.CONTINUUM).toContain("relationships");
      expect(OUTPUT_FORMATS.CONTINUUM).not.toContain("Max 15 lines");
    });
  });

  describe("get_output_format()", () => {
    it("resolves formats and schemas by exact key without backwards compatibility fallbacks", () => {
      expect(get_output_format("DIRECTOR")).toBe(OUTPUT_FORMATS.DIRECTOR);
      expect(get_output_format("PROFILE")).toBe(OUTPUT_FORMATS.PROFILE);
      expect(get_output_format("CONTINUUM")).toBe(OUTPUT_FORMATS.CONTINUUM);
      expect(get_output_format("PROSE")).toBe(OUTPUT_FORMATS.PROSE);

      expect(get_output_format("unknown", "fallback_val")).toBe("fallback_val");
      expect(get_output_format(null, "fallback_val")).toBe("fallback_val");
    });
  });

  describe("render_output_format_xml()", () => {
    it("renders clean <OUTPUT_FORMAT> XML blocks with optional mode attribute", () => {
      const xml_json = render_output_format_xml({ mode: "json", content: '{"key": "value"}' });
      expect(xml_json).toContain('<OUTPUT_FORMAT mode="json">');
      expect(xml_json).toContain('{"key": "value"}');
      expect(xml_json).toContain("</OUTPUT_FORMAT>");

      const xml_raw = render_output_format_xml({ content: "raw prose rule" });
      expect(xml_raw).toContain("<OUTPUT_FORMAT>");
      expect(xml_raw).toContain("raw prose rule");
      expect(xml_raw).toContain("</OUTPUT_FORMAT>");

      expect(render_output_format_xml({ content: "" })).toBe("");
    });
  });
});

/**
 * CHANGELOG
 * - 2026-09-13: Added verification for token-optimized SCHEMA_FIELD_DESCRIPTORS and streamlined schema outputs (PROSE, DIRECTOR, PROFILE, CONTINUUM).
 * - 2026-09-13: Verified output format contracts against the 7-section symmetrical format.js rebuild.
 * - 2026-09-12: Updated unit tests to verify the 7 consolidated SCREAMING_SNAKE_CASE keys and alias resolutions (PSEUDO_JSON -> BRACKETS, ARRAY_* -> MEMORIES).
 * - 2026-09-12: Zero backwards compatibility rebuild — tested frozen OUTPUT_FORMATS with kebab-case keys, get_output_format, and render_output_format_xml. Removed legacy individual constant assertions.
 */
