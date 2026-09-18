/**
 * src/intelligence/modules/format.test.js
 * 🧪 UNIT TESTS: Output Formats, Schemas & State Contracts (Zero Backwards Compatibility)
 */

import { describe, expect, it } from "vitest";
import { PROSE_FORMAT, SCHEMA_ATOMS, get_output_format, render_json_schema, render_output_format_xml } from "./format.js";
import { PROMPTS } from "../prompts.js";

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

  describe("PROSE_FORMAT", () => {
    it("declares the canonical plain prose directive", () => {
      expect(PROSE_FORMAT).toContain("plain prose");
      expect(PROSE_FORMAT).toBe("Emit strictly plain prose. No preamble, commentary, markdown, or structural tags.");
    });
  });

  describe("get_output_format()", () => {
    it("resolves PROSE format string to PROSE_FORMAT and returns fallback for unknown strings", () => {
      expect(get_output_format("PROSE")).toBe(PROSE_FORMAT);
      expect(get_output_format("unknown", "fallback_val")).toBe("fallback_val");
      expect(get_output_format(null, "fallback_val")).toBe("fallback_val");
    });

    it("parameterizes schemas dynamically by target or resolved entity taxonomy type", () => {
      expect(get_output_format(PROMPTS.continuum.format, { target_type: "fractal" })).toBe(
        render_json_schema(PROMPTS.continuum.format.schema, "fractal"),
      );
      expect(get_output_format(PROMPTS.continuum.format, { target_type: "character" })).toBe(
        render_json_schema(PROMPTS.continuum.format.schema, "character"),
      );
      expect(get_output_format(PROMPTS.sorting.format, { resolved_type: "fractal" })).toBe(
        render_json_schema(PROMPTS.sorting.format.schema, "fractal"),
      );
      expect(get_output_format(PROMPTS.sorting.format, { resolved_type: "character" })).toBe(
        render_json_schema(PROMPTS.sorting.format.schema, "character"),
      );
      expect(get_output_format(PROMPTS.optics.format, { variant: "selfie" })).toContain('"caption"');
    });

    it("dynamically compiles format specification objects declared in PROMPTS manifest", () => {
      const director_spec = PROMPTS.director.format;
      expect(get_output_format(director_spec)).toBe(render_json_schema(director_spec.schema));

      const continuum_spec = PROMPTS.continuum.format;
      expect(get_output_format(continuum_spec, { target_type: "fractal" })).toBe(render_json_schema(continuum_spec.schema, "fractal"));
      expect(get_output_format(continuum_spec, { target_type: "character" })).toBe(render_json_schema(continuum_spec.schema, "character"));

      const optics_spec = PROMPTS.optics.format;
      expect(get_output_format(optics_spec, { variant: "selfie" })).toContain('"caption"');
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
 * - 2026-09-16: Removed SCHEMA_FIELD_DESCRIPTORS suite following repatriation into PROFILE_FIELDS directives in profile-fields.js.
 * - 2026-09-13: Added verification for token-optimized SCHEMA_FIELD_DESCRIPTORS and streamlined schema outputs (PROSE, DIRECTOR, PROFILE, CONTINUUM).
 * - 2026-09-13: Verified output format contracts against the 7-section symmetrical format.js rebuild.
 * - 2026-09-12: Updated unit tests to verify the 7 consolidated SCREAMING_SNAKE_CASE keys and alias resolutions (PSEUDO_JSON -> BRACKETS, ARRAY_* -> MEMORIES).
 * - 2026-09-12: Zero backwards compatibility rebuild — tested frozen OUTPUT_FORMATS with kebab-case keys, get_output_format, and render_output_format_xml. Removed legacy individual constant assertions.
 */
