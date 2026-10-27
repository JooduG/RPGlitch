import { describe, expect, it } from "vitest";
import { CONSTITUTION, CONSTITUTION_ORDER, render_constitution } from "./constitution.js";

describe("CONSTITUTION and CONSTITUTION_ORDER", () => {
  it("resolves the canonical order record", () => {
    expect([...CONSTITUTION_ORDER]).toEqual(["CAUSALITY", "EPISTEMICS", "SOVEREIGNTY", "FIDELITY"]);
    expect(Object.keys(CONSTITUTION).sort()).toEqual([...CONSTITUTION_ORDER].sort());
  });
});

describe("constitution rendering", () => {
  it("renders the envelope with all four laws by default", () => {
    const direct = render_constitution();
    expect(direct).toContain("<AXIOMATIC_CONSTITUTION>");
    expect(direct).toContain('id="L1"');
    expect(direct).toContain('id="L2"');
    expect(direct).toContain('id="L3"');
    expect(direct).toContain('id="L4"');
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

  it("ignores unknown keys gracefully", () => {
    const xml = render_constitution({ laws: ["FIDELITY", "NOPE", "CAUSALITY"] });
    expect(xml).toContain('id="L4"');
    expect(xml).toContain('id="L1"');
    expect(xml).not.toContain("NOPE");
  });
});
