/**
 * @file src/ui/motion/transitions.test.js
 * Unit tests for the unified transition vocabulary. Locks in the shared visual
 * parameters (rise, settle scale, ease) and the reduced-motion contract so no
 * future tweak silently breaks overlay/list choreography consistency.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { motion } from "./engine.svelte.js";
import { overlay_in, overlay_out, item_in } from "./transitions.svelte.js";

describe("unified transitions", () => {
  beforeEach(() => {
    motion.is_reduced = false;
  });

  it("overlay_in fades, rises 10px, and settles from 97% scale", () => {
    const t = overlay_in({}, { duration: 300 });
    expect(t.duration).toBe(300);
    expect(t.css(0)).toContain("opacity: 0");
    expect(t.css(0)).toContain("translateY(10px)");
    expect(t.css(0)).toContain("scale(0.97)");
    expect(t.css(1)).toContain("opacity: 1");
    expect(t.css(1)).toContain("translateY(0px)");
    expect(t.css(1)).toContain("scale(1)");
  });

  it("overlay_out shrinks toward 97% without vertical travel", () => {
    const t = overlay_out({}, { duration: 160 });
    expect(t.duration).toBe(160);
    expect(t.css(1)).toContain("opacity: 1");
    expect(t.css(0)).toContain("opacity: 0");
    expect(t.css(0)).toContain("scale(0.97)");
    expect(t.css(0)).not.toContain("translateY");
  });

  it("item_in rises without scaling so text stays crisp", () => {
    const t = item_in({}, { duration: 300 });
    expect(t.css(0)).toContain("translateY(10px)");
    expect(t.css(0)).not.toContain("scale(");
  });

  it("snaps to zero duration under reduced motion", () => {
    motion.is_reduced = true;
    expect(overlay_in({}, { duration: 300 }).duration).toBe(0);
    expect(overlay_out({}, { duration: 160 }).duration).toBe(0);
    expect(item_in({}, { duration: 300 }).duration).toBe(0);
  });

  it("defaults match the design-token durations", () => {
    expect(overlay_in({}).duration).toBe(300); // --duration-standard
    expect(overlay_out({}).duration).toBe(160); // between --duration-fast and --duration-standard
    expect(item_in({}).duration).toBe(300); // --duration-standard
  });
});
