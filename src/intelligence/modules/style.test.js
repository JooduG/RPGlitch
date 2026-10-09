import { describe, expect, it } from "vitest";
import {
  build_aesthetic_map,
  CINEMATOGRAPHY_PRESETS,
  CINEMATOGRAPHY_RULES,
  compose_visual_generation_prompt,
  resolve_optics_cinematography,
  resolve_style_dna,
  resolve_style_snapshot,
  render_narrative_style_xml,
  render_visual_style_xml,
} from "./style.js";
import { resolve_optics_atom } from "./protocols.js";

describe("resolve_style_snapshot()", () => {
  it("resolves empty defaults with no explicit records", () => {
    const snapshot = resolve_style_snapshot({});
    expect(snapshot.narrative_key).toBe("");
    expect(snapshot.style.id).toBe("default");
    expect(snapshot.keywords).toEqual([]);
    expect(snapshot.visual_key).toBe("none");
    expect(snapshot.visual_style.id).toBe("none");
    expect(snapshot.style_dna.internal_ratio).toBe("0.50");
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.style_dna)).toBe(true);
  });

  it("resolves an explicit narrative style with pre-parsed DNA", () => {
    const snapshot = resolve_style_snapshot({ explicit_narrative_style: "cormac_mccarthy" });
    expect(snapshot.narrative_key).toBe("cormac_mccarthy");
    expect(snapshot.style.id).toBe("cormac_mccarthy");
    expect(snapshot.style_dna.rhythm).toContain("Polysyndetic");
    expect(snapshot.style_dna).toEqual(resolve_style_dna(snapshot.style));
  });

  it("resolves explicit narrative styles without runtime state", () => {
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
    const snapshot = resolve_style_snapshot({ explicit_narrative_style: "cormac_mccarthy", fractal: { visual_style: "noir" } });
    const narrative_xml = render_narrative_style_xml(snapshot.style);
    expect(narrative_xml).toContain('origin="CORMAC_MCCARTHY"');
    expect(narrative_xml).toContain("<SIGNATURE_ELEMENTS>");
    expect(render_visual_style_xml(snapshot.visual_style, {})).toContain('origin="NOIR"');
  });
});

// ============================================================================
// [OPTICS CINEMATOGRAPHY + VISUAL PAYLOAD — Track 0.11: moved from
// sensory.test.js (cinematography) and media/optics.test.js (compose/build)]
// ============================================================================

// [SECTION 2: CINEMATOGRAPHY RESOLUTION]
// ============================================================================

describe("resolve_optics_cinematography", () => {
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

    // Direct assertions on SENSORY_LIBRARY.CINEMATOGRAPHY
    expect(CINEMATOGRAPHY_PRESETS.WIDE_ENVIRONMENTAL.mode).toBe("Wide Environmental");
    expect(CINEMATOGRAPHY_PRESETS.DUTCH_LOW_ANGLE.mode).toBe("Dutch / Low-Angle");
    expect(CINEMATOGRAPHY_PRESETS.INTIMATE_CLOSE_UP.mode).toBe("Intimate Close-Up");
    expect(CINEMATOGRAPHY_PRESETS.MEDIUM_ACTION.mode).toBe("Medium Action");
    expect(CINEMATOGRAPHY_PRESETS.SOLO_PORTRAIT.mode).toBe("Solo Portrait");
    expect(resolve_optics_atom("OPTICS.CINEMATOGRAPHY.STAGING_DIRECTIVE", { visual_staging: "look left" })).toBe("\n  Staging Directive: look left");
    expect(resolve_optics_cinematography({ tier: "solo_entity" }).visual_staging).toBe("");
  });
});

describe("CINEMATOGRAPHY_RULES descriptor table", () => {
  it("declares ordered single-constraint rows with a MEDIUM_ACTION tail", () => {
    expect(CINEMATOGRAPHY_RULES.map((rule) => rule.preset)).toEqual([
      "WIDE_ENVIRONMENTAL",
      "DUTCH_LOW_ANGLE",
      "INTIMATE_CLOSE_UP",
      "INTIMATE_CLOSE_UP",
      "SOLO_PORTRAIT",
    ]);
    expect(Object.isFrozen(CINEMATOGRAPHY_RULES)).toBe(true);
  });

  it("falls back to MEDIUM_ACTION when no row matches", () => {
    const neutral = resolve_optics_cinematography({
      tier: "story_character",
      active_ai_character: { name: "Bob", dynamics: { intensity: 10, chaos: 10, affinity: 10 } },
    });
    expect(neutral.mode).toBe("Medium Action");
  });

  it("keeps affinity-driven close-ups matching intensity-driven ones", () => {
    const by_affinity = resolve_optics_cinematography({
      tier: "story_character",
      active_ai_character: { name: "Bob", dynamics: { intensity: 10, chaos: 10, affinity: 80 } },
    });
    expect(by_affinity.mode).toBe("Intimate Close-Up");
  });
});

// ============================================================================

describe("build_aesthetic_map", () => {
  it("merges eternal and present traits while respecting clothing overrides", () => {
    const entity = {
      name: "Test Subject",
      signature_color: "Electric Cyan",
      eternal: {
        physical: "[BUILD: lean athletic] [JACKET: worn brown duster] [EYES: silver]",
      },
      present: {
        physical: "[CLOTHING: none] [POSTURE: defensive]",
      },
    };

    const map = build_aesthetic_map(entity);
    expect(map.BUILD).toBe("lean athletic");
    expect(map.EYES).toBe("silver");
    expect(map.POSTURE).toBe("defensive");
    expect(map.JACKET).toBeUndefined();
    expect(map.aesthetic).toContain("#11aecc");
  });
});

describe("compose_visual_generation_prompt", () => {
  it("assembles positive tokens and deduplicates negative tokens", () => {
    const { prompt, negative_prompt } = compose_visual_generation_prompt({
      prompt: "A neon lit alleyway in rain",
      style_key: "none",
      is_character_shot: false,
      base_negative_prompt: "blurry, low resolution, ugly",
    });

    expect(prompt).toBe("A neon lit alleyway in rain");
    expect(negative_prompt).toContain("blurry");
    expect(negative_prompt).toContain("low resolution");
    expect(negative_prompt).toContain("ugly");
  });
});
