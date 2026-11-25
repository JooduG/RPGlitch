import { VOICE } from "@config";
import { describe, expect, it } from "vitest";
import { NARRATIVE_STYLES, get_narrative_style } from "./narrative-styles.js";

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
      expect(Array.isArray(style.motif_keys)).toBe(true);
      expect(VOICE.STYLES).toContain(style.speaking_style);
      expect(Array.isArray(style.triggers)).toBe(true);
    }
  });

  it("ensures styled presets contain valid structured DNA", () => {
    const active_styles = Object.entries(NARRATIVE_STYLES).filter(([key]) => key !== "default");
    const styles_with_dna = active_styles.filter(([, style]) => Boolean(style.dna));
    for (const [, style] of styles_with_dna) {
      expect(typeof style.dna.internal_ratio).toBe("number");
      expect(typeof style.dna.rhythm).toBe("string");
      expect(typeof style.dna.sensory).toBe("string");
      expect(typeof style.dna.grounding).toBe("string");
    }
  });
});

describe("Narrative Style Helper Accessors", () => {
  it("retrieves narrative style via get_narrative_style with fallback to default", () => {
    expect(get_narrative_style("cormac_mccarthy").id).toBe("cormac_mccarthy");
    expect(get_narrative_style("non_existent_key").id).toBe("default");
    expect(get_narrative_style().id).toBe("default");
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
