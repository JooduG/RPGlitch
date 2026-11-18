/**
 * @file src/state/chat.test.js
 * ChatLogStore + session_driver facade over real Dexie tables
 * (fake-indexeddb, mirroring src/data/session.test.js setup).
 */
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@data";
import { simulation_log, session_driver } from "./chat.svelte.js";

async function clear_all_tables() {
  await Promise.all([
    db.simulation_log.clear(),
    db.stories.clear(),
    db.entities.clear(),
    db.kv_settings.clear(),
    db.sessions.clear(),
    db.mutation_ledger.clear(),
  ]);
}

beforeEach(async () => {
  await db.open().catch(() => {});
  await clear_all_tables();
  simulation_log.clear();
  await session_driver.clear_active().catch(() => {});
});

describe("src/state/chat.svelte.js - ChatLogStore + session_driver", () => {
  it("owns a reactive feed array and nullable active_id", () => {
    expect(Array.isArray(simulation_log.feed)).toBe(true);
    expect(simulation_log.active_id == null).toBe(true);
  });

  it("set_active / clear_active round-trip the driver pointer with hooks", async () => {
    let hooked = null;
    session_driver.on_set_active = async (id) => {
      hooked = id;
    };
    await session_driver.set_active("story-1");
    expect(session_driver.active_id).toBe("story-1");
    expect(hooked).toBe("story-1");
    session_driver.on_set_active = null;
    await session_driver.clear_active();
    expect(session_driver.active_id).toBeNull();
    expect(simulation_log.feed).toEqual([]);
  });

  it("log_message persists and syncs the feed, delete_entry removes both", async () => {
    const story_id = await db.stories.add({ title: "Chat Test", ai_id: "ai-1", user_id: "u-1", fractal_id: "f-1", round: 0, created_at: 1, updated_at: 1 });
    await session_driver.set_active(String(story_id));
    const written = await session_driver.log_message("Hello feed", "user", "Tester", {});
    expect(written.id).toBeDefined();
    expect(simulation_log.feed.length).toBeGreaterThan(0);
    const found = simulation_log.feed.find((e) => String(e.id) === String(written.id));
    expect(found).toBeDefined();
    await session_driver.delete_log_entry(written.id);
    expect(simulation_log.feed.find((e) => String(e.id) === String(written.id))).toBeUndefined();
  });

  it("edit_entry updates text in DB and feed", async () => {
    const story_id = await db.stories.add({ title: "Chat Edit", ai_id: "ai-1", user_id: "u-1", fractal_id: "f-1", round: 0, created_at: 1, updated_at: 1 });
    await session_driver.set_active(String(story_id));
    const written = await session_driver.log_message("Before", "ai", "Beast", {});
    await session_driver.edit_log_entry(written.id, "After");
    const entry = simulation_log.feed.find((e) => String(e.id) === String(written.id));
    expect(entry.text).toBe("After");
  });

  it("delete_attachment feed sync mirrors persistence", async () => {
    const story_id = await db.stories.add({ title: "Chat Attach", ai_id: "ai-1", user_id: "u-1", fractal_id: "f-1", round: 0, created_at: 1, updated_at: 1 });
    await session_driver.set_active(String(story_id));
    const written = await session_driver.log_message("caption", "fractal", "Nova", { attachments: [{ src: "data:x", metadata: {} }] });
    expect(simulation_log.feed.find((e) => String(e.id) === String(written.id)).attachments.length).toBe(1);
    await session_driver.delete_log_attachment(written.id, 0);
    const after = simulation_log.feed.find((e) => String(e.id) === String(written.id));
    expect(after.attachments.length).toBe(0);
  });
});
