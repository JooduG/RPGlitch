/**
 * src/data/definitions/visual-styles.test.js
 * ============================================================================
 * Unit Tests for Visual Style Presets, XML Compilation & Resolution
 * ============================================================================
 *
 * Validates XML tag casing, vintage preset migration from polaroid, category
 * pruning, frozen immutability, and portrait/story visual style resolution.
 */

import { describe, expect, it } from "vitest";
import {
  VISUAL_STYLES,
  VALID_VISUAL_STYLES,
  is_valid_visual_style,
  get_visual_style,
  resolve_portrait_visual_style_key,
  resolve_story_visual_style_key,
} from "./visual-styles.js";
import { parse_visual_engine } from "@utils";

// ---------------------------------------------------------------------------------------------
// PRESET REGISTRY & XML COMPILATION TESTS
// ---------------------------------------------------------------------------------------------

describe("VISUAL_STYLES Preset Registry", () => {
  it("exports all expected visual styles including lego, vintage, and analog_video", () => {
    expect(VISUAL_STYLES.none).toBeDefined();
    expect(VISUAL_STYLES.lego).toBeDefined();
    expect(VISUAL_STYLES.vintage).toBeDefined();
    expect(VISUAL_STYLES.polaroid).toBeUndefined();
    expect(VISUAL_STYLES.analog_video).toBeDefined();
    expect(VISUAL_STYLES.cinematic).toBeDefined();
  });

  it("enforces immutability on VISUAL_STYLES and VALID_VISUAL_STYLES", () => {
    expect(Object.isFrozen(VISUAL_STYLES)).toBe(true);
    expect(Object.isFrozen(VALID_VISUAL_STYLES)).toBe(true);
    expect(VALID_VISUAL_STYLES.has("vintage")).toBe(true);
    expect(VALID_VISUAL_STYLES.has("polaroid")).toBe(false);
  });

  it("validates style identifiers via is_valid_visual_style", () => {
    expect(is_valid_visual_style("vintage")).toBe(true);
    expect(is_valid_visual_style("cinematic")).toBe(true);
    expect(is_valid_visual_style("none")).toBe(true);
    expect(is_valid_visual_style("polaroid")).toBe(false);
    expect(is_valid_visual_style("invalid_style")).toBe(false);
    expect(is_valid_visual_style(null)).toBe(false);
    expect(is_valid_visual_style(123)).toBe(false);
  });

  it("configures vintage with 35mm analog film and negative polaroid border guards", () => {
    const vintage = VISUAL_STYLES.vintage;
    expect(vintage.id).toBe("vintage");
    expect(vintage.name).toBe("Vintage Film");
    expect(vintage.keywords).toContain("vintage");
    expect(vintage.keywords).toContain("35mm");
    expect(vintage.keywords).toContain("analog");
    expect(vintage.visual_engine).toContain("<VISUAL_ENGINE>");
    expect(vintage.visual_engine).toContain("<MEDIUM>");
    expect(vintage.visual_engine).toContain("<CAMERA>");
    expect(vintage.visual_engine).toContain("35mm analog film photo");
    expect(vintage.negative_prompt).toContain("white border");
    expect(vintage.negative_prompt).toContain("polaroid frame");
    expect(vintage.negative_prompt).toContain("polaroid border");
  });

  it("configures lego_bricks with plastic studs and minifigure proportions", () => {
    const lego = VISUAL_STYLES.lego;
    expect(lego.id).toBe("lego");
    expect(lego.name).toContain("LEGO");
    expect(lego.keywords).toContain("lego");
    expect(lego.keywords).toContain("minifigure");
    expect(lego.visual_engine).toContain("minifigure");
    expect(lego.visual_engine).toContain("ABS plastic");
    expect(lego.visual_engine).toContain("studs");

    const parsed = parse_visual_engine(lego.visual_engine);
    expect(parsed.medium).toContain("plastic toy construction");
    expect(parsed.texture).toContain("studs");
  });

  it("configures analog_video with glitch artifacts and scanline stripes", () => {
    const vhs = VISUAL_STYLES.analog_video;
    expect(vhs.keywords).toContain("scanlines");
    expect(vhs.keywords).toContain("glitch");
    expect(vhs.keywords).toContain("surveillance");
    expect(vhs.visual_engine).toContain("horizontal scanline stripes");
    expect(vhs.visual_engine).toContain("VHS tracking glitch lines");

    const parsed = parse_visual_engine(vhs.visual_engine);
    expect(parsed.texture).toContain("horizontal scanline stripes");
    expect(parsed.texture).toContain("interlacing tear lines");
  });

  it("configures cinematic with widescreen optics and non-anime negative prompt", () => {
    const cinematic = VISUAL_STYLES.cinematic;
    expect(cinematic.keywords).toContain("cinematic");
    expect(cinematic.keywords).toContain("film");
    expect(cinematic.keywords).toContain("anamorphic");
    expect(cinematic.visual_engine).toContain("widescreen");
    expect(cinematic.visual_engine).toContain("anamorphic");
    expect(cinematic.negative_prompt).toContain("anime");
    expect(cinematic.negative_prompt).toContain("cel-shaded");
  });

  it("validates all presets match required schema structure without category", () => {
    for (const [key, style] of Object.entries(VISUAL_STYLES)) {
      expect(style.id).toBe(key);
      expect(typeof style.name).toBe("string");
      expect(style.name.length).toBeGreaterThan(0);
      expect(typeof style.description).toBe("string");
      expect(Array.isArray(style.keywords)).toBe(true);
      expect("category" in style).toBe(false);
    }
  });

  it("validates active visual engines parse clean XML structures with uppercase tags", () => {
    const active_styles = Object.entries(VISUAL_STYLES).filter(([key]) => key !== "none");
    for (const [, style] of active_styles) {
      expect(style.visual_engine).toContain("<VISUAL_ENGINE>");
      expect(style.visual_engine).toContain("</VISUAL_ENGINE>");
      expect(style.visual_engine).toContain("<MEDIUM>");
      expect(style.visual_engine).toContain("</MEDIUM>");
      expect(style.visual_engine).toContain("<PALETTE>");
      expect(style.visual_engine).toContain("</PALETTE>");
      expect(style.visual_engine).toContain("<TEXTURE>");
      expect(style.visual_engine).toContain("</TEXTURE>");
      const parsed = parse_visual_engine(style.visual_engine);
      expect(parsed.medium.length).toBeGreaterThan(0);
      expect(parsed.palette.length).toBeGreaterThan(0);
      expect(parsed.texture.length).toBeGreaterThan(0);
    }
  });

  it("retrieves visual style via get_visual_style with fallback to none", () => {
    expect(get_visual_style("cyberpunk").id).toBe("cyberpunk");
    expect(get_visual_style("vintage").id).toBe("vintage");
    expect(get_visual_style("non_existent_key").id).toBe("none");
    expect(get_visual_style().id).toBe("none");
  });

  it("resolves portrait and story visual style keys correctly", () => {
    expect(resolve_portrait_visual_style_key({ visual_style: "anime" })).toBe("anime");
    expect(resolve_portrait_visual_style_key({ visual_style: "vintage" })).toBe("vintage");
    expect(resolve_portrait_visual_style_key({ visual_style: "polaroid" })).toBe("none");
    expect(resolve_portrait_visual_style_key({ visual_style: "invalid_key" })).toBe("none");
    expect(resolve_portrait_visual_style_key({})).toBe("none");

    expect(resolve_story_visual_style_key({ visual_style: "noir" })).toBe("noir");
    expect(resolve_story_visual_style_key({ visual_style: "vintage" })).toBe("vintage");
    expect(resolve_story_visual_style_key(null)).toBe("none");
  });
});

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-06: Added unit tests for uppercase XML tags (<MEDIUM>, <PALETTE>, <CAMERA>/<COMPOSITION>, <TEXTURE>),
 *   vintage preset attributes and border exclusions, category pruning assertions, and frozen registry helpers.
 * - 2026-08-29: Initial visual style system test suite validating presets, engines, and fallback resolution.
 */
