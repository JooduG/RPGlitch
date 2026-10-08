/**
 * src/intelligence/modules/sheets.test.js
 * ============================================================================
 * 🧪 UNIT TESTS: Sheets Module — Specs, Snapshots & Unified Renderer
 * ============================================================================
 *
 * Verifies the Plan Omega snapshot-first pipeline:
 * 1. define_sheet catalog derivations and spec invariants
 * 2. parse_physical_rows direct row expansion + render_appearance_rows dedup
 * 3. resolve_sheet_snapshot spec-aware epistemic isolation (owner vs other)
 * 4. render_sheet full mode across AI, User, NPC, and Fractal
 * 5. render_sheet physical / separate modes for Optics and memory contexts
 * 6. render_enhancement_field_context across physical and past/future fields
 * ============================================================================
 */

import { describe, expect, it } from "vitest";

import {
  EPISTEMIC_POLICY,
  SHEET_SPECS,
  define_sheet,
  parse_physical_rows,
  render_appearance_rows,
  join_past_vectors,
  resolve_sheet_snapshot,
  render_sheet,
  render_entity_memory_context,
  render_enhancement_field_context,
  resolve_profile_field_tag,
} from "./sheets.js";

const test_character = {
  id: "ALICE",
  name: "Alice",
  type: "character",
  eternal: {
    physical: "[BUILD: tall and athletic]",
    non_physical: "Analytical cybernetic specialist.",
  },
  present: {
    physical: "[JACKET: worn leather] [POSTURE: alert]",
    non_physical: "Guarded vigilance. [@BOB: guarded trust]",
  },
  future: "Infiltrate the mainframe.",
  past: [{ content: "First memory." }, { content: "Second memory." }],
};

const test_fractal = {
  id: "SECTOR_FOUR",
  name: "Sector Four",
  type: "fractal",
  eternal: {
    physical: "[LANDMARKS: rusted catwalks]",
    non_physical: "Degraded industrial district.",
  },
  present: {
    physical: "[WEATHER: acid drizzle]",
    non_physical: "Hostile and oppressive.",
  },
  future: "Decay under acid rain.",
  past: [{ content: "Founded in rust." }],
};

describe("define_sheet + SHEET_SPECS", () => {
  it("derives every tag from PROFILE_FIELD_CATALOG", () => {
    expect(SHEET_SPECS.AI_CHARACTER.agenda_key).toBe(resolve_profile_field_tag("character", "future"));
    expect(SHEET_SPECS.AI_CHARACTER.personality_tag).toBe(resolve_profile_field_tag("character", "eternal.non_physical"));
    expect(SHEET_SPECS.AI_CHARACTER.memory_tag).toBe(resolve_profile_field_tag("character", "past"));
    expect(SHEET_SPECS.FRACTAL.agenda_key).toBe(resolve_profile_field_tag("fractal", "future"));
    expect(SHEET_SPECS.FRACTAL.memory_tag).toBe(resolve_profile_field_tag("fractal", "past"));
  });

  it("defaults epistemic to always, gating only owner state", () => {
    expect(SHEET_SPECS.AI_CHARACTER.epistemic.state).toBe(EPISTEMIC_POLICY.OWNER);
    expect(SHEET_SPECS.FRACTAL.epistemic.state).toBeUndefined();
    expect(SHEET_SPECS.USER_PERSONA.epistemic.state).toBeUndefined();
    expect(SHEET_SPECS.USER_PERSONA.memory_tag).toBe("BACKSTORY");
    expect(SHEET_SPECS.FRACTAL.axes_scope).toBe("fractal");
    expect(SHEET_SPECS.AI_CHARACTER.axes_scope).toBe("somatic");
  });

  it("freezes specs", () => {
    for (const spec of Object.values(SHEET_SPECS)) expect(Object.isFrozen(spec)).toBe(true);
    expect(define_sheet("fractal", { tag: "F", default_name: "F" }).axes_scope).toBe("fractal");
  });
});

describe("parse_physical_rows + render_appearance_rows", () => {
  it("expands bracket entries directly into tag rows", () => {
    expect(parse_physical_rows("[BUILD: tall] [POSTURE: alert]")).toEqual(["<BUILD>tall</BUILD>", "<POSTURE>alert</POSTURE>"]);
  });

  it("passes prose through as a single escaped row", () => {
    expect(parse_physical_rows("Tall and athletic <b>frame</b>.")).toEqual(["Tall and athletic &lt;b&gt;frame&lt;/b&gt;."]);
  });

  it("returns no rows for blank input", () => {
    expect(parse_physical_rows("")).toEqual([]);
    expect(parse_physical_rows(null)).toEqual([]);
  });

  it("merges eternal and present with present winning in place", () => {
    const merged = render_appearance_rows(["<BUILD>tall</BUILD>", "<JACKET>leather</JACKET>"], ["<BUILD>broad</BUILD>"]);
    expect(merged).toEqual(["<BUILD>broad</BUILD>", "<JACKET>leather</JACKET>"]);
  });
});

describe("join_past_vectors", () => {
  it("joins vector contents with newlines", () => {
    expect(join_past_vectors(test_character)).toBe("First memory.\nSecond memory.");
    expect(join_past_vectors({ past: [] })).toBe("");
    expect(join_past_vectors({})).toBe("");
  });
});

describe("resolve_sheet_snapshot", () => {
  it("keeps owner state for owners and strips it for others", () => {
    const hidden_state = { ...test_character, present: { ...test_character.present, non_physical: "Calm. [PLAN: strike at dawn | hide]" } };
    const owner_snapshot = resolve_sheet_snapshot(hidden_state, SHEET_SPECS.AI_CHARACTER, { is_owner: true });
    const other_snapshot = resolve_sheet_snapshot(hidden_state, SHEET_SPECS.AI_CHARACTER, { is_owner: false });
    expect(owner_snapshot.state).toContain("strike at dawn");
    expect(other_snapshot.state).not.toContain("strike at dawn");
    expect(other_snapshot.state).toContain("Calm.");
  });

  it("never strips fractal state (always-visible policy)", () => {
    const hidden_state = { ...test_fractal, present: { ...test_fractal.present, non_physical: "Still. [NOTE: sealed | hide]" } };
    const snapshot = resolve_sheet_snapshot(hidden_state, SHEET_SPECS.FRACTAL, { is_owner: false });
    expect(snapshot.state).toContain("sealed");
  });

  it("routes relational brackets out of state", () => {
    const snapshot = resolve_sheet_snapshot(test_character, SHEET_SPECS.AI_CHARACTER, { is_owner: true });
    expect(snapshot.state).toContain("Guarded vigilance.");
    expect(snapshot.state).not.toContain("@BOB");
  });

  it("resolves dispositions only for active participants", () => {
    const snapshot = resolve_sheet_snapshot(test_character, SHEET_SPECS.AI_CHARACTER, {
      show_dispositions: true,
      active_names: ["bob"],
      name_to_id: new Map([["bob", "BOB"]]),
    });
    expect(snapshot.dispositions).toContain("<DISPOSITIONS>");
    expect(snapshot.dispositions).toContain('target="BOB"');
    expect(snapshot.dispositions).toContain("guarded trust");
  });

  it("returns empty dispositions without an active roster", () => {
    const snapshot = resolve_sheet_snapshot(test_character, SHEET_SPECS.AI_CHARACTER, {});
    expect(snapshot.dispositions).toBe("");
  });

  it("freezes row arrays", () => {
    const snapshot = resolve_sheet_snapshot(test_character, SHEET_SPECS.AI_CHARACTER, {});
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.eternal_rows)).toBe(true);
    expect(snapshot.appearance_rows).toContain("<BUILD>tall and athletic</BUILD>");
    expect(snapshot.past_text).toBe("First memory.\nSecond memory.");
  });
});

describe("render_sheet full mode", () => {
  it("renders the AI character envelope with psychology, appearance, and memories", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, { entity: test_character, is_owner: true });
    expect(xml).toContain('<AI_CHARACTER id="ALICE" name="Alice">');
    expect(xml).toContain("<PSYCHOLOGY>");
    expect(xml).toContain("<APPEARANCE>");
    expect(xml).toContain("<BUILD>tall and athletic</BUILD>");
    expect(xml).toContain("Infiltrate the mainframe.");
    expect(xml).toContain("First memory.");
    expect(xml).toContain("</AI_CHARACTER>");
  });

  it("renders the fractal envelope", () => {
    const xml = render_sheet(SHEET_SPECS.FRACTAL, { entity: test_fractal, is_owner: true });
    expect(xml).toContain('<FRACTAL id="SECTOR_FOUR" name="Sector Four">');
    expect(xml).toContain("<LANDMARKS>rusted catwalks</LANDMARKS>");
    expect(xml).toContain("Decay under acid rain.");
  });

  it("renders USER_PERSONA with a BACKSTORY tag", () => {
    const xml = render_sheet(SHEET_SPECS.USER_PERSONA, { entity: { ...test_character, id: "BOB", name: "Bob" } });
    expect(xml).toContain("<USER_PERSONA");
    expect(xml).toContain("<BACKSTORY>");
  });

  it("suppresses agenda and memories when excluded", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, { entity: test_character, include_agenda: false, include_memories: false });
    expect(xml).not.toContain("Infiltrate the mainframe.");
    expect(xml).not.toContain("First memory.");
    expect(xml).toContain("<PSYCHOLOGY>");
  });

  it("returns empty for a missing entity", () => {
    expect(render_sheet(SHEET_SPECS.AI_CHARACTER, {})).toBe("");
  });
});

describe("render_sheet physical / separate modes", () => {
  it("renders visual-only separate blocks in physical mode", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, { entity: test_character, mode: "physical" });
    expect(xml).toContain('<AI_CHARACTER id="ALICE" name="Alice">');
    expect(xml).toContain("<APPEARANCE>");
    expect(xml).toContain("<CURRENT_LOOK>");
    expect(xml).toContain("<JACKET>worn leather</JACKET>");
    expect(xml).not.toContain("<PSYCHOLOGY>");
  });

  it("renders the full envelope with separate blocks in separate mode", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, { entity: test_character, mode: "separate", is_owner: true });
    expect(xml).toContain("<AI_CHARACTER");
    expect(xml).toContain("<PSYCHOLOGY>");
    expect(xml).toContain("<CURRENT_LOOK>");
    expect(xml).not.toContain("<BUILD>tall and athletic</BUILD>\n  <JACKET>");
  });

  it("applies the physical transform in every mode", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, {
      entity: test_character,
      mode: "physical",
      transform_physical: (value) => String(value).replace("worn leather", "scrap plate"),
    });
    expect(xml).toContain("scrap plate");
  });
});

describe("render_entity_memory_context", () => {
  it("renders an owner-view separate sheet", () => {
    const xml = render_entity_memory_context("AI_CHARACTER", test_character);
    expect(xml).toContain("<AI_CHARACTER");
    expect(xml).toContain("<CURRENT_LOOK>");
    expect(xml).toContain("Infiltrate the mainframe.");
  });

  it("returns empty for a missing entity", () => {
    expect(render_entity_memory_context("AI_CHARACTER", null)).toBe("");
  });
});

describe("render_enhancement_field_context", () => {
  it("renders sibling context for physical fields", () => {
    const xml = render_enhancement_field_context(test_character, "present.physical");
    expect(xml).toContain("<ENTITY_CONTEXT>");
    expect(xml).toContain("<STATE_OF_MIND>");
    expect(xml).toContain("Guarded vigilance.");
    expect(xml).toContain("<BUILD>tall and athletic</BUILD>");
  });

  it("renders the eternal sibling for eternal physical fields", () => {
    const xml = render_enhancement_field_context(test_character, "eternal.physical");
    expect(xml).toContain("Analytical cybernetic specialist.");
  });

  it("renders past vectors for the past field", () => {
    const xml = render_enhancement_field_context(test_character, "past");
    expect(xml).toContain("<ENTITY_CONTEXT>");
    expect(xml).toContain("First memory.");
  });

  it("renders future text for the future field", () => {
    const xml = render_enhancement_field_context(test_character, "future");
    expect(xml).toContain("Infiltrate the mainframe.");
  });

  it("returns empty for unknown fields and missing entities", () => {
    expect(render_enhancement_field_context(test_character, "name")).toBe("");
    expect(render_enhancement_field_context(null, "past")).toBe("");
  });
});
