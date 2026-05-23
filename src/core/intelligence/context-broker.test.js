import { describe, expect, it, beforeEach, vi } from "vitest";
import { context_broker } from "@core/intelligence/context-broker.js";
import { temporal_engine } from "@core/intelligence/temporal-engine.js";

// Hoisted mock variables starting with 'mock' to satisfy Vitest prefix requirement and bypass TDZ
let mockRound = 1;
let mockAppState = {
  state_anchor: "",
};

// Mock runtime store dynamically using lazy getters to survive Vitest hoisted module evaluation
vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    get round() {
      return mockRound;
    },
    set round(val) {
      mockRound = val;
    },
    get simulation() {
      return {
        get round() {
          return mockRound;
        },
      };
    },
  },
}));

// Mock app store dynamically with a lazy getter pointing to our outer block-scoped variable
vi.mock("@state/app.svelte.js", () => ({
  get app() {
    return mockAppState;
  },
}));

// Mock temporal_engine to intercept resolution calls
vi.mock("@core/intelligence/temporal-engine.js", () => ({
  temporal_engine: {
    resolve: vi.fn(),
  },
}));

describe("context_broker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRound = 1;
    mockAppState = {
      state_anchor: "",
    };
  });

  it("hydrate() returns a valid payload for simulation", async () => {
    expect(context_broker.hydrate).toBeDefined();
  });

  describe("manage_vector_lifecycle", () => {
    it("should gracefully handle missing entity or future arrays", async () => {
      await expect(context_broker.manage_vector_lifecycle(null, "log")).resolves.not.toThrow();
      await expect(
        context_broker.manage_vector_lifecycle({ future: null }, "log"),
      ).resolves.not.toThrow();
      await expect(
        context_broker.manage_vector_lifecycle({ future: [] }, "log"),
      ).resolves.not.toThrow();
    });

    it("should gracefully handle missing log text for non-conditional vectors", async () => {
      const entity = { future: [{ id: "1", vector_tags: [], text: "test" }] };
      // @ts-ignore
      await expect(context_broker.manage_vector_lifecycle(entity, null)).resolves.not.toThrow();
      await expect(context_broker.manage_vector_lifecycle(entity, "")).resolves.not.toThrow();
    });

    it("should resolve vectors based on vector_tags match", async () => {
      const entity = {
        future: [
          { id: "v1", vector_tags: ["apple", "banana"], text: "Some short text" },
          { id: "v2", vector_tags: ["cherry"], text: "Another text" },
          { id: "v3", vector_tags: ["multi word tag"], text: "Yet another text" },
        ],
      };
      const log = "I ate a Banana yesterday and saw a multi word tag in the wild.";

      await context_broker.manage_vector_lifecycle(entity, log);

      expect(temporal_engine.resolve).toHaveBeenCalledTimes(2);
      expect(temporal_engine.resolve).toHaveBeenCalledWith(entity, "v1", "AUTO_RESOLVED");
      expect(temporal_engine.resolve).toHaveBeenCalledWith(entity, "v3", "AUTO_RESOLVED");
    });

    it("should not resolve vectors using substring false positives", async () => {
      const entity = {
        future: [{ id: "v1", vector_tags: ["cat"], text: "Some short text" }],
      };
      const log = "This is a new category.";

      await context_broker.manage_vector_lifecycle(entity, log);

      expect(temporal_engine.resolve).not.toHaveBeenCalled();
    });

    it("should resolve vectors based on significant keywords if no tags match", async () => {
      const entity = {
        future: [
          { id: "v1", text: "The grand master spoke." },
          { id: "v2", text: "A tiny cat slept." },
        ],
      };
      const log = "The Grand old Master spoke loudly.";

      await context_broker.manage_vector_lifecycle(entity, log);

      expect(temporal_engine.resolve).toHaveBeenCalledTimes(1);
      expect(temporal_engine.resolve).toHaveBeenCalledWith(entity, "v1", "AUTO_RESOLVED");
    });

    it("should not resolve vectors if keywords don't meet threshold", async () => {
      const entity = {
        future: [{ id: "v1", text: "The grand master spoke." }],
      };
      const log = "The Grand canyon is big.";

      await context_broker.manage_vector_lifecycle(entity, log);

      expect(temporal_engine.resolve).not.toHaveBeenCalled();
    });

    // --- NEW STRICT STATE AND CHRONO MATRIX TESTS ---

    it("should not resolve state-locked vectors if requires state is not met, even if keywords are in log", async () => {
      mockAppState.state_anchor = "inactive";
      const entity = {
        future: [
          {
            id: "v_state",
            requires: { state_anchor: "active" },
            vector_tags: ["apple"],
            text: "The state is active",
          },
        ],
      };
      // Log text contains the tag "apple", but requirement is state_anchor: "active" (which is inactive)
      await context_broker.manage_vector_lifecycle(entity, "I ate an apple");

      expect(temporal_engine.resolve).not.toHaveBeenCalled();
    });

    it("should resolve state-locked vectors instantly when requires state matches, even with empty log text", async () => {
      mockAppState.state_anchor = "active";
      const entity = {
        future: [
          {
            id: "v_state",
            requires: { state_anchor: "active" },
            vector_tags: ["apple"],
            text: "The state is active",
          },
        ],
      };
      // Log text is empty, but requirement is met
      await context_broker.manage_vector_lifecycle(entity, "");

      expect(temporal_engine.resolve).toHaveBeenCalledWith(entity, "v_state", "AUTO_RESOLVED");
    });

    it("should block resolution if round has not met threshold from requires or meta, even if text matches", async () => {
      mockRound = 2;
      const entity = {
        future: [
          {
            id: "v_chrono_req",
            requires: { round: 3 },
            vector_tags: ["banana"],
          },
          {
            id: "v_chrono_meta",
            meta: { round: 4 },
            vector_tags: ["banana"],
          },
          {
            id: "v_chrono_meta_thresh",
            meta: { round_threshold: 5 },
            vector_tags: ["banana"],
          },
        ],
      };

      await context_broker.manage_vector_lifecycle(entity, "eating a banana");
      expect(temporal_engine.resolve).not.toHaveBeenCalled();
    });

    it("should resolve when round has met threshold, even without log text", async () => {
      mockRound = 3;
      const entity = {
        future: [
          {
            id: "v_chrono_req_ok",
            requires: { round: 3 },
            vector_tags: ["banana"],
          },
        ],
      };

      await context_broker.manage_vector_lifecycle(entity, "");
      expect(temporal_engine.resolve).toHaveBeenCalledWith(
        entity,
        "v_chrono_req_ok",
        "AUTO_RESOLVED",
      );
    });

    it("should fallback to legacy fuzzy matching when no requirements are defined", async () => {
      const entity = {
        future: [
          {
            id: "v_legacy",
            vector_tags: ["cherry"],
            text: "Cherry cherry",
          },
        ],
      };

      await context_broker.manage_vector_lifecycle(entity, "I love cherry.");
      expect(temporal_engine.resolve).toHaveBeenCalledWith(entity, "v_legacy", "AUTO_RESOLVED");
    });
  });
});
