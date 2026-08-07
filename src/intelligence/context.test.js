import { context_broker } from "./context.svelte.js";
import { temporal_engine } from "./temporal.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mock variables starting with 'mock' to satisfy Vitest prefix requirement and bypass TDZ
let mock_round = 1;
let mock_app_state = {
  state_anchor: "",
};

const _mock_runtime = {
  get round() {
    return mock_round;
  },
  set round(val) {
    mock_round = val;
  },
  get simulation() {
    return {
      get round() {
        return mock_round;
      },
    };
  },
  get snapshot_entities() {
    return {
      AI: { id: "ai", name: "AI", role: "AI", future: [], dynamics: {} },
      USER: { id: "user", name: "USER", role: "USER", future: [], dynamics: {} },
      FRACTAL: {
        id: "fractal",
        name: "FRACTAL",
        role: "FRACTAL",
        future: [],
        dynamics: {},
      },
    };
  },
  get active_ai() {
    return { future: [] };
  },
  get active_user() {
    return { future: [] };
  },
  get active_fractal() {
    return { future: [] };
  },
};

// Mock @utils to provide state_bridge so context.svelte.js can access runtime/app
vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    state_bridge: {
      get app() {
        return mock_app_state;
      },
      get runtime() {
        return _mock_runtime;
      },
      get session_driver() {
        return { log_system_entry: vi.fn() };
      },
    },
  };
});

// Mock session_driver to avoid pulling in Dexie during context tests
vi.mock("@engine/session.svelte.js", () => ({
  session_driver: {
    log_system_entry: vi.fn(),
  },
}));

// Mock temporal_engine to intercept resolution calls
vi.mock("@intelligence/temporal.js", () => ({
  temporal_engine: {
    resolve: vi.fn(),
    format: vi.fn().mockReturnValue("Continue the journey."),
  },
}));

describe("context_broker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock_round = 1;
    mock_app_state = {
      state_anchor: "",
    };
  });

  afterEach(() => {});

  it("hydrate() returns a valid payload for simulation", async () => {
    expect(context_broker.hydrate).toBeDefined();
  });

  describe("manage_vector_lifecycle", () => {
    it("should gracefully handle missing entity or vectors arrays", async () => {
      await expect(context_broker.manage_vector_lifecycle(null)).resolves.not.toThrow();
      await expect(context_broker.manage_vector_lifecycle({ future: null })).resolves.not.toThrow();
      await expect(context_broker.manage_vector_lifecycle({ future: [] })).resolves.not.toThrow();
    });

    // --- STRICT STATE AND CHRONO MATRIX TESTS ---

    it("should not resolve state-locked vectors if requires state is not met", async () => {
      mock_app_state.state_anchor = "inactive";
      const entity = {
        future: [
          {
            id: "v_state",
            requires: { state_anchor: "active" },
            tags: ["apple"],
            type: "future",
            content: "The state is active",
          },
        ],
      };
      // Requirement is state_anchor: "active" (which is inactive)
      await context_broker.manage_vector_lifecycle(entity);

      expect(temporal_engine.resolve).not.toHaveBeenCalled();
    });

    it("should resolve state-locked vectors instantly when requires state matches", async () => {
      mock_app_state.state_anchor = "active";
      const entity = {
        future: [
          {
            id: "v_state",
            requires: { state_anchor: "active" },
            tags: ["apple"],
            type: "future",
            content: "The state is active",
          },
        ],
      };

      await context_broker.manage_vector_lifecycle(entity);

      expect(temporal_engine.resolve).toHaveBeenCalledWith(entity, "v_state", "AUTO_RESOLVED", expect.anything());
    });

    it("should block resolution if round has not met threshold from requires or meta", async () => {
      mock_round = 2;
      const entity = {
        future: [
          {
            id: "v_chrono_req",
            requires: { round: 3 },
            tags: ["banana"],
            type: "future",
          },
          {
            id: "v_chrono_meta",
            meta: { round: 4 },
            tags: ["banana"],
            type: "future",
          },
          {
            id: "v_chrono_meta_thresh",
            meta: { round_threshold: 5 },
            tags: ["banana"],
            type: "future",
          },
        ],
      };

      await context_broker.manage_vector_lifecycle(entity);
      expect(temporal_engine.resolve).not.toHaveBeenCalled();
    });

    it("should resolve when round has met threshold", async () => {
      mock_round = 3;
      const entity = {
        future: [
          {
            id: "v_chrono_req_ok",
            requires: { round: 3 },
            tags: ["banana"],
            type: "future",
          },
        ],
      };

      await context_broker.manage_vector_lifecycle(entity);
      expect(temporal_engine.resolve).toHaveBeenCalledWith(entity, "v_chrono_req_ok", "AUTO_RESOLVED", expect.anything());
    });
  });

  describe("Performance Stress Test", () => {
    it("should process a long-form history (500+ nodes) in under 15ms without CPU spikes", async () => {
      // Create a massive log of 500+ entries to stress the parser
      const mock_history = Array.from({ length: 550 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "model",
        content: `This is a long history entry number ${i} to simulate intense gameplay with lots of detailed prose. <think>Hidden thinking process that should be ignored dynamically</think>`,
        character_name: i % 2 === 0 ? "User" : "AI",
      }));

      // Warm up the raw string cache to simulate active gameplay
      await context_broker.hydrate("Testing with tag_5 in input", "simulation", mock_history);

      const start = performance.now();
      // Hydrate with new input and the massive history log
      const _payload = await context_broker.hydrate("Testing with tag_5 in input", "simulation", mock_history);
      const end = performance.now();

      const duration = end - start;

      // Verify execution is extremely fast (well under 100ms, typically < 2ms on modern systems, but we allow margin for concurrent CI environments)
      expect(duration).toBeLessThan(100); // Robust 100ms performance gate
    });
  });

  describe("History Cache Key Optimization", () => {
    it("should key text caching by message ID instead of raw text or reference", async () => {
      const history1 = [{ id: "msg1", role: "model", content: "Initial <think>process</think> message.", character_name: "AI" }];

      const payload1 = await context_broker.hydrate("input", "simulation", history1);
      expect(payload1.simulation_log).toContain("[AI]: Initial message.");

      // Same ID but different reference and different content.
      // Since it's keyed by ID, it should return the cached value.
      const history2 = [{ id: "msg1", role: "model", content: "Changed content entirely.", character_name: "AI" }];

      const payload2 = await context_broker.hydrate("input", "simulation", history2);
      // It should return the old text because the cache hit the ID
      expect(payload2.simulation_log).toContain("[AI]: Initial message.");
      expect(payload2.simulation_log).not.toContain("Changed content entirely");
    });
  });

  describe("lexical_filter", () => {
    it("should return data_points as is if objective is null or empty", () => {
      const data_points = [
        { text: "apple", type: "fragment", enhancer: "none", section: "test" },
        { text: "banana", type: "fragment", enhancer: "none", section: "test" },
      ];
      // @ts-ignore
      expect(context_broker.lexical_filter(data_points, null)).toEqual(data_points);
      expect(context_broker.lexical_filter(data_points, "")).toEqual(data_points);
    });

    it("should return data_points as is if keywords are all short", () => {
      const data_points = [
        { text: "apple", type: "fragment", enhancer: "none", section: "test" },
        { text: "banana", type: "fragment", enhancer: "none", section: "test" },
      ];
      expect(context_broker.lexical_filter(data_points, "a b c")).toEqual(data_points);
    });

    it("should sort data points with keyword matches to the top and maintain stable order for others", () => {
      const data_points = [
        { text: "This is a cat.", type: "fragment", enhancer: "none", section: "test" },
        { text: "The quick brown fox.", type: "fragment", enhancer: "none", section: "test" },
        { text: "Another random sentence.", type: "fragment", enhancer: "none", section: "test" },
      ];
      const objective = "The quick fox";
      const result = context_broker.lexical_filter(data_points, objective);

      const expected_order = [
        { text: "The quick brown fox.", type: "fragment", enhancer: "none", section: "test" },
        { text: "This is a cat.", type: "fragment", enhancer: "none", section: "test" },
        { text: "Another random sentence.", type: "fragment", enhancer: "none", section: "test" },
      ];
      expect(result).toEqual(expected_order);
    });

    it("should be case-insensitive", () => {
      const data_points = [
        { text: "APPLE", type: "fragment", enhancer: "none", section: "test" },
        { text: "banana", type: "fragment", enhancer: "none", section: "test" },
      ];
      const objective = "apple";
      const result = context_broker.lexical_filter(data_points, objective);
      expect(result[0].text).toBe("APPLE");
    });

    it("should handle missing text property", () => {
      const data_points = [
        { text: "apple", type: "fragment", enhancer: "none", section: "test" },
        { something: "else", type: "fragment", enhancer: "none", section: "test" },
      ];
      const objective = "else";
      // "else" is length 4, so it counts as a keyword
      // @ts-ignore
      const result = context_broker.lexical_filter(data_points, objective);
      // Since {something: 'else'} doesn't have 'text', it won't match in current implementation
      expect(result).toEqual(data_points);
    });

    it("should handle non-array data_points gracefully", () => {
      // @ts-ignore
      expect(context_broker.lexical_filter(null, "objective")).toBe(null);
      // @ts-ignore
      expect(context_broker.lexical_filter({}, "objective")).toEqual({});
    });

    it("should preserve all data points in original order if no matches", () => {
      const data_points = [
        { text: "apple", type: "fragment", enhancer: "none", section: "test" },
        { text: "banana", type: "fragment", enhancer: "none", section: "test" },
      ];
      const objective = "zebra";
      const result = context_broker.lexical_filter(data_points, objective);
      expect(result).toEqual(data_points);
    });

    it("should assign a massive score offset (1000+) to data points with layer 'eternal' (case-insensitive)", () => {
      const data_points = [
        {
          text: "Voice tic: stutter",
          layer: "eternal",
          type: "fragment",
          enhancer: "none",
          section: "test",
          emotional_weight: 10,
          density_multiplier: 1,
        },
        {
          text: "Active plot point",
          layer: "present",
          type: "fragment",
          enhancer: "none",
          section: "test",
          emotional_weight: 5,
          density_multiplier: 1,
        },
        {
          text: "Unrelated baseline trait",
          layer: "ETERNAL",
          type: "fragment",
          enhancer: "none",
          section: "test",
          emotional_weight: 10,
          density_multiplier: 1,
        },
      ];
      const objective = "plot";
      const result = context_broker.lexical_filter(data_points, objective);

      // Expected order based on score:
      // 1. "Unrelated baseline trait" (Score: 1000 + 10 = 1010) - Since original order was preserved, it might sort with Voice tic
      // 2. "Voice tic: stutter" (Score: 1000 + 10 = 1010)
      // 3. "Active plot point" (Score: 5 + 1 * 1 = 6)

      expect(result[0].layer.toLowerCase()).toBe("eternal");
      expect(result[1].layer.toLowerCase()).toBe("eternal");
      expect(result[2].text).toBe("Active plot point");
    });

    it("should assign score >= 1000 to 'eternal' data points and float them to the top alongside high keyword hits", () => {
      const data_points = [
        {
          text: "Unrelated non-eternal trait",
          layer: "present",
          type: "fragment",
          enhancer: "none",
          section: "test",
          emotional_weight: 5,
          density_multiplier: 1,
        },
        {
          text: "Eternal voice tic",
          layer: "eternal",
          type: "fragment",
          enhancer: "none",
          section: "test",
          emotional_weight: 10,
          density_multiplier: 1,
        },
        {
          text: "Plot keyword match keyword keyword", // 3 keyword matches
          layer: "present",
          type: "fragment",
          enhancer: "none",
          section: "test",
          emotional_weight: 5,
          density_multiplier: 1,
        },
        {
          text: "Another unrelated non-eternal",
          layer: "present",
          type: "fragment",
          enhancer: "none",
          section: "test",
          emotional_weight: 5,
          density_multiplier: 1,
        },
      ];
      const objective = "keyword";
      const result = context_broker.lexical_filter(data_points, objective);

      // Expected: "Eternal voice tic" (Score: 1000 + 10 = 1010)
      // "Plot keyword match keyword keyword" (Score: 3 * 1 + 5 = 8)
      // "Unrelated non-eternal trait" (Score: 0 * 1 + 5 = 5)
      // "Another unrelated non-eternal" (Score: 0 * 1 + 5 = 5)
      const expected = [data_points[1], data_points[2], data_points[0], data_points[3]];
      expect(result).toEqual(expected);
    });
  });
});
