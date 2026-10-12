import { describe, it, expect } from "vitest";
import {
  resolve_speaking_style,
  resolve_style,
  VALID_SPEAKING_STYLES,
  lint_narrative_slop,
  cap_somatic_markers,
  audit_macro_shape,
} from "./styles.js";
import "../data/definitions/speaking-styles.js";
import { NARRATIVE_STYLES } from "../data/definitions/narrative-styles.js";

describe("resolve_speaking_style hierarchy", () => {
  it("prioritizes character speaking_style over narrative style", () => {
    const entity = { speaking_style: "casual" };
    const style = NARRATIVE_STYLES.edgar_allan_poe;
    expect(resolve_speaking_style(entity, style)).toBe("casual");
  });

  it("prioritizes character lyrical style over casual narrative style", () => {
    const entity = { speaking_style: "lyrical" };
    const style = NARRATIVE_STYLES.cormac_mccarthy;
    expect(resolve_speaking_style(entity, style)).toBe("lyrical");
  });

  it("falls back to narrative style speaking style when character speaking_style is empty", () => {
    const entity = { speaking_style: "" };
    expect(resolve_speaking_style(entity, NARRATIVE_STYLES.edgar_allan_poe)).toBe("lyrical");
    expect(resolve_speaking_style(entity, NARRATIVE_STYLES.cormac_mccarthy)).toBe("casual");
  });

  it("prioritizes character primal and clinical styles over narrative styles", () => {
    expect(resolve_speaking_style({ speaking_style: "primal" }, NARRATIVE_STYLES.edgar_allan_poe)).toBe("primal");
    expect(resolve_speaking_style({ speaking_style: "clinical" }, NARRATIVE_STYLES.cormac_mccarthy)).toBe("clinical");
  });

  it("defaults to casual when neither character nor narrative style has a speaking style", () => {
    expect(resolve_speaking_style(null, null)).toBe("casual");
    expect(resolve_speaking_style({}, "default")).toBe("casual");
  });
});

describe("resolve_style()", () => {
  const registry = {
    cyberpunk: { id: "cyberpunk" },
    gothic: { id: "gothic" },
  };

  it("resolves explicit entity/fractal style if valid in registry", () => {
    expect(resolve_style("cyberpunk", "visual_style", registry, "none")).toBe("cyberpunk");
  });

  it("falls back to default fallback if invalid or not found", () => {
    expect(resolve_style("unknown", "visual_style", registry, "none")).toBe("none");
    expect(resolve_style("default", "visual_style", registry, "none")).toBe("none");
    expect(resolve_style("", "visual_style", registry, "none")).toBe("none");
  });
});

describe("narrative slop linter", () => {
  it("reports clean prose with zero violations", () => {
    expect(lint_narrative_slop("Alice checks the charge on her deck.")).toEqual({ violations: [], somatic_count: 0, over_cap: false });
    expect(lint_narrative_slop("")).toEqual({ violations: [], somatic_count: 0, over_cap: false });
  });

  it("flags clichés and counts somatic markers against the cap", () => {
    const report = lint_narrative_slop("Against better judgment, her heart pounded. His breath caught.");
    expect(report.violations.some((violation) => violation.kind === "cliche")).toBe(true);
    expect(report.somatic_count).toBe(2);
    expect(report.over_cap).toBe(true);
  });

  it("allows a single somatic marker", () => {
    const report = lint_narrative_slop("Her heart pounded as the door opened.");
    expect(report.somatic_count).toBe(1);
    expect(report.over_cap).toBe(false);
  });
});

describe("cap_somatic_markers()", () => {
  it("keeps the textually-first marker and strips later ones", () => {
    const capped = cap_somatic_markers("Her heart pounded. His breath caught. Her stomach dropped.");
    expect(capped).toContain("heart pounded");
    expect(capped).not.toMatch(/breath caught|stomach dropped/i);
  });

  it("leaves single-marker and clean prose untouched", () => {
    expect(cap_somatic_markers("Her heart pounded as the door opened.")).toBe("Her heart pounded as the door opened.");
    expect(cap_somatic_markers("Alice checks the charge on her deck.")).toBe("Alice checks the charge on her deck.");
    expect(cap_somatic_markers("")).toBe("");
  });
});
describe("VALID_SPEAKING_STYLES", () => {
  it("exposes canonical speaking styles in a frozen Set", () => {
    expect(VALID_SPEAKING_STYLES.has("casual")).toBe(true);
    expect(VALID_SPEAKING_STYLES.has("lyrical")).toBe(true);
    expect(VALID_SPEAKING_STYLES.has("primal")).toBe(true);
    expect(VALID_SPEAKING_STYLES.has("clinical")).toBe(true);
    expect(VALID_SPEAKING_STYLES.size).toBe(4);
  });
});

describe("cap_somatic_markers() with stock faces (Track 3.3)", () => {
  it("caps stock facial expressions and mannerisms to 1 occurrence per reply", () => {
    const text = "A ghost of a smirk crossed her face. He spoke, barely above a whisper. Her eyes darkened.";
    const capped = cap_somatic_markers(text);
    expect(capped).toContain("ghost of a smirk");
    expect(capped).not.toMatch(/barely above a whisper|eyes darkened/i);
  });
});

describe("audit_macro_shape() (Track 3.4)", () => {
  it("flags as-if overuse when occurring more than twice", () => {
    const text = "She moved as if the floor were ice, and smiled as if nothing had happened, and left as though she had never come.";
    const report = audit_macro_shape(text);
    expect(report.as_if_overuse).toBe(true);
    expect(report.as_if_count).toBe(3);
    expect(report.violations).toContain("as-if-overuse");
  });

  it("does not flag clean as-if usage (<= 2)", () => {
    const text = "She moved through the room as if she owned it.";
    const report = audit_macro_shape(text);
    expect(report.as_if_overuse).toBe(false);
    expect(report.as_if_count).toBe(1);
    expect(report.violations).not.toContain("as-if-overuse");
  });

  it("flags multi-paragraph replies where every paragraph ends in a question", () => {
    const text = "Why are you here?\n\nDo you want me to leave?\n\nIs that what you came to say?";
    const report = audit_macro_shape(text);
    expect(report.every_para_question).toBe(true);
    expect(report.violations).toContain("every-para-question");
  });

  it("flags familiar closer opening with Meanwhile, Then, or Suddenly", () => {
    const text = "She closed the ledger.\n\nMeanwhile, across the yard, the gate swung open.";
    const report = audit_macro_shape(text);
    expect(report.familiar_closer).toBe(true);
    expect(report.violations).toContain("familiar-closer");
  });

  it("flags door slam closing sentence", () => {
    const text = "He said nothing else. The door slammed.";
    const report = audit_macro_shape(text);
    expect(report.door_slam_closer).toBe(true);
    expect(report.violations).toContain("door-slam-closer");
  });

  it("returns clean zero-violation report on normal prose", () => {
    const text = "Alice stood by the terminal.\n\nShe accessed the memory bank and confirmed the coordinates.";
    const report = audit_macro_shape(text);
    expect(report.violations.length).toBe(0);
    expect(report.as_if_overuse).toBe(false);
    expect(report.every_para_question).toBe(false);
    expect(report.familiar_closer).toBe(false);
    expect(report.door_slam_closer).toBe(false);
    expect(report.vocabulary_cluster).toBe(false);
  });

  it("flags Tier 2 vocabulary clusters when two or more appear in the text", () => {
    const text = "We must harness our resources to cultivate a stronger community.";
    const report = audit_macro_shape(text);
    expect(report.vocabulary_cluster).toBe(true);
    expect(report.cluster_hit_count).toBe(2);
    expect(report.violations).toContain("vocabulary-cluster");
  });

  it("does not flag isolated single Tier 2 words", () => {
    const text = "We must harness our resources for the winter ahead.";
    const report = audit_macro_shape(text);
    expect(report.vocabulary_cluster).toBe(false);
    expect(report.cluster_hit_count).toBe(1);
    expect(report.violations).not.toContain("vocabulary-cluster");
  });
});
