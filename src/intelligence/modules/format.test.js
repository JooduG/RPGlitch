/**
 * src/intelligence/modules/format.test.js
 * 🧪 UNIT TESTS: Output Formats, Schemas & State Contracts (Zero Backwards Compatibility)
 */

import { describe, expect, it } from "vitest";
import { OUTPUT_FORMATS, get_output_format, render_output_format_xml } from "./format.js";

describe("src/intelligence/modules/format.js", () => {
  describe("OUTPUT_FORMATS", () => {
    it("is frozen and contains exactly the 4 cohesive formats and schemas with SCREAMING_SNAKE_CASE keys", () => {
      expect(Object.isFrozen(OUTPUT_FORMATS)).toBe(true);
      const keys = Object.keys(OUTPUT_FORMATS);
      expect(keys.sort()).toEqual(["CONTINUUM", "DIRECTOR", "PROFILE", "PROSE"]);

      // Primitives
      expect(OUTPUT_FORMATS.PROSE).toContain("plain prose");

      // Schemas
      expect(OUTPUT_FORMATS.DIRECTOR).toContain("_thought_process");
      expect(OUTPUT_FORMATS.DIRECTOR).toContain("next_action");
      expect(OUTPUT_FORMATS.PROFILE).toContain('"name"');
      expect(OUTPUT_FORMATS.PROFILE).toContain('"eternal"');
      expect(OUTPUT_FORMATS.PROFILE).toContain('"present"');
      expect(OUTPUT_FORMATS.CONTINUUM).toContain("eternal");
      expect(OUTPUT_FORMATS.CONTINUUM).toContain("relationships");
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
 * - 2026-09-12: Updated unit tests to verify the 7 consolidated SCREAMING_SNAKE_CASE keys and alias resolutions (PSEUDO_JSON -> BRACKETS, ARRAY_* -> MEMORIES).
 * - 2026-09-12: Zero backwards compatibility rebuild — tested frozen OUTPUT_FORMATS with kebab-case keys, get_output_format, and render_output_format_xml. Removed legacy individual constant assertions.
 */
