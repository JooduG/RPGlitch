/**
 * src/intelligence/modules/reflex.test.js
 * ============================================================================
 * 🪞 REFLEX TESTS — Plans, Catalog Atoms, Renderers & Stable Entry Points
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import {
  REFLEX_DEFAULTS,
  REFLEX_LIBRARY,
  STABILITY_LOCK,
  TRUNCATION_COMPLETE_NOTE,
  classify_pacing,
  detect_environmental_hint,
  resolve_prose_posture_plan,
  resolve_stability_plan,
  get_reflex_atom,
  render_prose_posture_plan,
  render_stability_plan,
  render_alternation_block,
  render_alternation_protocol,
  build_pacing_directive,
  render_environmental_hint,
  render_prose_reflex,
  resolve_stability_lock,
} from "./reflex.js";

describe("reflex.js - pacing plans", () => {
  it("classifies empty input as TERSE", () => {
    expect(classify_pacing("")).toEqual({ level: "TERSE", chars: 0, words: 0 });
    expect(classify_pacing(null)).toEqual({ level: "TERSE", chars: 0, words: 0 });
  });

  it("classifies short input as TERSE at the band edge", () => {
    expect(classify_pacing("Hi").level).toBe("TERSE");
    expect(classify_pacing("x".repeat(40)).level).toBe("TERSE");
    expect(classify_pacing(Array(8).fill("word").join(" ")).level).toBe("TERSE");
  });

  it("classifies mid input as ADAPTIVE", () => {
    const plan = classify_pacing("This is a medium-length user turn with enough words to land squarely in the adaptive band.");
    expect(plan.level).toBe("ADAPTIVE");
    expect(plan.chars).toBeGreaterThan(40);
    expect(plan.words).toBeGreaterThan(8);
  });

  it("classifies long input as EXPANSIVE at either band edge", () => {
    expect(classify_pacing("x".repeat(300)).level).toBe("EXPANSIVE");
    expect(classify_pacing(Array(60).fill("word").join(" ")).level).toBe("EXPANSIVE");
  });

  it("renders the exact legacy <PACING> envelopes", () => {
    expect(build_pacing_directive("")).toBe(`<PACING mode="TERSE">Brief, weighted reply in 1-2 sharp beats. Zero padding.</PACING>`);
    expect(build_pacing_directive("x".repeat(350))).toBe(
      `<PACING mode="EXPANSIVE">Expand to match message breadth; close on one decisive hook.</PACING>`,
    );
  });
});

describe("reflex.js - environmental hint detection", () => {
  it("reports reasons for misses", () => {
    expect(detect_environmental_hint("")).toEqual({ hit: false, reason: "blank" });
    expect(detect_environmental_hint('"Hello there"')).toEqual({ hit: false, reason: "quotes" });
    expect(detect_environmental_hint("I wonder what happens next")).toEqual({ hit: false, reason: "no-signal" });
  });

  it("hits on verbs and nouns", () => {
    expect(detect_environmental_hint("The knight draws his sword and steps forward").hit).toBe(true);
    expect(detect_environmental_hint("cold stone walls loom overhead").hit).toBe(true);
  });

  it("renders the exact legacy hint text on hits and blank on misses", () => {
    expect(render_environmental_hint("The knight draws his sword and steps forward")).toBe(
      'ENVIRONMENTAL HINT: Non-verbal environmental action. Strongly consider setting "speaker" to "fractal" to narrate the setting, unless AI character should react directly.',
    );
    expect(render_environmental_hint("I wonder what happens next")).toBe("");
  });
});

describe("reflex.js - posture plans and envelopes", () => {
  it("resolves rhythm source, drive kind, and voice chain as plan data", () => {
    const plan = resolve_prose_posture_plan({ speaker: { speaking_style: "Primal" } }, "");
    expect(plan.pacing.level).toBe("TERSE");
    expect(plan.rhythm).toEqual({
      source: "default",
      body: REFLEX_LIBRARY.RHYTHM.DEFAULT.body,
    });
    expect(plan.drive.kind).toBe("without_input");
    expect(plan.voice).toEqual({ style: "Primal", mode: "primal" });
  });

  it("prefers style_dna rhythm and input-driven drive when present", () => {
    const plan = resolve_prose_posture_plan({ style: { dna: { rhythm: "Short hammering bursts." } } }, "The door slams open.", "Clinical");
    expect(plan.rhythm).toEqual({ source: "style_dna", body: "Short hammering bursts." });
    expect(plan.drive.kind).toBe("with_input");
    expect(plan.voice).toEqual({ style: "Clinical", mode: "clinical" });
  });

  it("leaves voice null without a speaking style", () => {
    expect(resolve_prose_posture_plan({}, "Hello.").voice).toBeNull();
  });

  it("renders the exact legacy <DELIVERY_POSTURE> envelope", () => {
    expect(render_prose_reflex(null, "")).toBe(
      `<DELIVERY_POSTURE>\n    <PACING mode="TERSE">Brief, weighted reply in 1-2 sharp beats. Zero padding.</PACING>\n    <RHYTHM>Hold temperament; resist passive compliance. Match conversational scale and build situational friction rather than rushing resolution.</RHYTHM>\n    <DRIVE>Take active initiative: drive events forward on your own terms through decisive actions and end on an unresolved hook demanding response.</DRIVE>\n</DELIVERY_POSTURE>`,
    );
  });

  it("renders voice only when a register resolves", () => {
    expect(render_prose_posture_plan(resolve_prose_posture_plan({}, "Hello."))).not.toContain("<VOICE");
    expect(render_prose_reflex({ speaking_style: "Lyrical" }, "Hello.")).toContain('<VOICE mode="lyrical">');
  });
});

describe("reflex.js - stability plans", () => {
  it("escalates along the ladder", () => {
    expect(resolve_stability_plan({})).toEqual({ level: "NONE", errors: 0 });
    expect(resolve_stability_plan({ structural_errors: 2 })).toEqual({ level: "WARNING", errors: 2 });
    expect(resolve_stability_plan({ structural_errors: 5 })).toEqual({ level: "CRITICAL", errors: 5 });
  });

  it("renders the exact legacy escalation strings", () => {
    expect(resolve_stability_lock({})).toBe("");
    expect(resolve_stability_lock({ structural_errors: 1 })).toBe(STABILITY_LOCK.WARNING);
    expect(resolve_stability_lock({ structural_errors: 3 })).toBe(STABILITY_LOCK.CRITICAL);
    expect(render_stability_plan(null)).toBe("");
  });
});

describe("reflex.js - atom compiler", () => {
  it("resolves conditional atoms by dotted key", () => {
    expect(get_reflex_atom("REFLEX.CONDITIONALS.ENVIRONMENTAL_HINT")).toBe(REFLEX_LIBRARY.CONDITIONALS.ENVIRONMENTAL_HINT.body);
    expect(get_reflex_atom("REFLEX.CONDITIONALS.ALTERNATION")).toContain("exactly ONE");
    expect(get_reflex_atom("REFLEX.PACING.TERSE")).toContain("Zero padding");
  });

  it("interpolates voice tokens from the values bag", () => {
    expect(get_reflex_atom("REFLEX.VOICE", { speaking_style: "Lyrical" })).toBe("Deliver dialogue matching the Lyrical speaking register.");
  });

  it("resolves branches and unknown keys to blank", () => {
    expect(get_reflex_atom("REFLEX.PACING")).toBe("");
    expect(get_reflex_atom("REFLEX.NOPE")).toBe("");
  });
});

describe("reflex.js - alternation blocks", () => {
  it("renders the exact legacy <ALTERNATION_OPTIONS> block", () => {
    expect(render_alternation_block()).toBe(
      `<ALTERNATION_OPTIONS>Resolve {Option A|Option B} alternations by selecting exactly ONE contextually fitting option. Emit only the chosen text—never echo braces or pipes, blend choices, or output multiple options simultaneously.</ALTERNATION_OPTIONS>`,
    );
  });

  it("gates text rendering on alternation syntax", () => {
    expect(render_alternation_protocol("plain text")).toBe("");
    expect(render_alternation_protocol("choice: {red|blue}")).toContain("<ALTERNATION_OPTIONS>");
  });
});

describe("reflex.js - recovery catalog ownership", () => {
  it("derives legacy exports from the catalog", () => {
    expect(STABILITY_LOCK.WARNING).toBe(REFLEX_LIBRARY.RECOVERY.STABILITY.WARNING.body);
    expect(STABILITY_LOCK.CRITICAL).toBe(REFLEX_LIBRARY.RECOVERY.STABILITY.CRITICAL.body);
    expect(TRUNCATION_COMPLETE_NOTE).toBe(REFLEX_LIBRARY.RECOVERY.TRUNCATION.body);
    expect(REFLEX_DEFAULTS.STABILITY_LADDER.map((rung) => rung.level)).toEqual(["CRITICAL", "WARNING"]);
  });
});
