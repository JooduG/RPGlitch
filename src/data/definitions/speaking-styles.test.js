/**
 * ============================================================================
 * src/data/definitions/speaking-styles.test.js
 * 🎙️ SPEAKING STYLES & DETOX RULES TEST SUITE
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import {
  SPEAKING_STYLES,
  VALID_SPEAKING_STYLES,
  is_valid_speaking_style,
  SPEAKING_STYLE_RULES,
  VOCAL_RULES,
  SOUND_RULES,
  SENSORY_RULES,
  METAPHOR_RULES,
  COMMUNITY_RULES,
} from "./speaking-styles.js";

describe("speaking-styles taxonomy", () => {
  it("exports canonical SPEAKING_STYLES containing the 4 balanced quartets", () => {
    expect(SPEAKING_STYLES).toEqual(["casual", "lyrical", "primal", "clinical"]);
    expect(Object.isFrozen(SPEAKING_STYLES)).toBe(true);
  });

  it("exports a fast lookup Set VALID_SPEAKING_STYLES matching the list", () => {
    expect(VALID_SPEAKING_STYLES.size).toBe(4);
    for (const style of SPEAKING_STYLES) {
      expect(VALID_SPEAKING_STYLES.has(style)).toBe(true);
    }
  });

  it("correctly validates supported and unsupported speaking styles", () => {
    expect(is_valid_speaking_style("casual")).toBe(true);
    expect(is_valid_speaking_style("lyrical")).toBe(true);
    expect(is_valid_speaking_style("primal")).toBe(true);
    expect(is_valid_speaking_style("clinical")).toBe(true);

    expect(is_valid_speaking_style("plain")).toBe(false);
    expect(is_valid_speaking_style("ornate")).toBe(false);
    expect(is_valid_speaking_style("raw")).toBe(false);
    expect(is_valid_speaking_style("")).toBe(false);
    expect(is_valid_speaking_style(null)).toBe(false);
    expect(is_valid_speaking_style(undefined)).toBe(false);
    expect(is_valid_speaking_style(123)).toBe(false);
    expect(is_valid_speaking_style({})).toBe(false);
  });

  it("exports comprehensive SPEAKING_STYLE_RULES and categorical subsets", () => {
    expect(Array.isArray(SPEAKING_STYLE_RULES)).toBe(true);
    expect(SPEAKING_STYLE_RULES.length).toBeGreaterThan(40);

    expect(Array.isArray(VOCAL_RULES)).toBe(true);
    expect(Array.isArray(SOUND_RULES)).toBe(true);
    expect(Array.isArray(SENSORY_RULES)).toBe(true);
    expect(Array.isArray(METAPHOR_RULES)).toBe(true);
    expect(Array.isArray(COMMUNITY_RULES)).toBe(true);

    const total_subsets_count = VOCAL_RULES.length + SOUND_RULES.length + SENSORY_RULES.length + METAPHOR_RULES.length + COMMUNITY_RULES.length;

    expect(SPEAKING_STYLE_RULES.length).toBe(total_subsets_count);
  });

  it("ensures all rules have valid regex pattern and replacement properties", () => {
    for (const rule of SPEAKING_STYLE_RULES) {
      expect(rule.pattern instanceof RegExp || rule.regex instanceof RegExp).toBe(true);
      expect(rule.replace).toBeDefined();
    }
  });

  it("properly executes functional callback rules", () => {
    const marrow_rule = METAPHOR_RULES.find((candidate_rule) => candidate_rule.regex.source.includes("marrow"));
    expect(marrow_rule).toBeDefined();
    expect(typeof marrow_rule.replace).toBe("function");
    const marrow_replaced = "marrow of his teeth".replace(marrow_rule.regex, marrow_rule.replace);
    expect(marrow_replaced).toMatch(/teeth|jaw|bones/);

    const ear_rule = METAPHOR_RULES.find((candidate_rule) => candidate_rule.regex.source.includes("shell of"));
    expect(ear_rule).toBeDefined();
    expect(typeof ear_rule.replace).toBe("function");
    const ear_replaced = "shell of his ear".replace(ear_rule.regex, ear_rule.replace);
    expect(ear_replaced).toBe("his ear");

    const void_rule = COMMUNITY_RULES.find((candidate_rule) => candidate_rule.regex.source.includes("void"));
    expect(void_rule).toBeDefined();
  });
});
