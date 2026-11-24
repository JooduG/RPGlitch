import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@data";
import { app } from "./interface.svelte.js";
import { session } from "./session.svelte.js";

const mock_checkpoint = vi.hoisted(() => ({ load_session_checkpoint: vi.fn(() => null), clear_session_checkpoint: vi.fn() }));

vi.mock("@data", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, load_session_checkpoint: mock_checkpoint.load_session_checkpoint, clear_session_checkpoint: mock_checkpoint.clear_session_checkpoint };
});

function base_entity(id, name, type, extra = {}) {
  return {
    id,
    name,
    type,
    eternal: { physical: "", non_physical: "" },
    present: { physical: "", non_physical: "" },
    past: "",
    future: "",
    dynamics: type === "fractal" ? { velocity: 50, entropy: 50 } : { chaos: 50, intensity: 50, openness: 50, affinity: 50 },
    ...extra,
  };
}

async function clear_all_tables() {
  await Promise.all([db.simulation_log.clear(), db.stories.clear(), db.entities.clear(), db.kv_settings.clear(), db.sessions.clear()]);
}

describe("SessionStore (session)", () => {
  beforeEach(async () => {
    mock_checkpoint.load_session_checkpoint.mockReset().mockReturnValue(null);
    mock_checkpoint.clear_session_checkpoint.mockReset();
    await clear_all_tables();
    await session.clear_active();
    session.reset_for_testing();
    app.selected_ai = null;
    app.selected_user = null;
    app.selected_fractal = null;
  });

  afterEach(() => {
    session.teardown_effects();
    vi.restoreAllMocks();
  });

  async function seed_story(round = 3, npc_entities = []) {
    await db.entities.put(base_entity("user-1", "You", "character"));
    await db.entities.put(base_entity("ai-1", "Silas", "character"));
    await db.entities.put(base_entity("fractal-1", "Nova City", "fractal"));
    for (const npc of npc_entities) {
      await db.entities.put(base_entity(npc.id, npc.name, "character"));
    }
    return await db.stories.add({
      title: "Chronicles of Silas & You in Nova City",
      ai_id: "ai-1",
      user_id: "user-1",
      fractal_id: "fractal-1",
      round,
      npc_ids: npc_entities.map((n) => n.id),
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  }

  it("set_active / clear_active syncs session, feed, and pointer without boot hooks", async () => {
    const story_id = await seed_story(2);
    await session.set_active(String(story_id));

    expect(session.active_id).toBe(String(story_id));
    expect(session.active_story?.title).toBe("Chronicles of Silas & You in Nova City");
    expect(session.active_ai?.name).toBe("Silas");
    expect(app.story_title).toBe("Chronicles of Silas & You in Nova City");

    await session.clear_active();
    expect(session.active_id).toBeNull();
    expect(session.feed).toEqual([]);
  });

  it("sync() does not overwrite draft storyboard selections (app.selected_*)", async () => {
    const draft_ai = base_entity("draft-ai", "Draft AI", "character");
    app.selected_ai = draft_ai;

    const story_id = await seed_story(4);
    await session.sync(String(story_id));

    expect(session.active_ai?.id).toBe("ai-1");
    expect(app.selected_ai).toEqual(draft_ai);
  });

  it("restores active story and newer round from versionchange checkpoint", async () => {
    const story_id = await seed_story(3);
    mock_checkpoint.load_session_checkpoint.mockReturnValue({ story_id: String(story_id), round: 9, phase: "generating" });

    await session.sync();

    expect(session.active_id).toBe(String(story_id));
    expect(session.round).toBe(9);
    expect(mock_checkpoint.clear_session_checkpoint).toHaveBeenCalled();
  });

  it("hydrates NPCs with active presence and keeps CRUD consistent", async () => {
    const story_id = await seed_story(3, [
      { id: "npc-elias", name: "Elias" },
      { id: "npc-mira", name: "Mira" },
    ]);
    await session.sync(String(story_id));

    expect(Object.keys(session.active_npcs).sort()).toEqual(["npc-elias", "npc-mira"]);
    expect(session.active_npcs["npc-elias"].presence).toBe("active");

    await session.update_entity("character", "npc-elias", { name: "Elias Updated" });
    expect(session.active_npcs["npc-elias"].name).toBe("Elias Updated");

    await session.delete_entity("character", "npc-elias");
    expect(session.active_npcs["npc-elias"]).toBeUndefined();
  });

  it("logs, edits, and deletes entries and attachments in DB and feed", async () => {
    const story_id = await seed_story(1);
    await session.set_active(String(story_id));

    const written = await session.log_message("Before", "ai", "Silas", { attachments: [{ src: "data:x", metadata: {} }] });
    expect(session.feed.some((e) => String(e.id) === String(written.id))).toBe(true);

    await session.edit_entry(written.id, "After");
    expect(session.feed.find((e) => String(e.id) === String(written.id))?.text).toBe("After");

    await session.delete_attachment(written.id, 0);
    expect(session.feed.find((e) => String(e.id) === String(written.id))?.attachments).toEqual([]);

    await session.delete_entry(written.id);
    expect(session.feed.find((e) => String(e.id) === String(written.id))).toBeUndefined();
  });
});
