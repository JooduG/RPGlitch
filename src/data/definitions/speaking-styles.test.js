import { describe, expect, it } from "vitest";
import { SPEAKING_STYLES, VALID_SPEAKING_STYLES, is_valid_speaking_style, SPEAKING_STYLE_RULES } from "./speaking-styles.js";

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
  });

  it("exports comprehensive SPEAKING_STYLE_RULES array", () => {
    expect(Array.isArray(SPEAKING_STYLE_RULES)).toBe(true);
    expect(SPEAKING_STYLE_RULES.length).toBeGreaterThan(40);
  });
});
