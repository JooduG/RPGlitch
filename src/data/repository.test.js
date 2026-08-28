import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";

describe("entity embedding persistence", () => {
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

  function make_entity(id) {
    return {
      id,
      type: "character",
      name: "Caelum",
      description: "",
      eternal: { physical: "", non_physical: "" },
      present: { physical: "", non_physical: "" },
      past: [],
      future: [],
      dynamics: {},
      voice: { rate: 1 },
    };
  }

  it("round-trips vector embeddings through upsert and get as Float32Array", async () => {
    const { entities } = await import("./repository.js");
    const embedding = new Float32Array(384);
    embedding[0] = 0.75;
    embedding[383] = -0.25;
    const entity = make_entity("char-1");
    entity.past = [{ id: "p1", timestamp: 1, content: "mem", type: "past", emotional_weight: 5, meta: {}, _embedding: embedding }];

    await entities.upsert("character", entity);
    const loaded = await entities.get("character", "char-1");

    expect(loaded.past).toHaveLength(1);
    expect(loaded.past[0]._embedding).toBeInstanceOf(Float32Array);
    expect(loaded.past[0]._embedding.length).toBe(384);
    expect(loaded.past[0]._embedding[0]).toBeCloseTo(0.75);
    expect(loaded.past[0]._embedding[383]).toBeCloseTo(-0.25);
  });

  it("drops corrupt embeddings so callers re-infer", async () => {
    const { db, init_db } = await import("./db.js");
    await init_db();
    const { entities } = await import("./repository.js");
    const entity = make_entity("char-bad");
    entity.past = [{ id: "bp1", timestamp: 1, content: "m", type: "past", emotional_weight: 5, meta: {}, _embedding: { 0: "nope" } }];

    await db.entities.put(entity);
    const loaded = await entities.get("character", "char-bad");

    expect(loaded.past[0]._embedding).toBeUndefined();
  });

  it("stores embeddings as JSON-safe arrays in the database record", async () => {
    const { db, init_db } = await import("./db.js");
    await init_db();
    const { entities } = await import("./repository.js");
    const embedding = new Float32Array(384);
    embedding[0] = 0.5;
    const entity = make_entity("char-json");
    entity.past = [{ id: "j1", timestamp: 1, content: "m", type: "past", emotional_weight: 5, meta: {}, _embedding: embedding }];

    await entities.upsert("character", entity);
    const raw = await db.entities.get("char-json");

    expect(Array.isArray(raw.past[0]._embedding)).toBe(true);
    expect(raw.past[0]._embedding.length).toBe(384);
    expect(raw.past[0]._embedding[0]).toBeCloseTo(0.5);
  });
});

describe("story entity claims", () => {
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

  it("claims entity ids from non-concluded stories and frees them on conclude", async () => {
    const { db, init_db } = await import("./db.js");
    await init_db();
    const { stories } = await import("./repository.js");

    const active = await db.stories.add({ title: "A", ai_id: "c1", user_id: "c2", fractal_id: "f1", round: 3, created_at: 1, updated_at: 1 });
    await db.stories.add({ title: "B", ai_id: "c3", user_id: "c4", fractal_id: "f2", is_concluded: 1, round: 5, created_at: 2, updated_at: 2 });

    const claimed = await stories.active_entity_ids();
    expect(claimed.sort()).toEqual(["c1", "c2", "f1"]);

    await stories.conclude(String(active));
    const after = await stories.active_entity_ids();
    expect(after).toEqual([]);
  });

  it("treats stories with an epilogue log entry as concluded (legacy signal)", async () => {
    const { db, init_db } = await import("./db.js");
    await init_db();
    const { stories } = await import("./repository.js");

    const id = await db.stories.add({ title: "Legacy", ai_id: "lx", user_id: "ly", fractal_id: "lz", round: 9, created_at: 1, updated_at: 1 });
    await db.simulation_log.add({ story_id: String(id), role: "fractal", type: "text", text: "...", meta: { is_epilogue: true }, created_at: 2 });

    const claimed = await stories.active_entity_ids();
    expect(claimed).toEqual([]);

    const list = await stories.list();
    expect(list.find((s) => s.id === id).state).toBe("concluded");
  });

  it("coerces string story ids for conclude and get", async () => {
    const { db, init_db } = await import("./db.js");
    await init_db();
    const { stories } = await import("./repository.js");

    const id = await db.stories.add({ title: "Coerce", ai_id: "x1", user_id: "x2", fractal_id: "x3", round: 1, created_at: 1, updated_at: 1 });
    await stories.conclude(String(id));

    const record = await stories.get(String(id));
    expect(record.is_concluded).toBe(1);
  });

  it("deletes a story's simulation log regardless of id form (numeric or string)", async () => {
    const { db, init_db } = await import("./db.js");
    await init_db();
    const { stories } = await import("./repository.js");

    const id = await db.stories.add({ title: "Delete Me", ai_id: "d1", user_id: "d2", fractal_id: "d3", round: 1, created_at: 1, updated_at: 1 });
    await db.simulation_log.add({ story_id: String(id), role: "fractal", type: "text", text: "one", created_at: 2 });
    await db.simulation_log.add({ story_id: String(id), role: "fractal", type: "text", text: "two", created_at: 3 });

    await stories.delete(id); // numeric id exactly as stories.list() returns it

    expect(
      await db.simulation_log
        .where("story_id")
        .anyOf([String(id), id])
        .count(),
    ).toBe(0);
    expect(await db.stories.get(id)).toBeUndefined();
  });
});

describe("stories.update_cast & world-cast npc_ids", () => {
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

  it("dedupes, trims, and persists the story's world-cast roster", async () => {
    const { db, init_db } = await import("./db.js");
    await init_db();
    const { stories } = await import("./repository.js");

    const id = await db.stories.add({ title: "Cast", ai_id: "c1", user_id: "c2", fractal_id: "f1", round: 1, created_at: 1, updated_at: 1 });

    await stories.update_cast(String(id), ["npc-elias", "  npc-elias ", "", "npc-mira", null, "npc-mira"]);
    const record = await stories.get(id);
    expect(record.npc_ids).toEqual(["npc-elias", "npc-mira"]);
  });

  it("coerces a non-array roster to an empty cast", async () => {
    const { db, init_db } = await import("./db.js");
    await init_db();
    const { stories } = await import("./repository.js");

    const id = await db.stories.add({ title: "Empty", ai_id: "c1", user_id: "c2", fractal_id: "f1", round: 1, created_at: 1, updated_at: 1 });
    await stories.update_cast(String(id), null);
    expect((await stories.get(id)).npc_ids).toEqual([]);
  });

  it("includes npc_ids in stories.list()", async () => {
    const { db, init_db } = await import("./db.js");
    await init_db();
    const { stories } = await import("./repository.js");

    const id = await db.stories.add({ title: "Listed", ai_id: "c1", user_id: "c2", fractal_id: "f1", round: 1, created_at: 1, updated_at: 1 });
    await stories.update_cast(String(id), ["npc-elias", "npc-mira"]);

    const list = await stories.list();
    const row = list.find((s) => s.id === id);
    expect(row.npc_ids).toEqual(["npc-elias", "npc-mira"]);
  });

  it("defaults npc_ids to [] for stories without a cast", async () => {
    const { db, init_db } = await import("./db.js");
    await init_db();
    const { stories } = await import("./repository.js");

    await db.stories.add({ title: "Lonely", ai_id: "c1", user_id: "c2", fractal_id: "f1", round: 1, created_at: 1, updated_at: 1 });
    const list = await stories.list();
    expect(list[0].npc_ids).toEqual([]);
  });

  it("normalizes premades fetched via fallback when not yet saved in DB", async () => {
    const { entities } = await import("./repository.js");
    const loaded = await entities.get("character", "orion");
    expect(loaded).toBeDefined();
    expect(loaded.id).toBe("orion");
    expect(loaded.type).toBe("character");
    expect(loaded.modifiers).toBeDefined();
    expect(loaded.modifiers.flipped).toBe(false);
    expect(loaded.chapters).toEqual([]);
  });
});
