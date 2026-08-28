/**
 * src/data/sessions.test.js
 * Unit tests for session_driver and create_from_selection auto-roster seeding.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { db, init } from "./db.js";
import { session_driver } from "./sessions.svelte.js";

describe("sessions.svelte.js session_driver", () => {
  beforeEach(async () => {
    try {
      db.close();
    } catch (err) {
      void err;
    }
    await Dexie.delete("rpglitch");
    await init();
  });

  afterEach(async () => {
    try {
      db.close();
    } catch (err) {
      void err;
    }
    vi.restoreAllMocks();
  });

  it("seeds wanderer NPCs and bidirectional fractal bonds into story.npc_ids upon create_from_selection", async () => {
    // Seed fractal
    const fractal = {
      id: "ashenweald",
      name: "Ashenweald",
      type: "fractal",
      relationships: ["Ashenweald → Hank: Old wanderer sits at the tavern"],
      dynamics: { velocity: 50, entropy: 50 },
    };
    await db.entities.put(fractal);

    // Seed wanderer character
    const wanderer = {
      id: "hank",
      name: "Hank",
      type: "character",
      is_wanderer: true,
      relationships: [],
    };
    await db.entities.put(wanderer);

    // Seed connected character (via character's outgoing relationship to fractal)
    const forest_guardian = {
      id: "guardian",
      name: "Guardian",
      type: "character",
      is_wanderer: false,
      relationships: ["Guardian → Ashenweald: Protects the heart tree"],
    };
    await db.entities.put(forest_guardian);

    // Seed unconnected character
    const unconnected = {
      id: "space_trader",
      name: "Trader",
      type: "character",
      is_wanderer: false,
      relationships: [],
    };
    await db.entities.put(unconnected);

    const session_id = await session_driver.create_from_selection({
      story_title: "Dark Journey",
      ai_id: "valerius",
      user_id: "caelum",
      fractal_id: "ashenweald",
    });

    expect(session_id).toBeDefined();

    const created_story = await db.stories.get(Number(session_id) || session_id);
    expect(created_story).toBeDefined();
    expect(created_story.npc_ids).toContain("hank");
    expect(created_story.npc_ids).toContain("guardian");
    expect(created_story.npc_ids).not.toContain("space_trader");
  });
});
