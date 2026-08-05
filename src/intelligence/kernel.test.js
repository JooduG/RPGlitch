import { context_broker } from "./context.svelte.js";
import { dynamics_engine, evaluate_image_trigger } from "./dynamics.js";
import { gamemaster } from "./kernel.js";
import { prompt_builder } from "./prompts.js";
import { temporal_engine } from "./temporal.js";
import { visual_engine } from "@media";
import { llm_service } from "@platform";
import { session_driver } from "@engine";
import { beforeEach, describe, expect, it, vi } from "vitest";

const _mock_runtime = {
  ai: { intensity: 50 },
  fractal: { entropy: 50 },
  active_ai: { name: "Viper" },
  active_fractal: { name: "Void" },
  active_user: null,
  round: 1,
  turn_type: "USER_TURN",
  structural_errors: 0,
  story_id: null,
  add_vector: vi.fn(),
  get snapshot_entities() {
    return {
      AI: { name: "Viper", dynamics: { intensity: 50 } },
      USER: { name: "Ghost" },
      FRACTAL: { name: "Void", dynamics: { entropy: 50 } },
    };
  },
  update_entity: vi.fn(),
};

const _mock_app = {
  log: vi.fn(),
  start_stream: vi.fn(),
  update_stream: vi.fn(),
  end_stream: vi.fn(),
  signal_stream_error: vi.fn(),
  prologue: "",
  busy: false,
  models_ready: true,
  is_ready: true,
  selected_count: 3,
  streaming: {
    active: false,
    content: "",
    node_id: null,
    role: "ai",
    abort_controller: null,
    text: "",
    errored: false,
    errored_node_id: null,
  },
};

const _mock_simulation_state = {
  phase: "idle",
  start_generation: vi.fn(),
  complete: vi.fn(),
};

// Mock dependencies
vi.mock("@intelligence/context.svelte.js", () => ({
  context_broker: {
    hydrate: vi.fn(),
  },
}));

vi.mock("@intelligence/prompts.js", () => ({
  prompt_builder: {
    synthesize: vi.fn(),
    build_director_prompt: vi.fn(),
    build_character_prompt: vi.fn(),
    build_epilogue: vi.fn(),
    render_history: vi.fn(),
    render_protocols: vi.fn(),
    build_scoring_context: vi.fn(() => "Hello"),
  },
}));

vi.mock("@platform/transport.js", () => ({
  llm_service: {
    generate: vi.fn(),
  },
  sanitize_llm: vi.fn((text) => text),
}));

vi.mock("@engine/session.svelte.js", () => ({
  session_driver: {
    load_log: vi.fn().mockResolvedValue([]),
    log_message: vi.fn().mockResolvedValue({}),
    log_system_entry: vi.fn().mockResolvedValue({}),
    update_log_attachment: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    state_bridge: {
      get app() {
        return _mock_app;
      },
      get runtime() {
        return _mock_runtime;
      },
      get simulation_state() {
        return _mock_simulation_state;
      },
      get simulation_log() {
        return _mock_simulation_state;
      },
      get session_driver() {
        return {
          load_log: session_driver.load_log,
          log_message: session_driver.log_message,
          log_system_entry: session_driver.log_system_entry,
          update_log_attachment: session_driver.update_log_attachment,
        };
      },
    },
  };
});

vi.mock("@intelligence/temporal.js", () => ({
  temporal_engine: {
    ensure_momentum: vi.fn(),
    consolidate: vi.fn(),
    apply_state_mutations: vi.fn(),
    set_round: vi.fn(),
    precompute_context_embedding: vi.fn(async () => {}),
  },
}));

vi.mock("@intelligence/dynamics.js", () => ({
  dynamics_engine: {
    settle_physics: vi.fn().mockImplementation((dynamics) => {
      if (dynamics) dynamics.intensity = 60; // Mutate to verify change
    }),
    _get_baselines: vi.fn().mockReturnValue({}),
  },
  evaluate_image_trigger: vi.fn(() => ({ fired: false, crossed: false, sum: 0, reasons: [] })),
}));

vi.mock("@media", () => ({
  visual_engine: {
    visualize: vi.fn().mockResolvedValue({ imageUrl: null, refinedPrompt: null, caption: null }),
  },
}));

describe("gamemaster (Intelligence Kernel)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _mock_runtime.ai = { intensity: 50 };
    _mock_runtime.fractal = { entropy: 50 };
    _mock_runtime.structural_errors = 0;
  });

  describe("capture_dynamics_delta()", () => {
    it("logs telemetry with system role and correct type when deltas exist", async () => {
      const snapshot = {
        ai: { dynamics: { intensity: 60 } }, // +10 from runtime
        fractal: { dynamics: { entropy: 40 } }, // -10 from runtime
      };

      await gamemaster.capture_dynamics_delta(snapshot);

      expect(session_driver.log_system_entry).toHaveBeenCalledWith(
        expect.stringContaining("Intensity +10"),
        "system",
        expect.objectContaining({
          type: "DYNAMICS_DELTA",
          updates: expect.objectContaining({
            AI_CHARACTER: expect.objectContaining({
              name: "Viper",
              present_mutations: { physical: "", non_physical: "" },
              eternal_mutations: { physical: "", non_physical: "" },
              vectors: { resolved: [], new: [] },
              dynamics: expect.arrayContaining([
                expect.objectContaining({
                  axis: "intensity",
                  old_value: 50,
                  new_value: 60,
                  diff: 10,
                }),
              ]),
            }),
            FRACTAL: expect.objectContaining({
              name: "Void",
              dynamics: expect.arrayContaining([expect.objectContaining({ axis: "entropy", old_value: 50, new_value: 40, diff: -10 })]),
            }),
          }),
        }),
      );
    });

    it("logs the normalized updates shape (renames, merges, retrieval sorting)", async () => {
      const snapshot = {
        ai: { dynamics: { intensity: 60 } },
        fractal: { dynamics: { entropy: 40 } },
      };
      const meta = {
        mutations: {
          AI_CHARACTER: {
            present_append_physical: "torn coat",
            present_append_non_physical: "quiet fury",
            dynamics_deltas: { intensity: 10 },
            resolve_vectors: [{ id: "v-old", resolution_summary: "Resolved" }],
            new_vectors: [{ content: "A vow to the storm", type: "future", weight: 5 }],
            eternal_mutations: { physical: "scar", non_physical: "" },
          },
        },
        vectors: [
          {
            id: "v1",
            directive: "m",
            type: "past",
            emotional_weight: 7,
            _embedding: new Float32Array(384),
            _semantic_score: 0.5,
            _recency_factor: 0.9,
            _relevance: 3.2,
          },
          { id: "v2", directive: "goal", type: "future", emotional_weight: 9, _relevance: 8.1 },
        ],
      };

      await gamemaster.capture_dynamics_delta(snapshot, meta);

      expect(session_driver.log_system_entry).toHaveBeenCalledWith(
        expect.stringContaining("Intensity +10"),
        "system",
        expect.objectContaining({
          updates: expect.objectContaining({
            AI_CHARACTER: expect.objectContaining({
              name: "Viper",
              present_mutations: { physical: "torn coat", non_physical: "quiet fury" },
              eternal_mutations: { physical: "scar", non_physical: "" },
              vectors: expect.objectContaining({
                resolved: [{ id: "v-old", resolution_summary: "Resolved" }],
                new: [{ content: "A vow to the storm", type: "future", emotional_weight: 5 }],
                retrieval: [
                  { id: "v2", content: "goal", type: "future", emotional_weight: 9, _relevance: 8.1 },
                  { id: "v1", content: "m", type: "past", emotional_weight: 7, _relevance: 3.2 },
                ],
              }),
            }),
          }),
        }),
      );
    });

    it("includes USER_PERSONA only when it has mutations content", async () => {
      const snapshot = {
        ai: { dynamics: { intensity: 60 } },
        fractal: { dynamics: { entropy: 40 } },
      };
      _mock_runtime.active_user = { name: "Glitch" };
      const meta = {
        mutations: {
          USER_PERSONA: {
            present_append_non_physical: "His heart hammers against his ribs.",
            new_vectors: [{ content: "Attempt to hack the blast doors open.", type: "future", weight: 6 }],
          },
        },
      };

      await gamemaster.capture_dynamics_delta(snapshot, meta);

      expect(session_driver.log_system_entry).toHaveBeenCalledWith(
        expect.any(String),
        "system",
        expect.objectContaining({
          updates: expect.objectContaining({
            AI_CHARACTER: expect.objectContaining({ dynamics: expect.any(Array) }),
            USER_PERSONA: expect.objectContaining({
              name: "Glitch",
              present_mutations: { physical: "", non_physical: "His heart hammers against his ribs." },
              vectors: expect.objectContaining({
                new: [{ content: "Attempt to hack the blast doors open.", type: "future", emotional_weight: 6 }],
              }),
            }),
            FRACTAL: expect.objectContaining({ dynamics: expect.any(Array) }),
          }),
        }),
      );
      _mock_runtime.active_user = null;
    });

    it("includes thoughts and trigger_image in the telemetry payload", async () => {
      const snapshot = {
        ai: { dynamics: { intensity: 60 } },
        fractal: { dynamics: { entropy: 40 } },
      };
      const meta = {
        trigger_image: true,
        thoughts: "## Cognition\nHe plans the ambush.\n\n## Reasoning\nThe attack must stay silent.",
        mutations: {
          AI_CHARACTER: {
            new_vectors: [{ id: "valerius-f3", content: " Corner Glitch against the sterile walls.", type: "future", weight: 8 }],
          },
        },
      };

      await gamemaster.capture_dynamics_delta(snapshot, meta);

      expect(session_driver.log_system_entry).toHaveBeenCalledWith(
        expect.any(String),
        "system",
        expect.objectContaining({
          type: "DYNAMICS_DELTA",
          trigger_image: true,
          thoughts: "## Cognition\nHe plans the ambush.\n\n## Reasoning\nThe attack must stay silent.",
          updates: expect.objectContaining({
            AI_CHARACTER: expect.objectContaining({
              vectors: expect.objectContaining({
                new: [expect.objectContaining({ id: "valerius-f3", content: "Corner Glitch against the sterile walls.", emotional_weight: 8 })],
              }),
            }),
          }),
        }),
      );
    });

    it("defaults trigger_image to false and stamps retrieval vectors with their source type", async () => {
      const snapshot = {
        ai: { dynamics: { intensity: 60 } },
        fractal: { dynamics: { entropy: 40 } },
      };
      const meta = {
        vectors: [
          { id: "v1", directive: "exiled from court", type: "past", emotional_weight: 10, _relevance: 10.9 },
          { id: "v2", directive: "corner Glitch", type: "future", emotional_weight: 8, _relevance: 8.1 },
        ],
      };

      await gamemaster.capture_dynamics_delta(snapshot, meta);

      expect(session_driver.log_system_entry).toHaveBeenCalledWith(
        expect.any(String),
        "system",
        expect.objectContaining({
          trigger_image: false,
          updates: expect.objectContaining({
            AI_CHARACTER: expect.objectContaining({
              vectors: expect.objectContaining({
                retrieval: [
                  { id: "v1", content: "exiled from court", type: "past", emotional_weight: 10, _relevance: 10.9 },
                  { id: "v2", content: "corner Glitch", type: "future", emotional_weight: 8, _relevance: 8.1 },
                ],
              }),
            }),
          }),
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
    const mock_payload = {
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
      meta: { active_vector: "", timestamp: new Date().toISOString() },
    };

    vi.mocked(context_broker.hydrate).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director_prompt).mockReturnValue({
      system: "DIRECTOR_PROMPT",
      task: "DIRECTOR_TASK",
    });
    vi.mocked(prompt_builder.build_character_prompt).mockReturnValue({
      system: "CHARACTER_PROMPT",
      task: "CHARACTER_TASK",
      meta: {
        ai: {},
        fractal: {},
        flags: [],
        vectors: [],
      },
    });
    vi.mocked(llm_service.generate).mockResolvedValueOnce("{}").mockResolvedValueOnce("Identified.");

    const result = await gamemaster.execute_turn("story-123", {
      input: "Hello",
      role: "ai",
    });

    expect(context_broker.hydrate).toHaveBeenCalled();
    expect(prompt_builder.build_director_prompt).toHaveBeenCalled();
    expect(prompt_builder.build_character_prompt).toHaveBeenCalled();
    expect(llm_service.generate).toHaveBeenCalled();
    expect(result.response).toBe("Identified.");
  });

  it("execute_turn() precomputes the semantic context embedding before prompt building", async () => {
    const mock_payload = {
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
      rawMessages: [{ role: "model", content: "Last line of context" }],
      meta: { active_vector: "", timestamp: new Date().toISOString() },
    };

    vi.mocked(session_driver.load_log).mockResolvedValue([{ role: "model", content: "Last line of context" }]);
    vi.mocked(context_broker.hydrate).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director_prompt).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_character_prompt).mockReturnValue({
      system: "C",
      task: "T",
      meta: { ai: {}, fractal: {}, flags: [], vectors: [] },
    });
    vi.mocked(llm_service.generate).mockResolvedValueOnce("{}").mockResolvedValueOnce("Identified.");

    await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

    expect(prompt_builder.build_scoring_context).toHaveBeenCalledWith(
      "Hello",
      expect.arrayContaining([expect.objectContaining({ content: "Last line of context" })]),
    );
    expect(temporal_engine.precompute_context_embedding).toHaveBeenCalledWith("Hello");
  });

  it("execute_prologue() precomputes the semantic context embedding from the prologue input before synthesis", async () => {
    _mock_app.prologue = "The festival begins at dusk over the harbor of Vareld.";
    const mock_payload = {
      input: "The festival begins at dusk over the harbor of Vareld.",
      type: "prologue",
      round: 1,
      entities: {
        AI: { name: "Viper", vectors: [] },
        USER: { name: "Ghost", vectors: [] },
        FRACTAL: { name: "Void", vectors: [] },
      },
      view_id: "global",
      simulation_log: "",
      rawMessages: [],
      meta: { active_vector: "", timestamp: new Date().toISOString() },
    };

    vi.mocked(context_broker.hydrate).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.synthesize).mockReturnValue({ system: "PROLOGUE_SYSTEM", task: "PROLOGUE_TASK" });
    vi.mocked(prompt_builder.build_director_prompt).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_character_prompt).mockReturnValue({
      system: "C",
      task: "T",
      meta: { ai: {}, fractal: {}, flags: [], vectors: [] },
    });
    vi.mocked(llm_service.generate).mockResolvedValueOnce("Prologue prose.").mockResolvedValueOnce("{}").mockResolvedValueOnce("Identified.");

    await gamemaster.execute_prologue("story-123");

    expect(context_broker.hydrate).toHaveBeenCalledWith("The festival begins at dusk over the harbor of Vareld.", "prologue");
    expect(temporal_engine.precompute_context_embedding).toHaveBeenCalledWith("The festival begins at dusk over the harbor of Vareld.");
    expect(temporal_engine.precompute_context_embedding.mock.invocationCallOrder[0]).toBeLessThan(
      prompt_builder.synthesize.mock.invocationCallOrder[0],
    );

    _mock_app.prologue = "";
  });

  it("execute_epilogue() executes a targeted epilogue completion with full context", async () => {
    vi.mocked(prompt_builder.build_epilogue).mockReturnValue({ system: "EPILOGUE", task: "EPILOGUE_TASK", messages: [] });
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
    const mock_payload = {
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
      meta: { active_vector: "", timestamp: new Date().toISOString() },
    };

    beforeEach(() => {
      vi.mocked(context_broker.hydrate).mockResolvedValue(mock_payload);
      vi.mocked(prompt_builder.build_director_prompt).mockReturnValue({
        system: "DIRECTOR_PROMPT",
        task: "DIRECTOR_TASK",
      });
      vi.mocked(prompt_builder.build_character_prompt).mockReturnValue({
        system: "CHARACTER_PROMPT",
        task: "CHARACTER_TASK",
        meta: {
          ai: {},
          fractal: {},
          flags: [],
          vectors: [],
        },
      });
    });

    it("appends missing think block closure", async () => {
      vi.mocked(llm_service.generate).mockResolvedValueOnce("{}").mockResolvedValueOnce("<think>Analyzing user state");

      const result = await gamemaster.execute_turn("story-123", {
        input: "Hello",
        role: "ai",
      });

      expect(result.response).toBe("<think>Analyzing user state</think>");
      expect(session_driver.log_message).toHaveBeenCalledWith("<think>Analyzing user state</think>", expect.any(String), expect.any(String), {
        turn_type: "AI_TURN",
        meta: expect.any(Object),
      });
    });

    it("scrubs Chinese character bleed outside think block but keeps inside characters and spacing intact", async () => {
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce("{}")
        .mockResolvedValueOnce("<think>thought block containing 中文</think> Normal spacing and some 中文 character bleed.");

      const result = await gamemaster.execute_turn("story-123", {
        input: "Hello",
        role: "ai",
      });

      expect(result.response).toBe("<think>thought block containing 中文</think> Normal spacing and some  character bleed.");
      expect(session_driver.log_message).toHaveBeenCalledWith(
        "<think>thought block containing 中文</think> Normal spacing and some  character bleed.",
        expect.any(String),
        expect.any(String),
        { turn_type: "AI_TURN", meta: expect.objectContaining({ sino_logic_violation: true }) },
      );
    });

    it("handles normal English text and preserves spacing exactly", async () => {
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce("{}")
        .mockResolvedValueOnce("No think block here.   Multiple   spaces   remain   intact.");

      const result = await gamemaster.execute_turn("story-123", {
        input: "Hello",
        role: "ai",
      });

      expect(result.response).toBe("No think block here.   Multiple   spaces   remain   intact.");
      expect(session_driver.log_message).toHaveBeenCalledWith(
        "No think block here.   Multiple   spaces   remain   intact.",
        expect.any(String),
        expect.any(String),
        { turn_type: "AI_TURN", meta: expect.not.objectContaining({ sino_logic_violation: true }) },
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

    it("increments and decrements runtime.structural_errors through a rolling multi-turn sequence", async () => {
      _mock_runtime.structural_errors = 0; // Reset state for test

      // Mock LLM to return valid JSON for Director and then the respective text for Character
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(
          JSON.stringify({ mutations: { AI_CHARACTER: { present_append_physical: "some state", dynamics_deltas: { intensity: 5 } } } }),
        ) // Turn 1 Director
        .mockResolvedValueOnce("<think>Unclosed block") // Turn 1 Character
        .mockResolvedValueOnce(
          JSON.stringify({ mutations: { AI_CHARACTER: { present_append_physical: "some state", dynamics_deltas: { intensity: 5 } } } }),
        ) // Turn 2 Director
        .mockResolvedValueOnce("<think>Clean block</think> Normal text") // Turn 2 Character
        .mockResolvedValueOnce(
          JSON.stringify({ mutations: { AI_CHARACTER: { present_append_physical: "some state", dynamics_deltas: { intensity: 5 } } } }),
        ) // Turn 3 Director
        .mockResolvedValueOnce("<think>Clean block</think> Normal text"); // Turn 3 Character

      // Turn 1: Broken output, needs repair
      await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });
      expect(_mock_runtime.structural_errors).toBe(1);

      // Turn 2: Clean output, no repair needed (cooldown activates)
      await gamemaster.execute_turn("story-123", { input: "Hello again", role: "ai" });
      expect(_mock_runtime.structural_errors).toBe(0);

      // Turn 3: Clean output, hits the hard floor of 0
      await gamemaster.execute_turn("story-123", { input: "Hello again", role: "ai" });
      expect(_mock_runtime.structural_errors).toBe(0);
    });
  });

  describe("Asynchronous Validation Isolation & Telemetry Unification", () => {
    const mock_payload = {
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
      meta: { active_vector: "", timestamp: new Date().toISOString() },
    };

    beforeEach(() => {
      vi.mocked(context_broker.hydrate).mockResolvedValue(mock_payload);
      vi.mocked(prompt_builder.build_director_prompt).mockReturnValue({
        system: "DIRECTOR_PROMPT",
        task: "DIRECTOR_TASK",
      });
      vi.mocked(prompt_builder.build_character_prompt).mockReturnValue({
        system: "CHARACTER_PROMPT",
        task: "CHARACTER_TASK",
        meta: {
          ai: { intensity: 50 },
          fractal: { entropy: 50 },
          flags: [],
          vectors: [],
        },
      });
      _mock_runtime.ai = { intensity: 50 };
      _mock_runtime.fractal = { entropy: 50 };
      _mock_runtime.last_auto_image_round = null;
      vi.mocked(session_driver.log_message).mockResolvedValue({});
      vi.mocked(visual_engine.visualize).mockResolvedValue({ imageUrl: null, refinedPrompt: null, caption: null });
      vi.mocked(evaluate_image_trigger).mockReturnValue({ fired: false, crossed: false, sum: 0, reasons: [] });
    });

    it("does not simulate physics a second time after generation", async () => {
      vi.mocked(dynamics_engine.settle_physics).mockClear();
      vi.mocked(llm_service.generate).mockResolvedValue("<think>Analyzing user state");

      await gamemaster.execute_turn("story-123", {
        input: "shoot kill attack",
        role: "ai",
      });

      // Settle physics is called exactly twice (once for AI, once for Fractal)
      expect(dynamics_engine.settle_physics).toHaveBeenCalledTimes(2);
    });

    it("triggers capture_dynamics_delta exactly once per execution turn sequence", async () => {
      const telemetry_spy = vi.spyOn(gamemaster, "capture_dynamics_delta");
      vi.mocked(llm_service.generate).mockResolvedValue("Clean output response");

      await gamemaster.execute_turn("story-123", {
        input: "Hello",
        role: "ai",
      });

      expect(telemetry_spy).toHaveBeenCalledTimes(1);
      telemetry_spy.mockRestore();
    });

    it("syncs physics snapshots to global runtime before generation", async () => {
      // Setup dynamic metrics in pre-simulation that differ from start state
      _mock_runtime.ai = { intensity: 50 };

      // We only assert on the second call (Character generation)
      let call_count = 0;
      vi.mocked(llm_service.generate).mockImplementation(async () => {
        call_count++;
        if (call_count === 1) {
          return JSON.stringify({ mutations: { AI_CHARACTER: { present_append_physical: "some state", dynamics_deltas: { intensity: 5 } } } });
        }
        expect(_mock_runtime.ai?.intensity).not.toBe(50);
        return "shoot kill attack";
      });

      await gamemaster.execute_turn("story-123", {
        input: "shoot kill attack",
        role: "ai",
      });
      expect(call_count).toBe(2);
    });

    it("surfaces director thoughts and trigger_image through the telemetry payload", async () => {
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(
          JSON.stringify({
            _thought_process: "The room is a trap and the doors are sealed.",
            trigger_image: true,
            mutations: {
              AI_CHARACTER: {
                new_vectors: [{ content: " corner Glitch against the sterile walls.", type: "future", weight: 8 }],
              },
            },
          }),
        )
        .mockResolvedValueOnce("Identified.");

      await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      const payload = session_driver.log_system_entry.mock.calls[0][2];
      expect(payload.trigger_image).toBe(true);
      expect(payload.thoughts).toContain("## Reasoning");
      expect(payload.thoughts).toContain("The room is a trap and the doors are sealed.");
      expect(payload.updates.AI_CHARACTER.vectors.new[0].content).toBe("corner Glitch against the sterile walls.");
    });

    it("fires an automatic image when the Director explicitly triggers a tier", async () => {
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(
          JSON.stringify({
            _thought_process: "Moment worth capturing.",
            trigger_image: "character",
            mutations: {},
          }),
        )
        .mockResolvedValueOnce("The neon rain beads off Viper's coat.");
      vi.mocked(session_driver.log_message).mockResolvedValue({ id: 42 });
      vi.mocked(visual_engine.visualize).mockResolvedValue({
        imageUrl: "data:image/svg+xml;base64,eHh4",
        refinedPrompt: "Viper in the neon alley",
        metadata: { mode: "character" },
      });

      await gamemaster.execute_turn("story-123", { input: "The neon rain falls.", role: "ai" });

      expect(session_driver.log_message).toHaveBeenCalledWith(
        "The neon rain beads off Viper's coat.",
        "ai",
        "Viper",
        expect.objectContaining({
          turn_type: "AI_TURN",
          attachments: [{ src: null, metadata: { mode: "character", auto: true } }],
        }),
      );
      expect(visual_engine.visualize).toHaveBeenCalledWith("story-123", "The neon rain beads off Viper's coat.", "character", {
        silent: true,
      });
      expect(_mock_runtime.last_auto_image_round).toBe(1);
    });

    it("fills the auto-image attachment when the visualization resolves", async () => {
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(JSON.stringify({ trigger_image: "scene", mutations: {} }))
        .mockResolvedValueOnce("The storm breaks over the harbor.");
      vi.mocked(session_driver.log_message).mockResolvedValue({ id: 7 });
      vi.mocked(visual_engine.visualize).mockResolvedValue({
        imageUrl: "data:image/png;base64,eHh4",
        refinedPrompt: "Harbor storm",
        metadata: { mode: "scene" },
      });

      await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(session_driver.update_log_attachment).toHaveBeenCalledWith(7, 0, {
        src: "data:image/png;base64,eHh4",
        metadata: expect.objectContaining({ prompt: "Harbor storm", mode: "scene", auto: true }),
      });
    });

    it("fires a scene image from the pure-JS dynamics gate when the signal fires and cooldown allows", async () => {
      vi.mocked(evaluate_image_trigger).mockReturnValue({ fired: true, crossed: true, sum: 20, reasons: ["crossed:ai.chaos"] });
      vi.mocked(llm_service.generate).mockResolvedValueOnce("{}").mockResolvedValueOnce("The storm breaks.");
      vi.mocked(session_driver.log_message).mockResolvedValue({ id: 7 });

      await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      expect(session_driver.log_message).toHaveBeenCalledWith(
        "The storm breaks.",
        "ai",
        "Viper",
        expect.objectContaining({ attachments: [{ src: null, metadata: { mode: "scene", auto: true } }] }),
      );
      expect(visual_engine.visualize).toHaveBeenCalledWith("story-123", "The storm breaks.", "scene", { silent: true });
      expect(_mock_runtime.last_auto_image_round).toBe(1);
    });

    it("respects the shared cooldown for the dynamics gate (no fire when last image was recent)", async () => {
      _mock_runtime.last_auto_image_round = 1;
      vi.mocked(evaluate_image_trigger).mockReturnValue({ fired: true, crossed: true, sum: 20, reasons: ["crossed:ai.chaos"] });
      vi.mocked(llm_service.generate).mockResolvedValueOnce("{}").mockResolvedValueOnce("Calm seas.");
      vi.mocked(session_driver.log_message).mockResolvedValue({ id: 9 });

      await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      expect(session_driver.log_message).not.toHaveBeenCalledWith(
        "Calm seas.",
        "ai",
        "Viper",
        expect.objectContaining({ attachments: expect.any(Array) }),
      );
      expect(visual_engine.visualize).not.toHaveBeenCalled();
    });

    it("handles invalid JSON or missing brackets from Director by falling back to raw internal_monologue", async () => {
      let call_count = 0;
      vi.mocked(llm_service.generate).mockImplementation(async () => {
        call_count++;
        if (call_count === 1) {
          // Return raw prose missing brackets (representing invalid JSON/missing brackets)
          return "Orion looks angry and the room is dark";
        }
        return "Character response text";
      });

      const result = await gamemaster.execute_turn("story-123", {
        input: "Action input",
        role: "ai",
      });

      expect(call_count).toBe(2);
      expect(result.response).toBe("<think>\n## Cognition\nOrion looks angry and the room is dark\n</think>\n\nCharacter response text");
    });
  });
});
