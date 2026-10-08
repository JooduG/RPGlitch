/**
 * src/intelligence/modules/constitution.test.js
 * ============================================================================
 * 🧪 CONSTITUTION MODULE UNIT TESTS — Law Plans & Envelope Rendering
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { CONSTITUTION, CONSTITUTION_ORDER, resolve_constitution_plan, render_constitution_plan, render_constitution } from "./constitution.js";

describe("resolve_constitution_plan", () => {
  it("selects all four laws by default with zero drops", () => {
    const plan = resolve_constitution_plan();
    expect(plan.tag).toBe("AXIOMATIC_CONSTITUTION");
    expect(plan.laws.map((law) => law.id)).toEqual(["L1", "L2", "L3", "L4"]);
    expect(plan.dropped).toEqual({ unknown: 0 });
    expect(Object.isFrozen(plan)).toBe(true);
  });

  it("selects subsets in order and counts unknown keys", () => {
    const plan = resolve_constitution_plan({ laws: ["FIDELITY", "NOPE", "CAUSALITY"] });
    expect(plan.laws.map((law) => law.id)).toEqual(["L4", "L1"]);
    expect(plan.dropped).toEqual({ unknown: 1 });
  });

  it("resolves the canonical order record", () => {
    expect([...CONSTITUTION_ORDER]).toEqual(["CAUSALITY", "EPISTEMICS", "SOVEREIGNTY", "FIDELITY"]);
    expect(Object.keys(CONSTITUTION).sort()).toEqual([...CONSTITUTION_ORDER].sort());
  });
});

describe("constitution rendering", () => {
  it("renders the envelope through the plan without branching", () => {
    const plan = resolve_constitution_plan();
    const direct = render_constitution_plan(plan);
    expect(render_constitution()).toBe(direct);
    expect(direct).toContain("<AXIOMATIC_CONSTITUTION>");
    expect(direct).toContain('id="L1"');
    expect(direct).toContain("</AXIOMATIC_CONSTITUTION>");
  });

  it("renders subsets and honors indent", () => {
    const subset = render_constitution({ laws: ["SOVEREIGNTY"] });
    expect(subset).toContain('id="L3"');
    expect(subset).not.toContain('id="L1"');
    expect(render_constitution({ indent: 4 }).startsWith("    <AXIOMATIC_CONSTITUTION>")).toBe(true);
  });

  it("renders empty laws to an empty envelope", () => {
    expect(render_constitution({ laws: [], indent: 0 })).toBe("<AXIOMATIC_CONSTITUTION>\n</AXIOMATIC_CONSTITUTION>");
  });
});
