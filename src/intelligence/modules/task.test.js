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
import {
  build_pacing_directive,
  render_environmental_hint,
  render_prose_reflex,
  render_task,
  render_keyword_directives_xml,
  resolve_optics_cinematography,
  render_subtext_xml,
  render_available_keywords_xml,
  resolve_physics_protocols,
  resolve_context_directives,
  TASK_LIBRARY,
} from "./task.js";

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
    const reflex = render_prose_reflex({ style: { dna: { rhythm: "Clipped, staccato." } } }, "He draws his sword.");
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
// [SECTION 5: KEYWORD DIRECTIVES XML]
// ============================================================================

describe("render_keyword_directives_xml", () => {
  it("renders default DIRECTOR keyword directives XML", () => {
    const xml = render_keyword_directives_xml("melancholy, visceral");
    expect(xml).toContain("<KEYWORD_DIRECTIVES>");
    expect(xml).toContain("- Function: Select 1-5 keywords from the list below");
    expect(xml).toContain('- Neutral state: Emit "[]" if no keywords apply.');
    expect(xml).toContain("- Whitelist rule: Select strictly from the list below.");
    expect(xml).toContain("<AVAILABLE_KEYWORDS>melancholy, visceral</AVAILABLE_KEYWORDS>");
    expect(xml).toContain("</KEYWORD_DIRECTIVES>");
  });

  it("renders OPTICS keyword directives XML cleanly", () => {
    const xml = render_keyword_directives_xml("cinematic, atmospheric", "OPTICS");
    expect(xml).toContain("<KEYWORD_DIRECTIVES>");
    expect(xml).toContain(TASK_LIBRARY.KEYWORD_DIRECTIVES.OPTICS);
    expect(xml).toContain("<AVAILABLE_KEYWORDS>cinematic, atmospheric</AVAILABLE_KEYWORDS>");
    expect(xml).toContain("</KEYWORD_DIRECTIVES>");
  });
});

// ============================================================================
// [SECTION 6: OPTICS TASK STAGING & SPATIAL FRAMING]
// ============================================================================

describe("task.js - Optics Task Staging", () => {
  it("compiles optics task with THINK_FORMAT, unified SPATIAL_FRAMING, and cinematography", () => {
    const task = render_task({
      mode: "optics",
      target_tier: "story_character",
      input_intent: "Standing alone in the pouring rain",
      think_format: "optics",
      cinematography: {
        mode: "Intimate Close-Up",
        tokens: "tight close-up portrait, shallow depth of field",
        narrative_context: "\n  Character In Scene: Depict Alice.",
        visual_staging: "\n  Staging Directive: Looking upward with eyes closed.",
      },
      engine_tokens: {
        camera: "85mm f/1.4 portrait lens",
      },
      keywords: ["melancholy", "atmospheric"],
      is_selfie: true,
      schema: '{"prompt": "string"}',
    });

    expect(task).toContain("<TASK>");
    expect(task).toContain("<TARGET>story_character</TARGET>");
    expect(task).toContain("<MANDATE>");
    expect(task).toContain("<THINK_FORMAT>");
    expect(task).toContain("_thought_process");
    expect(task).toContain("<SPATIAL_FRAMING>");
    expect(task).toContain("<FIRST_SENTENCE_MANDATE>");
    expect(task).toContain("<SPATIAL_GEOMETRY>");
    expect(task).toContain('<CINEMATOGRAPHY mode="Intimate Close-Up">');
    expect(task).toContain("<KEYWORD_DIRECTIVES>");
    expect(task).toContain("<SELFIE_DIRECTIVE>");
    expect(task).toContain("<INPUT_INTENT>Standing alone in the pouring rain</INPUT_INTENT>");
    expect(task).toContain('<OUTPUT_FORMAT mode="json">');
  });

  it("resolves optics cinematography mode, tokens, and context correctly", () => {
    const solo = resolve_optics_cinematography({
      tier: "solo_entity",
      solo_subject: { name: "Alice", type: "character" },
    });
    expect(solo.mode).toBe("Medium Action");
    expect(solo.tokens).toContain("medium portrait framing");

    const close_up = resolve_optics_cinematography({
      tier: "story_character",
      active_ai_character: { name: "Bob", dynamics: { intensity: 80 } },
    });
    expect(close_up.mode).toBe("Intimate Close-Up");

    const dutch = resolve_optics_cinematography({
      tier: "story_character",
      active_ai_character: { name: "Bob", dynamics: { chaos: 90 } },
    });
    expect(dutch.mode).toBe("Dutch / Low-Angle");

    const environmental = resolve_optics_cinematography({
      tier: "story_scene",
      active_fractal_setting: { name: "Neon City" },
    });
    expect(environmental.mode).toBe("Wide Environmental");

    const group = resolve_optics_cinematography({
      tier: "story_entities",
      active_ai_character: { name: "Aria" },
      active_user_persona: { name: "Protagonist" },
      visual_staging: "side by side under neon light",
    });
    expect(group.narrative_context).toContain("Group Mandate: Feature both Aria and Protagonist");
    expect(group.visual_staging).toContain("Staging Directive: side by side under neon light");

    // Direct assertions on TASK_LIBRARY.OPTICS.CINEMATOGRAPHY
    expect(TASK_LIBRARY.OPTICS.CINEMATOGRAPHY.PRESETS.WIDE_ENVIRONMENTAL.mode).toBe("Wide Environmental");
    expect(TASK_LIBRARY.OPTICS.CINEMATOGRAPHY.PRESETS.DUTCH_LOW_ANGLE.mode).toBe("Dutch / Low-Angle");
    expect(TASK_LIBRARY.OPTICS.CINEMATOGRAPHY.PRESETS.INTIMATE_CLOSE_UP.mode).toBe("Intimate Close-Up");
    expect(TASK_LIBRARY.OPTICS.CINEMATOGRAPHY.PRESETS.MEDIUM_ACTION.mode).toBe("Medium Action");
    expect(TASK_LIBRARY.OPTICS.CINEMATOGRAPHY.PRESETS.SOLO_PORTRAIT.mode).toBe("Medium Action");
    expect(TASK_LIBRARY.OPTICS.CINEMATOGRAPHY.STAGING_DIRECTIVE("look left")).toBe("\n  Staging Directive: look left");
    expect(TASK_LIBRARY.OPTICS.CINEMATOGRAPHY.STAGING_DIRECTIVE("")).toBe("");
  });

  describe("Subtext & Keyword XML Compilers", () => {
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

    it("resolves context directives against registry", () => {
      const resolved = resolve_context_directives(["fear"], mock_physics_protocols);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe("FEAR");
      expect(resolved[0].directive).toBe("Shallow breathing, scanning exits.");
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
});

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-19: Added unit test assertions for TASK_LIBRARY.OPTICS.CINEMATOGRAPHY presets, group context, and staging directives.
 * - 2026-09-19: Added unit test for resolve_optics_cinematography following relocation from entities/sheets.js.
 * - 2026-09-18: Added unit tests for render_keyword_directives_xml supporting DIRECTOR and OPTICS modes.
 * - 2026-09-18: Initial creation of comprehensive task.test.js validating pacing directives, environmental hints, delivery posture voice injection, and Layer 7 <OUTPUT_FORMAT> integration across director, continuum, and story prose.
 */
