import { describe, expect, it } from "vitest";
import {
  NARRATIVE_STYLES,
  STYLE_MOTIF_REGISTRY,
  get_narrative_style,
  get_style_keywords,
  resolve_active_style_key,
  render_narrative_style_xml,
} from "./narrative-styles.js";
import { VALID_SPEAKING_STYLES } from "./speaking-styles.js";

describe("NARRATIVE_STYLES Preset Catalog", () => {
  it("exports all expected author, director, and genre presets", () => {
    expect(NARRATIVE_STYLES.default).toBeDefined();
    expect(NARRATIVE_STYLES.anais_nin).toBeDefined();
    expect(NARRATIVE_STYLES.cormac_mccarthy).toBeDefined();
    expect(NARRATIVE_STYLES.david_lynch).toBeDefined();
    expect(NARRATIVE_STYLES.ernest_hemingway).toBeDefined();
    expect(NARRATIVE_STYLES.william_gibson).toBeDefined();
    expect(NARRATIVE_STYLES.joe_abercrombie).toBeDefined();
    expect(NARRATIVE_STYLES.arthur_morgan).toBeDefined();
  });

  it("validates all style entries match required schema and canonical speaking styles", () => {
    for (const [key, style] of Object.entries(NARRATIVE_STYLES)) {
      expect(style.id).toBe(key);
      expect(typeof style.name).toBe("string");
      expect(style.name.length).toBeGreaterThan(0);
      expect(typeof style.description).toBe("string");
      expect(Array.isArray(style.tags)).toBe(true);
      expect(VALID_SPEAKING_STYLES).toContain(style.speaking_style);
      expect(Array.isArray(style.triggers)).toBe(true);
      expect(typeof style.xml).toBe("string");
    }
  });

  it("ensures styled presets contain valid XML narrative engine blocks", () => {
    const active_styles = Object.entries(NARRATIVE_STYLES).filter(([key]) => key !== "default");
    for (const [, style] of active_styles) {
      expect(style.xml).toContain(`<NARRATIVE_STYLE narrator="${style.id}">`);
      expect(style.xml).toContain("</NARRATIVE_STYLE>");
    }

    const styles_with_engine = active_styles.filter(([, style]) => Boolean(style.narrative_engine));
    for (const [, style] of styles_with_engine) {
      expect(style.narrative_engine).toContain("<NARRATIVE_ENGINE>");
      expect(style.narrative_engine).not.toContain("<dna>");
      expect(style.narrative_engine).toContain("<internal_ratio>");
      expect(style.narrative_engine).toContain("<sentence_rhythm>");
      expect(style.narrative_engine).toContain("<sensory_order>");
      expect(style.narrative_engine).toContain("<emotion_grounding>");
    }
  });

  it("ensures default preset produces empty XML block", () => {
    expect(NARRATIVE_STYLES.default.xml).toBe("");
    expect(render_narrative_style_xml("default")).toBe("");
  });
});

describe("STYLE_MOTIF_REGISTRY & Keyword Aggregation", () => {
  it("auto-aggregates motifs from all narrative styles", () => {
    expect(Object.keys(STYLE_MOTIF_REGISTRY).length).toBeGreaterThan(0);
    expect(STYLE_MOTIF_REGISTRY.sensual_submersion).toBeDefined();
    expect(STYLE_MOTIF_REGISTRY.sensual_submersion.directive).toBeTruthy();
    expect(STYLE_MOTIF_REGISTRY.high_tech_low_life).toBeDefined();
    expect(STYLE_MOTIF_REGISTRY.high_tech_low_life.directive).toBeTruthy();
  });

  it("is frozen and immutable", () => {
    expect(Object.isFrozen(STYLE_MOTIF_REGISTRY)).toBe(true);
  });
});

describe("Narrative Style Helper Accessors", () => {
  it("retrieves narrative style via get_narrative_style with fallback to default", () => {
    expect(get_narrative_style("cormac_mccarthy").id).toBe("cormac_mccarthy");
    expect(get_narrative_style("non_existent_key").id).toBe("default");
    expect(get_narrative_style().id).toBe("default");
  });

  it("returns keywords copy for styled keys and empty array for unknown keys", () => {
    const gibson_keywords = get_style_keywords("william_gibson");
    expect(gibson_keywords).toContain("high_tech_low_life");
    expect(gibson_keywords).toContain("flickering_neon_data");

    expect(get_style_keywords("default")).toEqual([]);
    expect(get_style_keywords("unknown_key")).toEqual([]);
    expect(get_style_keywords()).toEqual([]);
  });

  it("resolves active style key safely with fallback to empty string", () => {
    expect(resolve_active_style_key()).toBe("");
  });

  it("renders pre-compiled narrative style XML correctly", () => {
    const xml = render_narrative_style_xml("edgar_allan_poe");
    expect(xml).toContain('<NARRATIVE_STYLE narrator="edgar_allan_poe">');
    expect(xml).toContain("<DESCRIPTION>");
    expect(xml).toContain("<DEFINING_CHARACTERISTICS>");
  });

  it("evaluates trigger conditions without throwing errors", () => {
    const mock_dynamics = { intensity: 75, chaos: 65, openness: 25, affinity: 70 };
    for (const style of Object.values(NARRATIVE_STYLES)) {
      for (const trigger of style.triggers) {
        expect(typeof trigger.id).toBe("string");
        expect(typeof trigger.directive).toBe("string");
        expect(typeof trigger.when).toBe("function");
        const result = trigger.when(mock_dynamics, null);
        expect(typeof result).toBe("boolean");
      }
    }
  });
});
