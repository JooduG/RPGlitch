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
  classify_pacing,
  classify_input_size,
  resolve_beat_budget_plan,
  detect_staged_dialogue_turn,
  detect_held_moment,
  detect_environmental_hint,
  resolve_prose_posture_plan,
  resolve_stability_plan,
  resolve_turn_state_plan,
  get_reflex_atom,
  render_prose_posture_plan,
  render_stability_plan,
  render_alternation_protocol,
  render_environmental_hint,
  render_prose_reflex,
  resolve_stability_lock,
} from "./reflex.js";
import { render_subtext_xml, resolve_physics_protocols } from "../dynamics.js";
import { render_available_keywords_xml } from "./task.js";

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

  it("classifies empty, short, and long input into pacing levels", () => {
    expect(classify_pacing("").level).toBe("TERSE");
    expect(classify_pacing("x".repeat(350)).level).toBe("EXPANSIVE");
  });

  it("renders the exact legacy <PACING> envelope inside the posture", () => {
    expect(render_prose_reflex(null, "")).toContain(`<PACING mode="TERSE">Brief, weighted reply in 1-2 sharp beats. Zero padding.</PACING>`);
  });
});

describe("reflex.js - input-size tiers and beat budgets", () => {
  it("classifies inputs into TINY/SMALL/MEDIUM/EXPANSIVE at the char edges", () => {
    expect(classify_input_size("").tier).toBe("TINY");
    expect(classify_input_size("x".repeat(12)).tier).toBe("TINY");
    expect(classify_input_size("x".repeat(13)).tier).toBe("SMALL");
    expect(classify_input_size("x".repeat(90)).tier).toBe("SMALL");
    expect(classify_input_size("x".repeat(91)).tier).toBe("MEDIUM");
    expect(classify_input_size("x".repeat(400)).tier).toBe("MEDIUM");
    expect(classify_input_size("x".repeat(401)).tier).toBe("EXPANSIVE");
    expect(classify_input_size(null).tier).toBe("TINY");
  });

  it("resolves beat budgets per tier", () => {
    expect(resolve_beat_budget_plan("Hi")).toEqual({ tier: "TINY", beats: "1", mandate: REFLEX_DEFAULTS.INPUT_SIZE_TIERS[0].mandate });
    expect(resolve_beat_budget_plan("x".repeat(50)).beats).toBe("1-2");
    expect(resolve_beat_budget_plan("x".repeat(200)).beats).toBe("2-4");
    expect(resolve_beat_budget_plan("x".repeat(500)).beats).toBe("open");
  });

  it("reports staged-dialogue reasons", () => {
    expect(detect_staged_dialogue_turn("")).toEqual({ hit: false, reason: "blank" });
    expect(detect_staged_dialogue_turn("Alice prepares to move.")).toEqual({ hit: false, reason: "no-quotes" });
    expect(detect_staged_dialogue_turn('"I draw my blade and advance."')).toEqual({ hit: false, reason: "has-action-verbs" });
    expect(detect_staged_dialogue_turn('"We ride at dawn."')).toEqual({ hit: true, reason: "terse-dialogue" });
  });

  it("reports held-moment reasons, never firing on blank input", () => {
    expect(detect_held_moment("")).toEqual({ hit: false, reason: "blank" });
    expect(detect_held_moment("Alice prepares to move.")).toEqual({ hit: false, reason: "no-pause-marker" });
    expect(detect_held_moment("...")).toEqual({ hit: true, reason: "held-pause" });
    expect(detect_held_moment("She remains silent.")).toEqual({ hit: true, reason: "held-pause" });
  });

  it("carries constraint flags on the posture plan", () => {
    expect(resolve_prose_posture_plan({}, '"We ride at dawn."').constraints).toEqual({ anti_staging: true, held_moment: false });
    expect(resolve_prose_posture_plan({}, "...").constraints).toEqual({ anti_staging: false, held_moment: true });
    expect(resolve_prose_posture_plan({}, "Alice prepares to move.").constraints).toEqual({ anti_staging: false, held_moment: false });
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

  it("renders the enveloped hint on hits and blank on misses", () => {
    expect(render_environmental_hint("The knight draws his sword and steps forward")).toBe(
      '<ENVIRONMENTAL_HINT>Non-verbal environmental action. Strongly consider setting "speaker" to "fractal" to narrate the setting, unless AI character should react directly.</ENVIRONMENTAL_HINT>',
    );
    expect(render_environmental_hint("I wonder what happens next")).toBe("");
  });
});

describe("reflex.js - posture plans and envelopes", () => {
  it("resolves rhythm source and drive kind as plan data", () => {
    const plan = resolve_prose_posture_plan({}, "");
    expect(plan.pacing.level).toBe("TERSE");
    expect(plan.rhythm).toEqual({
      source: "default",
      body: REFLEX_LIBRARY.RHYTHM.DEFAULT.body,
    });
    expect(plan.drive.kind).toBe("without_input");
    expect(plan).not.toHaveProperty("voice");
  });

  it("honors pre-resolved has_input over deriving from the text", () => {
    expect(resolve_prose_posture_plan({}, "", { has_input: true }).drive.kind).toBe("with_input");
    expect(resolve_prose_posture_plan({}, "The door slams open.", { has_input: false }).drive.kind).toBe("without_input");
    expect(resolve_prose_posture_plan({}, "").drive.kind).toBe("without_input");
  });

  it("prefers style_dna rhythm and input-driven drive when present", () => {
    const plan = resolve_prose_posture_plan({ style_dna: { rhythm: "Short hammering bursts." } }, "The door slams open.");
    expect(plan.rhythm).toEqual({ source: "style_dna", body: "Short hammering bursts." });
    expect(plan.drive.kind).toBe("with_input");
  });

  it("renders the exact legacy <DELIVERY_POSTURE> envelope", () => {
    expect(render_prose_reflex(null, "")).toBe(
      `<DELIVERY_POSTURE>\n    <PACING mode="TERSE">Brief, weighted reply in 1-2 sharp beats. Zero padding.</PACING>\n    <BEAT_BUDGET size="TINY" beats="1">Reply in exactly 1 beat — a fragment, a single line, or a single action. Zero padding.</BEAT_BUDGET>\n    <RHYTHM>Hold temperament; resist passive compliance. Match conversational scale and build situational friction rather than rushing resolution.</RHYTHM>\n    <DRIVE>Take active initiative: drive events forward on your own terms through decisive actions and end on an unresolved hook demanding response.</DRIVE>\n</DELIVERY_POSTURE>`,
    );
  });

  it("emits no constraint children for plain fixture inputs", () => {
    const envelope = render_prose_reflex(null, "Alice prepares to move.");
    expect(envelope).toContain("<BEAT_BUDGET");
    expect(envelope).not.toContain("<ANTI_STAGING>");
    expect(envelope).not.toContain("<HELD_MOMENT>");
  });

  it("emits ANTI_STAGING only for terse quoted dialogue without action verbs", () => {
    expect(render_prose_reflex(null, '"We ride at dawn."')).toContain("<ANTI_STAGING>");
    expect(render_prose_reflex(null, "Alice prepares to move.")).not.toContain("<ANTI_STAGING>");
    expect(render_prose_reflex(null, '"I draw my blade and advance."')).not.toContain("<ANTI_STAGING>");
  });

  it("emits HELD_MOMENT only for explicit pause markers, never blank input", () => {
    expect(render_prose_reflex(null, "...")).toContain("<HELD_MOMENT>");
    expect(render_prose_reflex(null, "She says nothing.")).toContain("<HELD_MOMENT>");
    expect(render_prose_reflex(null, "")).not.toContain("<HELD_MOMENT>");
    expect(render_prose_reflex(null, "Alice prepares to move.")).not.toContain("<HELD_MOMENT>");
  });

  it("never emits a VOICE tag", () => {
    expect(render_prose_posture_plan(resolve_prose_posture_plan({}, "Hello."))).not.toContain("VOICE");
    expect(render_prose_reflex({ speaking_style: "Lyrical" }, "Hello.")).not.toContain("VOICE");
  });
});

describe("reflex.js - turn-state plans", () => {
  it("resolves firing flags from transient turn metadata", () => {
    expect(resolve_turn_state_plan({})).toEqual({ first_contact: false, round_one: true, evaluation: "EVALUATION_SCENE" });
    expect(resolve_turn_state_plan({ has_input: true, round: 3 })).toEqual({
      first_contact: false,
      round_one: false,
      evaluation: "EVALUATION_INPUT",
    });
    expect(resolve_turn_state_plan({ is_first_contact: true })).toEqual({
      first_contact: true,
      round_one: true,
      evaluation: "EVALUATION_SCENE",
    });
  });

  it("resolves every TURN_STATE atom by dotted key", () => {
    expect(get_reflex_atom("REFLEX.TURN_STATE.FIRST_CONTACT")).toContain("First encounter");
    expect(get_reflex_atom("REFLEX.TURN_STATE.ROUND_ONE")).toContain("AI_CHARACTER");
    expect(get_reflex_atom("REFLEX.TURN_STATE.EVALUATION_INPUT")).toContain("EPILOGUE_COLLAPSED");
    expect(get_reflex_atom("REFLEX.TURN_STATE.EVALUATION_SCENE")).toContain("EPILOGUE_COLLAPSED");
  });
});

describe("reflex.js - stability plans", () => {
  it("escalates along the ladder", () => {
    expect(resolve_stability_plan({})).toEqual({ level: "NONE", errors: 0 });
    expect(resolve_stability_plan({ structural_errors: 2 })).toEqual({ level: "WARNING", errors: 2 });
    expect(resolve_stability_plan({ structural_errors: 5 })).toEqual({ level: "CRITICAL", errors: 5 });
  });

  it("renders the <STABILITY_LOCK> envelope with the level as attribute", () => {
    expect(resolve_stability_lock({})).toBe("");
    expect(resolve_stability_lock({ structural_errors: 1 })).toBe(
      `<STABILITY_LOCK level="WARNING">Structural drift detected. Ensure all XML tags close cleanly.</STABILITY_LOCK>`,
    );
    expect(resolve_stability_lock({ structural_errors: 3 })).toBe(
      `<STABILITY_LOCK level="CRITICAL">Structural collapse. Every XML tag must close cleanly.</STABILITY_LOCK>`,
    );
    expect(render_stability_plan(null)).toBe("");
  });
});

describe("reflex.js - atom compiler", () => {
  it("resolves the enveloped conditional atom by dotted key", () => {
    expect(get_reflex_atom("REFLEX.CONDITIONALS.ENVIRONMENTAL_HINT")).toBe(
      '<ENVIRONMENTAL_HINT>Non-verbal environmental action. Strongly consider setting "speaker" to "fractal" to narrate the setting, unless AI character should react directly.</ENVIRONMENTAL_HINT>',
    );
    expect(get_reflex_atom("REFLEX.CONDITIONALS.ALTERNATION")).toContain("exactly ONE");
    expect(get_reflex_atom("REFLEX.PACING.TERSE")).toContain("Zero padding");
  });

  it("resolves the retired VOICE key to blank", () => {
    expect(get_reflex_atom("REFLEX.VOICE", { speaking_style: "Lyrical" })).toBe("");
  });

  it("resolves branches and unknown keys to blank", () => {
    expect(get_reflex_atom("REFLEX.PACING")).toBe("");
    expect(get_reflex_atom("REFLEX.NOPE")).toBe("");
  });
});

describe("reflex.js - alternation blocks", () => {
  it("renders the exact legacy <ALTERNATION_OPTIONS> block when forced", () => {
    expect(render_alternation_protocol("", { force: true })).toBe(
      `<ALTERNATION_OPTIONS>Resolve {Option A|Option B} alternations by selecting exactly ONE contextually fitting option. Emit only the chosen text—never echo braces or pipes, blend choices, or output multiple options simultaneously.</ALTERNATION_OPTIONS>`,
    );
  });

  it("gates text rendering on alternation syntax", () => {
    expect(render_alternation_protocol("plain text")).toBe("");
    expect(render_alternation_protocol("choice: {red|blue}")).toContain("<ALTERNATION_OPTIONS>");
  });
});

describe("reflex.js - recovery catalog ownership", () => {
  it("owns recovery copy in the catalog with no derived aliases", () => {
    expect(REFLEX_LIBRARY.RECOVERY.STABILITY.WARNING.body).toContain("Structural drift detected");
    expect(REFLEX_LIBRARY.RECOVERY.STABILITY.CRITICAL.body).toContain("Structural collapse");
    expect(REFLEX_LIBRARY.RECOVERY.TRUNCATION.body).toContain("Previous reply cut off mid-sentence");
    expect(REFLEX_DEFAULTS.STABILITY_LADDER.map((rung) => rung.level)).toEqual(["CRITICAL", "WARNING"]);
  });
});

describe("reflex.js - somatic subtext & keyword resolvers (repatriated from task.js)", () => {
  const mock_physics_protocols = {
    SHAME: "Averted eye contact, hunched shoulders.",
    FEAR: "Shallow breathing, scanning exits.",
    ADRENALINE: "High-adrenaline pacing.",
  };

  it("resolves physics protocols against registry and style motifs", () => {
    const resolved = resolve_physics_protocols(["shame", "unknown_key"], mock_physics_protocols);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe("SHAME");
    expect(resolved[0].directive).toBe("Averted eye contact, hunched shoulders.");
  });

  it("renders available keywords XML with uppercase brackets", () => {
    const xml = render_available_keywords_xml(["cyberpunk", "sensual"], ["SHAME", "FEAR"]);
    expect(xml).toContain("[SHAME]");
    expect(xml).toContain("[FEAR]");
    expect(xml).toContain("[CYBERPUNK]");
    expect(xml).toContain("[SENSUAL]");
  });

  it("renders subtext XML block with somatic directives and subtext protocols", () => {
    const xml = render_subtext_xml(
      { intensity: 80 },
      { velocity: 20 },
      {
        keywords: ["SHAME"],
        physics_protocols: mock_physics_protocols,
        evaluate_subtext_protocols: () => [{ id: "ADRENALINE" }],
      },
    );
    expect(xml).toContain("<SUBTEXT>");
    expect(xml).toContain("<SHAME>Averted eye contact, hunched shoulders.</SHAME>");
    expect(xml).toContain("<ADRENALINE>High-adrenaline pacing.</ADRENALINE>");
  });
});
