/**
 * src/data/ledger.test.js
 * 🧪 TESTS FOR MUTATION LEDGER & EVENT-SOURCING ACCESS LAYER
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";

describe("mutation ledger persistence & replay", () => {
  beforeEach(async () => {
    try {
      const { db } = await import("./db.js");
      db.close();
    } catch (err) {
      void err;
    }
    vi.resetModules();
    const Dexie = (await import("dexie")).default;
    await Dexie.delete("rpglitch");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  }, 15000);

  afterEach(async () => {
    try {
      const { db } = await import("./db.js");
      db.close();
    } catch (err) {
      void err;
    }
    vi.restoreAllMocks();
  });

  it("appends and queries discrete ledger entries", async () => {
    const { append_ledger_entry, query_entity_history } = await import("./ledger.js");

    const row_id = await append_ledger_entry({
      story_id: "story_123",
      round: 1,
      seq: 1,
      turn_id: "turn_1",
      entity_id: "char_mira",
      field: "present.physical",
      key: "OUTFIT",
      old_value: null,
      new_value: "red cloak",
      writer: "continuum",
    });

    expect(row_id).toBeGreaterThan(0);

    const history = await query_entity_history("char_mira", "present.physical");
    expect(history).toHaveLength(1);
    expect(history[0].key).toBe("OUTFIT");
    expect(history[0].new_value).toBe("red cloak");
    expect(history[0].writer).toBe("continuum");
  });

  it("replays entity field states correctly with supersession and clearing", async () => {
    const { append_ledger_entries, replay_entity_field } = await import("./ledger.js");

    await append_ledger_entries([
      {
        story_id: "story_123",
        round: 1,
        seq: 1,
        entity_id: "char_mira",
        field: "present.non_physical",
        key: "@ORION",
        new_value: "wary alliance",
        writer: "continuum",
      },
      {
        story_id: "story_123",
        round: 2,
        seq: 1,
        entity_id: "char_mira",
        field: "present.non_physical",
        key: "@ORION",
        old_value: "wary alliance",
        new_value: "trusted companion",
        writer: "continuum",
      },
      {
        story_id: "story_123",
        round: 3,
        seq: 1,
        entity_id: "char_mira",
        field: "present.non_physical",
        key: "@ORION",
        new_value: null, // cleared
        writer: "user",
      },
      {
        story_id: "story_123",
        round: 2,
        seq: 2,
        entity_id: "char_mira",
        field: "present.non_physical",
        key: "MOOD",
        new_value: "cautious",
        writer: "continuum",
      },
    ]);

    // Replay at round 1
    const state_r1 = await replay_entity_field("char_mira", "present.non_physical", 1);
    expect(state_r1.key_values.get("@ORION")).toBe("wary alliance");
    expect(state_r1.key_values.has("MOOD")).toBe(false);

    // Replay at round 2
    const state_r2 = await replay_entity_field("char_mira", "present.non_physical", 2);
    expect(state_r2.key_values.get("@ORION")).toBe("trusted companion");
    expect(state_r2.key_values.get("MOOD")).toBe("cautious");

    // Replay at round 3 (cleared)
    const state_r3 = await replay_entity_field("char_mira", "present.non_physical", 3);
    expect(state_r3.key_values.has("@ORION")).toBe(false);
    expect(state_r3.key_values.get("MOOD")).toBe("cautious");
  });

  it("filters snapshot entries by max round and sequence", async () => {
    const { append_ledger_entries, query_story_snapshot } = await import("./ledger.js");

    await append_ledger_entries([
      { story_id: "s1", round: 1, seq: 1, entity_id: "e1", field: "past" },
      { story_id: "s1", round: 1, seq: 2, entity_id: "e2", field: "past" },
      { story_id: "s1", round: 2, seq: 1, entity_id: "e1", field: "future" },
      { story_id: "s2", round: 1, seq: 1, entity_id: "e3", field: "past" },
    ]);

    const snapshot = await query_story_snapshot("s1", 1, 1);
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].entity_id).toBe("e1");
  });

  it("skips duplicate writes with identical values and flags (dedup guard)", async () => {
    const { append_ledger_entry, append_ledger_entries, query_entity_history } = await import("./ledger.js");

    const row_1 = await append_ledger_entry({
      story_id: "s_dedup",
      round: 1,
      seq: 1,
      entity_id: "char_mira",
      field: "present.non_physical",
      key: "@ORION",
      old_value: "steady ally",
      new_value: "steady ally", // Identical -> should skip
    });

    expect(row_1).toBeNull();

    // Verify append_ledger_entries skips identical batches
    await append_ledger_entries([
      {
        story_id: "s_dedup",
        round: 1,
        seq: 1,
        entity_id: "char_mira",
        field: "present.non_physical",
        key: "@ORION",
        old_value: "steady ally",
        new_value: "steady ally",
      },
      {
        story_id: "s_dedup",
        round: 1,
        seq: 1,
        entity_id: "char_mira",
        field: "present.non_physical",
        key: "@ORION",
        old_value: "steady ally",
        new_value: "fierce guardian", // Changed -> should persist
      },
    ]);

    const history = await query_entity_history("char_mira", "present.non_physical");
    expect(history).toHaveLength(1);
    expect(history[0].new_value).toBe("fierce guardian");
  });

  it("restores visibility and weight flags in replay_entity_field", async () => {
    const { append_ledger_entries, replay_entity_field } = await import("./ledger.js");

    await append_ledger_entries([
      {
        story_id: "s_flags",
        round: 1,
        seq: 1,
        entity_id: "char_mira",
        field: "present.non_physical",
        key: "@BENEDICT",
        new_value: "covert informant",
        visibility: "hide",
        weight: 8,
        writer: "director",
        decider: "director",
      },
      {
        story_id: "s_flags",
        round: 1,
        seq: 1,
        entity_id: "char_mira",
        field: "present.non_physical",
        key: "DAGGER",
        new_value: "stiletto",
        visibility: "hide",
        writer: "user",
      },
    ]);

    const replayed = await replay_entity_field("char_mira", "present.non_physical");
    expect(replayed.reconstructed_brackets).toContain("[@BENEDICT: covert informant | hide w:8]");
    expect(replayed.reconstructed_brackets).toContain("[DAGGER: stiletto | hide]");
  });

  it("preserves un-mutated Round 0 Genesis brackets when replaying subsequent single-key updates", async () => {
    const { append_ledger_entries, replay_entity_field, replay_full_entity_at_round } = await import("./ledger.js");

    // Round 0 Genesis: full bracket string written with key: null
    await append_ledger_entries([
      {
        story_id: "s_genesis",
        round: 0,
        seq: 0,
        entity_id: "char_mira",
        field: "present.physical",
        key: null,
        old_value: null,
        new_value: "[SHIRT: white silk] [PANTS: black leather] [BOOTS: riding boots | w:7]",
        writer: "genesis",
        decider: "genesis",
      },
      // Round 1: single-key mutation overwriting only SHIRT
      {
        story_id: "s_genesis",
        round: 1,
        seq: 1,
        entity_id: "char_mira",
        field: "present.physical",
        key: "SHIRT",
        old_value: "white silk",
        new_value: "torn tunic",
        writer: "director",
        decider: "director",
      },
    ]);

    const replayed = await replay_entity_field("char_mira", "present.physical");
    expect(replayed.key_values.get("SHIRT")).toBe("torn tunic");
    expect(replayed.key_values.get("PANTS")).toBe("black leather");
    expect(replayed.key_values.get("BOOTS")).toBe("riding boots");
    expect(replayed.entries_map.get("BOOTS")?.weight).toBe(7);

    expect(replayed.reconstructed_brackets).toContain("[SHIRT: torn tunic]");
    expect(replayed.reconstructed_brackets).toContain("[PANTS: black leather]");
    expect(replayed.reconstructed_brackets).toContain("[BOOTS: riding boots | w:7]");

    const full_profile = await replay_full_entity_at_round("char_mira", 1);
    expect(full_profile.present.physical).toContain("[SHIRT: torn tunic]");
    expect(full_profile.present.physical).toContain("[PANTS: black leather]");
    expect(full_profile.present.physical).toContain("[BOOTS: riding boots | w:7]");
  });
});
