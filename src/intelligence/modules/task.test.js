/**
 * src/intelligence/modules/task.test.js
 * ============================================================================
 * 🧪 TASK MODULE UNIT TESTS — Turn Directives, Pacing, Delivery & Layer 7 Formats
 * ============================================================================
 *
 * Validates Layer 6 (<TASK>) turn execution and output format integration:
 * 1. Pacing classification and environmental hint detection
 * 2. Delivery posture synthesis (rhythm, drive, voice register)
 * 3. Universal task envelope compilation across all simulation modes:
 *    - Director: evaluation, environmental hint, and <OUTPUT_FORMAT mode="json">
 *    - Continuum: target focus, mandate, and <OUTPUT_FORMAT mode="json">
 *    - Enhancement & Sorting: directives and <OUTPUT_FORMAT>
 *    - Story Prose: think directives, currents, posture, and <OUTPUT_FORMAT mode="prose">
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { build_pacing_directive, render_environmental_hint, render_prose_reflex, render_task } from "./task.js";

// ============================================================================
// [SECTION 1: PACING & ENVIRONMENTAL HINTS]
// ============================================================================

describe("Pacing and Environmental Reaction", () => {
  it("classifies empty or short input as TERSE pacing", () => {
    expect(build_pacing_directive("")).toContain('mode="TERSE"');
    expect(build_pacing_directive("Yes.")).toContain('mode="TERSE"');
  });

  it("classifies medium input as ADAPTIVE pacing", () => {
    const medium = "She looked at him across the fire. The flames cast long, dancing shadows on the cave wall.";
    expect(build_pacing_directive(medium)).toContain('mode="ADAPTIVE"');
  });

  it("classifies expansive input as EXPANSIVE pacing", () => {
    const long_text =
      "The storm raged outside, battering against the reinforced shutters with relentless ferocity. Every gust of wind shook the ancient stone foundation of the watchtower, rattling the glass vials lining the alchemical workbench. Bob stepped toward the window, pulling the heavy velvet drape aside to glimpse the jagged lightning splitting the abyssal clouds over the distant spire.";
    expect(build_pacing_directive(long_text)).toContain('mode="EXPANSIVE"');
  });

  it("detects environmental actions without dialogue", () => {
    expect(render_environmental_hint("The rain pours down the stone steps.")).toContain("<INPUT_NOTE>");
    expect(render_environmental_hint('"Hello there," she said.')).toBe("");
    expect(render_environmental_hint("")).toBe("");
  });
});

// ============================================================================
// [SECTION 2: PROSE REFLEX & DELIVERY POSTURE]
// ============================================================================

describe("render_prose_reflex", () => {
  it("synthesizes DELIVERY_POSTURE with rhythm, drive, and pacing", () => {
    const reflex = render_prose_reflex(
      { style: { narrative_engine: "<SENTENCE_RHYTHM>Clipped, staccato.</SENTENCE_RHYTHM>" } },
      "He draws his sword.",
    );
    expect(reflex).toContain("<DELIVERY_POSTURE>");
    expect(reflex).toContain("<RHYTHM>");
    expect(reflex).toContain("Clipped, staccato.");
    expect(reflex).toContain("<DRIVE>");
    expect(reflex).toContain("Advance the scene in response to &lt;INPUT /&gt;");
  });

  it("injects voice register into DELIVERY_POSTURE when speaking_style is provided", () => {
    const reflex = render_prose_reflex({ style: null }, "He steps forward.", "lyrical");
    expect(reflex).toContain('<VOICE mode="lyrical">');
    expect(reflex).toContain("Deliver dialogue matching the lyrical speaking register.");
  });

  it("resolves speaking_style from snapshot if not passed explicitly", () => {
    const reflex = render_prose_reflex({ speaking_style: "primal" }, "He growls.");
    expect(reflex).toContain('<VOICE mode="primal">');
    expect(reflex).toContain("Deliver dialogue matching the primal speaking register.");
  });
});

// ============================================================================
// [SECTION 3: UNIVERSAL TASK ENVELOPE COMPILER]
// ============================================================================

describe("render_task — Director Mode", () => {
  const dummy_schema = '{\n  "next_action": "AI_CHARACTER"\n}';

  it("renders Director task with evaluation rules and OUTPUT_FORMAT mode='json'", () => {
    const task = render_task({
      mode: "director",
      round: 1,
      input: "Bob draws a weapon.",
      schema: dummy_schema,
    });

    expect(task).toContain('<INPUT origin="USER">');
    expect(task).toContain("<TASK>");
    expect(task).toContain('next_action MUST be "AI_CHARACTER"');
    expect(task).toContain('<OUTPUT_FORMAT mode="json">');
    expect(task).toContain("Return a single, COMPLETE, VALID JSON object matching this schema:");
    expect(task).toContain('"next_action": "AI_CHARACTER"');
    expect(task).toContain("</OUTPUT_FORMAT>");
  });

  it("renders terse Director retry envelope with OUTPUT_FORMAT mode='json'", () => {
    const task = render_task({
      mode: "director",
      terse: true,
      schema: dummy_schema,
    });

    expect(task).toContain("<TASK>");
    expect(task).toContain('<OUTPUT_FORMAT mode="json">');
    expect(task).toContain("</OUTPUT_FORMAT>");
    expect(task).toContain("</TASK>");
  });
});

describe("render_task — Story Prose Mode", () => {
  it("renders Story Prose task with OUTPUT_FORMAT mode='prose'", () => {
    const task = render_task({
      config: { task: { think_format: "character" } },
      input: "Alice examines the vault.",
      action_directive: "Respond strictly as Alice.",
      speaking_style: "clinical",
    });

    expect(task).toContain("<TASK>");
    expect(task).toContain("<THINK>");
    expect(task).toContain("VISCERAL_IMPACT");
    expect(task).toContain('<INPUT origin="USER">');
    expect(task).toContain("Respond strictly as Alice.");
    expect(task).toContain("<DELIVERY_POSTURE>");
    expect(task).toContain('<VOICE mode="clinical">');
    expect(task).toContain('<OUTPUT_FORMAT mode="prose">');
    expect(task).toContain("Emit strictly plain prose. No preamble, commentary, markdown, or structural tags.");
    expect(task).toContain("</OUTPUT_FORMAT>");
    expect(task).toContain("</TASK>");
  });
});

describe("render_task — Continuum Mode", () => {
  it("renders Continuum task with target focus and OUTPUT_FORMAT mode='json'", () => {
    const dummy_schema = '{\n  "memories": []\n}';
    const task = render_task({
      mode: "continuum",
      target_name: "Kaelen",
      schema: dummy_schema,
    });

    expect(task).toContain("<TASK>");
    expect(task).toContain("TARGET FOCUS: Consolidate state and extract relational vectors for Kaelen.");
    expect(task).toContain('<OUTPUT_FORMAT mode="json">');
    expect(task).toContain("EXECUTION MANDATE:");
    expect(task).toContain("</TASK>");
  });
});

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-18: Initial creation of comprehensive task.test.js validating pacing directives, environmental hints, delivery posture voice injection, and Layer 7 <OUTPUT_FORMAT> integration across director, continuum, and story prose.
 */
