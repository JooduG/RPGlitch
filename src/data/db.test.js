/**
 * @file src/data/db.test.js
 * Unit tests for Dexie premade seeding (entities + premade story history & ledger).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { active_entity_ids, db, seed_premades } from "./db.js";
import { query_entity_history } from "./ledger.js";

describe("seed_premades", () => {
  beforeEach(async () => {
    await Promise.all([db.entities.clear(), db.stories.clear(), db.simulation_log.clear(), db.mutation_ledger.clear()]);
  });

  it("seeds starter entities and the 10-round Orion/Glitch/Nova story idempotently without claiming entities", async () => {
    await seed_premades();
    await seed_premades();

    const stories = await db.stories.toArray();
    expect(stories).toHaveLength(1);
    expect(stories[0]).toMatchObject({ premade_key: "orion-nova-glitch", ai_id: "orion", user_id: "glitch", fractal_id: "nova", round: 10, is_concluded: 1 });

    const story_id = String(stories[0].id);
    const logs = await db.simulation_log.where("story_id").equals(story_id).toArray();
    // STORY_START + 10 * (user + ai) + EPILOGUE = 22
    expect(logs).toHaveLength(22);

    const orion_history = await query_entity_history("orion");
    const glitch_history = await query_entity_history("glitch");
    const nova_history = await query_entity_history("nova");
    expect(orion_history.some((entry) => entry.round === 10)).toBe(true);
    expect(glitch_history.some((entry) => entry.round === 10)).toBe(true);
    expect(nova_history.some((entry) => entry.round === 8)).toBe(true);

    // Concluded premade story must not lock orion, glitch, or nova on Storyboard
    const claimed = await active_entity_ids();
    expect(claimed).not.toContain("orion");
    expect(claimed).not.toContain("glitch");
    expect(claimed).not.toContain("nova");
  });

  it("preserves user DB edits (including pov) on existing premades across subsequent boots", async () => {
    await seed_premades();
    await db.entities.update("orion", { pov: "3rd_person", signature_color: "Electric Cyan" });

    await seed_premades();

    const orion = await db.entities.get("orion");
    expect(orion?.pov).toBe("3rd_person");
    expect(orion?.signature_color).toBe("Electric Cyan");
  });
});
