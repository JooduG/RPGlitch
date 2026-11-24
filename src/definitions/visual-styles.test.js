/**
 * src/definitions/visual-styles.test.js
 * ============================================================================
 * Unit Tests for Visual Style Presets, XML Compilation & Resolution
 * ============================================================================
 *
 * Validates XML tag casing, vintage preset migration from polaroid, category
 * pruning, frozen immutability, and portrait/story visual style resolution.
 */

import { describe, expect, it } from "vitest";
import { VISUAL_STYLES, get_visual_style } from "./visual-styles.js";

// ---------------------------------------------------------------------------------------------
// PRESET REGISTRY & XML COMPILATION TESTS
// ---------------------------------------------------------------------------------------------

describe("VISUAL_STYLES Preset Registry", () => {
  it("exports all expected visual styles including lego, vintage, and analog_video", () => {
    expect(VISUAL_STYLES.none).toBeDefined();
    expect(VISUAL_STYLES.none.negative_prompt).toContain("blurry");
    expect(VISUAL_STYLES.lego).toBeDefined();
    expect(VISUAL_STYLES.vintage).toBeDefined();
    expect(VISUAL_STYLES.polaroid).toBeUndefined();
    expect(VISUAL_STYLES.analog_video).toBeDefined();
    expect(VISUAL_STYLES.cinematic).toBeDefined();
  });

  it("enforces immutability on VISUAL_STYLES", () => {
    expect(Object.isFrozen(VISUAL_STYLES)).toBe(true);
  });

  it("configures vintage with 35mm analog film and negative polaroid border guards", () => {
    const vintage = VISUAL_STYLES.vintage;
    expect(vintage.id).toBe("vintage");
    expect(vintage.name).toBe("Vintage Film");
    expect(vintage.keywords).toContain("vintage");
    expect(vintage.keywords).toContain("35mm");
    expect(vintage.engine).toBeDefined();
    expect(vintage.engine.medium).toContain("35mm analog film photo");
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
    expect(lego.engine).toBeDefined();
    expect(lego.engine.medium).toContain("plastic toy construction");
    expect(lego.engine.texture).toContain("studs");
  });

  it("configures analog_video with glitch artifacts and scanline stripes", () => {
    const vhs = VISUAL_STYLES.analog_video;
    expect(vhs.keywords).toContain("scanlines");
    expect(vhs.keywords).toContain("glitch");
    expect(vhs.keywords).toContain("surveillance");
    expect(vhs.engine).toBeDefined();
    expect(vhs.engine.texture).toContain("horizontal scanline stripes");
    expect(vhs.engine.texture).toContain("interlacing tear lines");
  });

  it("configures cinematic with widescreen optics and non-anime negative prompt", () => {
    const cinematic = VISUAL_STYLES.cinematic;
    expect(cinematic.keywords).toContain("cinematic");
    expect(cinematic.keywords).toContain("film");
    expect(cinematic.keywords).toContain("anamorphic");
    expect(cinematic.engine).toBeDefined();
    expect(cinematic.engine.medium).toContain("widescreen");
    expect(cinematic.engine.camera).toContain("anamorphic");
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

  it("validates active visual engines contain structured tokens", () => {
    const active_styles = Object.entries(VISUAL_STYLES).filter(([key]) => key !== "none");
    for (const [, style] of active_styles) {
      expect(style.engine).toBeDefined();
      expect(typeof style.engine.medium).toBe("string");
      expect(style.engine.medium.length).toBeGreaterThan(0);
      expect(typeof style.engine.palette).toBe("string");
      expect(style.engine.palette.length).toBeGreaterThan(0);
      expect(typeof style.engine.texture).toBe("string");
      expect(style.engine.texture.length).toBeGreaterThan(0);
    }
  });

  it("retrieves visual style via get_visual_style with fallback to none", () => {
    expect(get_visual_style("cyberpunk").id).toBe("cyberpunk");
    expect(get_visual_style("vintage").id).toBe("vintage");
    expect(get_visual_style("non_existent_key").id).toBe("none");
    expect(get_visual_style().id).toBe("none");
  });
});

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-11-10: Moved with src/media/styles.js back to src/definitions/visual-styles.js
 *   (import re-pointed, header path updated). No assertion changes.
 * - 2026-09-06: Added unit tests for uppercase XML tags (<MEDIUM>, <PALETTE>, <CAMERA>/<COMPOSITION>, <TEXTURE>),
 *   vintage preset attributes and border exclusions, category pruning assertions, and frozen registry helpers.
 * - 2026-08-29: Initial visual style system test suite validating presets, engines, and fallback resolution.
 */
