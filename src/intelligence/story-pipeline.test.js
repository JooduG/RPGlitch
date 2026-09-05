import { gamemaster } from "./story-pipeline.js";
import { context_builder } from "./payload.js";
import { physics_engine } from "./physics.js";
import { prompt_builder } from "./prompts/builder.js";
import { temporal_engine } from "./temporal-pipeline.js";
import { resolve_npc_entity, apply_in_scene_change, apply_relationships } from "./director.js";
import { spawn_character } from "./profile-pipeline.js";
import { capture_dynamics_delta } from "./telemetry.js";
import * as telemetry from "./telemetry.js";
import { llm_service } from "@platform";
import { session_driver } from "@data";
import { visual_engine, spawn_image_beat, sweep_stale_ghosts, resolve_image_trigger, reset_image_generation_queue } from "@media";
import { _image_generation_queue } from "@media/image-beats.js";
import { entities, stories } from "@data";
import { state_bridge } from "@utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const _mock_runtime = {
  ai: { intensity: 50 },
  fractal: { entropy: 50 },
  active_ai: { name: "Viper" },
  active_fractal: { name: "Void" },
  active_user: null,
  active_npcs: {},
  in_scene_npc_ids: [],
  streaming_entity_id: null,
  round: 1,
  turn_type: "USER_TURN",
  structural_errors: 0,
  story_id: null,
  last_director_beat_round: -1,
  last_dynamics_beat_round: -1,
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
  prologue: "",
  busy: false,
  models_ready: true,
  is_ready: true,
  selected_count: 3,
  streaming: {
    triggered: false,
    content: "",
    node_id: null,
    role: "ai",
    abort_controller: null,
  },
};

const _mock_simulation_state = {
  phase: "idle",
  start_generation: vi.fn(),
  complete: vi.fn(),
  set_generating_entity: vi.fn(),
  clear_generating_entity: vi.fn(),
};

// Mock dependencies

vi.mock("@intelligence/prompts/builder.js", () => ({
  prompt_builder: {
    build_prologue: vi.fn(),
    build_director: vi.fn(),
    build_character: vi.fn(),
    build_scene_narrator: vi.fn(),
    build_npc: vi.fn(() => ({
      system: "NPC_PROMPT",
      task: "NPC_TASK",
      meta: { ai: {}, fractal: {}, role: "npc", entity_id: null },
    })),
    build_epilogue: vi.fn(),
    render_history: vi.fn(),
    render_protocols: vi.fn(),
    build_scoring_context: vi.fn(() => "Hello"),
    build_terse_director_task: vi.fn(() => "<TASK>terse</TASK>"),
    build_profile_sorting: vi.fn(() => ({ system: "SYS", messages: [] })),
  },
  render_terse_director_task: vi.fn(() => "<TASK>terse</TASK>"),
}));

vi.mock("@platform/transport.js", () => ({
  llm_service: {
    generate: vi.fn(),
    enhance: vi.fn(),
  },
  sanitize_llm: vi.fn((text) => text),
  looks_truncated: vi.fn(() => false),
  raw_to_text: vi.fn((raw) => (typeof raw === "string" ? raw.trim() : String(raw?.generatedText ?? raw?.text ?? "").trim())),
  raw_stop_reason: vi.fn((raw) => {
    if (raw && typeof raw === "object" && !(raw instanceof String)) return "";
    return raw?.stopReason ? String(raw.stopReason) : "";
  }),
}));

vi.mock("@data/sessions.svelte.js", () => ({
  session_driver: {
    load_log: vi.fn().mockResolvedValue([]),
    log_message: vi.fn().mockResolvedValue({ id: "img-1" }),
    edit_log_entry: vi.fn().mockResolvedValue({}),
    log_system_entry: vi.fn().mockResolvedValue({}),
    update_log_attachment: vi.fn().mockResolvedValue({}),
    delete_log_entry: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../media/visual.svelte.js", () => ({
  visual_engine: {
    visualize: vi.fn().mockResolvedValue({ imageUrl: "https://img.test/auto.png", refinedPrompt: "Auto scene", metadata: {} }),
    generate: vi.fn(),
    enhance: vi.fn(),
    generate_candidates: vi.fn(),
    upload: vi.fn(),
  },
}));

vi.mock("@media/visual.svelte.js", () => ({
  visual_engine: {
    visualize: vi.fn().mockResolvedValue({ imageUrl: "https://img.test/auto.png", refinedPrompt: "Auto scene", metadata: {} }),
    generate: vi.fn(),
    enhance: vi.fn(),
    generate_candidates: vi.fn(),
    upload: vi.fn(),
  },
  VisualEngine: vi.fn(),
}));

vi.mock("@media", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    resolve_image_trigger: vi.fn().mockImplementation((params) => {
      if (params?.director_data?.trigger_image) {
        return {
          active: true,
          tier: "story_scene",
          source: "director",
          signals: {},
          deltas: [],
          next_director_round: params.turn_round,
          next_dynamics_round: null,
          next_auto_round: params.turn_round,
          director_explicit: true,
        };
      }
      return {
        active: false,
        signals: { band_entry: null, displacement: 0, displacement_threshold: 60 },
        tier: "story_scene",
        deltas: [],
        next_director_round: null,
        next_dynamics_round: null,
        next_auto_round: null,
        director_explicit: false,
        source: "dynamics",
      };
    }),
    IMAGE_TRIGGER: actual.IMAGE_TRIGGER,
  };
});

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
          edit_log_entry: session_driver.edit_log_entry,
          log_system_entry: session_driver.log_system_entry,
          update_log_attachment: session_driver.update_log_attachment,
          delete_log_entry: session_driver.delete_log_entry,
        };
      },
    },
  };
});

vi.mock("@intelligence/temporal-pipeline.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    temporal_engine: {
      ensure_momentum: vi.fn(),
      consolidate: vi.fn(),
      set_round: vi.fn(),
      precompute_context_embedding: vi.fn(async () => {}),
      create: vi.fn((content, type) => ({ content, type: type || "past", timestamp: Date.now() })),
    },
  };
});

vi.mock("./physics.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    physics_engine: {
      apply_dynamics_gravity: vi.fn().mockImplementation((dynamics) => {
        if (dynamics) dynamics.intensity = 60; // Mutate to verify change
      }),
      extract_entity_dynamics_baselines: vi.fn().mockReturnValue({}),
    },
  };
});

vi.mock("@data", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    entities: {
      upsert: vi.fn(async (type, entity) => entity),
      update: vi.fn(async () => 1),
      remove: vi.fn(async () => 1),
      get: vi.fn(async () => null),
    },
    stories: {
      ...actual.stories,
      get: vi.fn(async () => null),
      update_cast: vi.fn(async () => 1),
      conclude: vi.fn(async () => 1),
    },
  };
});

vi.mock("./director.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual };
});

describe("gamemaster (Intelligence Kernel)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    _mock_runtime.ai = { intensity: 50 };
    _mock_runtime.fractal = { entropy: 50 };
    _mock_runtime.structural_errors = 0;
    // Cooldown state is now authoritative for BOTH image sources, so every test
    // starts from the open-gate sentinel (-1) instead of inheriting mutations
    // from earlier tests.
    _mock_runtime.round = 1;
    _mock_runtime.last_director_beat_round = -1;
    _mock_runtime.last_dynamics_beat_round = -1;
    _mock_runtime.active_npcs = {};
    _mock_runtime.in_scene_npc_ids = [];
    _mock_runtime.streaming_entity_id = null;
    vi.spyOn(context_builder, "build_context");
  });

  describe("capture_dynamics_delta()", () => {
    it("logs telemetry with system role and correct type when deltas exist", async () => {
      const snapshot = {
        ai: { dynamics: { intensity: 60 } }, // +10 from runtime
        fractal: { dynamics: { entropy: 40 } }, // -10 from runtime
      };

      await capture_dynamics_delta(state_bridge, snapshot);

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
              vectors: { new: [] },
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
            state_append: { physical: "torn coat", non_physical: "quiet fury" },
            dynamics_deltas: { intensity: 10 },
            vector_append: [{ content: "A vow to the storm", type: "future", weight: 5 }],
            foundation_consolidated: { physical: "scar", non_physical: "" },
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

      await capture_dynamics_delta(state_bridge, snapshot, meta);

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
            state_append: { non_physical: "His heart hammers against his ribs." },
            vector_append: [{ content: "Attempt to hack the blast doors open.", type: "future", weight: 6 }],
          },
        },
      };

      await capture_dynamics_delta(state_bridge, snapshot, meta);

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
            vector_append: [{ id: "valerius-f3", content: " Corner Glitch against the sterile walls.", type: "future", weight: 8 }],
          },
        },
      };

      await capture_dynamics_delta(state_bridge, snapshot, meta);

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

      await capture_dynamics_delta(state_bridge, snapshot, meta);

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

      await capture_dynamics_delta(state_bridge, snapshot);

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
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };

    vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director).mockReturnValue({
      system: "DIRECTOR_PROMPT",
      task: "DIRECTOR_TASK",
    });
    vi.mocked(prompt_builder.build_character).mockReturnValue({
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

    expect(context_builder.build_context).toHaveBeenCalled();
    expect(prompt_builder.build_director).toHaveBeenCalled();
    expect(prompt_builder.build_character).toHaveBeenCalled();
    expect(llm_service.generate).toHaveBeenCalled();
    expect(result.response).toBe("Identified.");
  });

  it("execute_turn() auto-dispatches the epilogue when the Director declares CONCLUDED", async () => {
    const mock_payload = {
      input: "We did it.",
      type: "simulation",
      round: 1,
      entities: { AI: { name: "Viper" }, USER: { name: "Ghost" }, FRACTAL: { name: "Void" } },
      view_id: "global",
      simulation_log: "",
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };

    vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_character).mockReturnValue({
      system: "C",
      task: "T",
      meta: { ai: {}, fractal: {}, flags: [], vectors: [] },
    });
    vi.mocked(prompt_builder.build_epilogue).mockReturnValue({ system: "E", task: "ET" });
    vi.mocked(session_driver.load_log).mockResolvedValue([]);
    vi.mocked(llm_service.generate)
      .mockResolvedValueOnce('{"next_action":"EPILOGUE_CONCLUDED","keywords":[],"directors_note":"","dynamics_deltas":{}}')
      .mockResolvedValueOnce("Final words.")
      .mockResolvedValueOnce("And so it ends.");

    const conclude_spy = vi.spyOn(stories, "conclude").mockResolvedValue(undefined);

    const result = await gamemaster.execute_turn("story-123", { input: "We did it.", role: "ai" });

    expect(result.response).toBe("Final words.");
    expect(prompt_builder.build_epilogue).toHaveBeenCalled();
    expect(session_driver.log_message).toHaveBeenCalledWith(
      expect.stringContaining("And so it ends."),
      "fractal",
      "Void",
      expect.objectContaining({ meta: expect.objectContaining({ is_epilogue: true }) }),
    );
    expect(conclude_spy).toHaveBeenCalledWith("story-123");
    conclude_spy.mockRestore();
  });

  it("execute_turn() does not auto-dispatch an epilogue for IN_PROGRESS turns", async () => {
    const mock_payload = {
      input: "Hello",
      type: "simulation",
      round: 1,
      entities: { AI: { name: "Viper" }, USER: { name: "Ghost" }, FRACTAL: { name: "Void" } },
      view_id: "global",
      simulation_log: "",
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };

    vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_character).mockReturnValue({
      system: "C",
      task: "T",
      meta: { ai: {}, fractal: {}, flags: [], vectors: [] },
    });
    vi.mocked(llm_service.generate)
      .mockResolvedValueOnce('{"story_status":"IN_PROGRESS","speaker":"ai","keywords":[],"directive":"","trigger_image":"false"}')
      .mockResolvedValueOnce("Identified.");

    await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

    expect(prompt_builder.build_epilogue).not.toHaveBeenCalled();
  });

  it("execute_turn() records Director execution latency on runtime", async () => {
    const mock_payload = {
      input: "Hello",
      type: "simulation",
      round: 1,
      entities: { AI: { name: "Viper" }, USER: { name: "Ghost" }, FRACTAL: { name: "Void" } },
      view_id: "global",
      simulation_log: "",
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };

    const record_spy = vi.fn();
    state_bridge.runtime.record_director_latency = record_spy;

    vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_character).mockReturnValue({
      system: "C",
      task: "T",
      meta: { ai: {}, fractal: {}, flags: [], vectors: [] },
    });
    vi.mocked(llm_service.generate)
      .mockResolvedValueOnce('{"story_status":"IN_PROGRESS","speaker":"ai","keywords":[],"directive":"","trigger_image":"false"}')
      .mockResolvedValueOnce("Identified.");

    await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

    expect(record_spy).toHaveBeenCalledWith(expect.any(Number));
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
      raw_messages: [{ role: "model", content: "Last line of context" }],
      meta: { timestamp: new Date().toISOString() },
    };

    vi.mocked(session_driver.load_log).mockResolvedValue([{ role: "model", content: "Last line of context" }]);
    vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_character).mockReturnValue({
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
        AI: { name: "Viper", future: [], past: [] },
        USER: { name: "Ghost", future: [], past: [] },
        FRACTAL: { name: "Void", future: [], past: [] },
      },
      view_id: "global",
      simulation_log: "",
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };

    vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_prologue).mockReturnValue({ system: "PROLOGUE_SYSTEM", task: "PROLOGUE_TASK" });
    vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_character).mockReturnValue({
      system: "C",
      task: "T",
      meta: { ai: {}, fractal: {}, flags: [], vectors: [] },
    });
    vi.mocked(llm_service.generate).mockResolvedValue("Prologue prose.");

    await gamemaster.execute_prologue("story-123");

    expect(context_builder.build_context).toHaveBeenCalledWith("The festival begins at dusk over the harbor of Vareld.", "prologue");
    expect(temporal_engine.precompute_context_embedding).toHaveBeenCalledWith("The festival begins at dusk over the harbor of Vareld.");
    expect(temporal_engine.precompute_context_embedding.mock.invocationCallOrder[0]).toBeLessThan(
      prompt_builder.build_prologue.mock.invocationCallOrder[0],
    );
    // The prologue's own image opens the shared cooldown so the opening turn can't
    // immediately fire a second image at round 0.
    expect(_mock_runtime.last_director_beat_round).toBe(0);
    expect(_mock_runtime.last_dynamics_beat_round).toBe(0);

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
      "CONCLUDED",
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
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };

    beforeEach(() => {
      vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
      vi.mocked(prompt_builder.build_director).mockReturnValue({
        system: "DIRECTOR_PROMPT",
        task: "DIRECTOR_TASK",
      });
      vi.mocked(prompt_builder.build_character).mockReturnValue({
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
      expect(session_driver.log_message).toHaveBeenCalledWith(
        "<think>Analyzing user state</think>",
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ turn_type: "AI_TURN", story_id: "story-123" }),
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
        expect.objectContaining({ turn_type: "AI_TURN", story_id: "story-123" }),
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
          JSON.stringify({ mutations: { AI_CHARACTER: { state_append: { physical: "some state" }, dynamics_deltas: { intensity: 5 } } } }),
        ) // Turn 1 Director
        .mockResolvedValueOnce("<think>Unclosed block") // Turn 1 Character
        .mockResolvedValueOnce(
          JSON.stringify({ mutations: { AI_CHARACTER: { state_append: { physical: "some state" }, dynamics_deltas: { intensity: 5 } } } }),
        ) // Turn 2 Director
        .mockResolvedValueOnce("<think>Clean block</think> Normal text") // Turn 2 Character
        .mockResolvedValueOnce(
          JSON.stringify({ mutations: { AI_CHARACTER: { state_append: { physical: "some state" }, dynamics_deltas: { intensity: 5 } } } }),
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
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };

    beforeEach(() => {
      vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
      vi.mocked(prompt_builder.build_director).mockReturnValue({
        system: "DIRECTOR_PROMPT",
        task: "DIRECTOR_TASK",
      });
      vi.mocked(prompt_builder.build_character).mockReturnValue({
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
    });

    it("does not simulate physics a second time after generation", async () => {
      vi.mocked(physics_engine.apply_dynamics_gravity).mockClear();
      vi.mocked(llm_service.generate).mockResolvedValue("<think>Analyzing user state");

      await gamemaster.execute_turn("story-123", {
        input: "shoot kill attack",
        role: "ai",
      });

      // Gravity settlement is called exactly twice (once for AI, once for Fractal)
      expect(physics_engine.apply_dynamics_gravity).toHaveBeenCalledTimes(2);
    });

    it("triggers capture_dynamics_delta exactly once per execution turn sequence", async () => {
      const telemetry_spy = vi.spyOn(telemetry, "capture_dynamics_delta");
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
          return JSON.stringify({ mutations: { AI_CHARACTER: { state_append: { physical: "some state" }, dynamics_deltas: { intensity: 5 } } } });
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
            dynamics_deltas: { intensity: 10 },
          }),
        )
        .mockResolvedValueOnce("Identified.");

      await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      const payload = session_driver.log_system_entry.mock.calls[0][2];
      expect(payload.trigger_image).toBe(true);
      expect(payload.thoughts).toContain("The room is a trap and the doors are sealed.");
    });

    it("streams the director's _thought_process as its own think block and preserves the character's own think block", async () => {
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(
          JSON.stringify({
            _thought_process: "The door seals shut behind them.",
            mutations: { AI_CHARACTER: {} },
          }),
        )
        .mockResolvedValueOnce("<think>The character steadies itself.</think>\nIt moves deeper.");

      const result = await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      expect(result.response).toContain("<think>\nThe door seals shut behind them.\n</think>");
      expect(result.response).toContain("<think>The character steadies itself.</think>");
      expect(result.response).toContain("It moves deeper.");
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

      // Director prose attempt → terse JSON retry → character pass.
      expect(call_count).toBe(3);
      expect(result.response).toBe("<think>\nOrion looks angry and the room is dark\n</think>\n\nCharacter response text");
    });
  });

  describe("Image Trigger Engine (step 4.6)", () => {
    const mock_payload = {
      input: "Hello",
      type: "simulation",
      round: 1,
      entities: {
        AI: { name: "Viper", dynamics: { intensity: 50 } },
        USER: { name: "Ghost" },
        FRACTAL: { name: "Void", dynamics: { entropy: 50 } },
      },
      view_id: "global",
      simulation_log: "",
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };

    beforeEach(() => {
      vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
      vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "D", task: "T" });
      vi.mocked(prompt_builder.build_character).mockReturnValue({
        system: "C",
        task: "T",
        meta: { ai: {}, fractal: {}, flags: [], vectors: [] },
      });
      _mock_runtime.ai = { intensity: 50 };
      _mock_runtime.fractal = { entropy: 50 };
      _mock_runtime.round = 1;
      _mock_runtime.last_director_beat_round = -1;
      _mock_runtime.last_dynamics_beat_round = -1;
      reset_image_generation_queue();
      vi.clearAllMocks();
    });

    it("Source A: fires an auto-trigger when the dynamics gate triggers, honoring the shared cooldown state", async () => {
      vi.mocked(resolve_image_trigger).mockReturnValue({
        active: true,
        tier: "story_scene",
        source: "dynamics",
        signals: { band_entry: { axis: "intensity", from: 50, to: 88, band: "high" }, displacement: 38, displacement_threshold: 60 },
        next_director_round: null,
        next_dynamics_round: 1,
        next_auto_round: 1,
        director_explicit: false,
      });
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(JSON.stringify({ mutations: { AI_CHARACTER: {} } }))
        .mockResolvedValueOnce("Identified.");

      const result = await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      expect(resolve_image_trigger).toHaveBeenCalled();
      expect(result.meta.image_trigger).toBe(true);
      expect(result.meta.image_tier).toBe("story_scene");
      expect(result.meta.image_source).toBe("dynamics");
      expect(_mock_runtime.last_dynamics_beat_round).toBe(1);
      // Placeholder attachment logged immediately
      const placeholder_call = session_driver.log_message.mock.calls.find((c) => c[3]?.attachments?.[0]?.src === null);
      expect(placeholder_call).toBeDefined();
      expect(placeholder_call[3].attachments[0].metadata.mode).toBe("story_scene");
      // Background generation fired against the tier (not awaited)
      await vi.waitFor(() => expect(visual_engine.visualize).toHaveBeenCalled());
      expect(visual_engine.visualize).toHaveBeenCalledWith("story-123", expect.stringContaining("Hello"), "story_scene", { silent: true });
    });

    it("Source A: suppresses the auto-trigger while the shared cooldown is active", async () => {
      vi.mocked(resolve_image_trigger).mockReturnValue({
        active: false,
        tier: null,
        source: null,
        signals: { band_entry: { axis: "intensity", from: 50, to: 88, band: "high" }, displacement: 38, displacement_threshold: 60 },
        next_director_round: null,
        next_dynamics_round: null,
        next_auto_round: null,
        director_explicit: false,
      });
      _mock_runtime.last_dynamics_beat_round = 2; // round 1 < 2 + 3 → cooldown not elapsed
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(JSON.stringify({ mutations: { AI_CHARACTER: {} } }))
        .mockResolvedValueOnce("Identified.");

      const result = await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      expect(result.meta.image_trigger).toBe(false);
      expect(result.meta.image_tier).toBeNull();
      expect(visual_engine.visualize).not.toHaveBeenCalled();
      expect(_mock_runtime.last_dynamics_beat_round).toBe(2);
    });

    it("Source B: a director explicit trigger is suppressed while the shared cooldown is active", async () => {
      vi.mocked(resolve_image_trigger).mockReturnValue({
        active: false,
        tier: null,
        source: null,
        signals: { band_entry: null, displacement: 0, displacement_threshold: 60 },
        next_director_round: null,
        next_dynamics_round: null,
        next_auto_round: null,
        director_explicit: true,
      });
      _mock_runtime.last_director_beat_round = 2; // round 1 < 2 + 3 → cooldown not elapsed
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(JSON.stringify({ trigger_image: true, mutations: { AI_CHARACTER: {} } }))
        .mockResolvedValueOnce("Identified.");

      const result = await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      expect(result.meta.image_trigger).toBe(false);
      expect(result.meta.image_tier).toBeNull();
      expect(visual_engine.visualize).not.toHaveBeenCalled();
      expect(_mock_runtime.last_director_beat_round).toBe(2);
    });

    it("Source B: a director explicit trigger fires once the shared cooldown has elapsed and resets the timer", async () => {
      vi.mocked(resolve_image_trigger).mockReturnValue({
        active: true,
        tier: "story_scene",
        source: "director",
        signals: { band_entry: null, displacement: 0, displacement_threshold: 60 },
        next_director_round: 5,
        next_dynamics_round: null,
        next_auto_round: 5,
        director_explicit: true,
      });
      _mock_runtime.round = 5;
      _mock_runtime.last_director_beat_round = 2; // 5 >= 2 + 3 → cooldown elapsed
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(JSON.stringify({ trigger_image: true, mutations: { AI_CHARACTER: {} } }))
        .mockResolvedValueOnce("Identified.");

      const result = await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      expect(result.meta.image_trigger).toBe(true);
      expect(result.meta.image_source).toBe("director");
      expect(result.meta.image_tier).toBe("story_scene");
      expect(_mock_runtime.last_director_beat_round).toBe(5);
      await vi.waitFor(() => expect(visual_engine.visualize).toHaveBeenCalled());
    });

    it("Source B: director can supply an explicit 4-tier target string", async () => {
      vi.mocked(resolve_image_trigger).mockReturnValue({
        active: true,
        tier: "story_entities",
        source: "director",
        signals: { band_entry: null, displacement: 0, displacement_threshold: 60 },
        next_director_round: 5,
        next_dynamics_round: null,
        next_auto_round: 5,
        director_explicit: true,
      });
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(JSON.stringify({ trigger_image: "story_entities", mutations: { AI_CHARACTER: {} } }))
        .mockResolvedValueOnce("Identified.");

      const result = await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      expect(result.meta.image_tier).toBe("story_entities");
      await vi.waitFor(() => expect(visual_engine.visualize).toHaveBeenCalled());
      expect(visual_engine.visualize).toHaveBeenCalledWith(expect.anything(), expect.any(String), "story_entities", expect.anything());
    });

    it("resolves the placeholder attachment when the background generation completes", async () => {
      vi.mocked(resolve_image_trigger).mockReturnValue({
        active: true,
        tier: "story_scene",
        source: "dynamics",
        signals: { band_entry: null, displacement: 70, displacement_threshold: 60 },
        next_auto_round: 1,
        director_explicit: false,
      });
      vi.mocked(visual_engine.visualize).mockResolvedValue({
        imageUrl: "https://img.test/beat.png",
        refinedPrompt: "The vault door slams shut.",
        metadata: { seed: 42 },
      });
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(JSON.stringify({ mutations: { AI_CHARACTER: {} } }))
        .mockResolvedValueOnce("Identified.");

      await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      await vi.waitFor(() =>
        expect(session_driver.update_log_attachment).toHaveBeenCalledWith("img-1", 0, expect.objectContaining({ src: "https://img.test/beat.png" })),
      );
    });

    it("does not fire when neither source triggers", async () => {
      vi.mocked(resolve_image_trigger).mockReturnValue({
        active: false,
        tier: null,
        source: null,
        signals: { band_entry: null, displacement: 0, displacement_threshold: 60 },
        next_auto_round: null,
        director_explicit: false,
      });
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(JSON.stringify({ mutations: { AI_CHARACTER: {} } }))
        .mockResolvedValueOnce("Identified.");

      const result = await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      expect(result.meta.image_trigger).toBe(false);
      expect(session_driver.log_message).not.toHaveBeenCalledWith(
        expect.anything(),
        "fractal",
        expect.anything(),
        expect.objectContaining({ attachments: expect.any(Array) }),
      );
      expect(visual_engine.visualize).not.toHaveBeenCalled();
    });

    it("treats the -1 sentinel as an open cooldown gate so round-0 auto-triggers are allowed", async () => {
      vi.mocked(resolve_image_trigger).mockReturnValue({
        active: true,
        tier: "story_character",
        source: "dynamics",
        signals: { band_entry: { axis: "intensity", from: 50, to: 88, band: "high" }, displacement: 38, displacement_threshold: 60 },
        next_director_round: null,
        next_dynamics_round: 0,
        next_auto_round: 0,
        director_explicit: false,
      });
      _mock_runtime.round = 0;
      _mock_runtime.last_director_beat_round = -1;
      _mock_runtime.last_dynamics_beat_round = -1;
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(JSON.stringify({ mutations: { AI_CHARACTER: {} } }))
        .mockResolvedValueOnce("Identified.");

      const result = await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      expect(result.meta.image_trigger).toBe(true);
      expect(result.meta.image_tier).toBe("story_character");
      expect(_mock_runtime.last_dynamics_beat_round).toBe(0);
    });

    it("a real round-0 trigger does not permanently open the cooldown gate", async () => {
      vi.mocked(resolve_image_trigger).mockReturnValue({
        active: false,
        tier: null,
        source: null,
        signals: { band_entry: { axis: "intensity", from: 50, to: 88, band: "high" }, displacement: 38, displacement_threshold: 60 },
        next_director_round: null,
        next_dynamics_round: null,
        next_auto_round: null,
        director_explicit: false,
      });
      _mock_runtime.round = 1;
      _mock_runtime.last_dynamics_beat_round = 0; // a real round-0 (prologue) trigger
      vi.mocked(llm_service.generate)
        .mockResolvedValueOnce(JSON.stringify({ mutations: { AI_CHARACTER: {} } }))
        .mockResolvedValueOnce("Identified.");

      const result = await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

      // round 1 < 0 + 3 → cooldown still active; the gate must NOT treat 0 as "never triggered".
      expect(result.meta.image_trigger).toBe(false);
      expect(visual_engine.visualize).not.toHaveBeenCalled();
      expect(_mock_runtime.last_dynamics_beat_round).toBe(0);
    });

    it("marks the oldest beat's placeholder failed when the image queue overflows", async () => {
      vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify({ mutations: { AI_CHARACTER: {} } }));
      // Keep beats pending so the queue fills to capacity instead of resolving immediately.
      visual_engine.visualize.mockReturnValue(new Promise(() => {}));
      // Deterministic start: the module-level queue may hold leftovers from earlier tests.
      reset_image_generation_queue();

      // Fire one more beat than the queue capacity (5); the oldest must be evicted and deleted.
      for (let i = 0; i <= 5; i++) {
        await spawn_image_beat("story_scene", { source: "dynamics" });
      }

      await vi.waitFor(() => expect(session_driver.delete_log_entry).toHaveBeenCalledWith("img-1"));
      expect(_image_generation_queue.length).toBeLessThanOrEqual(5);
    });

    it("sweep_stale_ghosts deletes empty-text failed/stale ghosts and marks stale unfailed ones", async () => {
      _mock_runtime.story_id = "story-123";
      const now = Date.now();
      const ghost_age = 2 * 60 * 1000;
      session_driver.load_log.mockResolvedValue([
        { id: "ghost-failed", text: "", created_at: now, attachments: [{ src: null, metadata: { failed: true, image_ghost_swept: true } }] },
        { id: "ghost-stale", text: "", created_at: now - ghost_age - 1, attachments: [{ src: null, metadata: {} }] },
        { id: "ghost-fresh", text: "", created_at: now, attachments: [{ src: null, metadata: {} }] },
        { id: "ghost-stale-with-text", text: "Scene endures.", created_at: now - ghost_age - 1, attachments: [{ src: null, metadata: {} }] },
        { id: "resolved", text: "Done.", created_at: now, attachments: [{ src: "https://img.test/x.png", metadata: {} }] },
      ]);

      await sweep_stale_ghosts();

      expect(session_driver.delete_log_entry).toHaveBeenCalledWith("ghost-failed");
      expect(session_driver.delete_log_entry).toHaveBeenCalledWith("ghost-stale");
      expect(session_driver.delete_log_entry).not.toHaveBeenCalledWith("ghost-fresh");
      expect(session_driver.delete_log_entry).not.toHaveBeenCalledWith("ghost-stale-with-text");
      expect(session_driver.delete_log_entry).not.toHaveBeenCalledWith("resolved");
      expect(session_driver.update_log_attachment).toHaveBeenCalledWith(
        "ghost-stale-with-text",
        0,
        expect.objectContaining({ metadata: expect.objectContaining({ failed: true, image_ghost_swept: true }) }),
      );
    });
  });
});

describe("NPC world cast (track-npc-expansion)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _mock_runtime.active_npcs = {};
    _mock_runtime.in_scene_npc_ids = [];
    _mock_runtime.streaming_entity_id = null;
    _mock_runtime.story_id = null;
  });

  it("_resolve_npc_entity() resolves by id and by case-insensitive name", () => {
    _mock_runtime.active_npcs = { ben1: { id: "ben1", name: "Benedict" } };

    expect(resolve_npc_entity({ runtime: _mock_runtime }, "ben1")?.id).toBe("ben1");
    expect(resolve_npc_entity({ runtime: _mock_runtime }, "benedict")?.id).toBe("ben1");
    expect(resolve_npc_entity({ runtime: _mock_runtime }, "nobody")).toBeNull();
    expect(resolve_npc_entity({ runtime: _mock_runtime }, "")).toBeNull();
  });

  it("_apply_in_scene_change() moves NPCs on/off stage via the Director choreography", async () => {
    _mock_runtime.active_npcs = { a: { id: "a", name: "A" }, b: { id: "b", name: "B" } };
    _mock_runtime.in_scene_npc_ids = ["a", "b"];

    const changed = await apply_in_scene_change({ runtime: _mock_runtime }, { enter: ["c", "a"], exit: ["b"] });
    expect(changed).toBe(true);
    expect(_mock_runtime.in_scene_npc_ids.sort()).toEqual(["a", "c"]);
  });

  it("_apply_in_scene_change() is a no-op when the stage is unchanged", async () => {
    _mock_runtime.in_scene_npc_ids = ["a"];
    const changed = await apply_in_scene_change({ runtime: _mock_runtime }, { enter: ["a"] });
    expect(changed).toBe(false);
    expect(_mock_runtime.in_scene_npc_ids).toEqual(["a"]);

    const noop = await apply_in_scene_change({ runtime: _mock_runtime }, null);
    expect(noop).toBe(false);
  });

  it("spawn_character() genesis: persists, registers on the story, and puts the character on-stage", async () => {
    vi.mocked(entities.upsert).mockImplementation(async (type, entity) => ({ ...entity, id: "npc-mira-1", type: "character" }));
    vi.mocked(stories.get).mockResolvedValue({ id: 7, npc_ids: ["ben1"] });
    _mock_runtime.story_id = 7;
    _mock_runtime.active_npcs = { ben1: { id: "ben1", name: "Benedict" } };
    _mock_runtime.in_scene_npc_ids = ["ben1"];

    const npc = await spawn_character({ runtime: _mock_runtime, app: _mock_app }, { name: "Mira", description: "A fixer." });

    expect(npc.name).toBe("Mira");
    expect(entities.upsert).toHaveBeenCalledWith("character", expect.objectContaining({ name: "Mira" }));
    expect(stories.update_cast).toHaveBeenCalledWith(7, ["ben1", "npc-mira-1"]);
    expect(_mock_runtime.active_npcs["npc-mira-1"].name).toBe("Mira");
    expect(_mock_runtime.in_scene_npc_ids).toEqual(["ben1", "npc-mira-1"]);
  });

  it("spawn_character() requires a name", async () => {
    vi.mocked(entities.upsert).mockImplementation(async (type, entity) => ({ ...entity, id: "npc-x", type: "character" }));

    expect(await spawn_character({ runtime: _mock_runtime, app: _mock_app }, { name: "  " })).toBeNull();
    expect(await spawn_character({ runtime: _mock_runtime, app: _mock_app }, {})).toBeNull();
  });

  it("spawn_character() forwards the Director's signature_color for the character identity", async () => {
    vi.mocked(entities.upsert).mockImplementation(async (type, entity) => ({ ...entity, id: "npc-hue-1", type: "character" }));

    const npc = await spawn_character({ runtime: _mock_runtime, app: _mock_app }, { name: "Hue", signature_color: "Proud Purple" });

    expect(npc.signature_color).toBe("Proud Purple");
    expect(entities.upsert).toHaveBeenCalledWith("character", expect.objectContaining({ name: "Hue", signature_color: "Proud Purple" }));
  });

  it("spawn_character() synthesizes rich Twin-Cylinder profile when LLM enhances the draft", async () => {
    vi.mocked(llm_service.enhance).mockResolvedValueOnce(
      JSON.stringify({
        name: "Kaelen",
        description: "A seasoned archivist.",
        signature_color: "Electric Cyan",
        appearance: "[GENDER: male]\n[AGE: 38]\n[HAIR: silver]\n[EYES: grey]",
        personality: "Methodical, reserved, sharp-tongued.",
        current_look: "[CLOTHING: faded scholar robes]",
        state_of_mind: "Cautiously observing the newcomers.",
        future: "Will preserve the restricted records at all costs.",
        past: ["Surfaced from the lower archive with the black ledger."],
      }),
    );
    vi.mocked(entities.upsert).mockImplementation(async (type, entity) => ({ ...entity, id: "npc-kaelen-1", type: "character" }));

    const npc = await spawn_character(
      { runtime: _mock_runtime, app: _mock_app },
      { name: "Kaelen", description: "An archivist with silver hair.", signature_color: "Electric Cyan" },
    );

    expect(npc.name).toBe("Kaelen");
    expect(npc.signature_color).toBe("Electric Cyan");
    expect(npc.eternal.physical).toContain("[GENDER: male]");
    expect(npc.eternal.non_physical).toBe("Methodical, reserved, sharp-tongued.");
    expect(npc.present.physical).toContain("[CLOTHING: faded scholar robes]");
    expect(npc.present.non_physical).toBe("Cautiously observing the newcomers.");
    expect(npc.future).toBe("Will preserve the restricted records at all costs.");
    expect(npc.past[0].content).toBe("Surfaced from the lower archive with the black ledger.");
    expect(npc.past[0].id).toMatch(/^usr_/);
    expect(visual_engine.generate).toHaveBeenCalledWith("npc-kaelen-1", expect.objectContaining({ mode: "solo_entity" }));
  });

  it("execute_turn() synthesizes a new character inline and speaks as them when next_action is GENESIS", async () => {
    const mock_payload = {
      input: "A stranger steps out from the shadows.",
      type: "simulation",
      round: 2,
      entities: { AI: { name: "Viper" }, USER: { name: "Ghost" }, FRACTAL: { name: "Void" } },
      view_id: "global",
      simulation_log: "",
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };

    vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_npc).mockReturnValue({
      system: "GENESIS_NPC_PROMPT",
      task: "GENESIS_NPC_TASK",
      meta: { ai: {}, fractal: {}, role: "npc", entity_id: "npc-stranger-1" },
    });
    vi.mocked(entities.upsert).mockImplementation(async (type, entity) => ({ ...entity, id: "npc-stranger-1", type: "character" }));
    vi.mocked(stories.get).mockResolvedValue({ id: "story-123", npc_ids: [] });

    vi.mocked(llm_service.generate)
      .mockResolvedValueOnce(
        '{"next_action":"GENESIS","genesis":{"name":"Kaelen","description":"A hooded scout.","speaking_style":"lyrical","signature_color":"#38bdf8"},"keywords":["defiance"],"directors_note":"Approach slowly from the mist.","dynamics_deltas":{"intensity":10},"fractal_dynamics_deltas":{"velocity":5,"entropy":-5}}',
      )
      .mockResolvedValueOnce("Who goes there?");

    const result = await gamemaster.execute_turn("story-123", { input: "A stranger steps out.", role: "ai" });

    expect(result.response).toBe("Who goes there?");
    expect(_mock_runtime.active_npcs["npc-stranger-1"].name).toBe("Kaelen");
    expect(_mock_runtime.active_npcs["npc-stranger-1"].speaking_style).toBe("lyrical");
    expect(physics_engine.apply_dynamics_gravity).toHaveBeenCalledWith(
      expect.objectContaining({ intensity: 60 }),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.any(Set),
    );
    expect(physics_engine.apply_dynamics_gravity).toHaveBeenCalledWith(
      expect.objectContaining({ velocity: 55, entropy: 45 }),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.any(Set),
    );
  });

  it("execute_turn() delegates the turn to a world-cast NPC when the Director names one", async () => {
    const mock_payload = {
      input: "Who guards the gate?",
      type: "simulation",
      round: 2,
      entities: { AI: { name: "Viper" }, USER: { name: "Ghost" }, FRACTAL: { name: "Void" } },
      view_id: "global",
      simulation_log: "",
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };
    _mock_runtime.round = 2;
    _mock_runtime.active_npcs = { ben1: { id: "ben1", name: "Benedict" } };

    vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_npc).mockReturnValue({
      system: "NPC_PROMPT",
      task: "NPC_TASK",
      meta: { ai: {}, fractal: {}, role: "npc", entity_id: "ben1" },
    });
    vi.mocked(llm_service.generate)
      .mockResolvedValueOnce('{"next_action":"npc:ben1","keywords":[],"directors_note":"","dynamics_deltas":{}}')
      .mockResolvedValueOnce("I guard the gate. None pass without the Warden's seal.");

    const result = await gamemaster.execute_turn("story-123", { input: "Who guards the gate?", role: "ai" });

    expect(prompt_builder.build_npc).toHaveBeenCalledWith(
      mock_payload,
      expect.objectContaining({ id: "ben1", name: "Benedict" }),
      expect.anything(),
      expect.objectContaining({ speaker: "npc" }),
    );
    expect(prompt_builder.build_character).not.toHaveBeenCalled();
    expect(_mock_runtime.streaming_entity_id).toBe("ben1");
    expect(result.response).toBe("I guard the gate. None pass without the Warden's seal.");
    expect(session_driver.log_message).toHaveBeenCalledWith(
      "I guard the gate. None pass without the Warden's seal.",
      "npc",
      "Benedict",
      expect.objectContaining({ meta: expect.objectContaining({ speaker_type: "npc", entity_id: "ben1" }) }),
    );
  });

  it("coerces non-AI actions to AI_CHARACTER on round <= 1", async () => {
    const mock_payload = {
      input: "First contact.",
      type: "simulation",
      round: 1,
      entities: { AI: { name: "Viper" }, USER: { name: "Ghost" }, FRACTAL: { name: "Void" } },
      view_id: "global",
      simulation_log: "",
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };
    _mock_runtime.round = 1;
    _mock_runtime.active_npcs = { ben1: { id: "ben1", name: "Benedict" } };

    vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_character).mockReturnValue({
      system: "AI_PROMPT",
      task: "AI_TASK",
      meta: { ai: {}, fractal: {}, role: "ai" },
    });
    vi.mocked(llm_service.generate)
      .mockResolvedValueOnce('{"next_action":"npc:ben1","keywords":[],"directors_note":"","dynamics_deltas":{}}')
      .mockResolvedValueOnce("Viper responds instead.");

    const result = await gamemaster.execute_turn("story-123", { input: "First contact.", role: "ai" });

    expect(prompt_builder.build_character).toHaveBeenCalled();
    expect(result.response).toBe("Viper responds instead.");
  });

  it("execute_turn() falls back to the AI character when the Director names an unknown NPC", async () => {
    const mock_payload = {
      input: "Hello",
      type: "simulation",
      round: 1,
      entities: { AI: { name: "Viper" }, USER: { name: "Ghost" }, FRACTAL: { name: "Void" } },
      view_id: "global",
      simulation_log: "",
      raw_messages: [],
      meta: { timestamp: new Date().toISOString() },
    };

    vi.mocked(context_builder.build_context).mockResolvedValue(mock_payload);
    vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "D", task: "T" });
    vi.mocked(prompt_builder.build_character).mockReturnValue({
      system: "C",
      task: "T",
      meta: { ai: {}, fractal: {}, flags: [], vectors: [] },
    });
    vi.mocked(llm_service.generate)
      .mockResolvedValueOnce('{"story_status":"IN_PROGRESS","speaker":"npc:ghost-unknown","keywords":[],"directive":"","trigger_image":"false"}')
      .mockResolvedValueOnce("Identified.");

    const result = await gamemaster.execute_turn("story-123", { input: "Hello", role: "ai" });

    expect(prompt_builder.build_character).toHaveBeenCalled();
    expect(prompt_builder.build_npc).not.toHaveBeenCalled();
    expect(_mock_runtime.streaming_entity_id).toBeNull();
    expect(result.response).toBe("Identified.");
  });
});

describe("apply_in_scene_change (in-scene name tolerance)", () => {
  beforeEach(() => {
    _mock_runtime.active_npcs = { npc1: { id: "npc1", name: "Lord Benedict" } };
    _mock_runtime.in_scene_npc_ids = [];
  });

  it("resolves raw cast names (case-insensitive) as well as bare ids", async () => {
    await apply_in_scene_change(state_bridge, { enter: ["lord benedict"] });
    expect(_mock_runtime.in_scene_npc_ids).toContain("npc1");

    await apply_in_scene_change(state_bridge, { exit: ["LORD BENEDICT"] });
    expect(_mock_runtime.in_scene_npc_ids).not.toContain("npc1");
  });

  it("still resolves bare ids directly", async () => {
    await apply_in_scene_change(state_bridge, { enter: ["npc1"] });
    expect(_mock_runtime.in_scene_npc_ids).toContain("npc1");
  });

  it("ignores unknown names without mutating the roster", async () => {
    const changed = await apply_in_scene_change(state_bridge, { enter: ["Nobody Here"] });
    expect(changed).toBe(false);
    expect(_mock_runtime.in_scene_npc_ids).toEqual([]);
  });
});

describe("apply_relationships (Relational Mesh)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _mock_runtime.active_ai = { id: "ai-1", name: "Viper", type: "character", relationships: [] };
    _mock_runtime.active_user = { id: "user-1", name: "Ghost", type: "character", relationships: [] };
    _mock_runtime.active_fractal = { id: "fx-1", name: "Void", type: "fractal", relationships: [] };
    _mock_runtime.active_npcs = { npc1: { id: "npc1", name: "Mira", type: "character", relationships: [] } };
  });

  it("resolves sources by case-insensitive name and persists edges", async () => {
    await apply_relationships(state_bridge, ["Viper → Mira: alliance"]);
    expect(_mock_runtime.active_ai.relationships).toContain("Viper → Mira: alliance");
    expect(entities.upsert).toHaveBeenCalledWith("character", expect.objectContaining({ id: "ai-1", relationships: ["Viper → Mira: alliance"] }));
  });

  it("resolves sources by id and replaces existing edges to the same target", async () => {
    _mock_runtime.active_ai.relationships = ["Viper → Mira: alliance"];
    await apply_relationships(state_bridge, ["ai-1 → Mira: rivalry"]);
    expect(_mock_runtime.active_ai.relationships).toEqual(["ai-1 → Mira: rivalry"]);
  });

  it("caps the edge list at 12", async () => {
    const rels = Array.from({ length: 15 }, (_, i) => `Viper → Target${i}: edge ${i}`);
    await apply_relationships(state_bridge, rels);
    expect(_mock_runtime.active_ai.relationships.length).toBeLessThanOrEqual(12);
  });

  it("skips edges whose source resolves to nobody", async () => {
    await apply_relationships(state_bridge, ["Unknown → Mira: debt"]);
    expect(entities.upsert).not.toHaveBeenCalled();
  });

  it("writes fractal edges through the fractal upsert path", async () => {
    await apply_relationships(state_bridge, ["Void → Viper: looming danger"]);
    expect(entities.upsert).toHaveBeenCalledWith("fractal", expect.objectContaining({ id: "fx-1", relationships: ["Void → Viper: looming danger"] }));
    expect(_mock_runtime.active_fractal.relationships).toContain("Void → Viper: looming danger");
  });
});

describe("spawn_character (World-Cast Expansion)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _mock_runtime.active_ai = { id: "ai-1", name: "Viper", type: "character" };
    _mock_runtime.active_user = { id: "user-1", name: "Ghost", type: "character" };
    _mock_runtime.active_fractal = { id: "fx-1", name: "Void", type: "fractal" };
    _mock_runtime.active_npcs = {};
    _mock_runtime.in_scene_npc_ids = [];
    _mock_runtime.story_id = null;
  });

  it("spawns a new character and registers it on-stage", async () => {
    const npc = await spawn_character(state_bridge, { name: "Mira", description: "A scarred courier", speaking_style: "casual" });
    expect(npc).toBeDefined();
    expect(npc.name).toBe("Mira");
    const spawned = Object.values(_mock_runtime.active_npcs);
    expect(spawned).toHaveLength(1);
    expect(_mock_runtime.in_scene_npc_ids).toContain(npc.id);
    expect(_mock_app.log).toHaveBeenCalledWith(expect.stringContaining("Roster expanded"), "system");
  });

  it("forwards signature_color and speaking_style into the spawned entity", async () => {
    const npc = await spawn_character(state_bridge, {
      name: "Mira",
      description: "A courier.",
      signature_color: "Emerald Green",
      speaking_style: "lyrical",
    });

    expect(npc.signature_color).toBe("Emerald Green");
    expect(npc.speaking_style).toBe("lyrical");
  });
});

describe("execute_epilogue (conclusion badge)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prompt_builder.build_epilogue).mockReturnValue({ system: "E", task: "T" });
    vi.mocked(llm_service.generate).mockResolvedValue("The city exhales. Embers settle. It is over.");
    vi.mocked(session_driver.load_log).mockResolvedValue([]);
    vi.mocked(session_driver.log_message).mockResolvedValue({ id: "img-1" });
  });

  it("stamps conclusion_status and story_status on the epilogue meta", async () => {
    await gamemaster.execute_epilogue("story-1", "COLLAPSED");
    expect(session_driver.log_message).toHaveBeenCalledWith(
      expect.any(String),
      "fractal",
      expect.any(String),
      expect.objectContaining({
        meta: expect.objectContaining({
          is_epilogue: true,
          conclusion_status: "COLLAPSED",
          story_status: "COLLAPSED",
        }),
      }),
    );
  });

  it("defaults the conclusion to CONCLUDED", async () => {
    await gamemaster.execute_epilogue("story-1");
    const call = vi.mocked(session_driver.log_message).mock.calls.at(-1);
    expect(call[3].meta.conclusion_status).toBe("CONCLUDED");
    expect(call[3].meta.story_status).toBe("CONCLUDED");
  });

  it("detoxes epilogue prose according to the active speaker speaking style", async () => {
    _mock_runtime.active_fractal = { name: "Void", speaking_style: "clinical" };
    vi.mocked(llm_service.generate).mockResolvedValue("The air tasted of ozone and silence descended.");

    await gamemaster.execute_epilogue("story-1", "CONCLUDED");
    const call = vi.mocked(session_driver.log_message).mock.calls.at(-1);
    expect(call[0]).not.toMatch(/ozone/i);
  });
});

describe("director mutations telemetry integration (Bug 2 verification)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _mock_runtime.ai = { intensity: 50, chaos: 30 };
    _mock_runtime.fractal = { entropy: 40 };
    _mock_runtime.active_ai = { name: "Viper", id: "ai-1" };
    _mock_runtime.active_user = { name: "Ghost", id: "usr-1" };
    _mock_runtime.active_fractal = { name: "Void", id: "frac-1" };
    _mock_runtime.story_id = "story-123";

    vi.mocked(session_driver.load_log).mockResolvedValue([]);
    vi.mocked(prompt_builder.build_director).mockReturnValue({ system: "DIR_SYS", task: "DIR_TASK" });
    vi.mocked(prompt_builder.build_character).mockReturnValue({
      system: "CHAR_SYS",
      task: "CHAR_TASK",
      meta: { ai: {}, fractal: {}, role: "ai", entity_id: null },
    });
  });

  it("drives director mutations through execute_turn to capture_dynamics_delta and updates payload in production shape", async () => {
    vi.mocked(llm_service.generate)
      .mockResolvedValueOnce(
        JSON.stringify({
          _thought_process: "Tension escalating rapidly.",
          next_action: "AI_CHARACTER",
          keywords: ["vulnerability"],
          directors_note: "Hold your ground.",
          dynamics_deltas: { intensity: 10, chaos: 5 },
          fractal_dynamics_deltas: { entropy: 8 },
          state_append: { physical: "burned sleeves", non_physical: "tense breathing" },
          vector_append: [{ content: "Investigate reactor core", type: "future", weight: 7 }],
          mutations: {
            USER_PERSONA: {
              state_append: { physical: "dusty cloak", non_physical: "elevated pulse" },
              vector_append: [{ content: "Shield Viper from debris", type: "future", weight: 8 }],
            },
          },
        }),
      )
      .mockResolvedValueOnce("We need to move now.");

    await gamemaster.execute_turn("story-123", { input: "I step into the hallway.", role: "ai" });

    expect(session_driver.log_system_entry).toHaveBeenCalledTimes(1);
    const [, , payload] = session_driver.log_system_entry.mock.calls[0];
    expect(payload.type).toBe("DYNAMICS_DELTA");
    expect(payload.updates).toBeDefined();

    // Verify AI Character updates block
    expect(payload.updates.AI_CHARACTER).toBeDefined();
    expect(payload.updates.AI_CHARACTER.name).toBe("Viper");
    expect(payload.updates.AI_CHARACTER.present_mutations).toEqual({
      physical: "burned sleeves",
      non_physical: "tense breathing",
    });
    expect(payload.updates.AI_CHARACTER.vectors.new).toEqual([expect.objectContaining({ content: "Investigate reactor core", emotional_weight: 7 })]);

    // Verify User Persona updates block
    expect(payload.updates.USER_PERSONA).toBeDefined();
    expect(payload.updates.USER_PERSONA.name).toBe("Ghost");
    expect(payload.updates.USER_PERSONA.present_mutations).toEqual({
      physical: "dusty cloak",
      non_physical: "elevated pulse",
    });
    expect(payload.updates.USER_PERSONA.vectors.new).toEqual([expect.objectContaining({ content: "Shield Viper from debris", emotional_weight: 8 })]);

    // Verify Fractal updates block
    expect(payload.updates.FRACTAL).toBeDefined();
    expect(payload.updates.FRACTAL.name).toBe("Void");
  });
});

describe("execute_with_retry resilience diagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs distinct warn messages for model refusals vs network connection failures", async () => {
    const refusal_err = new Error("AI guardrail refusal triggered");
    refusal_err.is_refused = true;

    let attempts = 0;
    const fn_refusal = vi.fn(async () => {
      attempts++;
      if (attempts === 1) throw refusal_err;
      return "Success after recalibration";
    });

    const res = await gamemaster.execute_with_retry(fn_refusal, 1, 10);
    expect(res).toBe("Success after recalibration");
    expect(_mock_app.log).toHaveBeenCalledWith(expect.stringContaining("Model refusal / content guardrail triggered"), "warn");
  });

  it("recovers from Director refusal by retrying with the terse director task", async () => {
    let call_count = 0;
    const tasks_received = [];

    vi.mocked(llm_service.generate).mockImplementation(async (payload) => {
      call_count++;
      tasks_received.push(payload.task);
      if (call_count === 1) {
        // Director turn 1: Model refusal trigger phrase
        return "I cannot fulfill this request as an AI safety precaution.";
      }
      if (call_count === 2) {
        // Director turn 2 (terse retry): Valid director JSON
        return JSON.stringify({
          _thought_process: "Recovered via terse prompt.",
          next_action: "AI_CHARACTER",
          dynamics_deltas: { intensity: 5 },
        });
      }
      // Character pass
      return "The path is clear.";
    });

    const result = await gamemaster.execute_turn("story-123", { input: "Advance cautiously.", role: "ai" });
    expect(result.response).toContain("The path is clear.");
    expect(call_count).toBe(3);
    // First call received standard director task; second call received terse recovery task
    expect(tasks_received[1]).toContain("Return a single, COMPLETE, VALID JSON object");
  });
});
