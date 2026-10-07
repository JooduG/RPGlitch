import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { register_state_accessors } from "@utils";
import { resolve_style_dna, resolve_style_snapshot, render_narrative_style_xml, render_visual_style_xml } from "./style.js";

describe("resolve_style_snapshot()", () => {
  beforeEach(() => {
    register_state_accessors({ runtime: null });
  });

  afterEach(() => {
    register_state_accessors({ runtime: null });
  });

  it("resolves empty defaults with no active state", () => {
    const snapshot = resolve_style_snapshot();
    expect(snapshot.narrative_key).toBe("");
    expect(snapshot.style.id).toBe("default");
    expect(snapshot.keywords).toEqual([]);
    expect(snapshot.visual_key).toBe("none");
    expect(snapshot.visual_style.id).toBe("none");
    expect(snapshot.style_dna.internal_ratio).toBe("0.50");
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.style_dna)).toBe(true);
  });

  it("resolves the active fractal narrative style with pre-parsed DNA", () => {
    register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
    const snapshot = resolve_style_snapshot();
    expect(snapshot.narrative_key).toBe("cormac_mccarthy");
    expect(snapshot.style.id).toBe("cormac_mccarthy");
    expect(snapshot.style_dna.rhythm).toContain("Polysyndetic");
    expect(snapshot.style_dna).toEqual(resolve_style_dna(snapshot.style));
  });

  it("lets an explicit narrative style override runtime state", () => {
    register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
    const snapshot = resolve_style_snapshot({ explicit_narrative_style: "william_gibson" });
    expect(snapshot.narrative_key).toBe("william_gibson");
    expect(snapshot.keywords).toContain("high_tech_low_life");
  });

  it("falls back to the default record for unknown keys", () => {
    const snapshot = resolve_style_snapshot({ explicit_narrative_style: "unknown_key" });
    expect(snapshot.narrative_key).toBe("");
    expect(snapshot.style.id).toBe("default");
  });

  it("resolves the story visual record from a fractal", () => {
    const snapshot = resolve_style_snapshot({ fractal: { visual_style: "noir" } });
    expect(snapshot.visual_key).toBe("noir");
    expect(snapshot.visual_style.id).toBe("noir");
  });

  it("renders byte-identical style XML from snapshot records", () => {
    register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
    const snapshot = resolve_style_snapshot({ fractal: { visual_style: "noir" } });
    const narrative_xml = render_narrative_style_xml(snapshot.style);
    expect(narrative_xml).toContain('origin="CORMAC_MCCARTHY"');
    expect(narrative_xml).toContain("<SIGNATURE_ELEMENTS>");
    expect(render_visual_style_xml(snapshot.visual_style, {})).toContain('origin="NOIR"');
  });
});
