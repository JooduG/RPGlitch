/**
 * ============================================================================
 * src/data/definitions/speaking-styles.test.js
 * 🎙️ SPEAKING STYLES & DETOX RULES TEST SUITE
 * ============================================================================
 */

import { SPEAKING_STYLES } from "@config";
import { describe, expect, it } from "vitest";
import { SPEAKING_STYLE_RULES } from "./speaking-styles.js";

describe("speaking-styles taxonomy", () => {
  it("exports canonical SPEAKING_STYLES containing the 4 balanced quartets", () => {
    expect(SPEAKING_STYLES).toEqual(["casual", "lyrical", "primal", "clinical"]);
    expect(Object.isFrozen(SPEAKING_STYLES)).toBe(true);
  });

  it("exports comprehensive frozen SPEAKING_STYLE_RULES", () => {
    expect(Array.isArray(SPEAKING_STYLE_RULES)).toBe(true);
    expect(SPEAKING_STYLE_RULES.length).toBeGreaterThan(40);
    expect(Object.isFrozen(SPEAKING_STYLE_RULES)).toBe(true);
  });

  it("ensures all rules have valid regex pattern and replacement properties", () => {
    for (const rule of SPEAKING_STYLE_RULES) {
      expect(rule.pattern instanceof RegExp || rule.regex instanceof RegExp).toBe(true);
      expect(rule.replace).toBeDefined();
    }
  });

  it("properly executes functional callback rules", () => {
    const marrow_rule = SPEAKING_STYLE_RULES.find((candidate_rule) => candidate_rule.regex.source.includes("marrow"));
    expect(marrow_rule).toBeDefined();
    expect(typeof marrow_rule.replace).toBe("function");
    const marrow_replaced = "marrow of his teeth".replace(marrow_rule.regex, marrow_rule.replace);
    expect(marrow_replaced).toMatch(/teeth|jaw|bones/);

    const ear_rule = SPEAKING_STYLE_RULES.find((candidate_rule) => candidate_rule.regex.source.includes("shell of"));
    expect(ear_rule).toBeDefined();
    expect(typeof ear_rule.replace).toBe("function");
    const ear_replaced = "shell of his ear".replace(ear_rule.regex, ear_rule.replace);
    expect(ear_replaced).toBe("his ear");

    const void_rule = SPEAKING_STYLE_RULES.find((candidate_rule) => candidate_rule.regex.source.includes("void"));
    expect(void_rule).toBeDefined();
  });
});
