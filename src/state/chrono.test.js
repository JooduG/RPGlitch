import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChronoEngine, chrono_engine } from "./chrono.svelte.js";
import { register_state_accessors } from "@utils";
import { session_driver } from "@data";
import { gamemaster } from "@intelligence";

vi.mock("@data", () => ({
  session_driver: {
    create_from_selection: vi.fn().mockResolvedValue("story-123"),
    send: vi.fn().mockResolvedValue({}),
    regenerate: vi.fn().mockResolvedValue({}),
    load_log: vi.fn().mockResolvedValue([]),
    log_system_entry: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@intelligence", () => ({
  gamemaster: {
    execute_prologue: vi.fn().mockResolvedValue({}),
    execute_turn: vi.fn().mockResolvedValue({}),
  },
  build_turn_summary: vi.fn().mockReturnValue("Turn summary"),
}));

describe("ChronoEngine", () => {
  let mock_app;
  let mock_simulation_state;
  let mock_runtime;
  let mock_simulation_log;

  beforeEach(() => {
    vi.clearAllMocks();
    mock_app = {
      simulation: { loading: false },
      story_title: "Test Story",
      suppress_card_transitions: false,
      begin_story_pending: false,
      _begin_flight_assets: null,
      view: "storyboard",
      set_view: vi.fn(),
      log: vi.fn(),
      end_stream: vi.fn(),
      streaming: {
        active: false,
        abort_controller: null,
        content: "",
        node_id: null,
        role: "ai",
      },
    };
    mock_simulation_state = {
      phase: "idle",
      intent_active: false,
      set_intent_active: vi.fn((val) => {
        mock_simulation_state.intent_active = val;
      }),
      start_generation: vi.fn(),
      set_generating_entity: vi.fn(),
      complete: vi.fn(),
      lock: vi.fn(() => {
        mock_simulation_state.phase = "locked";
      }),
      unlock: vi.fn(() => {
        mock_simulation_state.phase = "idle";
      }),
    };
    mock_runtime = {
      story_id: "story-123",
      round: 1,
      sync: vi.fn().mockResolvedValue({}),
      save: vi.fn().mockResolvedValue({}),
    };
    mock_simulation_log = {
      feed: [],
      add: vi.fn(),
    };

    register_state_accessors({
      app: mock_app,
      simulation_state: mock_simulation_state,
      runtime: mock_runtime,
      simulation_log: mock_simulation_log,
    });
  });

  it("exports a singleton chrono_engine instance", () => {
    expect(chrono_engine).toBeInstanceOf(ChronoEngine);
  });

  describe("send", () => {
    it("rejects empty text without advancing turn", async () => {
      const result = await chrono_engine.send("   ");
      expect(result).toBe(false);
      expect(session_driver.send).not.toHaveBeenCalled();
    });

    it("rejects when simulation is already loading", async () => {
      mock_app.simulation.loading = true;
      const result = await chrono_engine.send("Hello");
      expect(result).toBe(false);
      expect(session_driver.send).not.toHaveBeenCalled();
    });

    it("rejects when intent is locked", async () => {
      mock_simulation_state.intent_active = true;
      const result = await chrono_engine.send("Hello");
      expect(result).toBe(false);
      expect(session_driver.send).not.toHaveBeenCalled();
    });

    it("accepts valid text and dispatches execute_turn", async () => {
      const result = await chrono_engine.send("Look around");
      expect(result).toBe(true);
      expect(session_driver.send).toHaveBeenCalledWith("Look around");
      expect(gamemaster.execute_turn).toHaveBeenCalled();
    });
  });

  describe("start", () => {
    it("creates session, syncs runtime, and executes prologue", async () => {
      const selection = {
        ai: { id: "ai-1", name: "Iris" },
        user: { id: "usr-1", name: "Player" },
        fractal: { id: "fr-1", name: "Citadel", visual_style: "photo", narrative_style: "casual" },
      };

      await chrono_engine.start(selection);

      expect(session_driver.create_from_selection).toHaveBeenCalledWith(
        expect.objectContaining({
          ai_id: "ai-1",
          user_id: "usr-1",
          fractal_id: "fr-1",
        }),
      );
      expect(mock_runtime.sync).toHaveBeenCalledWith("story-123");
      expect(gamemaster.execute_prologue).toHaveBeenCalledWith("story-123");
      expect(mock_app.suppress_card_transitions).toBe(false);
    });
  });

  describe("retry and continue", () => {
    it("calls session_driver.regenerate on retry and advances turn", async () => {
      await chrono_engine.retry();
      expect(session_driver.regenerate).toHaveBeenCalled();
      expect(gamemaster.execute_turn).toHaveBeenCalled();
    });

    it("advances turn on continue without incrementing round again if continue option is set", async () => {
      const initial_round = mock_runtime.round;
      await chrono_engine.continue();
      expect(gamemaster.execute_turn).toHaveBeenCalled();
      expect(mock_runtime.round).toBe(initial_round);
    });
  });
});
