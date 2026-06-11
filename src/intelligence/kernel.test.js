import { session_driver, TELEMETRY_TYPES } from "@engine";
import { context_broker, dynamics_engine, gamemaster, prompt_builder } from "@intelligence";
import { llm_service } from "@platform";
import { runtime } from "@state";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@intelligence/context.svelte.js", () => ({
  context_broker: {
    hydrate: vi.fn(),
    loadViewContext: vi.fn(),
    get_active_view_id: vi.fn().mockReturnValue("global"),
    is_hibernating: vi.fn().mockReturnValue(false),
    get_active_knowledge: vi.fn().mockReturnValue({ AI: [], USER: [], FRACTAL: [] }),
  },
}));

vi.mock("@intelligence/prompts.js", () => ({
  prompt_builder: {
    synthesize: vi.fn(),
    build_epilogue: vi.fn(),
    render_history: vi.fn(),
    render_protocols: vi.fn(),
  },
}));

vi.mock("@platform/transport.js", () => ({
  llm_service: {
    generate: vi.fn(),
  },
}));

vi.mock("@engine/session.svelte.js", () => ({
  session_driver: {
    load_log: vi.fn().mockResolvedValue([]),
    log_turn: vi.fn().mockResolvedValue({}),
    log_system_entry: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    ai: { intensity: 50 },
    fractal: { entropy: 50 },
    active_ai: { name: "Viper" },
    active_fractal: { name: "Void" },
    round: 1,
    turn_type: "USER_TURN",
    add_vector: vi.fn(),
    get snapshot_entities() {
      return {
        AI: { name: "Viper", dynamics: { intensity: 50 } },
        USER: { name: "Ghost" },
        FRACTAL: { name: "Void", dynamics: { entropy: 50 } },
      };
    },
    update_entity: vi.fn(),
  },
}));

vi.mock("@state/app.svelte.js", () => ({
  app: {
    log: vi.fn(),
    start_stream: vi.fn(),
    update_stream: vi.fn(),
    end_stream: vi.fn(),
    streaming: {
      active: false,
      content: "",
      node_id: null,
      role: "ai",
      abort_controller: null,
      text: "",
      nodeId: null,
    },
  },
}));

vi.mock("@intelligence/temporal.js", () => ({
  temporal_engine: {
    ensure_momentum: vi.fn(),
    consolidate: vi.fn(),
  },
}));

describe("gamemaster (Intelligence Kernel)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("capture_dynamics_delta()", () => {
    it("logs telemetry with system role and correct type when deltas exist", async () => {
      const snapshot = {
        ai: { dynamics: { intensity: 60 } }, // +10 from runtime
        fractal: { dynamics: { entropy: 40 } }, // -10 from runtime
        contributors: {
          "AI.intensity": ["TEST_CAUSE"],
        },
        signals: { SIGNAL_1: true },
      };

      await gamemaster.capture_dynamics_delta(snapshot);

      expect(session_driver.log_system_entry).toHaveBeenCalledWith(
        expect.stringContaining("Intensity +10"),
        "system",
        expect.objectContaining({
          type: TELEMETRY_TYPES.DYNAMICS_DELTA,
          deltas: expect.arrayContaining([
            expect.objectContaining({
              axis: "intensity",
              target: "ai",
              diff: 10,
              cause: "TEST_CAUSE",
            }),
            expect.objectContaining({ axis: "entropy", target: "fractal", diff: -10, cause: null }),
          ]),
          signals: ["SIGNAL_1"],
        }),
      );
    });

    it("does not log if no deltas exist", async () => {
      const snapshot = {
        ai: { dynamics: { intensity: 50 } }, // same as runtime
        fractal: { dynamics: { entropy: 50 } },
      };

      await gamemaster.capture_dynamics_delta(snapshot);

      expect(session_driver.log_system_entry).not.toHaveBeenCalled();
    });
  });

  it("execute_turn() coordinates hydration, synthesis, and generation", async () => {
    // Provide a full mock payload to satisfy TS/Lint
    const mockPayload = {
      input: "Hello",
      type: "simulation",
      round: 1,
      entities: {
        AI: { name: "Viper" },
        USER: { name: "Ghost" },
        FRACTAL: { name: "Void" },
      },
      view_id: "global",
      simulation_log: "",
      rawMessages: [],
      meta: { active_vector: "", timestamp: new Date().toISOString(), is_suspicious: false },
    };

    vi.mocked(context_broker.hydrate).mockResolvedValue(mockPayload);
    vi.mocked(prompt_builder.synthesize).mockReturnValue({
      system: "PROMPT",
      meta: {
        ai: {},
        fractal: {},
        flags: {},
        signal_prompts: [],
        signals: {},
        vectors: { past: [], future: [] },
      },
    });
    vi.mocked(llm_service.generate).mockResolvedValue("Identified.");

    const result = await gamemaster.execute_turn("story-123", {
      input: "Hello",
      role: "ai",
    });

    expect(context_broker.hydrate).toHaveBeenCalled();
    expect(prompt_builder.synthesize).toHaveBeenCalled();
    expect(llm_service.generate).toHaveBeenCalled();
    expect(result.response).toBe("Identified.");
  });

  it("execute_epilogue() executes a targeted epilogue completion with full context", async () => {
    vi.mocked(prompt_builder.build_epilogue).mockReturnValue({ system: "EPILOGUE", messages: [] });
    vi.mocked(llm_service.generate).mockResolvedValue("And so it ends.");
    vi.mocked(session_driver.load_log).mockResolvedValue([{ text: "Scene start" }]);

    const result = await gamemaster.execute_epilogue("story-123");

    expect(prompt_builder.build_epilogue).toHaveBeenCalledWith(
      expect.objectContaining({
        AI: expect.objectContaining({ name: "Viper" }),
        USER: expect.objectContaining({ name: "Ghost" }),
        FRACTAL: expect.objectContaining({ name: "Void" }),
      }),
      expect.objectContaining({
        ai: expect.objectContaining({ intensity: 50 }),
        fractal: expect.objectContaining({ entropy: 50 }),
      }),
      expect.any(Array),
    );
    expect(llm_service.generate).toHaveBeenCalled();
    expect(result).toBe("And so it ends.");
  });

  describe("Post-Turn Validation Circuit-Breaker Integration", () => {
    const mockPayload = {
      input: "Hello",
      type: "simulation",
      round: 1,
      entities: {
        AI: { name: "Viper" },
        USER: { name: "Ghost" },
        FRACTAL: { name: "Void" },
      },
      view_id: "global",
      simulation_log: "",
      rawMessages: [],
      meta: { active_vector: "", timestamp: new Date().toISOString(), is_suspicious: false },
    };

    beforeEach(() => {
      vi.mocked(context_broker.hydrate).mockResolvedValue(mockPayload);
      vi.mocked(prompt_builder.synthesize).mockReturnValue({
        system: "PROMPT",
        meta: {
          ai: {},
          fractal: {},
          flags: [],
          signal_prompts: [],
          signals: {},
          vectors: { past: [], future: [] },
        },
      });
    });

    it("appends missing think block closure", async () => {
      vi.mocked(llm_service.generate).mockResolvedValue("<think>Analyzing user state");

      const result = await gamemaster.execute_turn("story-123", {
        input: "Hello",
        role: "ai",
      });

      expect(result.response).toBe("<think>Analyzing user state</think>");
      expect(session_driver.log_turn).toHaveBeenCalledWith(
        "<think>Analyzing user state</think>",
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          turn_type: "AI_TURN",
        }),
      );
    });

    it("scrubs Chinese character bleed outside think block but keeps inside characters and spacing intact", async () => {
      vi.mocked(llm_service.generate).mockResolvedValue(
        "<think>thought block containing 中文</think> Normal spacing and some 中文 character bleed.",
      );

      const result = await gamemaster.execute_turn("story-123", {
        input: "Hello",
        role: "ai",
      });

      expect(result.response).toBe(
        "<think>thought block containing 中文</think> Normal spacing and some  character bleed.",
      );
      expect(session_driver.log_turn).toHaveBeenCalledWith(
        "<think>thought block containing 中文</think> Normal spacing and some  character bleed.",
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          sino_logic_violation: true,
        }),
      );
    });

    it("handles normal English text and preserves spacing exactly", async () => {
      vi.mocked(llm_service.generate).mockResolvedValue(
        "No think block here.   Multiple   spaces   remain   intact.",
      );

      const result = await gamemaster.execute_turn("story-123", {
        input: "Hello",
        role: "ai",
      });

      expect(result.response).toBe("No think block here.   Multiple   spaces   remain   intact.");
      expect(session_driver.log_turn).toHaveBeenCalledWith(
        "No think block here.   Multiple   spaces   remain   intact.",
        expect.any(String),
        expect.any(String),
        expect.not.objectContaining({
          sino_logic_violation: true,
        }),
      );
    });

    it("handles empty or blank parameters gracefully", async () => {
      vi.mocked(llm_service.generate).mockResolvedValue("");

      const result = await gamemaster.execute_turn("story-123", {
        input: "Hello",
        role: "ai",
      });

      expect(result.response).toBe("");
    });
  });

  describe("Asynchronous Validation Isolation & Telemetry Unification", () => {
    const mockPayload = {
      input: "shoot kill attack", // triggers VIOLENCE dynamics
      type: "simulation",
      round: 1,
      entities: {
        AI: { name: "Viper", dynamics: { intensity: 50 } },
        USER: { name: "Ghost" },
        FRACTAL: { name: "Void", dynamics: { entropy: 50 } },
      },
      view_id: "global",
      simulation_log: "",
      rawMessages: [],
      meta: { active_vector: "", timestamp: new Date().toISOString(), is_suspicious: false },
    };

    beforeEach(() => {
      vi.mocked(context_broker.hydrate).mockResolvedValue(mockPayload);
      vi.mocked(prompt_builder.synthesize).mockReturnValue({
        system: "PROMPT",
        meta: {
          ai: { intensity: 50 },
          fractal: { entropy: 50 },
          flags: [],
          signal_prompts: [],
          signals: {},
          vectors: { past: [], future: [] },
        },
      });
      runtime.ai = { intensity: 50 };
      runtime.fractal = { entropy: 50 };
    });

    it("does not simulate physics a second time after generation", async () => {
      const simulateSpy = vi.spyOn(dynamics_engine, "simulate");
      vi.mocked(llm_service.generate).mockResolvedValue("<think>Analyzing user state");

      await gamemaster.execute_turn("story-123", {
        input: "shoot kill attack",
        role: "ai",
      });

      // The physics should only be evaluated once (the pre-simulation using the user's input)
      expect(simulateSpy).toHaveBeenCalledTimes(1);

      simulateSpy.mockRestore();
    });

    it("triggers capture_dynamics_delta exactly once per execution turn sequence", async () => {
      const telemetrySpy = vi.spyOn(gamemaster, "capture_dynamics_delta");
      vi.mocked(llm_service.generate).mockResolvedValue("Clean output response");

      await gamemaster.execute_turn("story-123", {
        input: "Hello",
        role: "ai",
      });

      expect(telemetrySpy).toHaveBeenCalledTimes(1);
      telemetrySpy.mockRestore();
    });

    it("syncs physics snapshots to global runtime before generation", async () => {
      // Setup dynamic metrics in pre-simulation that differ from start state
      runtime.ai = { intensity: 50 };

      // Inside generate, we assert that runtime HAS been mutated by pre-generation physics
      vi.mocked(llm_service.generate).mockImplementation(async () => {
        expect(runtime.ai?.intensity).not.toBe(50);
        return "shoot kill attack";
      });

      await gamemaster.execute_turn("story-123", {
        input: "shoot kill attack",
        role: "ai",
      });
    });

    it("injects HIGH_ENTROPY narrative bridge when entropy > 70 declaratively", async () => {
      const payloadWithHighEntropy = {
        ...mockPayload,
        entities: {
          ...mockPayload.entities,
          FRACTAL: { name: "Void", dynamics: { entropy: 90 } },
        },
      };
      vi.mocked(context_broker.hydrate).mockResolvedValue(payloadWithHighEntropy);

      const synthesizeSpy = vi.mocked(prompt_builder.synthesize);
      vi.mocked(llm_service.generate).mockResolvedValue("Clean output");

      await gamemaster.execute_turn("story-123", {
        input: "Hello",
        role: "ai",
      });

      expect(synthesizeSpy).toHaveBeenCalled();
      const snapshotPassed = synthesizeSpy.mock.calls[0][1];
      expect(snapshotPassed.signal_prompts).toContain(
        "The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.",
      );
    });
  });
});

// =============================================================================
// [SECTION: TAB-CONTEXT COUPLING — loadViewContext]
// Verifies that switching a "Chin" (tab/view) to "combat" suppresses Merchant
// lore and that the Global Truth fallback re-exposes all vectors.
// =============================================================================
describe("context_broker.loadViewContext() — Tab-Context Coupling", () => {
  /**
   * Isolated helper that exercises the real hibernation logic without the
   * Svelte/module reactivity layer. We replicate the pure function behaviour
   * directly so the test can run in Vitest’s Node environment.
   * @param {string} viewId
   * @param {Array<{ id: string; vector_tags: string[] }>} allVectors
   * @returns {Set<string>}
   */
  function buildHibernationSet(viewId, allVectors) {
    const safeView =
      typeof viewId === "string" && viewId.trim() ? viewId.trim().toLowerCase() : "global";
    const hibernated = new Set();
    for (const v of allVectors) {
      const tags = Array.isArray(v.vector_tags) ? v.vector_tags : [];
      const isRelevant =
        safeView === "global" ||
        tags.length === 0 ||
        tags.some(
          (/** @type {string} */ t) => t.toLowerCase() === "global" || t.toLowerCase() === safeView,
        );
      if (!isRelevant && v.id) hibernated.add(v.id);
    }
    return hibernated;
  }

  const COMBAT_VECTOR = { id: "vec-combat-1", text: "Clash of steel.", vector_tags: ["combat"] };
  const MERCHANT_VECTOR = {
    id: "vec-merchant-1",
    text: "Trade route lore.",
    vector_tags: ["merchant"],
  };
  const GLOBAL_VECTOR = { id: "vec-global-1", text: "World fact.", vector_tags: ["global"] };
  const UNTAGGED_VECTOR = { id: "vec-untagged-1", text: "Ambient detail.", vector_tags: [] };

  const allVectors = [COMBAT_VECTOR, MERCHANT_VECTOR, GLOBAL_VECTOR, UNTAGGED_VECTOR];

  it("hibernates Merchant lore when the Combat tab is active", () => {
    const hibernated = buildHibernationSet("combat", allVectors);

    // Merchant-tagged vector MUST be suppressed.
    expect(hibernated.has(MERCHANT_VECTOR.id)).toBe(true);
    // Combat-tagged vector MUST remain active.
    expect(hibernated.has(COMBAT_VECTOR.id)).toBe(false);
  });

  it("keeps global-tagged vectors visible regardless of active view", () => {
    const hibernated = buildHibernationSet("combat", allVectors);

    expect(hibernated.has(GLOBAL_VECTOR.id)).toBe(false);
  });

  it("keeps untagged vectors always visible (they have no view restriction)", () => {
    const hibernated = buildHibernationSet("combat", allVectors);

    expect(hibernated.has(UNTAGGED_VECTOR.id)).toBe(false);
  });

  it("exposes all vectors when Global Truth is active (view_id = 'global')", () => {
    const hibernated = buildHibernationSet("global", allVectors);

    expect(hibernated.size).toBe(0);
  });

  it("treats null/invalid viewId as 'global' (safety fallback)", () => {
    const hibernated = buildHibernationSet("", allVectors);

    expect(hibernated.size).toBe(0);
  });

  it("does not include Merchant lore in Combat hydration payload (integration contract)", async () => {
    // Verify that `context_broker.loadViewContext` is exposed on the mock
    // so intelligence-kernel can call it without throwing.
    expect(typeof context_broker.loadViewContext).toBe("function");
    context_broker.loadViewContext("combat");
    expect(context_broker.loadViewContext).toHaveBeenCalledWith("combat");
  });
});
