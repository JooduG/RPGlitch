import "fake-indexeddb/auto";
import { runtime } from "./runtime.svelte.js";
import { app } from "./app.svelte.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// hoisted so it's initialized before the mocked @engine/session.js module is
// first imported (which happens during the top-level runtime import below).
const mock_checkpoint = vi.hoisted(() => ({
  load_session_checkpoint: vi.fn(() => null),
  clear_session_checkpoint: vi.fn(),
}));

vi.mock("@engine/session.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    load_session_checkpoint: mock_checkpoint.load_session_checkpoint,
    clear_session_checkpoint: mock_checkpoint.clear_session_checkpoint,
  };
});

function base_entity(id, name, type, extra = {}) {
  return {
    id,
    name,
    type,
    eternal: { physical: "", non_physical: "" },
    present: { physical: "", non_physical: "" },
    past: [],
    future: [],
    dynamics: type === "fractal" ? { velocity: 50, entropy: 50 } : { chaos: 50, intensity: 50, openness: 50, affinity: 50 },
    ...extra,
  };
}

describe("Narrative Vector System", () => {
  beforeEach(() => {
    runtime.init_effects();
    // Reset state before each test
    runtime._debug_inject({
      fractal: /** @type {any} */ ({ id: "test-fractal", active: true, future: "" }),
    });
  });

  afterEach(() => {
    runtime.teardown_effects();
  });

  it("should initialize with an empty future agenda", () => {
    // FUTURE is a consolidated prose field, not a vector pool.
    expect(runtime.active_fractal?.future).toEqual("");
  });

  it("should append agenda lines to the future field", () => {
    runtime.add_vector("Find the key.", "FRACTAL");
    expect(runtime.active_fractal?.future).toBe("Find the key.");

    runtime.add_vector("Explore the cave.", "FRACTAL");
    expect(runtime.active_fractal?.future).toBe("Find the key.\nExplore the cave.");
  });

  it("should prepend a vanguard agenda line", () => {
    runtime.add_vector("Background Task", "FRACTAL");
    runtime.add_vector("Urgent Task", "FRACTAL", true); // is_vanguard = true
    expect(runtime.active_fractal?.future).toBe("Urgent Task\nBackground Task");
  });

  it("should complete the newest agenda line (drop it)", () => {
    runtime.add_vector("Task A", "FRACTAL");
    runtime.add_vector("Task B", "FRACTAL");
    expect(runtime.active_fractal?.future).toBe("Task A\nTask B");
    runtime.complete_vector("FRACTAL");
    expect(runtime.active_fractal?.future).toBe("Task A");
  });

  it("should handle complete_vector on an empty future field safely", () => {
    runtime.complete_vector("FRACTAL");
    expect(runtime.active_fractal?.future).toEqual("");
  });

  describe("State Synchronization", () => {
    it("should synchronize app-level selected entities on debug inject", () => {
      const mock_user = {
        id: "user-1",
        name: "User One",
        eternal: { non_physical: "", physical: "" },
        present: { non_physical: "", physical: "" },
        future: [],
        dynamics: { chaos: 50, openness: 50, intensity: 50, affinity: 50 },
      };
      const mock_ai = {
        id: "ai-1",
        name: "AI One",
        eternal: { non_physical: "", physical: "" },
        present: { non_physical: "", physical: "" },
        future: [],
        dynamics: { chaos: 50, openness: 50, intensity: 50, affinity: 50 },
      };
      const mock_fractal = {
        id: "fractal-1",
        name: "Fractal One",
        eternal: { non_physical: "", physical: "" },
        present: { non_physical: "", physical: "" },
        future: [],
        dynamics: { velocity: 50, entropy: 50 },
      };

      runtime._debug_inject({
        user: mock_user,
        ai: mock_ai,
        fractal: mock_fractal,
      });

      expect(app.selected_user).toEqual(mock_user);
      expect(app.selected_ai).toEqual(mock_ai);
      expect(app.selected_fractal).toEqual(mock_fractal);
    });
  });
});

describe("runtime.sync checkpoint restore", () => {
  /** @type {any} */
  let runtime;

  beforeEach(async () => {
    vi.resetModules();
    mock_checkpoint.load_session_checkpoint.mockReset().mockReturnValue(null);
    mock_checkpoint.clear_session_checkpoint.mockReset();
    const Dexie = (await import("dexie")).default;
    await Dexie.delete("rpglitch");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    ({ runtime } = await import("./runtime.svelte.js"));
  }, 30000);

  afterEach(() => {
    runtime?.teardown_effects?.();
    vi.restoreAllMocks();
  });

  async function seed_story(round = 3) {
    const { db, init } = await import("@data/db.js");
    await init();
    await db.entities.put(base_entity("user-1", "You", "character"));
    await db.entities.put(base_entity("ai-1", "Silas", "character"));
    await db.entities.put(base_entity("fractal-1", "Nova City", "fractal"));
    const story_id = await db.stories.add({
      title: "Test",
      ai_id: "ai-1",
      user_id: "user-1",
      fractal_id: "fractal-1",
      round,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    return { db, story_id };
  }

  it("restores the active story and newer round from a versionchange checkpoint", async () => {
    const { story_id } = await seed_story(3);
    mock_checkpoint.load_session_checkpoint.mockReturnValue({ story_id: String(story_id), round: 9, phase: "generating" });

    await runtime.sync();

    expect(runtime.story_id).toBe(String(story_id));
    expect(runtime.round).toBe(9);
    expect(runtime.is_ready).toBe(true);
    expect(mock_checkpoint.clear_session_checkpoint).toHaveBeenCalled();
  });

  it("falls back to kv_settings when no checkpoint exists", async () => {
    const { db, story_id } = await seed_story(3);
    await db.kv_settings.put({ key: "active_session_id", value: String(story_id) });

    await runtime.sync();

    expect(runtime.story_id).toBe(String(story_id));
    expect(runtime.round).toBe(3);
    expect(runtime.is_ready).toBe(true);
  });

  it("keeps the persisted story round when the checkpoint round is not newer", async () => {
    const { story_id } = await seed_story(5);
    mock_checkpoint.load_session_checkpoint.mockReturnValue({ story_id: String(story_id), round: 4, phase: "idle" });

    await runtime.sync();

    expect(runtime.story_id).toBe(String(story_id));
    expect(runtime.round).toBe(5);
  });

  it("synchronizes session_driver.active_id during sync()", async () => {
    const { story_id } = await seed_story(3);
    mock_checkpoint.load_session_checkpoint.mockReturnValue({ story_id: String(story_id), round: 3, phase: "idle" });

    const { session_driver } = await import("@engine");

    await runtime.sync();

    expect(session_driver.active_id).toBe(String(story_id));
  });
});

describe("runtime world-cast hydration (track-npc-expansion)", () => {
  /** @type {any} */
  let runtime;

  beforeEach(async () => {
    vi.resetModules();
    mock_checkpoint.load_session_checkpoint.mockReset().mockReturnValue(null);
    mock_checkpoint.clear_session_checkpoint.mockReset();
    const Dexie = (await import("dexie")).default;
    await Dexie.delete("rpglitch");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    ({ runtime } = await import("./runtime.svelte.js"));
  }, 30000);

  afterEach(() => {
    runtime?.teardown_effects?.();
    vi.restoreAllMocks();
  });

  async function seed_story_with_npcs(npc_entities = []) {
    const { db, init } = await import("@data/db.js");
    await init();
    await db.entities.put(base_entity("user-1", "You", "character"));
    await db.entities.put(base_entity("ai-1", "Silas", "character"));
    await db.entities.put(base_entity("fractal-1", "Nova City", "fractal"));
    for (const e of npc_entities) {
      await db.entities.put(
        base_entity(e.id, e.name, "character", {
          role_tier: e.role_tier ?? 1,
          relationships: e.relationships || [],
        }),
      );
    }
    const story_id = await db.stories.add({
      title: "Test",
      ai_id: "ai-1",
      user_id: "user-1",
      fractal_id: "fractal-1",
      round: 3,
      npc_ids: npc_entities.map((e) => e.id),
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    return { db, story_id };
  }

  it("hydrates the story's NPCs into active_npcs and puts everyone on-stage", async () => {
    const { story_id } = await seed_story_with_npcs([
      { id: "npc-elias", name: "Elias", role_tier: 2 },
      { id: "npc-mira", name: "Mira" },
    ]);
    mock_checkpoint.load_session_checkpoint.mockReturnValue({ story_id: String(story_id), round: 3, phase: "idle" });

    await runtime.sync();

    expect(Object.keys(runtime.active_npcs).sort()).toEqual(["npc-elias", "npc-mira"]);
    expect(runtime.active_npcs["npc-elias"].name).toBe("Elias");
    expect(runtime.active_npcs["npc-elias"].role_tier).toBe(2);
    expect(runtime.snapshot_npcs["npc-mira"].name).toBe("Mira");
    expect(runtime.in_scene_npc_ids).toEqual(expect.arrayContaining(["npc-elias", "npc-mira"]));
    expect([...runtime.snapshot_in_scene_npc_ids].sort()).toEqual(["npc-elias", "npc-mira"]);
  });

  it("clears the cast when the story has no npc_ids", async () => {
    const { story_id } = await seed_story_with_npcs();
    mock_checkpoint.load_session_checkpoint.mockReturnValue({ story_id: String(story_id), round: 3, phase: "idle" });

    await runtime.sync();

    expect(runtime.active_npcs).toEqual({});
    expect(runtime.in_scene_npc_ids).toEqual([]);
  });

  it("keeps the world cast consistent across update/save/delete of an NPC", async () => {
    const { story_id } = await seed_story_with_npcs([{ id: "npc-elias", name: "Elias" }]);
    mock_checkpoint.load_session_checkpoint.mockReturnValue({ story_id: String(story_id), round: 3, phase: "idle" });
    await runtime.sync();

    await runtime.update_entity("character", "npc-elias", { role_tier: 3 });
    expect(runtime.active_npcs["npc-elias"].role_tier).toBe(3);

    await runtime.save_entity("character", { ...runtime.active_npcs["npc-elias"], name: "Elias II" });
    expect(runtime.active_npcs["npc-elias"].name).toBe("Elias II");

    await runtime.delete_entity("character", "npc-elias");
    expect(runtime.active_npcs["npc-elias"]).toBeUndefined();
    expect(runtime.in_scene_npc_ids).not.toContain("npc-elias");
  });

  it("persists stage moves through the in_scene_npc_ids setter (Stage Spotlight)", async () => {
    const { story_id } = await seed_story_with_npcs([
      { id: "npc-elias", name: "Elias" },
      { id: "npc-mira", name: "Mira" },
    ]);
    mock_checkpoint.load_session_checkpoint.mockReturnValue({ story_id: String(story_id), round: 3, phase: "idle" });
    await runtime.sync();

    runtime.in_scene_npc_ids = ["npc-mira"];
    expect(runtime.in_scene_npc_ids).toEqual(["npc-mira"]);
    expect(runtime.snapshot_in_scene_npc_ids).toEqual(["npc-mira"]);

    runtime.in_scene_npc_ids = ["npc-mira", "npc-mira", "npc-elias"];
    expect(runtime.in_scene_npc_ids).toEqual(["npc-mira", "npc-elias"]);
  });
});
