/**
 * @file src/data/story-library.test.js
 * Unit tests for session pointer tracking, story creation, simulation-log
 * CRUD, and turn writers against real Dexie tables (fake-indexeddb).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  SESSION_ID_KEY,
  clear_active_session_id,
  db,
  get_active_session_id,
  get_recent_sessions,
  record_session_access,
  require_active,
  set_active_session_id,
} from "./db.js";
import {
  create_from_selection,
  delete_log_attachment,
  delete_log_entry,
  delete_story_log,
  edit_log_entry,
  load_log,
  log_message,
  regenerate,
  resolve_log_entity_id,
  send,
} from "./story-library.js";

async function clear_all_tables() {
  await Promise.all([db.simulation_log.clear(), db.stories.clear(), db.entities.clear(), db.kv_settings.clear(), db.sessions.clear()]);
}

async function seed_story() {
  return await db.stories.add({ title: "Test Story", ai_id: "ai-1", user_id: "user-1", fractal_id: "f-1", round: 3, created_at: 1, updated_at: 1 });
}

beforeEach(async () => {
  await db.open().catch(() => {});
  await clear_all_tables();
});

describe("src/data/db.js & story-library.js", () => {
  describe("session pointer (kv_settings)", () => {
    it("round-trips the active session id", async () => {
      expect(await get_active_session_id()).toBeNull();
      await set_active_session_id("story-9");
      expect(await get_active_session_id()).toBe("story-9");
      expect(await require_active()).toBe("story-9");
      await clear_active_session_id();
      expect(await get_active_session_id()).toBeNull();
      await expect(require_active()).rejects.toThrow("[Session] No active session found.");
    });

    it("uses the documented kv key", () => {
      expect(SESSION_ID_KEY).toBe("active_session_id");
    });

    it("records and lists recent sessions", async () => {
      await record_session_access("a");
      await record_session_access("b");
      const recent = await get_recent_sessions(10);
      expect(recent.map((row) => row.session_id)).toEqual(["b", "a"]);
    });
  });

  describe("log_message / load_log / edit / delete", () => {
    it("writes, loads, edits (with meta patch), and deletes entries", async () => {
      const story_id = await seed_story();
      const written = await log_message("Hello there", "user", "Orion", { story_id });
      expect(written.id).toBeDefined();
      expect(written.round).toBe(3);

      await edit_log_entry(written.id, "Hello edited", { think: "deliberation" });
      const loaded = await load_log(story_id);
      expect(loaded).toHaveLength(1);
      expect(loaded[0].text).toBe("Hello edited");
      expect(loaded[0].meta.think).toBe("deliberation");

      await delete_log_entry(written.id);
      expect(await load_log(story_id)).toHaveLength(0);
    });

    it("degrades sessionless writes to a no-op sentinel instead of throwing", async () => {
      const sentinel = await log_message("orphan", "ai", "Glitch", {});
      expect(sentinel.story_id).toBeNull();
      expect(String(sentinel.id).startsWith("skip-")).toBe(true);
    });

    it("refuses to store empty narrative messages", async () => {
      const story_id = await seed_story();
      const sentinel = await log_message("   ", "ai", "Glitch", { story_id });
      expect(String(sentinel.id).startsWith("skip-")).toBe(true);
      expect(await load_log(story_id)).toHaveLength(0);
    });

    it("deletes emptied image bubbles but keeps text entries on attachment removal", async () => {
      const story_id = await seed_story();
      const bubble_id = await db.simulation_log.add({
        story_id,
        role: "fractal",
        type: "text",
        text: "",
        character_name: "Nova",
        meta: {},
        attachments: [{ src: null }],
        created_at: 1,
      });
      await delete_log_attachment(bubble_id, 0);
      expect(await load_log(story_id)).toHaveLength(0);

      const kept = await log_message("captioned", "fractal", "Nova", { story_id, attachments: [{ src: null }] });
      await delete_log_attachment(kept.id, 0);
      const remaining = await load_log(story_id);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].attachments).toEqual([]);
    });

    it("clears a whole story log", async () => {
      const story_id = await seed_story();
      await log_message("one", "user", "Orion", { story_id });
      await log_message("two", "ai", "Glitch", { story_id });
      expect(await delete_story_log(story_id)).toBe(2);
      expect(await load_log(story_id)).toHaveLength(0);
    });
  });

  describe("speaker resolution (case-insensitive snapshots)", () => {
    it("matches lowercase story-row snapshots", async () => {
      const story_id = await db.stories.add({
        title: "T",
        entity_snapshots: { ai: { id: "ai-1", name: "Glitch" }, user: { id: "user-1", name: "Orion" } },
        created_at: 1,
        updated_at: 1,
        round: 0,
      });
      expect(await resolve_log_entity_id("user", "ORION", null, story_id)).toBe("user-1");
      expect(await resolve_log_entity_id("ai", "glitch", null, story_id)).toBe("ai-1");
    });
  });

  describe("create_from_selection", () => {
    it("filters nullish ids before String() and writes STORY_START", async () => {
      await db.entities.add({ id: "c-wanderer", type: "character", name: "Wren", is_wanderer: true });
      let activated = null;
      const story_id = await create_from_selection(
        { ai_id: null, user_id: undefined, fractal_id: null, story_title: "Fresh" },
        {
          set_active: async (id) => {
            activated = id;
          },
        },
      );
      expect(typeof story_id).toBe("string");
      expect(activated).toBe(story_id);
      const story = await db.stories.get(Number(story_id));
      expect(story.npc_ids).not.toContain("null");
      expect(story.npc_ids).not.toContain("undefined");

      const logs = await load_log(story_id);
      expect(logs.some((entry) => entry.meta?.type === "STORY_START")).toBe(true);
    });
  });

  describe("send / regenerate", () => {
    it("stamps the speaker from the story row snapshots", async () => {
      const story_id = await db.stories.add({ title: "T", entity_snapshots: { user: { name: "Orion" } }, created_at: 1, updated_at: 1, round: 7 });
      const entry = await send("hi", { active_id: String(story_id) });
      expect(entry.character_name).toBe("Orion");
      expect(entry.round).toBe(7);
    });

    it("prunes trailing turns but protects STORY_START", async () => {
      const story_id = String(await seed_story());
      await log_message("Story Started: T", "system", "", { story_id, meta: { type: "STORY_START" }, turn_type: "SYSTEM_TURN" });
      await log_message("go", "user", "Orion", { story_id, round: 3 });
      await log_message("reply", "ai", "Glitch", { story_id, round: 3 });
      await regenerate({ active_id: story_id });
      const remaining = await load_log(story_id);
      expect(remaining.map((entry) => entry.text)).toEqual(["Story Started: T", "go"]);
    });
  });
});
