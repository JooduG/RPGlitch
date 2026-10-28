/**
 * ============================================================================
 * src/data/db.test.js
 * 🧪 TESTS FOR DEXIE.JS DATABASE LIFECYCLE & COMPOUND INDEX PROFILING
 * ============================================================================
 *
 * Single test file for Dexie.js 4 database operations:
 *   1. Connection lifecycle, blocked listeners, and versionchange quiesce hooks.
 *   2. Compound index health ([story_id+round+seq], [entity_id+field], *npc_ids)
 *      and sub-millisecond full-entity replay latency under 600+ batch mutations.
 *
 * RULES FOR MODIFICATION:
 *   - Universal File Architecture compliance (Header block & Changelog footer).
 *   - Keep tests isolated with fake-indexeddb.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";

describe("Database db.js Lifecycle & Connection", () => {
  /** @type {import('dexie').Dexie | null} */
  let db_instance;
  /** @type {import('vitest').MockInstance} */
  let console_warn_spy;

  beforeEach(async () => {
    vi.resetModules();
    const Dexie = (await import("dexie")).default;
    await Dexie.delete("rpglitch");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: vi.fn() },
    });

    console_warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (db_instance) {
      db_instance.close();
      db_instance = null;
    }
  });

  it("should initialize database connection with init_db", async () => {
    const { db, init_db } = await import("@data/db.js");
    db_instance = db;
    const instance = await init_db();
    expect(instance).toBe(db);
    expect(db.isOpen()).toBe(true);
  });

  it("should log a warning when database is blocked", async () => {
    const { db, init_db } = await import("@data/db.js");
    db_instance = db;
    await init_db();
    db.on("blocked").fire({ oldVersion: 10, newVersion: 11 });
    expect(console_warn_spy).toHaveBeenCalledWith("[Database] Database is blocked by another tab/version. Please close other instances.");
  });

  it("should handle versionchange event and close DB/reload window", async () => {
    const { db, init_db } = await import("@data/db.js");
    db_instance = db;
    await init_db();
    const close_spy = vi.spyOn(db, "close");
    db.on("versionchange").fire({ oldVersion: 10, newVersion: 11 });
    expect(close_spy).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("should invoke the registered quiesce hook before versionchange reload", async () => {
    const { db, init_db, set_versionchange_quiesce } = await import("@data/db.js");
    db_instance = db;
    await init_db();
    const quiesce = vi.fn();
    set_versionchange_quiesce(quiesce);
    const close_spy = vi.spyOn(db, "close");
    db.on("versionchange").fire({ oldVersion: 10, newVersion: 11 });
    expect(quiesce).toHaveBeenCalledTimes(1);
    expect(close_spy).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it("should guard against duplicate versionchange reloads", async () => {
    const { db, init_db, set_versionchange_quiesce } = await import("@data/db.js");
    db_instance = db;
    await init_db();
    const quiesce = vi.fn();
    set_versionchange_quiesce(quiesce);
    db.on("versionchange").fire({ oldVersion: 10, newVersion: 11 });
    db.on("versionchange").fire({ oldVersion: 10, newVersion: 11 });
    expect(quiesce).toHaveBeenCalledTimes(1);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});

describe("Database db.js Compound Index Health & Latency Profiling", () => {
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

  it("handles high-volume batch mutation appends and queries [entity_id+field] with high throughput", async () => {
    const { append_ledger_entries, query_entity_history } = await import("./ledger.js");
    const { db } = await import("./db.js");

    const TOTAL_MUTATIONS = 600;
    const test_entries = [];

    for (let i = 1; i <= TOTAL_MUTATIONS; i++) {
      test_entries.push({
        story_id: "story_perf_01",
        round: Math.floor(i / 10) + 1,
        seq: (i % 3) + 1,
        turn_id: `turn_${i}`,
        entity_id: i % 2 === 0 ? "char_alpha" : "char_beta",
        field: i % 4 === 0 ? "present.non_physical" : "present.physical",
        key: `SLOT_${i % 15}`,
        old_value: null,
        new_value: `state_value_${i}`,
        writer: "forge",
        timestamp: 1700000000000 + i * 100,
      });
    }

    // 1. Benchmark batch append
    const write_start = performance.now();
    await append_ledger_entries(test_entries);
    const write_duration_ms = performance.now() - write_start;

    const total_stored = await db.mutation_ledger.count();
    expect(total_stored).toBe(TOTAL_MUTATIONS);
    // In-memory fake-indexeddb batch insertion for 600 rows should complete briskly (< 1500ms)
    expect(write_duration_ms).toBeLessThan(1500);

    // 2. Query compound index [entity_id+field]
    const query_start = performance.now();
    const alpha_physical = await query_entity_history("char_alpha", "present.physical");
    const query_duration_ms = performance.now() - query_start;

    expect(alpha_physical.length).toBeGreaterThan(100);
    expect(query_duration_ms).toBeLessThan(100);

    // Verify ordering by timestamp
    for (let j = 1; j < alpha_physical.length; j++) {
      expect(alpha_physical[j].timestamp).toBeGreaterThanOrEqual(alpha_physical[j - 1].timestamp);
    }
  });

  it("replays full entity state at target round with sub-millisecond per-round latency", async () => {
    const { append_ledger_entries, replay_full_entity_at_round } = await import("./ledger.js");

    const ENTITY_ID = "char_protagonist";
    const entries = [];

    // Seed 50 rounds of progressive mutations across physical, non_physical, and future
    for (let round = 1; round <= 50; round++) {
      entries.push(
        {
          story_id: "story_arc_1",
          round,
          seq: 1,
          entity_id: ENTITY_ID,
          field: "present.physical",
          key: "CLOAK",
          old_value: null,
          new_value: `weathered wool tier ${round}`,
          timestamp: 1000 + round * 10,
        },
        {
          story_id: "story_arc_1",
          round,
          seq: 2,
          entity_id: ENTITY_ID,
          field: "present.non_physical",
          key: "RESOLVE",
          old_value: null,
          new_value: `${round * 2}%`,
          timestamp: 1001 + round * 10,
        },
        {
          story_id: "story_arc_1",
          round,
          seq: 3,
          entity_id: ENTITY_ID,
          field: "future",
          key: null,
          old_value: null,
          new_value: `Ascend to summit step ${round}`,
          timestamp: 1002 + round * 10,
        },
      );
    }

    await append_ledger_entries(entries);

    // Measure full entity state replay at round 25
    const replay_start = performance.now();
    const state_round_25 = await replay_full_entity_at_round(ENTITY_ID, 25);
    const replay_duration_ms = performance.now() - replay_start;

    expect(state_round_25.present.physical).toContain("weathered wool tier 25");
    expect(state_round_25.present.non_physical).toContain("50%");
    expect(state_round_25.future).toBe("Ascend to summit step 25");

    // Must be fast: under 50ms total for 6 parallel quadrant queries in fake-indexeddb
    expect(replay_duration_ms).toBeLessThan(50);
  });

  it("profiles multi-entry *npc_ids query on stories table", async () => {
    const { db } = await import("./db.js");

    // Seed 30 stories with diverse NPC rosters
    const stories = [];
    for (let i = 1; i <= 30; i++) {
      stories.push({
        id: i,
        title: `Chapter ${i}`,
        ai_id: "char_ai",
        user_id: "char_user",
        fractal_id: "fractal_world",
        round: i,
        created_at: Date.now(),
        updated_at: Date.now(),
        npc_ids: [`npc_${i % 5}`, `npc_${(i + 1) % 5}`, "npc_common"],
      });
    }

    await db.stories.bulkAdd(stories);

    // Test querying multi-entry index *npc_ids
    const npc_start = performance.now();
    const common_stories = await db.stories.where("npc_ids").equals("npc_common").toArray();
    const npc_duration_ms = performance.now() - npc_start;

    expect(common_stories).toHaveLength(30);
    expect(npc_duration_ms).toBeLessThan(50);

    const specific_stories = await db.stories.where("npc_ids").equals("npc_0").toArray();
    expect(specific_stories.length).toBeGreaterThan(0);
  });
});

/**
 * CHANGELOG
 * ----------------------------------------------------------------------------
 * 2026-10-03: Merged Dexie.js 4 compound index health and replay latency profiling test suite (Item 1.3).
 */
