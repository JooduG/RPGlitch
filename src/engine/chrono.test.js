import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChronoEngine, chrono_engine } from "./chrono.svelte.js";
import { app, runtime, session_driver, simulation_log, simulation_state } from "@state";
import { run_turn } from "./runner.js";
import { generate_opening } from "./lifecycle.js";

vi.mock("./runner.js", () => ({ run_turn: vi.fn().mockResolvedValue({}), continue_turn: vi.fn().mockResolvedValue({}) }));

vi.mock("./lifecycle.js", () => ({
  generate_opening: vi.fn().mockResolvedValue({}),
  generate_closing: vi.fn().mockResolvedValue({}),
  refine_image_prompt: vi.fn().mockResolvedValue({ prompt: "", negative_prompt: "" }),
  parse_entity_profile: vi.fn().mockResolvedValue(null),
}));

describe("ChronoEngine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    simulation_state.set_intent_active(false);
    try {
      simulation_state.unlock();
    } catch {
      /* real singleton starts unlocked */
    }
    try {
      simulation_state.complete();
    } catch {
      /* noop */
    }
    app.simulation.loading = false;
    simulation_log.clear();
    simulation_log.active_id = "story-123";
    runtime.round = 1;

    vi.spyOn(session_driver, "create_from_selection").mockResolvedValue("story-123");
    vi.spyOn(session_driver, "send").mockResolvedValue({});
    vi.spyOn(session_driver, "regenerate").mockResolvedValue({});
    vi.spyOn(session_driver, "load_log").mockResolvedValue([]);
    vi.spyOn(session_driver, "log_message").mockResolvedValue({ id: 1, created_at: Date.now() });
    vi.spyOn(simulation_log, "delete_entry").mockResolvedValue(undefined);
    vi.spyOn(app, "log").mockImplementation(() => {});
    vi.spyOn(app, "start_stream").mockImplementation(() => {});
    vi.spyOn(app, "update_stream").mockImplementation(() => {});
    vi.spyOn(app, "end_stream").mockImplementation(() => {});
    vi.spyOn(app, "set_view").mockImplementation(() => {});
    vi.spyOn(runtime, "sync").mockResolvedValue({});
    vi.spyOn(runtime, "save").mockResolvedValue({});
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
      app.simulation.loading = true;
      const result = await chrono_engine.send("Hello");
      expect(result).toBe(false);
      expect(session_driver.send).not.toHaveBeenCalled();
    });

    it("rejects when intent is locked", async () => {
      simulation_state.set_intent_active(true);
      const result = await chrono_engine.send("Hello");
      expect(result).toBe(false);
      expect(session_driver.send).not.toHaveBeenCalled();
    });

    it("accepts valid text and dispatches run_turn", async () => {
      const result = await chrono_engine.send("Look around");
      expect(result).toBe(true);
      expect(session_driver.send).toHaveBeenCalledWith("Look around");
      expect(run_turn).toHaveBeenCalled();
    });

    it("persists a user-role row when engine is on and dispatches run_turn", async () => {
      app.settings = { ...(app.settings || {}) };
      const result = await chrono_engine.send("Look around");
      expect(result).toBe(true);
      expect(session_driver.send).toHaveBeenCalledWith("Look around");
      expect(run_turn).toHaveBeenCalledWith("Look around", expect.objectContaining({ is_retry: undefined, is_continue: undefined }));
    });

    it("purges orphaned user turn row from IndexedDB when a turn is aborted", async () => {
      simulation_log.active_id = "story-123";
      session_driver.load_log.mockResolvedValueOnce([{ id: 42, role: "user", text: "Aborted user message" }]);
      run_turn.mockImplementationOnce(() => {
        const err = new Error("Generation interrupted");
        err.name = "AbortError";
        throw err;
      });

      const result = await chrono_engine.send("Aborted user message");
      expect(result).toBe(false);
      expect(simulation_log.delete_entry).toHaveBeenCalledWith(42);
      expect(app.log).toHaveBeenCalledWith("Generation interrupted cleanly.", "system");
    });
  });

  describe("start", () => {
    it("creates session, syncs runtime, and executes opening", async () => {
      const selection = {
        ai: { id: "ai-1", name: "Iris" },
        user: { id: "usr-1", name: "Player" },
        fractal: { id: "fr-1", name: "Citadel", visual_style: "photo", narrative_style: "casual" },
      };

      await chrono_engine.start(selection);

      expect(session_driver.create_from_selection).toHaveBeenCalledWith(expect.objectContaining({ ai_id: "ai-1", user_id: "usr-1", fractal_id: "fr-1" }));
      expect(runtime.sync).toHaveBeenCalledWith("story-123");
      expect(generate_opening).toHaveBeenCalledWith("story-123");
      expect(app.suppress_card_transitions).toBe(false);
    });
  });

  describe("retry and continue", () => {
    it("calls session_driver.regenerate on retry and advances turn", async () => {
      await chrono_engine.retry();
      expect(session_driver.regenerate).toHaveBeenCalled();
      expect(run_turn).toHaveBeenCalled();
    });

    it("advances turn on continue without incrementing round again if continue option is set", async () => {
      const initial_round = runtime.round;
      await chrono_engine.continue();
      expect(run_turn).toHaveBeenCalledWith("", expect.objectContaining({ is_continue: true }));
      expect(runtime.round).toBe(initial_round);
    });
  });
});
