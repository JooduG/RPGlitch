import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileState } from "./Profile.svelte.js";

// Mock platform module
let resolveEnhanceFn;
vi.mock("@platform", () => ({
  llm_service: {
    enhance: vi.fn(() => {
      return new Promise((resolve) => {
        resolveEnhanceFn = resolve;
      });
    }),
  },
  security: {
    sanitize: vi.fn((val) => val),
  },
}));

// Mock imports
vi.mock("@state/app-store.svelte.js", () => ({
  app: {
    editing_entity: null,
    load_entities: vi.fn(),
    ai_list: [],
    fractal_list: [],
    settings: { dev_mode: false },
    claimed_entity_ids: { has: vi.fn(() => false) },
  },
}));

vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    character: { id: "test-char", name: "Test Character", type: "character", profile_picture: "" },
    save_entity: vi.fn(),
    update_entity: vi.fn(),
  },
}));

vi.mock("@data/db.js", () => ({
  db: {
    entities: {
      update: vi.fn().mockResolvedValue(true),
    },
  },
  set_versionchange_quiesce: vi.fn(),
}));

vi.mock("@data/normalizer.js", () => ({
  normalize: vi.fn((char) => char),
}));

describe("ProfileState setImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update profile_picture property and trigger persistence with defensive trimming", async () => {
    const state = new ProfileState();
    const mock_data_url = "  data:image/png;base64,trimmed123 \n ";

    await state.setImage(mock_data_url);

    // Assert state update and defensive trim edge-case guard
    expect(state.char.profile_picture).toBe("data:image/png;base64,trimmed123");

    // Assert persistence
    const { db } = await import("@data/db.js");
    const { runtime } = await import("@state/runtime.svelte.js");

    expect(db.entities.update).toHaveBeenCalledWith("test-char", {
      profile_picture: "data:image/png;base64,trimmed123",
      updated_at: expect.any(Number),
    });

    expect(runtime.update_entity).toHaveBeenCalledWith("character", "test-char", {
      profile_picture: "data:image/png;base64,trimmed123",
    });
  });
});

describe("ProfileState enhance_profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set busy_fields correctly during the async enhance call and clear them afterward", async () => {
    const state = new ProfileState();

    // Start enhancement
    const enhance_call = state.enhance_profile("character");

    // Check that busy_fields are populated during enhancement
    expect(state.busy_fields.has("eternal.physical")).toBe(true);
    expect(state.busy_fields.has("eternal.non_physical")).toBe(true);
    expect(state.busy_fields.has("present.physical")).toBe(true);
    expect(state.busy_fields.has("present.non_physical")).toBe(true);
    expect(state.busy_fields.has("past")).toBe(true);
    expect(state.busy_fields.has("future")).toBe(true);
    expect(state.busy_fields.has("description")).toBe(true);
    expect(state.is_saving).toBe(true);

    // Resolve LLM call with a modified name property
    resolveEnhanceFn(`{"name": "Proxy Name Modification", "description": "New description"}`);
    await enhance_call;

    // Verify name was preserved and not overwritten; description is excluded from sorting
    expect(state.char.name).toBe("Test Character");
    expect(state.char.description).not.toBe("New description");

    // Check that busy_fields are cleared after enhancement
    expect(state.busy_fields.has("eternal.physical")).toBe(false);
    expect(state.busy_fields.has("eternal.non_physical")).toBe(false);
    expect(state.busy_fields.has("present.physical")).toBe(false);
    expect(state.busy_fields.has("present.non_physical")).toBe(false);
    expect(state.busy_fields.has("past")).toBe(false);
    expect(state.busy_fields.has("future")).toBe(false);
    expect(state.busy_fields.has("description")).toBe(false);
    expect(state.is_saving).toBe(false);
  });
});

describe("ProfileState story editing lock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks start_editing while the entity is claimed by an active story", async () => {
    const { app } = await import("@state/app-store.svelte.js");
    app.settings.dev_mode = false;
    app.claimed_entity_ids.has = vi.fn(() => true);

    const state = new ProfileState();
    state.start_editing();

    expect(state.can_edit).toBe(false);
    expect(state.story_locked).toBe(true);
    expect(state.is_editing).toBe(false);
  });

  it("allows editing when the entity is unclaimed", async () => {
    const { app } = await import("@state/app-store.svelte.js");
    app.settings.dev_mode = false;
    app.claimed_entity_ids.has = vi.fn(() => false);

    const state = new ProfileState();
    state.start_editing();

    expect(state.can_edit).toBe(true);
    expect(state.is_editing).toBe(true);
  });

  it("bypasses the lock when DevMode is enabled", async () => {
    const { app } = await import("@state/app-store.svelte.js");
    app.settings.dev_mode = true;
    app.claimed_entity_ids.has = vi.fn(() => true);

    const state = new ProfileState();
    state.start_editing();

    expect(state.can_edit).toBe(true);
    expect(state.is_editing).toBe(true);
  });
});
