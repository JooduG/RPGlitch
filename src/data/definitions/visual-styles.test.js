import { describe, expect, it } from "vitest";
import { VISUAL_STYLES } from "./visual-styles.js";
import { parse_visual_engine } from "../../media/image-prompts.js";

describe("VISUAL_STYLES Preset Registry", () => {
  it("exports all expected visual styles including lego and concept", () => {
    expect(VISUAL_STYLES.none).toBeDefined();
    expect(VISUAL_STYLES.lego).toBeDefined();
    expect(VISUAL_STYLES.analog_video).toBeDefined();
    expect(VISUAL_STYLES.cinematic).toBeDefined();
  });

  it("configures lego_bricks with plastic studs and minifigure proportions", () => {
    const lego = VISUAL_STYLES.lego;
    expect(lego.id).toBe("lego");
    expect(lego.name).toContain("LEGO");
    expect(lego.tags).toContain("lego");
    expect(lego.tags).toContain("minifigure");
    expect(lego.visual_engine).toContain("minifigure");
    expect(lego.visual_engine).toContain("ABS plastic");
    expect(lego.visual_engine).toContain("studs");

    const parsed = parse_visual_engine(lego.visual_engine);
    expect(parsed.medium).toContain("plastic toy construction");
    expect(parsed.texture).toContain("studs");
  });

  it("configures analog_video with glitch artifacts and scanline stripes", () => {
    const vhs = VISUAL_STYLES.analog_video;
    expect(vhs.tags).toContain("scanlines");
    expect(vhs.tags).toContain("glitch");
    expect(vhs.tags).toContain("surveillance");
    expect(vhs.visual_engine).toContain("horizontal scanline stripes");
    expect(vhs.visual_engine).toContain("VHS tracking glitch lines");

    const parsed = parse_visual_engine(vhs.visual_engine);
    expect(parsed.texture).toContain("horizontal scanline stripes");
    expect(parsed.texture).toContain("interlacing tear lines");
  });

  it("configures cinematic with widescreen optics and non-anime negative prompt", () => {
    const cinematic = VISUAL_STYLES.cinematic;
    expect(cinematic.tags).toContain("cinematic");
    expect(cinematic.tags).toContain("film");
    expect(cinematic.tags).toContain("anamorphic");
    expect(cinematic.visual_engine).toContain("widescreen");
    expect(cinematic.visual_engine).toContain("anamorphic");
    expect(cinematic.negative_prompt).toContain("anime");
    expect(cinematic.negative_prompt).toContain("cel-shaded");
  });

  it("validates all presets match required schema structure", () => {
    for (const [key, style] of Object.entries(VISUAL_STYLES)) {
      expect(style.id).toBe(key);
      expect(typeof style.name).toBe("string");
      expect(style.name.length).toBeGreaterThan(0);
      expect(typeof style.description).toBe("string");
      expect(Array.isArray(style.tags)).toBe(true);
    }
  });

  it("validates active visual engines parse clean XML structures", () => {
    const active_styles = Object.entries(VISUAL_STYLES).filter(([key]) => key !== "none");
    for (const [, style] of active_styles) {
      expect(style.visual_engine).toContain("<VISUAL_ENGINE>");
      expect(style.visual_engine).toContain("</VISUAL_ENGINE>");
      const parsed = parse_visual_engine(style.visual_engine);
      expect(parsed.medium.length).toBeGreaterThan(0);
      expect(parsed.palette.length).toBeGreaterThan(0);
      expect(parsed.texture.length).toBeGreaterThan(0);
    }
  });
});
