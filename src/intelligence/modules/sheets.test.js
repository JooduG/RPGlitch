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
  parse_profile_field_rows,
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
    expect(SHEET_SPECS.USER_PERSONA.epistemic.state).toBe(EPISTEMIC_POLICY.OWNER);
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
  it("expands short bracket entries into compacted attribute rows and long entries (> 40 chars) into tag rows", () => {
    expect(parse_physical_rows("[BUILD: tall] [POSTURE: alert]")).toEqual(['build="tall"', 'posture="alert"']);
    expect(parse_physical_rows("[SCARS: Deep cybernetic scarring running from left temple across jawline]")).toEqual([
      "<SCARS>Deep cybernetic scarring running from left temple across jawline</SCARS>",
    ]);
  });

  it("passes prose through as a single escaped row", () => {
    expect(parse_physical_rows("Tall and athletic <b>frame</b>.")).toEqual(["Tall and athletic &lt;b&gt;frame&lt;/b&gt;."]);
  });

  it("returns no rows for blank input", () => {
    expect(parse_physical_rows("")).toEqual([]);
    expect(parse_physical_rows(null)).toEqual([]);
  });

  it("merges eternal and present with present winning in place", () => {
    const merged = render_appearance_rows(['build="tall"', 'jacket="leather"'], ['build="broad"']);
    expect(merged).toEqual(['build="broad"', 'jacket="leather"']);
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

  it("enforces epistemic-first sequencing: strips hidden secrets before macro expansion in past and future", () => {
    const bob = {
      id: "BOB",
      name: "Bob",
      type: "character",
      future: "Public agenda. [SECRET: poisoned dagger in @ME boot | hide]",
      past: [{ content: "Public past. [CONCEALED: betrayed by @YOU | hide]" }],
    };
    const other_snapshot = resolve_sheet_snapshot(bob, SHEET_SPECS.AI_CHARACTER, {
      is_owner: false,
      entities: { USER: { id: "ALICE", name: "Alice" }, AI: bob },
    });
    expect(other_snapshot.agenda).toBe("Public agenda.");
    expect(other_snapshot.past_text).toBe("Public past.");

    // Owner sees them with macros resolved
    const owner_snapshot = resolve_sheet_snapshot(bob, SHEET_SPECS.AI_CHARACTER, {
      is_owner: true,
      entities: { USER: { id: "ALICE", name: "Alice" }, AI: bob },
    });
    expect(owner_snapshot.agenda).toContain("poisoned dagger in Bob boot");
    expect(owner_snapshot.past_text).toContain("betrayed by Alice");
  });

  it("preserves relational brackets natively in state", () => {
    const snapshot = resolve_sheet_snapshot(test_character, SHEET_SPECS.AI_CHARACTER, { is_owner: true });
    expect(snapshot.state).toContain("Guarded vigilance.");
    expect(snapshot.state).toContain("[@BOB: guarded trust]");
  });

  it("freezes row arrays", () => {
    const snapshot = resolve_sheet_snapshot(test_character, SHEET_SPECS.AI_CHARACTER, {});
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.eternal_rows)).toBe(true);
    expect(snapshot.appearance_rows).toContain('build="tall and athletic"');
    expect(snapshot.past_text).toBe("First memory.\nSecond memory.");
  });
});

describe("render_sheet full mode", () => {
  it("renders the AI character envelope with psychology, appearance, and memories", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, { entity: test_character, is_owner: true });
    expect(xml).toContain('<CHARACTER id="alice" name="Alice">');
    expect(xml).toContain("<PSYCHOLOGY>");
    expect(xml).toContain('<APPEARANCE build="tall and athletic" jacket="worn leather" posture="alert" />');
    expect(xml).toContain("Infiltrate the mainframe.");
    expect(xml).toContain("First memory.");
    expect(xml).toContain("</CHARACTER>");
    expect(xml).not.toContain("<AI_CHARACTER");
  });

  it("renders the fractal envelope", () => {
    const xml = render_sheet(SHEET_SPECS.FRACTAL, { entity: test_fractal, is_owner: true });
    expect(xml).toContain('<FRACTAL id="sector_four" name="Sector Four">');
    expect(xml).toContain('landmarks="rusted catwalks"');
    expect(xml).toContain("Decay under acid rain.");
  });

  it("renders USER_PERSONA with universal CHARACTER envelope and a BACKSTORY tag", () => {
    const xml = render_sheet(SHEET_SPECS.USER_PERSONA, { entity: { ...test_character, id: "BOB", name: "Bob" } });
    expect(xml).toContain('<CHARACTER id="bob" name="Bob">');
    expect(xml).not.toContain("<USER_PERSONA");
    expect(xml).toContain("<BACKSTORY>");
  });

  it("suppresses agenda and memories when excluded", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, { entity: test_character, include_agenda: false, include_memories: false });
    expect(xml).not.toContain("Infiltrate the mainframe.");
    expect(xml).not.toContain("First memory.");
    expect(xml).toContain("<PSYCHOLOGY>");
  });

  it("renders relational brackets natively inside field envelopes and preserves unbracketed prose", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, {
      entity: test_character,
      is_owner: true,
      name_to_id: new Map([["bob", "BOB"]]),
    });
    expect(xml).toContain("Guarded vigilance.");
    expect(xml).toContain('<RELATION target="bob">guarded trust</RELATION>');
    expect(xml).not.toContain("[@BOB: guarded trust]");
    expect(xml).not.toContain("<DISPOSITION");
  });

  it("returns empty for a missing entity", () => {
    expect(render_sheet(SHEET_SPECS.AI_CHARACTER, {})).toBe("");
  });
});

describe("parse_profile_field_rows and relational rendering", () => {
  const entity_with_relations = {
    id: "ALICE",
    name: "Alice",
    present: {
      non_physical: "Watchful. [@BOB: immediate tactical ally] [@EVE: concealed rival | hide]",
    },
    eternal: {
      non_physical: "Veteran soldier. [@CHARLIE: old squad commander]",
    },
  };
  const active_map = new Map([
    ["bob", "BOB"],
    ["eve", "EVE"],
    ["charlie", "CHARLIE"],
  ]);

  it("parses unbracketed prose and formats canonical relation target", () => {
    const rows = parse_profile_field_rows(entity_with_relations.present.non_physical, entity_with_relations, null, null, null, active_map);
    expect(rows).toContain("Watchful.");
    expect(rows).toContain('<RELATION target="bob">immediate tactical ally</RELATION>');
    expect(rows).toContain('<RELATION target="eve">concealed rival | hide</RELATION>');
  });

  it("enforces Epistemic Wall in snapshot: strips hidden relations for other observers", () => {
    const state_xml = render_sheet(SHEET_SPECS.AI_CHARACTER, {
      entity: entity_with_relations,
      is_owner: false,
      name_to_id: active_map,
    });
    expect(state_xml).toContain('<RELATION target="bob">immediate tactical ally</RELATION>');
    expect(state_xml).not.toContain("concealed rival");
    expect(state_xml).not.toContain('target="eve"');
  });

  it("preserves hidden relations for owner perspective in snapshot", () => {
    const state_xml = render_sheet(SHEET_SPECS.AI_CHARACTER, {
      entity: entity_with_relations,
      is_owner: true,
      name_to_id: active_map,
    });
    expect(state_xml).toContain('<RELATION target="bob">immediate tactical ally</RELATION>');
    expect(state_xml).toContain('<RELATION target="eve">concealed rival | hide</RELATION>');
  });

  it("resolves @USER relation to entities.USER.id and strips | show and | w:10 flags", () => {
    const context_entities = {
      USER: { id: "JULIEN", name: "Julien the Banished Prince" },
    };
    const rows = parse_profile_field_rows("[@USER: submitted to royal authority | show | w:10]", null, context_entities);
    expect(rows).toEqual(['<RELATION target="julien">submitted to royal authority</RELATION>']);
  });
});

describe("render_sheet physical / separate modes", () => {
  it("renders visual-only separate blocks in physical mode with compacted attributes", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, { entity: test_character, mode: "physical" });
    expect(xml).toContain('<CHARACTER id="alice" name="Alice">');
    expect(xml).toContain('<APPEARANCE build="tall and athletic" />');
    expect(xml).toContain('<CURRENT_LOOK jacket="worn leather" posture="alert" />');
    expect(xml).not.toContain("<PSYCHOLOGY>");
  });

  it("renders the full envelope with separate blocks in separate mode", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, { entity: test_character, mode: "separate", is_owner: true });
    expect(xml).toContain('<CHARACTER id="alice" name="Alice">');
    expect(xml).toContain("<PSYCHOLOGY>");
    expect(xml).toContain('<CURRENT_LOOK jacket="worn leather" posture="alert" />');
  });

  it("compacts short biometrics into attributes and expands long biometrics (> 40 chars) into child elements", () => {
    const complex_char = {
      id: "GLITCH",
      name: "Glitch",
      type: "character",
      eternal: {
        physical: "[EYES: amber] [SCARS: Deep cybernetic scarring running from left temple across the jawline to collarbone]",
      },
      present: {
        physical: "[JACKET: worn duster]",
      },
    };
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, { entity: complex_char, mode: "separate" });
    expect(xml).toContain('<APPEARANCE eyes="amber">');
    expect(xml).toContain("<SCARS>Deep cybernetic scarring running from left temple across the jawline to collarbone</SCARS>");
    expect(xml).toContain("</APPEARANCE>");
    expect(xml).toContain('<CURRENT_LOOK jacket="worn duster" />');
  });

  it("applies the physical transform in every mode", () => {
    const xml = render_sheet(SHEET_SPECS.AI_CHARACTER, {
      entity: test_character,
      mode: "physical",
      transform_physical: (value) => String(value).replace("worn leather", "scrap plate"),
    });
    expect(xml).toContain('jacket="scrap plate"');
  });
});

describe("render_entity_memory_context", () => {
  it("renders an owner-view separate sheet with CHARACTER envelope", () => {
    const xml = render_entity_memory_context("AI_CHARACTER", test_character);
    expect(xml).toContain('<CHARACTER id="alice" name="Alice">');
    expect(xml).not.toContain("<AI_CHARACTER");
    expect(xml).toContain('<CURRENT_LOOK jacket="worn leather" posture="alert" />');
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
    expect(xml).toContain('build="tall and athletic"');
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
