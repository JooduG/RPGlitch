import { describe, expect, it, vi, beforeEach } from "vitest";
import { gamemaster } from "@core/intelligence/intelligence-kernel.js";
import { context_broker } from "@core/intelligence/context-broker.svelte.js";
import { prompt_builder } from "@core/intelligence/prompt-builder.js";
import { llm_service } from "@core/intelligence/llm-service.js";
import { session_driver } from "@core/engine/session-driver.svelte.js";

// Mock dependencies
vi.mock("@core/intelligence/context-broker.svelte.js", () => ({
  context_broker: {
    hydrate: vi.fn(),
  },
}));

vi.mock("@core/intelligence/prompt-builder.js", () => ({
  prompt_builder: {
    synthesize: vi.fn(),
    build_epilogue: vi.fn(),
    render_history: vi.fn(),
    render_protocols: vi.fn(),
  },
}));

vi.mock("@core/intelligence/llm-service.js", () => ({
  llm_service: {
    generate: vi.fn(),
  },
}));

vi.mock("@core/engine/session-driver.svelte.js", () => ({
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
  },
}));

vi.mock("@core/intelligence/temporal-engine.js", () => ({
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
        expect.stringContaining("AI.intensity: 60 (+10) [TEST_CAUSE]"),
        "system",
        expect.objectContaining({
          type: "telemetry",
          deltas: expect.arrayContaining([
            "AI.intensity: 60 (+10) [TEST_CAUSE]",
            "World.entropy: 40 (-10) [GM]",
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

  describe("generate_narrative_bridges()", () => {
    it("should generate narrative bridges for high entropy", () => {
      const state = {
        fractal: { dynamics: { entropy: 90 } },
        signal_prompts: ["Ambient chill."],
      };

      const bridges = gamemaster.generate_narrative_bridges(state);
      expect(bridges).toContain(
        "The environmental geometry is unstable. Weave sensory descriptions of physical glitches and non-linear decay directly into the background texture.",
      );
    });

    it("should generate narrative bridges for high intensity", () => {
      const state = {
        ai: { dynamics: { intensity: 90 } },
        signal_prompts: [],
      };

      const bridges = gamemaster.generate_narrative_bridges(state);
      expect(bridges).toContain(
        "The pacing is high-adrenaline. Express this intensity strictly through short sentences and immediate sensory physics.",
      );
    });

    it("should generate narrative bridges for low openness", () => {
      const state = {
        ai: { dynamics: { openness: 10 } },
        signal_prompts: [],
      };

      const bridges = gamemaster.generate_narrative_bridges(state);
      expect(bridges).toContain(
        "The character maintains cold distance, naturally deflecting personal inquiries within their dialogue.",
      );
    });

    it("should combine existing signal prompts with GM bridges", () => {
      const state = {
        ai: { dynamics: { intensity: 90 } },
        signal_prompts: ["Existing signal."],
      };

      const bridges = gamemaster.generate_narrative_bridges(state);
      expect(bridges).toEqual([
        "Existing signal.",
        "The pacing is high-adrenaline. Express this intensity strictly through short sentences and immediate sensory physics.",
      ]);
    });
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
});
