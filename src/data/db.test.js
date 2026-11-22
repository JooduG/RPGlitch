/**
 * @file src/data/db.test.js
 * Unit tests for Dexie premade seeding and entity CRUD.
 */

import { ALL_PREMADES } from "@definitions";
import { beforeEach, describe, expect, it } from "vitest";
import { db, reset_database } from "./db.js";
import { entities, seed_premades } from "./entity-repository.js";

describe("seed_premades & entity-repository", () => {
  beforeEach(async () => {
    await Promise.all([db.entities.clear(), db.stories.clear(), db.simulation_log.clear()]);
  });

  it("seeds starter entities idempotently under concurrent calls", async () => {
    await Promise.all([seed_premades(), seed_premades()]);

    const stored = await db.entities.toArray();
    expect(stored).toHaveLength(ALL_PREMADES.length);
  });

  it("preserves user DB edits (including pov) on existing premades across subsequent boots", async () => {
    await seed_premades();
    await entities.update("orion", { pov: "3rd_person", signature_color: "Electric Cyan" });

    await seed_premades();

    const orion = await entities.get("orion");
    expect(orion?.pov).toBe("3rd_person");
    expect(orion?.signature_color).toBe("Electric Cyan");
  });

  it("resets all database tables cleanly on reset_database", async () => {
    await seed_premades();
    await db.stories.add({ title: "To Delete", round: 1 });
    expect(await db.entities.count()).toBeGreaterThan(0);
    expect(await db.stories.count()).toBeGreaterThan(0);

    await reset_database();
    expect(await db.entities.count()).toBe(0);
    expect(await db.stories.count()).toBe(0);
  });
});
