import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChronoEngine, chrono_engine } from "./chrono.svelte.js";
import { app, execution, session } from "@state";
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
    execution.set_intent_active(false);
    execution.unlock();
    execution.complete();
    execution.set_loading(false);
    session.clear_feed();
    session.active_id = "story-123";
    session.round = 1;

    vi.spyOn(session, "create_from_selection").mockResolvedValue("story-123");
    vi.spyOn(session, "send_user_message").mockResolvedValue({});
    vi.spyOn(session, "rollback_for_retry").mockResolvedValue({});
    vi.spyOn(session, "load_log").mockResolvedValue([]);
    vi.spyOn(session, "log_message").mockResolvedValue({ id: 1, created_at: Date.now() });
    vi.spyOn(session, "delete_entry").mockResolvedValue(undefined);
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(app, "set_view").mockImplementation(() => {});
    vi.spyOn(session, "sync").mockResolvedValue();
    vi.spyOn(session, "save").mockResolvedValue();
  });

  it("exports a singleton chrono_engine instance", () => {
    expect(chrono_engine).toBeInstanceOf(ChronoEngine);
  });

  describe("send", () => {
    it("rejects empty text without advancing turn", async () => {
      const result = await chrono_engine.send("   ");
      expect(result).toBe(false);
      expect(session.send_user_message).not.toHaveBeenCalled();
    });

    it("rejects when execution is already loading", async () => {
      execution.set_loading(true);
      const result = await chrono_engine.send("Hello");
      expect(result).toBe(false);
      expect(session.send_user_message).not.toHaveBeenCalled();
    });

    it("rejects when intent is locked", async () => {
      execution.set_intent_active(true);
      const result = await chrono_engine.send("Hello");
      expect(result).toBe(false);
      expect(session.send_user_message).not.toHaveBeenCalled();
    });

    it("accepts valid text and dispatches run_turn", async () => {
      const result = await chrono_engine.send("Look around");
      expect(result).toBe(true);
      expect(session.send_user_message).toHaveBeenCalledWith("Look around");
      expect(run_turn).toHaveBeenCalled();
    });

    it("purges orphaned user turn row from IndexedDB when a turn is aborted", async () => {
      session.active_id = "story-123";
      session.load_log.mockResolvedValueOnce([{ id: 42, role: "user", text: "Aborted user message" }]);
      run_turn.mockImplementationOnce(() => {
        const err = new Error("Generation interrupted");
        err.name = "AbortError";
        throw err;
      });

      const result = await chrono_engine.send("Aborted user message");
      expect(result).toBe(false);
      expect(session.delete_entry).toHaveBeenCalledWith(42);
    });
  });

  describe("start", () => {
    it("creates session, syncs session store, and executes opening", async () => {
      const selection = {
        ai: { id: "ai-1", name: "Iris" },
        user: { id: "usr-1", name: "Player" },
        fractal: { id: "fr-1", name: "Citadel", visual_style: "photo", narrative_style: "casual" },
      };

      await chrono_engine.start(selection);

      expect(session.create_from_selection).toHaveBeenCalledWith(expect.objectContaining({ ai_id: "ai-1", user_id: "usr-1", fractal_id: "fr-1" }));
      expect(session.sync).toHaveBeenCalledWith("story-123");
      expect(generate_opening).toHaveBeenCalledWith("story-123");
      expect(app.suppress_card_transitions).toBe(false);
    });
  });

  describe("retry and continue", () => {
    it("calls session.rollback_for_retry on retry and advances turn", async () => {
      await chrono_engine.retry();
      expect(session.rollback_for_retry).toHaveBeenCalled();
      expect(run_turn).toHaveBeenCalled();
    });

    it("advances turn on continue without incrementing round again if continue option is set", async () => {
      const initial_round = session.round;
      await chrono_engine.continue();
      expect(run_turn).toHaveBeenCalledWith("", expect.objectContaining({ is_continue: true }));
      expect(session.round).toBe(initial_round);
    });
  });
});
