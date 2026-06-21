import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileState } from "./profile.svelte.js";

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
  Security: {
    sanitize: vi.fn((val) => val),
  },
}));

// Mock imports
vi.mock("@state/app.svelte.js", () => ({
  app: {
    editing_entity: null,
    load_entities: vi.fn(),
    ai_list: [],
    fractal_list: [],
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
}));

vi.mock("@data/normalizer.js", () => ({
  normalize: vi.fn((char) => char),
}));

describe("ProfileState setImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update profile_picture and image properties, and trigger persistence with defensive trimming", async () => {
    const state = new ProfileState();
    const mockDataUrl = "  data:image/png;base64,trimmed123 \n ";

    await state.setImage(mockDataUrl);

    // Assert state update and defensive trim edge-case guard
    expect(state.char.profile_picture).toBe("data:image/png;base64,trimmed123");
    expect(state.char.image).toBe("data:image/png;base64,trimmed123");

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
    const enhanceCall = state.enhance_profile("character");

    // Check that busy_fields are populated during enhancement
    expect(state.busy_fields.has("eternal.physical")).toBe(true);
    expect(state.busy_fields.has("eternal.non_physical")).toBe(true);
    expect(state.busy_fields.has("present.physical")).toBe(true);
    expect(state.busy_fields.has("present.non_physical")).toBe(true);
    expect(state.busy_fields.has("past")).toBe(true);
    expect(state.busy_fields.has("future")).toBe(true);
    expect(state.busy_fields.has("description")).toBe(true);
    expect(state.is_saving).toBe(true);

    // Resolve LLM call
    resolveEnhanceFn(`{"name": "Proxy"}`);
    await enhanceCall;

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
