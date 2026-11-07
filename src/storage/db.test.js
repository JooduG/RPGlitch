import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  db,
  init_db,
  list_stories,
  get_story,
  create_story,
  update_story,
  conclude_story,
  delete_story,
  coerce_story_key,
  list_entities,
  get_entity,
  upsert_entity,
  update_entity,
  delete_entity,
  seed_starter_entities,
  append_log_entry,
  get_story_log,
  delete_story_log,
  record_session_access,
  get_recent_sessions,
  get_active_session_id,
  set_active_session_id,
  clear_active_session_id,
  require_active,
  log_message,
  append_ledger_entry,
  get_story_ledger,
  update_cast,
  active_entity_ids,
  delete_log_entry,
  edit_log_entry,
  update_log_attachment,
  delete_log_attachment,
} from "./db.js";

describe("src/storage/db.js — Dexie Persistence & CRUD Engine", () => {
  beforeEach(async () => {
    await init_db();
    await db.entities.clear();
    await db.stories.clear();
    await db.simulation_log.clear();
    await db.kv_settings.clear();
    await db.sessions.clear();
    await db.mutation_ledger.clear();
  });

  afterEach(async () => {
    await db.entities.clear();
    await db.stories.clear();
    await db.simulation_log.clear();
    await db.kv_settings.clear();
    await db.sessions.clear();
    await db.mutation_ledger.clear();
  });

  describe("Schema Verification", () => {
    it("strictly preserves version 2 with mutation_ledger", () => {
      expect(db.verno).toBe(2);
      expect(db.entities).toBeDefined();
      expect(db.stories).toBeDefined();
      expect(db.simulation_log).toBeDefined();
      expect(db.kv_settings).toBeDefined();
      expect(db.sessions).toBeDefined();
      expect(db.audio_prefs).toBeDefined();
      expect(db.mutation_ledger).toBeDefined();
    });
  });

  describe("Entity CRUD & Starter Seeding", () => {
    it("seeds all 10 starter entities idempotently by ID", async () => {
      await seed_starter_entities();
      const all_seeded = await list_entities();
      expect(all_seeded).toHaveLength(10);

      // Re-running seed does not duplicate records
      await seed_starter_entities();
      const after_second_seed = await list_entities();
      expect(after_second_seed).toHaveLength(10);
    });

    it("lists entities filtered by type", async () => {
      await seed_starter_entities();
      const characters = await list_entities("character");
      expect(characters).toHaveLength(7);
      const fractals = await list_entities("fractal");
      expect(fractals).toHaveLength(3);
    });

    it("upserts and gets an entity, returning null for unknown id", async () => {
      const entity = {
        id: "custom_hero",
        name: "Custom Hero",
        type: "character",
        eternal: { physical: "[BUILD: athletic]", non_physical: "[CORE: brave]" },
        present: { physical: "", non_physical: "" },
        future: "",
        past: "",
        dynamics: { chaos: 50, intensity: 50, openness: 50, affinity: 50 },
      };

      await upsert_entity(entity);
      const fetched = await get_entity("custom_hero");
      expect(fetched?.name).toBe("Custom Hero");
      expect(fetched?.type).toBe("character");

      const unknown = await get_entity("does_not_exist");
      expect(unknown).toBeNull();
    });

    it("updates specific fields on an existing entity via update_entity", async () => {
      await upsert_entity({ id: "update_target", name: "Original", type: "character" });
      const updated_count = await update_entity("update_target", { profile_picture: "data:image/png;base64,123" });
      expect(updated_count).toBe(1);

      const fetched = await get_entity("update_target");
      expect(fetched?.profile_picture).toBe("data:image/png;base64,123");
      expect(fetched?.name).toBe("Original");

      const missing_count = await update_entity("non_existent_target", { profile_picture: "none" });
      expect(missing_count).toBe(0);
    });

    it("deletes an entity by ID", async () => {
      await upsert_entity({ id: "to_delete", name: "To Delete", type: "character" });
      expect(await get_entity("to_delete")).not.toBeNull();

      await delete_entity("to_delete");
      expect(await get_entity("to_delete")).toBeNull();
    });

    it("normalizes legacy rows on read via get_entity and list_entities", async () => {
      // Direct raw write of legacy row
      await db.entities.put({
        id: "legacy_user",
        name: "Legacy Row",
        type: "character",
        memories: [{ text: "first memory", is_origin: true }],
      });

      const fetched = await get_entity("legacy_user");
      expect(fetched?.past).toContain("[MEMORY: first memory | is_origin]");

      const list = await list_entities("character");
      const found = list.find((e) => e.id === "legacy_user");
      expect(found?.past).toContain("[MEMORY: first memory | is_origin]");
    });
  });

  describe("Story CRUD", () => {
    it("creates, retrieves, updates, and concludes a story", async () => {
      const story_id = await create_story({
        title: "Neon Odyssey",
        ai_id: "orion",
        user_id: "glitch",
        fractal_id: "nova",
        round: 1,
      });

      expect(story_id).toBeDefined();
      const story = await get_story(story_id);
      expect(story.title).toBe("Neon Odyssey");
      expect(story.round).toBe(1);

      await update_story(story_id, { round: 2 });
      const updated = await get_story(story_id);
      expect(updated.round).toBe(2);

      await conclude_story(story_id);
      const concluded = await get_story(story_id);
      expect(concluded.is_concluded).toBe(1);
    });

    it("lists stories joined with fractal summary metadata", async () => {
      await seed_starter_entities();
      const story_id = await create_story({
        title: "City Chronicle",
        ai_id: "orion",
        user_id: "glitch",
        fractal_id: "nova",
      });

      const summaries = await list_stories();
      expect(summaries).toHaveLength(1);
      expect(summaries[0].id).toBe(story_id);
      expect(summaries[0].fractal_name).toBe("Nova City");
      expect(summaries[0].state).toBe("active");
    });

    it("cascades story deletion to logs and mutation ledger", async () => {
      const story_id = await create_story({ title: "Purge Me" });
      await append_log_entry({ story_id, role: "user", text: "Hello" });
      await append_ledger_entry({ story_id, entity_id: "glitch", field: "present_physical", new_value: "wet" });

      expect((await get_story_log(story_id)).length).toBe(1);
      expect((await get_story_ledger(story_id)).length).toBe(1);

      await delete_story(story_id);
      expect(await get_story(story_id)).toBeUndefined();
      expect((await get_story_log(story_id)).length).toBe(0);
      expect((await get_story_ledger(story_id)).length).toBe(0);
    });

    it("coerces numeric string keys for story retrieval", () => {
      expect(coerce_story_key("123")).toBe(123);
      expect(coerce_story_key(456)).toBe(456);
      expect(coerce_story_key("story-uuid")).toBe("story-uuid");
    });
  });

  describe("Simulation Log CRUD", () => {
    it("appends and retrieves simulation log entries ordered by ID", async () => {
      const entry1 = await append_log_entry({ story_id: 1, role: "user", text: "Action 1" });
      const entry2 = await append_log_entry({ story_id: 1, role: "model", text: "Reaction 1" });

      expect(entry1).toBeDefined();
      expect(entry2).toBeDefined();

      const log = await get_story_log(1);
      expect(log).toHaveLength(2);
      expect(log[0].text).toBe("Action 1");
      expect(log[1].text).toBe("Reaction 1");

      await delete_story_log(1);
      expect(await get_story_log(1)).toHaveLength(0);
    });
  });

  describe("Session & KV Tracking", () => {
    it("records and lists recent session accesses", async () => {
      await record_session_access("session_alpha");
      await record_session_access("session_beta");

      const recent = await get_recent_sessions(5);
      expect(recent).toHaveLength(2);
      expect(recent[0].session_id).toBe("session_beta");
    });

    it("gets, sets, and clears active session pointer in kv_settings", async () => {
      expect(await get_active_session_id()).toBeNull();

      await set_active_session_id("active_123");
      expect(await get_active_session_id()).toBe("active_123");

      await clear_active_session_id();
      expect(await get_active_session_id()).toBeNull();
    });

    it("B17 storage shim: require_active returns active ID or throws on missing session", async () => {
      await clear_active_session_id();
      await expect(require_active()).rejects.toThrow("[Session] No active session found.");

      await set_active_session_id("active_story_789");
      expect(await require_active()).toBe("active_story_789");
    });

    it("B17 storage shim: log_message preserves telemetry-sentinel guard (drops empty prose without sentinels)", async () => {
      await set_active_session_id("story_1");

      // Empty prose without attachments or telemetry sentinels returns skip sentinel and does not write to DB
      const skipped = await log_message("", "system", "Director");
      expect(skipped.id).toMatch(/^skip-/);
      const log_after_skip = await get_story_log("story_1");
      expect(log_after_skip).toHaveLength(0);

      // Telemetry sentinels (e.g. DYNAMICS_DELTA) with empty prose ARE persisted
      const telemetry = await log_message("", "system", "Director", {
        turn_type: "SYSTEM_TURN",
        meta: { type: "DYNAMICS_DELTA", deltas: { chaos: 5 } },
      });
      expect(telemetry.id).toBeDefined();
      expect(String(telemetry.id)).not.toMatch(/^skip-/);

      // Normal non-empty prose is persisted
      const normal = await log_message("Hello, world!", "ai", "Sylvia");
      expect(normal.id).toBeDefined();

      const log = await get_story_log("story_1");
      expect(log).toHaveLength(2);
      expect(log[0].meta.type).toBe("DYNAMICS_DELTA");
      expect(log[1].text).toBe("Hello, world!");
    });
  });

  describe("Mutation Ledger & Provenance Tagging", () => {
    it("appends ledger entry tagged with writer: 'kernel'", async () => {
      const entry_id = await append_ledger_entry({
        story_id: 1,
        entity_id: "orion",
        field: "present_physical",
        key: "CHEST",
        new_value: "bare",
        round: 1,
        seq: 1,
      });

      expect(entry_id).toBeDefined();
      const ledger = await get_story_ledger(1);
      expect(ledger).toHaveLength(1);
      expect(ledger[0].writer).toBe("kernel");
      expect(ledger[0].key).toBe("CHEST");
      expect(ledger[0].new_value).toBe("bare");
    });
  });

  describe("B15, B16, B22 Extended Persistence Operations", () => {
    it("B15: append_log_entry persists round, turn_type, entity_id, and attachments payload", async () => {
      const story_id = await create_story({ title: "Log Story" });
      const entry_id = await append_log_entry({
        story_id,
        role: "assistant",
        type: "dialogue",
        character_name: "Sylvia",
        text: "The path is clear.",
        round: 4,
        turn_type: "NARRATIVE_TURN",
        entity_id: "char_sylvia",
        attachments: [{ type: "image", url: "https://example.com/img.png" }],
      });

      expect(entry_id).toBeDefined();

      const log = await get_story_log(story_id);
      expect(log).toHaveLength(1);
      expect(log[0].id).toBe(entry_id);
      expect(log[0].round).toBe(4);
      expect(log[0].turn_type).toBe("NARRATIVE_TURN");
      expect(log[0].entity_id).toBe("char_sylvia");
      expect(log[0].attachments).toHaveLength(1);
      expect(log[0].attachments[0].url).toBe("https://example.com/img.png");
    });

    it("B15: edit_log_entry and delete_log_entry mutate persisted entries", async () => {
      const story_id = await create_story({ title: "Edit Story" });
      const entry_id = await append_log_entry({
        story_id,
        role: "user",
        text: "Initial message",
      });

      await edit_log_entry(entry_id, "Edited message text");
      let log = await get_story_log(story_id);
      expect(log[0].text).toBe("Edited message text");

      await delete_log_entry(entry_id);
      log = await get_story_log(story_id);
      expect(log).toHaveLength(0);
    });

    it("B15: update_log_attachment and delete_log_attachment update attachments array", async () => {
      const story_id = await create_story({ title: "Attachment Story" });
      const entry_id = await append_log_entry({
        story_id,
        role: "assistant",
        text: "Here is the visual.",
        attachments: [
          { type: "image", url: "https://example.com/old.png" },
          { type: "audio", url: "https://example.com/sound.mp3" },
        ],
      });

      await update_log_attachment(entry_id, 0, { type: "image", url: "https://example.com/new.png" });
      let log = await get_story_log(story_id);
      expect(log[0].attachments[0].url).toBe("https://example.com/new.png");
      expect(log[0].attachments[1].url).toBe("https://example.com/sound.mp3");

      await delete_log_attachment(entry_id, 1);
      log = await get_story_log(story_id);
      expect(log[0].attachments).toHaveLength(1);
      expect(log[0].attachments[0].url).toBe("https://example.com/new.png");
    });

    it("B15: delete_log_attachment auto-deletes empty image bubble when text is whitespace", async () => {
      const story_id = await create_story({ title: "Empty Bubble Story" });
      const entry_id = await append_log_entry({
        story_id,
        role: "assistant",
        text: "   ",
        attachments: [{ type: "image", url: "https://example.com/only.png" }],
      });

      await delete_log_attachment(entry_id, 0);
      const log = await get_story_log(story_id);
      expect(log).toHaveLength(0);
    });

    it("B16: list_stories returns ai_id, user_id, and fractal_id trio", async () => {
      await create_story({
        title: "Cast Story",
        ai_id: "char_ai",
        user_id: "char_user",
        fractal_id: "fractal_world",
      });

      const summaries = await list_stories();
      expect(summaries).toHaveLength(1);
      expect(summaries[0].ai_id).toBe("char_ai");
      expect(summaries[0].user_id).toBe("char_user");
      expect(summaries[0].fractal_id).toBe("fractal_world");
    });

    it("B16: active_entity_ids returns claimed entity IDs from active non-concluded stories", async () => {
      await create_story({
        title: "Active Quest",
        ai_id: "ai_1",
        user_id: "user_1",
        fractal_id: "fractal_1",
      });

      const concluded_story_id = await create_story({
        title: "Finished Quest",
        ai_id: "ai_dead",
        user_id: "user_dead",
        fractal_id: "fractal_dead",
      });
      await conclude_story(concluded_story_id);

      const claims = await active_entity_ids();
      expect(claims).toContain("ai_1");
      expect(claims).toContain("user_1");
      expect(claims).toContain("fractal_1");
      expect(claims).not.toContain("ai_dead");
      expect(claims).not.toContain("user_dead");
      expect(claims).not.toContain("fractal_dead");
    });

    it("B22: update_cast sanitizes nulls, duplicates, and trims whitespace", async () => {
      const story_id = await create_story({ title: "Cast Sanitize Story" });
      await update_cast(story_id, [" npc_1 ", "", null, "npc_2", "npc_1", undefined, "  npc_3  "]);

      const loaded = await get_story(story_id);
      expect(loaded.npc_ids).toEqual(["npc_1", "npc_2", "npc_3"]);
    });
  });
});
