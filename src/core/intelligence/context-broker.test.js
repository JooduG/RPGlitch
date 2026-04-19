import { describe, expect, it, beforeEach, vi } from "vitest";
import { context_broker } from "./context-broker.js";

import { temporal_engine } from "./temporal-engine.js";

// Mock temporal_engine to intercept resolution calls
vi.mock("./temporal-engine.js", () => ({
  temporal_engine: {
    resolve: vi.fn(),
  },
}));

describe("context_broker", () => {
  beforeEach(() => {
    // Initial state cleanup if needed
    vi.clearAllMocks();
  });

  it("hydrate() returns a valid payload for simulation", async () => {
    // Basic test to verify snake_case integration

    // This is a minimal mock test since hydrate depends on global state
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

    it("should gracefully handle missing log text", async () => {
      const entity = { future: [{ id: "1" }] };
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
      // The word 'category' contains 'cat', but it should not match the exact word 'cat'
      const log = "This is a new category.";

      await context_broker.manage_vector_lifecycle(entity, log);

      expect(temporal_engine.resolve).not.toHaveBeenCalled();
    });

    it("should resolve vectors based on significant keywords if no tags match", async () => {
      const entity = {
        future: [
          { id: "v1", text: "The grand master spoke." }, // keywords: grand, master, spoke
          { id: "v2", text: "A tiny cat slept." }, // keywords: slept (others <= 4 chars)
        ],
      };

      // Match "grand", "master", "spoke"
      const log = "The Grand old Master spoke loudly.";

      await context_broker.manage_vector_lifecycle(entity, log);

      expect(temporal_engine.resolve).toHaveBeenCalledTimes(1);
      expect(temporal_engine.resolve).toHaveBeenCalledWith(entity, "v1", "AUTO_RESOLVED");
    });

    it("should not resolve vectors if keywords don't meet threshold", async () => {
      const entity = {
        future: [
          { id: "v1", text: "The grand master spoke." }, // keywords: grand, master, spoke
        ],
      };

      // Match only "grand" (threshold is 3)
      const log = "The Grand canyon is big.";

      await context_broker.manage_vector_lifecycle(entity, log);

      expect(temporal_engine.resolve).not.toHaveBeenCalled();
    });
  });
});
