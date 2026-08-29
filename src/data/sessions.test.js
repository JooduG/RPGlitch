/**
 * src/data/sessions.test.js
 * Unit tests for session_driver, active session state, simulation log operations, and create_from_selection auto-roster seeding.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { db, init_db } from "./db.js";
import { session_driver, SESSION_ID_KEY } from "./sessions.svelte.js";

describe("sessions.svelte.js session_driver", () => {
  beforeEach(async () => {
    try {
      db.close();
    } catch (error) {
      void error;
    }
    await Dexie.delete("rpglitch");
    await init_db();
  });

  afterEach(async () => {
    try {
      db.close();
    } catch (error) {
      void error;
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

  it("manages active session pointer across set_active, restore_active, require_active, and clear_active", async () => {
    await session_driver.set_active("test_story_123");
    expect(session_driver.active_id).toBe("test_story_123");
    expect(session_driver.require_active()).toBe("test_story_123");

    const saved_setting = await db.kv_settings.get(SESSION_ID_KEY);
    expect(saved_setting?.value).toBe("test_story_123");

    session_driver.restore_active("restored_story_456");
    expect(session_driver.active_id).toBe("restored_story_456");

    await session_driver.clear_active();
    expect(session_driver.active_id).toBeNull();
    expect(() => session_driver.require_active()).toThrow("[Session] No active session found.");
  });

  it("performs simulation log CRUD operations and handles attachment lifecycle", async () => {
    await session_driver.set_active("log_test_story");

    // 1. Log message
    const entry = await session_driver.log_message("Hello world", "user", "Hero", {
      attachments: [{ type: "image", url: "https://example.com/art.png" }],
    });
    expect(entry.id).toBeDefined();

    // 2. Load log
    let logs = await session_driver.load_log("log_test_story");
    expect(logs.length).toBe(1);
    expect(logs[0].text).toBe("Hello world");
    expect(logs[0].attachments.length).toBe(1);

    // 3. Edit log entry
    await session_driver.edit_log_entry(entry.id, "Hello modified");
    logs = await session_driver.load_log("log_test_story");
    expect(logs[0].text).toBe("Hello modified");

    // 4. Update attachment
    await session_driver.update_log_attachment(entry.id, 0, { type: "image", url: "https://example.com/new_art.png" });
    logs = await session_driver.load_log("log_test_story");
    expect(logs[0].attachments[0].url).toBe("https://example.com/new_art.png");

    // 5. Delete attachment
    await session_driver.delete_log_attachment(entry.id, 0);
    logs = await session_driver.load_log("log_test_story");
    expect(logs[0].attachments.length).toBe(0);

    // 6. Delete log entry
    await session_driver.delete_log_entry(entry.id);
    logs = await session_driver.load_log("log_test_story");
    expect(logs.length).toBe(0);
  });
});
