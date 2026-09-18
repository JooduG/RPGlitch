/**
 * src/intelligence/optics.test.js
 * ============================================================================
 * Optics Pipeline & Image Prompt Synthesis Test Suite
 * ============================================================================
 *
 * Validates:
 * 1. Proper name sanitization and prompt cleaning algorithms (`parser.js`).
 * 2. 5-phase Optics Builder protocol and sensory framing (`optics.js`).
 * 3. Multi-tier prompt synthesis (solo entity, scene, selfie) and JSON structures.
 * 4. Sensory history formatting and cognition block stripping.
 */

import { describe, expect, it } from "vitest";
import {
  NEGATIVE_PROMPT,
  OPTICS_BUILDER_PROTOCOL,
  build_optics_builder_protocol,
  format_sensory_history,
  prompt_templates,
  render_optics_prompt,
  render_visual_enhancement,
} from "./optics.js";
import { clean_image_prompt, strip_proper_names } from "./parser.js";

// ============================================================================
// [SECTION 1: PROPER NAME STRIPPING & SANITIZATION]
// ============================================================================

describe("strip_proper_names", () => {
  it("removes a character's full name and surname tokens", () => {
    const out = strip_proper_names("a portrait of Lord Benedict Silvers in a charcoal suit", ["Lord Benedict Silvers"]);
    expect(out).not.toContain("Silvers");
    expect(out).not.toContain("Benedict");
    expect(out).toContain("charcoal suit");
  });

  it("handles possessive forms", () => {
    const out = strip_proper_names("Silvers's crimson eyes", ["Lord Benedict Silvers"]);
    expect(out).not.toContain("Silvers");
    expect(out).toContain("crimson eyes");
  });

  it("does not leave doubled punctuation behind", () => {
    const out = strip_proper_names("portrait, Silvers, in a suit", ["Silvers"]);
    expect(out).not.toContain("Silvers");
    expect(out).not.toContain(",,");
  });

  it("ignores honorific stopwords when collecting tokens", () => {
    const out = strip_proper_names("a lordly posture of Lord Silvers", ["Lord Silvers"]);
    expect(out).toContain("lordly posture");
    expect(out).not.toContain("Silvers");
  });

  it("returns the text unchanged when no names are given", () => {
    expect(strip_proper_names("a charcoal suit", [])).toBe("a charcoal suit");
  });
});

describe("clean_image_prompt", () => {
  it("strips proper names from the sanitized prompt", () => {
    const out = clean_image_prompt("cinematic portrait of Silvers in a charcoal suit", { names: ["Lord Benedict Silvers"] });
    expect(out).not.toContain("Silvers");
    expect(out).toContain("charcoal");
  });

  it("works without options", () => {
    expect(clean_image_prompt("a charcoal suit")).toContain("charcoal");
  });
});

// ============================================================================
// [SECTION 2: OPTICS PROTOCOLS & BUILDER PROTOCOL]
// ============================================================================

describe("optics protocols", () => {
  it("exports concise negative prompt without legacy SD1.5 token salad", () => {
    expect(NEGATIVE_PROMPT).toBeDefined();
    expect(NEGATIVE_PROMPT).toContain("blurry");
    expect(NEGATIVE_PROMPT).toContain("compressed artifacts");
    expect(NEGATIVE_PROMPT).not.toContain("masterpiece");
  });

  it("builds 5-phase Optics Builder protocol", () => {
    const protocol = build_optics_builder_protocol();
    expect(protocol).toContain('<PHASE_1 task="COMPOSITION_STRATEGY">');
    expect(protocol).toContain('<PHASE_2 task="SPATIAL_FRAMING">');
    expect(protocol).toContain('<PHASE_3 task="SUBJECT_SPECIFICATION">');
    expect(protocol).toContain('<PHASE_4 task="STYLE_DISCIPLINE">');
    expect(protocol).toContain('<PHASE_5 task="SENSORY_GROUNDING">');
  });

  it("OPTICS_BUILDER_PROTOCOL matches build_optics_builder_protocol output", () => {
    expect(OPTICS_BUILDER_PROTOCOL).toBe(build_optics_builder_protocol());
  });
});

// ============================================================================
// [SECTION 3: SENSORY HISTORY FORMATTING]
// ============================================================================

describe("format_sensory_history", () => {
  it("returns empty string for null or non-string inputs", () => {
    expect(format_sensory_history(null)).toBe("");
    expect(format_sensory_history(undefined)).toBe("");
    expect(format_sensory_history(123)).toBe("");
  });

  it("strips think blocks and telemetry tags from sensory history", () => {
    const raw_history = `
      <think>Internal deliberation that should not leak</think>
      The rain pounded against the obsidian spire.
      system: affinity +2
      Silvers stepped into the shadow of the colonnade.
    `;
    const formatted = format_sensory_history(raw_history);
    expect(formatted).not.toContain("Internal deliberation");
    expect(formatted).not.toContain("affinity +2");
    expect(formatted).toContain("The rain pounded against the obsidian spire.");
    expect(formatted).toContain("Silvers stepped into the shadow of the colonnade.");
  });
});

// ============================================================================
// [SECTION 4: MULTI-TIER PROMPT SYNTHESIS]
// ============================================================================

describe("render_optics_prompt & prompt_templates", () => {
  it("compiles affirmative framing protocol without undefined leaks", () => {
    const prompt = prompt_templates.build_prompt("A stormy mountain peak", {
      tier: "story_scene",
      context: { scene_description: "lightning over crags" },
    });
    expect(prompt).toContain("<AFFIRMATIVE_FRAMING>");
    expect(prompt).not.toContain("<AFFIRMATIVE_FRAMING>undefined</AFFIRMATIVE_FRAMING>");
    expect(prompt).toContain("Describe positive presence in frame");
  });

  it("synthesizes solo entity prompt with character visual tokens", () => {
    const prompt = render_optics_prompt("solo_entity", "A portrait in the rain", {
      entity: {
        id: "char_silvers",
        name: "Lord Silvers",
        role: "ai",
        visual: {
          hair: "silver swept back",
          eyes: "crimson",
          clothing: "charcoal tailored suit",
        },
      },
    });

    expect(prompt).toContain("<TARGET>solo_entity</TARGET>");
    expect(prompt).toContain("<TASK>");
    expect(prompt).toContain("Convert narrative intent into a structured image prompt payload");
    expect(prompt).toContain("JSON STRUCTURE:");
    expect(prompt).toContain('"prompt": "<synthesized descriptive image prompt>"');
  });

  it("synthesizes selfie prompt with in-character caption field", () => {
    const prompt = render_optics_prompt("selfie", "Smiling at the tavern", {
      entity: {
        id: "char_lyra",
        name: "Lyra",
        role: "ai",
      },
      variant: "selfie",
    });

    expect(prompt).toContain('"caption": "<in-character selfie caption>"');
  });

  it("render_visual_enhancement delegates to render_optics_prompt with enhance mode", () => {
    const prompt = render_visual_enhancement("A bustling neon bazaar", "story_scene");
    expect(prompt).toContain("<TARGET>story_scene</TARGET>");
    expect(prompt).toContain("Convert narrative intent into a structured image prompt payload");
  });
});

/**
 * CHANGELOG:
 * - 2026-09-18: Initial creation of optics.test.js unifying proper name sanitization, 5-phase Optics Builder protocol, sensory history formatting, and multi-tier prompt synthesis tests.
 */
