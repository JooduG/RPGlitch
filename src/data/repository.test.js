import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";

describe("entity embedding persistence", () => {
  beforeEach(async () => {
    vi.resetModules();
    const Dexie = (await import("dexie")).default;
    await Dexie.delete("rpglitch");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
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

  it("hydrates the legacy JSON-flattened embedding object form", async () => {
    const { db, init } = await import("./db.js");
    await init();
    const { entities } = await import("./repository.js");
    const legacy_embedding = Object.fromEntries(Array.from({ length: 384 }, (_, i) => [i, i / 384]));
    const entity = make_entity("char-legacy");
    entity.past = [{ id: "lp1", timestamp: 1, content: "m", type: "past", emotional_weight: 5, meta: {}, _embedding: legacy_embedding }];

    await db.entities.put(entity);
    const loaded = await entities.get("character", "char-legacy");

    expect(loaded.past[0]._embedding).toBeInstanceOf(Float32Array);
    expect(loaded.past[0]._embedding.length).toBe(384);
    expect(loaded.past[0]._embedding[0]).toBeCloseTo(0);
    expect(loaded.past[0]._embedding[383]).toBeCloseTo(383 / 384, 4);
  });

  it("drops corrupt embeddings so callers re-infer", async () => {
    const { db, init } = await import("./db.js");
    await init();
    const { entities } = await import("./repository.js");
    const entity = make_entity("char-bad");
    entity.past = [{ id: "bp1", timestamp: 1, content: "m", type: "past", emotional_weight: 5, meta: {}, _embedding: { 0: "nope" } }];

    await db.entities.put(entity);
    const loaded = await entities.get("character", "char-bad");

    expect(loaded.past[0]._embedding).toBeUndefined();
  });

  it("stores embeddings as JSON-safe arrays in the database record", async () => {
    const { db, init } = await import("./db.js");
    await init();
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
