import { describe, expect, it } from "vitest";
import { build_available_keywords_xml, build_somatic_directives_xml, resolve_somatic_directives, SOMATIC_REGISTRY } from "./physics-prompts.js";
import { STYLE_MOTIF_REGISTRY } from "@data";
import { GLOBAL_TRIGGERS, evaluate_automatic_somatics } from "../physics.js";

describe("SOMATIC_REGISTRY", () => {
  it("contains exactly the 12 universal archetypes", () => {
    expect(SOMATIC_REGISTRY).toHaveLength(12);
    const ids = SOMATIC_REGISTRY.map((e) => e.id);
    for (const id of [
      "shame",
      "fear",
      "vulnerability",
      "betrayal",
      "abandonment",
      "emotional_neglect",
      "defiance",
      "intimacy",
      "grief",
      "dominance",
      "deception",
      "dysregulation",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("every archetype carries a physical tells description and an injectable directive", () => {
    for (const entry of SOMATIC_REGISTRY) {
      expect(entry.id).toBeTruthy();
      expect(entry.label).toBeTruthy();
      expect(entry.tells).toBeTruthy();
      expect(entry.directive).toBeTruthy();
    }
  });
});

describe("STYLE_MOTIF_REGISTRY", () => {
  it("exposes the blueprint-named motifs", () => {
    for (const motif of ["stoic_pain", "iceberg_subtext", "high_tech_low_life", "flickering_neon_data", "court_paranoia", "bitter_confrontation"]) {
      expect(STYLE_MOTIF_REGISTRY[motif]).toBeDefined();
      expect(STYLE_MOTIF_REGISTRY[motif].directive).toBeTruthy();
    }
  });
});

describe("resolve_somatic_directives", () => {
  it("resolves static archetypes with tells + directive", () => {
    const resolved = resolve_somatic_directives(["shame"]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe("shame");
    expect(resolved[0].tells).toContain("Averted eye contact");
    expect(resolved[0].directive).toContain("Weave involuntary");
  });

  it("resolves style motifs alongside static archetypes", () => {
    const resolved = resolve_somatic_directives(["shame", "stoic_pain"]);
    expect(resolved.map((r) => r.id)).toEqual(["shame", "stoic_pain"]);
    expect(resolved[1].directive).toContain("Mask pain behind curt declarative statements");
  });

  it("drops unknown keywords without throwing", () => {
    expect(resolve_somatic_directives(["nonexistent_keyword"])).toEqual([]);
    expect(resolve_somatic_directives(["shame", null, 42, "grief"])).toHaveLength(2);
    expect(resolve_somatic_directives()).toEqual([]);
  });
});

describe("build_somatic_directives_xml", () => {
  it("one-call resolve+render", () => {
    expect(build_somatic_directives_xml(["fear"])).toContain("Physical freeze/flight response");
    expect(build_somatic_directives_xml(["fear"])).toContain("<SOMATIC_DIRECTIVES>");
    expect(build_somatic_directives_xml(["fear", "stoic_pain"])).toContain("- stoic_pain: Mask pain behind curt declarative statements");
    expect(build_somatic_directives_xml(["nope"])).toBe("");
    expect(build_somatic_directives_xml([])).toBe("");
  });
});

describe("build_available_keywords_xml", () => {
  it("always lists the 12 static archetypes", () => {
    const xml = build_available_keywords_xml();
    expect(xml).toContain("static (universal)");
    for (const id of SOMATIC_REGISTRY.map((e) => e.id)) {
      expect(xml).toContain(id);
    }
  });

  it("appends the active style's motifs when provided", () => {
    const xml = build_available_keywords_xml(["stoic_pain", "iceberg_subtext"]);
    expect(xml).toContain("active style: stoic_pain, iceberg_subtext");
  });
});

describe("evaluate_automatic_somatics", () => {
  it("resolves fear when intensity is high (>=75) and affinity is moderate/low", () => {
    const somatics = evaluate_automatic_somatics({ intensity: 80, affinity: 40 });
    expect(somatics).toContain("fear");
  });

  it("resolves dysregulation on extreme chaos (>=75)", () => {
    const somatics = evaluate_automatic_somatics({ chaos: 85 });
    expect(somatics).toContain("dysregulation");
  });

  it("resolves betrayal on low openness (<=25) and low affinity (<=40)", () => {
    const somatics = evaluate_automatic_somatics({ openness: 20, affinity: 30 });
    expect(somatics).toContain("betrayal");
  });

  it("resolves intimacy on high affinity (>=75) and high openness (>=60)", () => {
    const somatics = evaluate_automatic_somatics({ affinity: 80, openness: 70 });
    expect(somatics).toContain("intimacy");
  });

  it("prioritizes manual Director keywords over automatic ones", () => {
    const somatics = evaluate_automatic_somatics({ intensity: 90 }, ["grief"]);
    expect(somatics[0]).toBe("grief");
  });

  it("clamps results to max_directives (default: 2)", () => {
    const somatics = evaluate_automatic_somatics({ intensity: 90, chaos: 90, openness: 10, affinity: 10 });
    expect(somatics.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array for neutral dynamics without manual keywords", () => {
    const somatics = evaluate_automatic_somatics({ intensity: 50, chaos: 50, openness: 50, affinity: 50 });
    expect(somatics).toEqual([]);
  });

  it("build_somatic_directives_xml renders XML automatically from dynamics", () => {
    const xml = build_somatic_directives_xml([], { intensity: 85, affinity: 30 });
    expect(xml).toContain("<SOMATIC_DIRECTIVES>");
    expect(xml).toContain("- fear:");
  });
});

describe("GLOBAL_TRIGGERS", () => {
  it("contains 18 baseline dynamic signals", () => {
    expect(GLOBAL_TRIGGERS).toHaveLength(18);
  });

  it("every global trigger has an id, when function, and directive", () => {
    for (const trigger of GLOBAL_TRIGGERS) {
      expect(typeof trigger.id).toBe("string");
      expect(typeof trigger.when).toBe("function");
      expect(typeof trigger.directive).toBe("string");
    }
  });
});
