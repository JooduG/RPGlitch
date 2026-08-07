import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock_checkpoint = {
  load_session_checkpoint: vi.fn(() => null),
  clear_session_checkpoint: vi.fn(),
};
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
