/**
 * src/intelligence/modules/protocols.test.js
 * ============================================================================
 * 🧪 CORE PROTOCOLS & PROTOCOL LIBRARY UNIT TESTS
 * ============================================================================
 *
 * Validates protocol compilation, visual style XML rendering, and optics protocols:
 * 1. Protocol library invariants and rendering
 * 2. render_visual_style_xml rendering <VISUAL_STYLE> with medium, palette, textures
 * 3. Omission of <VISUAL_STYLE> when style is "none" or empty
 * 4. render_optics_protocols compiling clean <CORE_PROTOCOLS> with static rules
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import {
  PROTOCOL_LIBRARY,
  render_core_protocols,
  resolve_protocol_plan,
  render_protocol_plan,
  resolve_pov_protocol,
  resolve_layer_tense_protocol,
} from "./protocols.js";
import { render_alternation_protocol } from "./reflex.js";
import { render_narrative_style_xml, render_visual_style_xml } from "./style.js";
import { render_dynamics_axes_xml } from "../physics.js";

// ============================================================================
// [SECTION 1: CORE PROTOCOL LIBRARY & COMPILER]
// ============================================================================

describe("protocols.js - Core Protocol Library & Compiler", () => {
  it("renders selected protocol tags via render_core_protocols", () => {
    const output = render_core_protocols({
      protocols: ["OUTPUT.DATA"],
    });
    expect(output).toContain("<CORE_PROTOCOLS>");
    expect(output).toContain("<DATA>");
    expect(output).not.toContain("SIMULATION_FIDELITY");
  });

  it("resolves POV protocols correctly", () => {
    expect(resolve_pov_protocol({ type: "character", pov: "1st_person" })).toBe("CORE_PROTOCOLS.PERSPECTIVE.POV.FIRST");
    expect(resolve_pov_protocol({ type: "character", pov: "3rd_person" })).toBe("CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD");
    expect(resolve_pov_protocol({ type: "fractal" })).toBe("CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD");
  });

  it("resolves the correct layer-tense protocol per temporal field", () => {
    expect(resolve_layer_tense_protocol("eternal.non_physical", "")).toBe("CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT");
    expect(resolve_layer_tense_protocol("present.physical", "")).toBe("CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT");
    expect(resolve_layer_tense_protocol("past", "")).toBe("CORE_PROTOCOLS.PERSPECTIVE.TENSE.PAST");
    expect(resolve_layer_tense_protocol("", "FUTURE")).toBe("CORE_PROTOCOLS.PERSPECTIVE.TENSE.FUTURE");
    expect(resolve_layer_tense_protocol("name", "")).toBe(null);
  });

  it("folds tense atoms into PERSPECTIVE instead of a LAYER_TENSE block", () => {
    const output = render_core_protocols({
      protocols: ["OUTPUT.DATA", "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PAST", "CORE_PROTOCOLS.PERSPECTIVE.TENSE.FUTURE"],
    });
    expect(output).not.toContain("<LAYER_TENSE>");
    expect(output).toContain('<PERSPECTIVE tense="LAYER">');
    expect(output).toContain("Match tense to the layer being written:");
    expect(output).toContain("write strictly in the past tense");
    expect(output).toContain("active future tense");
    expect(output).not.toContain("<PAST>");
    expect(output).not.toContain("<FUTURE>");
  });

  it("pins a single tense atom to the PERSPECTIVE tense attribute", () => {
    const output = render_core_protocols({
      protocols: ["OUTPUT.DATA", "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PAST"],
      pov_protocol: "CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD",
    });
    expect(output).toContain('<PERSPECTIVE person="THIRD" tense="PAST">');
    expect(output).toContain("Write strictly in the past tense.");
  });

  it("renders alternation protocol if text contains alternations", () => {
    expect(render_alternation_protocol("plain text")).toBe("");
    expect(render_alternation_protocol("choice: {red|blue}")).toContain("<ALTERNATION_OPTIONS>");
  });

  it("renders <NARRATIVE_STYLE> symmetrically via render_narrative_style_xml", () => {
    const style = {
      id: "noir",
      description: "Shadow-drenched cynicism.",
      elements: ["rain", "cynicism", "venetian blinds"],
      dna: { internal_ratio: 0.7 },
    };
    const xml = render_narrative_style_xml(style);
    expect(xml).toContain('<NARRATIVE_STYLE origin="NOIR" internal_ratio="0.70">');
    expect(xml).toContain("Shadow-drenched cynicism.");
    expect(xml).toContain("<SIGNATURE_ELEMENTS>rain, cynicism, venetian blinds</SIGNATURE_ELEMENTS>");
    expect(render_narrative_style_xml({ id: "default" })).toBe("");
    expect(render_narrative_style_xml(null)).toBe("");
  });
});

// ============================================================================
// [SECTION 2: VISUAL STYLE XML & OPTICS PROTOCOLS]
// ============================================================================

describe("protocols.js - Visual Style & Optics Protocols", () => {
  it("renders <VISUAL_STYLE> with medium, palette, and textures when active style is not none", () => {
    const style_definition = {
      id: "photo",
      name: "RAW Photography",
      description: "Authentic candid photograph capturing natural everyday lighting.",
    };
    const engine_tokens = {
      medium: "photorealistic 35mm photograph",
      palette: "natural ambient illumination",
      texture: "organic skin micro-textures",
    };

    const xml = render_visual_style_xml(style_definition, engine_tokens);
    expect(xml).toContain('<VISUAL_STYLE origin="PHOTO">');
    expect(xml).toContain("Authentic candid photograph capturing natural everyday lighting.");
    expect(xml).toContain("<MEDIUM>photorealistic 35mm photograph</MEDIUM>");
    expect(xml).toContain("<PALETTE>natural ambient illumination</PALETTE>");
    expect(xml).toContain("<TEXTURES>organic skin micro-textures</TEXTURES>");
  });

  it("omits <VISUAL_STYLE> when style is none or unselected", () => {
    expect(render_visual_style_xml({ id: "none" }, {})).toBe("");
    expect(render_visual_style_xml(null, {})).toBe("");
  });

  it("renders clean <CORE_PROTOCOLS> for optics via render_core_protocols", () => {
    const style_definition = {
      id: "cyberpunk",
      description: "Gritty neon future.",
    };
    const engine_tokens = {
      medium: "digital illustration",
      palette: "electric magenta and cyan neon",
      texture: "rain-slicked pavement reflections",
    };

    const protocols_xml = render_core_protocols({
      visual_style: style_definition,
      engine_tokens,
      protocols: ["OUTPUT.DATA", "OPTICS.IMAGE_VOCABULARY", "OPTICS.TEXT_RENDERING", "CORE_PROTOCOLS.GROUNDING"],
    });

    expect(protocols_xml).toContain("<CORE_PROTOCOLS>");
    expect(protocols_xml).toContain("<DATA>");
    expect(protocols_xml).toContain("<IMAGE_VOCABULARY>");
    expect(protocols_xml).toContain("<TEXT_RENDERING>");
    expect(protocols_xml).toContain("<GROUNDING>");
    expect(protocols_xml).toContain('<VISUAL_STYLE origin="CYBERPUNK">');
    // Verify no legacy nested <VISUAL_SYNTHESIS> wrapper exists
    expect(protocols_xml).not.toContain("<VISUAL_SYNTHESIS>");
  });

  describe("Dynamics & Axes XML Compilers", () => {
    const mock_axes = {
      chaos: { label: "Chaos", low: "Order", high: "Volatility", scope: "somatic" },
      velocity: { label: "Velocity", low: "Suspension", high: "Acceleration", scope: "fractal" },
    };

    it("renders scoped <DYNAMIC_AXES>", () => {
      const dynamics = { chaos: 65, velocity: 30 };
      const somatic_xml = render_dynamics_axes_xml(dynamics, "somatic", mock_axes);
      expect(somatic_xml).toContain('<CHAOS value="65" low="Order" high="Volatility" />');
      expect(somatic_xml).not.toContain("<VELOCITY");

      const fractal_xml = render_dynamics_axes_xml(dynamics, "fractal", mock_axes);
      expect(fractal_xml).toContain('<VELOCITY value="30" low="Suspension" high="Acceleration" />');
      expect(fractal_xml).not.toContain("<CHAOS");
    });
  });
});

describe("protocols.js - Protocol Plans", () => {
  const prose_bundle = [
    "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.NATURAL_DIALOGUE",
    "CORE_PROTOCOLS.ALTERNATION_OPTIONS",
  ];

  it("resolves frozen plans with static rules, perspective data, and drop counts", () => {
    const plan = resolve_protocol_plan({ protocols: [...prose_bundle, "BOGUS.KEY"], has_alternation: true });
    expect(Object.isFrozen(plan)).toBe(true);
    expect(plan.static_rules).toEqual([]);
    expect(plan.perspective.tense).toBe("PRESENT");
    expect(plan.perspective.person).toBe(null);
    expect(plan.alternation).toBe(true);
    expect(plan.disciplines.map((discipline) => discipline.tag)).toEqual(["TYPOGRAPHY", "NATURAL_DIALOGUE"]);
    expect(plan.dropped.unknown).toBe(1);
  });

  it("maps plans to the identical envelopes as the compiler", () => {
    const inputs = {
      protocols: ["OUTPUT.DATA", ...prose_bundle],
      pov_protocol: "CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD",
      has_alternation: true,
    };
    expect(render_protocol_plan(resolve_protocol_plan(inputs))).toBe(render_core_protocols(inputs));
    expect(render_protocol_plan(null)).toBe("");
  });

  it("records visual style selection as plan data", () => {
    const plan = resolve_protocol_plan({
      protocols: ["OUTPUT.DATA", "OPTICS.IMAGE_VOCABULARY"],
      visual_style: { id: "photo", description: "Candid." },
      engine_tokens: { medium: "35mm" },
    });
    expect(plan.style_kind).toBe("visual");
    expect(plan.style_xml).toContain('<VISUAL_STYLE origin="PHOTO">');
    expect(plan.static_rules.map((rule) => rule.tag)).toEqual(["DATA", "IMAGE_VOCABULARY"]);
  });
});

describe("protocols.js - Restructured Catalog", () => {
  it("resolves OUTPUT.DATA through the output-shape fallback with the same tag", () => {
    const plan = resolve_protocol_plan({ protocols: ["OUTPUT.DATA"] });
    expect(plan.static_rules).toEqual([{ tag: "DATA", body: expect.stringContaining("raw, unpadded structural data") }]);
    expect(plan.dropped.unknown).toBe(0);
    expect(render_core_protocols({ protocols: ["OUTPUT.DATA"] })).toContain("<DATA>");
  });

  it("shares one GROUNDING atom between prose and optics lists", () => {
    const prose = resolve_protocol_plan({
      protocols: ["CORE_PROTOCOLS.GROUNDING", "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY"],
    });
    expect(prose.static_rules.map((rule) => rule.tag)).toEqual(["GROUNDING"]);
    const optics = resolve_protocol_plan({
      protocols: ["OUTPUT.DATA", "OPTICS.IMAGE_VOCABULARY", "OPTICS.TEXT_RENDERING", "CORE_PROTOCOLS.GROUNDING"],
    });
    expect(optics.static_rules.map((rule) => rule.tag)).toEqual(["DATA", "IMAGE_VOCABULARY", "TEXT_RENDERING", "GROUNDING"]);
  });

  it("emits single-concern discipline atoms including standalone consent", () => {
    const output = render_core_protocols({
      protocols: [
        "CORE_PROTOCOLS.PROSE_DISCIPLINE.SENTENCE_FORMULAS",
        "CORE_PROTOCOLS.PROSE_DISCIPLINE.SCENE_MOMENTUM",
        "CORE_PROTOCOLS.PROSE_DISCIPLINE.CLICHES",
        "CORE_PROTOCOLS.PROSE_DISCIPLINE.CONSENT",
      ],
    });
    for (const tag of ["SENTENCE_FORMULAS", "SCENE_MOMENTUM", "CLICHES", "CONSENT"]) {
      expect(output).toContain(`<${tag}>`);
    }
    expect(output).not.toContain("ANTI_TROPES");
    expect(output).not.toContain("BANNED_CLICHES");
    expect(output).not.toContain("PHYSICALITY");
  });

  it("builds macro directives from the shared subject lists", () => {
    expect(PROTOCOL_LIBRARY.MACROS.CHARACTER).toContain("Never use raw pronouns ambiguously.");
    expect(PROTOCOL_LIBRARY.MACROS.FRACTAL).toContain("'@USER' (user persona)");
    expect(PROTOCOL_LIBRARY.MACROS.SORTING).toContain("Use placeholder macros for entities:");
  });
});

/**
 * CHANGELOG
 * - 2026-10-04: Catalog restructure coverage — OUTPUT.DATA fallback, shared GROUNDING, single-concern disciplines + CONSENT, macro derivation, plan parity; alternation assertions read from reflex.js.
 * - 2026-10-04: Plan/render split coverage — frozen plans, perspective data, drop counts, compiler parity, visual style-kind recording.
 * - 2026-10-04: Unified-tense round — resolver/merge tests track `PERSPECTIVE.TENSE.*` keys and the reworded atoms.
 * - 2026-10-04: Rewrote the layer-tense test for the PERSPECTIVE merge (`<LAYER_TENSE>` gone; tense asserts against the `tense` attribute plus the composed command).
 * - 2026-09-23: Prompt-grammar harmonization — dropped the `render_dynamics_xml` `<DYNAMICS>` coverage (that compiler was deleted); the suite keeps the scoped `render_dynamics_axes_xml` `<DYNAMIC_AXES>` case the Director now shares.
 * - 2026-09-23: Added coverage for the consolidated `render_dynamics_xml` `<DYNAMICS>` block — each axis carries `value` plus both poles, and a value-less axis keeps its legend.
 * - 2026-09-19: Added unit test suite validating render_visual_style_xml and render_optics_protocols for Layer 3.
 */
