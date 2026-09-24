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
 *    - TASK_LAYERS: the single ordered grammar every mode walks
 *    - Director: evaluation, environmental hint in <DIRECTIVES>, and <OUTPUT_FORMAT mode="json">
 *    - Continuum: target focus + mandate in <DIRECTIVES>, and <OUTPUT_FORMAT mode="json">
 *    - Enhancement & Sorting: directives in <DIRECTIVES> and <OUTPUT_FORMAT>
 *    - Story Prose: think directives, currents, posture, and <OUTPUT_FORMAT mode="prose">
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import {
  build_pacing_directive,
  render_environmental_hint,
  render_prose_reflex,
  render_task,
  render_directives_xml,
  render_keyword_directives_xml,
  resolve_optics_cinematography,
  render_subtext_xml,
  render_available_keywords_xml,
  resolve_physics_protocols,
  get_directive_atom,
  TASK_LAYERS,
  TASK_LIBRARY,
} from "./task.js";
import { get_prompt } from "../prompts.js";

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
    expect(render_environmental_hint("The rain pours down the stone steps.")).toContain("ENVIRONMENTAL HINT:");
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
    expect(reflex).toContain("Advance the scene in response to «INPUT»");
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
      config: get_prompt("director"),
      task_state: "director",
      round: 1,
      input: "Bob draws a weapon.",
      schema: dummy_schema,
      entities: { AI: { id: "ALICE", name: "Alice" }, USER: { id: "BOB", name: "Bob" } },
    });

    expect(task).toContain('<INPUT origin="BOB" round="1" channel="action">');
    expect(task).toContain("<TASK>");
    expect(task).toContain('next_action MUST be "AI_CHARACTER"');
    expect(task).toContain('<OUTPUT_FORMAT mode="json">');
    expect(task).toContain("Return a single, COMPLETE, VALID JSON object matching this schema:");
    expect(task).toContain('"next_action": "AI_CHARACTER"');
    expect(task).toContain("</OUTPUT_FORMAT>");
  });

  it("renders terse Director retry envelope with OUTPUT_FORMAT mode='json'", () => {
    const task = render_task({
      config: get_prompt("director"),
      task_state: "director",
      terse: true,
      schema: dummy_schema,
      layers: ["output_format"],
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
      config: { think_format: "character" },
      input: "Alice examines the vault.",
      action_directive: "Respond strictly as Alice.",
      speaking_style: "clinical",
    });

    expect(task).toContain("<TASK>");
    expect(task).toContain("<THINK>");
    expect(task).toContain("VISCERAL_IMPACT");
    expect(task).toContain('<INPUT channel="action">');
    expect(task).toContain("Respond strictly as Alice.");
    expect(task).toContain("<DELIVERY_POSTURE>");
    expect(task).toContain('<VOICE mode="clinical">');
    expect(task).toContain('<OUTPUT_FORMAT mode="prose">');
    expect(task).toContain("After closing </THINK>, emit strictly plain prose: no preamble, commentary, markdown, or structural tags.");
    expect(task).toContain("</OUTPUT_FORMAT>");
    expect(task).toContain("</TASK>");
  });

  it("drops the </THINK> reference for a prose task with no think block", () => {
    const task = render_task({ input: "Terse, dry.", action_directive: "Expand it." });

    expect(task).not.toContain("<THINK_FORMAT>");
    expect(task).toContain("Emit strictly plain prose: no preamble, commentary, markdown, or structural tags.");
    expect(task).not.toContain("</THINK>");
  });
});

describe("render_task — Continuum Mode", () => {
  it("renders Continuum task with target focus and OUTPUT_FORMAT mode='json'", () => {
    const dummy_schema = '{\n  "memories": []\n}';
    const task = render_task({
      config: get_prompt("continuum"),
      task_state: "continuum",
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
      config: get_prompt("optics"),
      task_state: "optics",
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
    expect(task).toContain("<DIRECTIVES>");
    expect(task).toContain("Convert narrative intent into a structured image prompt payload depicting");
    expect(task).toContain("<THINK_FORMAT>");
    expect(task).toContain("_thought_process");
    expect(task).toContain("<SPATIAL_FRAMING>");
    expect(task).toContain("<FIRST_SENTENCE_MANDATE>");
    expect(task).toContain("<SPATIAL_GEOMETRY>");
    expect(task).toContain('<CINEMATOGRAPHY mode="Intimate Close-Up">');
    expect(task).toContain("<KEYWORD_DIRECTIVES>");
    expect(task).toContain("<SELFIE_DIRECTIVE>");
    expect(task).toContain('<INPUT channel="intent">Standing alone in the pouring rain</INPUT>');
    expect(task).toContain('<OUTPUT_FORMAT mode="json">');
  });

  it("resolves optics cinematography mode, tokens, and context correctly", () => {
    const solo = resolve_optics_cinematography({
      tier: "solo_entity",
      solo_subject: { name: "Alice", type: "character" },
    });
    expect(solo.mode).toBe("Solo Portrait");
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
    expect(TASK_LIBRARY.OPTICS.CINEMATOGRAPHY.PRESETS.SOLO_PORTRAIT.mode).toBe("Solo Portrait");
    expect(get_directive_atom("OPTICS.CINEMATOGRAPHY.STAGING_DIRECTIVE", { visual_staging: "look left" })).toBe("\n  Staging Directive: look left");
    expect(resolve_optics_cinematography({ tier: "solo_entity" }).visual_staging).toBe("");
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
// [SECTION 7: TASK LAYER TABLE & MODE DISPATCH]
// ============================================================================

describe("TASK_LAYERS — canonical envelope grammar", () => {
  it("declares the ordered layer slots every mode walks", () => {
    expect(TASK_LAYERS.map((layer) => layer.key)).toEqual([
      "think_format",
      "input",
      "currents",
      "target",
      "spatial_framing",
      "directives",
      "delivery_posture",
      "stability_lock",
      "output_format",
    ]);
  });

  it("wraps directive prose in one canonical <DIRECTIVES> element", () => {
    expect(render_directives_xml([])).toBe("");
    expect(render_directives_xml(["", null, undefined])).toBe("");
    const xml = render_directives_xml(["First block.", "Second block."]);
    expect(xml).toContain("<DIRECTIVES>");
    expect(xml).toContain("First block.");
    expect(xml).toContain("Second block.");
    expect(xml).toContain("</DIRECTIVES>");
  });
});

describe("render_task — per-mode state dispatch", () => {
  it("routes director to its JSON staging state and terse to the minimal refusal state", () => {
    const full = render_task({
      config: get_prompt("director"),
      task_state: "director",
      round: 2,
      input: "hi",
      last_ai_text: "prev",
      schema: '{"a":1}',
      entities: { AI: { id: "ALICE", name: "Alice" }, USER: { id: "BOB", name: "Bob" } },
    });
    expect(full).toContain('<INPUT origin="BOB" round="2" channel="action">hi</INPUT>');
    expect(full).toContain('<INPUT origin="ALICE" channel="reply">');
    expect(full).toContain("<DIRECTIVES>");
    expect(full).toContain('<OUTPUT_FORMAT mode="json">');

    const terse = render_task({ config: get_prompt("director"), task_state: "director", terse: true, schema: '{"a":1}', layers: ["output_format"] });
    expect(terse).not.toContain("<DIRECTIVES>");
    expect(terse).not.toContain("<INPUT");
    expect(terse).toContain('<OUTPUT_FORMAT mode="json">');
  });

  it("routes continuum to target-focus + mandate directives and a JSON schema", () => {
    const task = render_task({ config: get_prompt("continuum"), task_state: "continuum", target_name: "Kaelen", schema: '{"m":[]}' });
    expect(task).toContain("<DIRECTIVES>");
    expect(task).toContain("TARGET FOCUS: Consolidate state and extract relational vectors for Kaelen.");
    expect(task).toContain("EXECUTION MANDATE:");
    expect(task).toContain('<OUTPUT_FORMAT mode="json">');
  });

  it("routes enhancement/sorting directives through <DIRECTIVES> without a schema when none is supplied", () => {
    const task = render_task({ task_state: "sorting", directives: ["- one", "- two"] });
    expect(task).toContain("<DIRECTIVES>");
    expect(task).toContain("- one");
    expect(task).not.toContain("<OUTPUT_FORMAT");
  });

  it("routes optics to the sensory staging state", () => {
    const args = { target_tier: "story_character", input_intent: "rain", think_format: "optics", is_selfie: true, schema: '{"prompt":"s"}' };
    const task = render_task({ config: get_prompt("optics"), task_state: "optics", ...args });
    expect(task).toContain("<TARGET>story_character</TARGET>");
    expect(task).toContain("<SPATIAL_FRAMING>");
    expect(task).toContain("<DIRECTIVES>");
    expect(task).toContain('<OUTPUT_FORMAT mode="json">');
  });

  it("falls back to story prose for an unknown mode", () => {
    const args = { config: { think_format: "character" }, input: "hi", input_origin: "USER", action_directive: "Be Alice." };
    expect(render_task({ task_state: "not-a-mode", ...args })).toBe(render_task(args));
  });
});

/**
 * CHANGELOG
 * - 2026-09-25: Layer-6 refactor — directive-bearing `render_task` calls (director/continuum/optics) now pass their manifest `config` so the declarative `<DIRECTIVES>`/spatial-framing selections resolve; terse calls pass `layers: ["output_format"]` like production; the cinematography staging assertion moved from the retired `STAGING_DIRECTIVE(...)` closure to `get_directive_atom`.
 * - 2026-09-23: `render_task` calls updated to the `task_state` API (was `mode`) and the story-prose case passes the flattened `config.think_format` (was `config.task.think_format`).
 * - 2026-09-24: Entity-id origins — the Director `<INPUT>` assertions now expect the real entity ids (`origin="BOB"` / `origin="ALICE"`) from a supplied `entities` bag; added a think-free prose case asserting no orphaned `</THINK>` reference.
 * - 2026-09-23: Prompt-grammar harmonization — `<INPUT>` now carries `channel=` (was `mode=`), the Director's last turn is a second `<INPUT origin="AI_CHARACTER" channel="reply">` (no separate tag), the `input`/`last_turn` slots collapse into one `inputs` layer, and prose `OUTPUT_FORMAT` is asserted against the reconciled `</THINK>` wording.
 * - 2026-09-23: Harmonized signal channel + directives nesting — assertions now expect the `mode` discriminator (was `kind`), the `<AI_CHARACTER_LAST_TURN>` block carrying input-style attributes, the `keyword_directives` slot removed from `TASK_LAYERS`, and `<KEYWORD_DIRECTIVES>` nested inside `<DIRECTIVES>`.
 * - 2026-09-21: Realigned to the table-driven TASK envelope: removed the retired per-mode renderer imports and rewrote Section 3/7 around `render_task` + `TASK_LAYERS` + `render_directives_xml` (directive prose now lives inside the single `<DIRECTIVES>` element; optics `<MANDATE>` folded into `<DIRECTIVES>`).
 * - 2026-09-19: Added a per-mode compiler dispatch suite asserting render_task routes to render_director_task / render_structured_task / render_optics_task / render_prose_task.
 * - 2026-09-19: Dropped the resolve_context_directives test (resolver removed — FIRST_CONTACT is now the single TASK_LIBRARY.PROSE.CHARACTER directive, driven by director_data.first_contact).
 * - 2026-09-19: Added unit test assertions for TASK_LIBRARY.OPTICS.CINEMATOGRAPHY presets, group context, and staging directives.
 * - 2026-09-19: Added unit test for resolve_optics_cinematography following relocation from entities/sheets.js.
 * - 2026-09-18: Added unit tests for render_keyword_directives_xml supporting DIRECTOR and OPTICS modes.
 * - 2026-09-18: Initial creation of comprehensive task.test.js validating pacing directives, environmental hints, delivery posture voice injection, and Layer 7 <OUTPUT_FORMAT> integration across director, continuum, and story prose.
 */
