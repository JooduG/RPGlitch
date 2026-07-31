import { describe, expect, it } from "vitest";
import { VISUAL_STYLES } from "./visual-styles.js";
import { parse_visual_engine } from "../../media/optics.js";

describe("VISUAL_STYLES Preset Registry", () => {
  it("exports all expected visual styles including lego and concept", () => {
    expect(VISUAL_STYLES.none).toBeDefined();
    expect(VISUAL_STYLES.lego).toBeDefined();
    expect(VISUAL_STYLES.concept).toBeDefined();
    expect(VISUAL_STYLES.cctv).toBeDefined();
    expect(VISUAL_STYLES.amateur).toBeDefined();
    expect(VISUAL_STYLES.steampunk).toBeDefined();
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
    expect(parsed.medium).toContain("LEGO minifigure");
    expect(parsed.texture).toContain("studs");
  });

  it("configures concept_art with multiple angles and design sheet layout", () => {
    const concept = VISUAL_STYLES.concept;
    expect(concept.id).toBe("concept");
    expect(concept.tags).toContain("concept_art");
    expect(concept.tags).toContain("model_sheet");
    expect(concept.visual_engine).toContain("exploratory");

    const parsed = parse_visual_engine(concept.visual_engine);
    expect(parsed.medium).toContain("production design sheet");
    expect(parsed.texture).toContain("pencil strokes");
  });

  it("configures surveillance_footage with glitch artifacts and scanline stripes", () => {
    const cctv = VISUAL_STYLES.cctv;
    expect(cctv.tags).toContain("scanlines");
    expect(cctv.tags).toContain("glitch");
    expect(cctv.tags).toContain("striped_artifacts");
    expect(cctv.visual_engine).toContain("scanline stripes");
    expect(cctv.visual_engine).toContain("glitch");

    const parsed = parse_visual_engine(cctv.visual_engine);
    expect(parsed.texture).toContain("scanline stripes");
    expect(parsed.texture).toContain("interlacing tear lines");
  });

  it("configures amateur_snap with mirror_selfie tag and casual unremarkable tokens", () => {
    const snap = VISUAL_STYLES.amateur;
    expect(snap.tags).toContain("mirror_selfie");
    expect(snap.tags).toContain("unremarkable");
    expect(snap.tags).toContain("casual");
    expect(snap.description).toContain("unremarkable");
    expect(snap.visual_engine).toContain("mirror selfie");
    expect(snap.visual_engine).toContain("unremarkable");
  });

  it("configures steampunk with authentic Victorian clockwork machinery and non-anime negative prompt", () => {
    const steam = VISUAL_STYLES.steampunk;
    expect(steam.tags).toContain("clockwork");
    expect(steam.tags).toContain("victorian");
    expect(steam.tags).toContain("gears");
    expect(steam.visual_engine).toContain("clockwork");
    expect(steam.visual_engine).toContain("Victorian");
    expect(steam.negative_prompt).toContain("anime");
    expect(steam.negative_prompt).toContain("cel-shaded");
  });

  it("configures blueprint with Da Vinci Vitruvian Man invention sketch tokens", () => {
    const bp = VISUAL_STYLES.blueprint;
    expect(bp.tags).toContain("da_vinci");
    expect(bp.tags).toContain("vitruvian_man");
    expect(bp.tags).toContain("sketch");
    expect(bp.description).toContain("Vitruvian Man");
    expect(bp.visual_engine).toContain("Leonardo da Vinci manuscript");
    expect(bp.visual_engine).toContain("sepia");

    const parsed = parse_visual_engine(bp.visual_engine);
    expect(parsed.medium).toContain("Vitruvian Man");
    expect(parsed.palette).toContain("sepia");
  });

  it("configures vhs_found_footage with uncanny mysterious unexplained glitch artifacts and static blur", () => {
    const vhs = VISUAL_STYLES.vhs;
    expect(vhs.tags).toContain("uncanny");
    expect(vhs.tags).toContain("mysterious");
    expect(vhs.tags).toContain("blurry");
    expect(vhs.description.toLowerCase()).toContain("uncanny");
    expect(vhs.visual_engine).toContain("uncanny found footage");
    expect(vhs.visual_engine).toContain("static blur");

    const parsed = parse_visual_engine(vhs.visual_engine);
    expect(parsed.medium).toContain("uncanny found footage");
    expect(parsed.texture).toContain("static blur");
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
