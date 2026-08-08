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
      fractal: /** @type {any} */ ({ id: "test-fractal", active: true, future: [] }),
    });
  });

  afterEach(() => {
    runtime.teardown_effects();
  });

  it("should initialize with an empty future pool", () => {
    // Default for FRACTAL is now handled by the caller or Simulation seeding
    expect(runtime.active_fractal?.future).toEqual([]);
  });

  it("should add a vector to the future pool (echoes)", () => {
    runtime.add_vector("Find the key.", "FRACTAL");
    expect(runtime.active_fractal?.future).toHaveLength(1);
    expect(runtime.active_fractal?.future?.[0].type).toBe("future");
    expect(runtime.active_fractal?.future?.[0].content).toBe("Find the key.");

    runtime.add_vector("Explore the cave.", "FRACTAL");
    expect(runtime.active_fractal?.future).toHaveLength(2);
    // "Find the key" is still index 0 because we pushed
    expect(runtime.active_fractal?.future?.[0].content).toBe("Find the key.");
    expect(runtime.active_fractal?.future?.[1].content).toBe("Explore the cave.");
  });

  it("should add a vector to the front (is_vanguard)", () => {
    runtime.add_vector("Background Task", "FRACTAL");
    runtime.add_vector("Urgent Task", "FRACTAL", true); // is_vanguard = true
    expect(runtime.active_fractal?.future?.[0].content).toBe("Urgent Task");
    expect(runtime.active_fractal?.future?.[1].content).toBe("Background Task");
  });

  it("should complete the active vector and promote the next one", () => {
    runtime.add_vector("Task A", "FRACTAL");
    runtime.add_vector("Task B", "FRACTAL");
    expect(runtime.active_fractal?.future?.[0].content).toBe("Task A");
    runtime.complete_vector("FRACTAL");
    expect(runtime.active_fractal?.future?.[0].content).toBe("Task B");
    expect(runtime.active_fractal?.future).toHaveLength(1);
  });

  it("should handle complete_vector on an empty future pool safely", () => {
    runtime.complete_vector("FRACTAL");
    expect(runtime.active_fractal?.future).toEqual([]);
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
});
