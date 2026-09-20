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
  render_narrative_style_xml,
  render_visual_style_xml,
  render_core_protocols,
  resolve_pov_protocol,
  render_alternation_protocol,
} from "./protocols.js";
import { render_dynamics_axes_xml } from "./entities/sheets.js";

// ============================================================================
// [SECTION 1: CORE PROTOCOL LIBRARY & COMPILER]
// ============================================================================

describe("protocols.js - Core Protocol Library & Compiler", () => {
  it("renders selected protocol tags via render_core_protocols", () => {
    const output = render_core_protocols({
      protocols: ["CORE_PROTOCOLS.DATA", "CORE_PROTOCOLS.SIMULATION_FIDELITY"],
    });
    expect(output).toContain("<CORE_PROTOCOLS>");
    expect(output).toContain("<DATA>");
    expect(output).toContain(PROTOCOL_LIBRARY.CORE_PROTOCOLS.DATA);
    expect(output).toContain("<SIMULATION_FIDELITY>");
  });

  it("resolves POV protocols correctly", () => {
    expect(resolve_pov_protocol({ type: "character", pov: "1st_person" })).toBe("CORE_PROTOCOLS.PERSPECTIVE.POV.FIRST");
    expect(resolve_pov_protocol({ type: "character", pov: "3rd_person" })).toBe("CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD");
    expect(resolve_pov_protocol({ type: "fractal" })).toBe("CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD");
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
      protocols: [
        "CORE_PROTOCOLS.DATA",
        "OPTICS.WEIGHTING_RESTRICTIONS",
        "OPTICS.AFFIRMATIVE_FRAMING",
        "OPTICS.TYPOGRAPHY",
        "OPTICS.ENVIRONMENTAL_GROUNDING",
      ],
    });

    expect(protocols_xml).toContain("<CORE_PROTOCOLS>");
    expect(protocols_xml).toContain("<DATA>");
    expect(protocols_xml).toContain("<WEIGHTING_RESTRICTIONS>");
    expect(protocols_xml).toContain("<AFFIRMATIVE_FRAMING>");
    expect(protocols_xml).toContain("<TYPOGRAPHY>");
    expect(protocols_xml).toContain("<ENVIRONMENTAL_GROUNDING>");
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

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-23: Prompt-grammar harmonization — dropped the `render_dynamics_xml` `<DYNAMICS>` coverage (that compiler was deleted); the suite keeps the scoped `render_dynamics_axes_xml` `<DYNAMIC_AXES>` case the Director now shares.
 * - 2026-09-23: Added coverage for the consolidated `render_dynamics_xml` `<DYNAMICS>` block — each axis carries `value` plus both poles, and a value-less axis keeps its legend.
 * - 2026-09-19: Added unit test suite validating render_visual_style_xml and render_optics_protocols for Layer 3.
 */
