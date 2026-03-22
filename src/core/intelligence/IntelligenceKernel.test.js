import { describe, it, expect, vi, beforeEach } from "vitest";
import { IntelligenceKernel } from "./IntelligenceKernel.js";
import { Session } from "@core/engine/SessionDriver.js";
import { LlmService } from "./LlmService.js";
import { runtime } from "@state/runtime.svelte.js";

// Mock dependencies
vi.mock("@core/engine/SessionDriver.js", () => ({
  Session: {
    load_log: vi.fn(),
    log_turn: vi.fn(),
    require_active: vi.fn(() => "story-123"),
  },
}));

vi.mock("./LlmService.js", () => ({
  LlmService: {
    generate: vi.fn(),
  },
}));

vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    round: 0,
    turn_type: "USER_TURN",
    active_vectors: vi.fn(() => [{ text: "Exploration" }]),
    active_vector: vi.fn(() => "Exploration"),
    add_vector: vi.fn(),
    active_ai: { name: "Ghost" },
    active_user: { name: "Player" },
    active_fractal: { name: "Void", future: [{ text: "Existing" }] },
    physics: {},
  },
}));

vi.mock("@state/app.svelte.js", () => ({
  app: {
    log: vi.fn(),
  },
}));

describe("IntelligenceKernel Orchestration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    runtime.round = 0;
  });

  it("should execute a full narrative turn", async () => {
    vi.mocked(Session.load_log).mockResolvedValue([{ role: "user", text: "Hello" }]);
    vi.mocked(LlmService.generate).mockResolvedValue("Identified.");

    const result = await IntelligenceKernel.execute_turn("story-123", {
      input: "Hi",
    });

    expect(runtime.round).toBe(1);
    expect(Session.load_log).toHaveBeenCalledWith("story-123");
    expect(LlmService.generate).toHaveBeenCalled();
    expect(Session.log_turn).toHaveBeenCalledWith("Identified.", "Ghost", "ai", expect.any(Object));
    expect(result.response).toBe("Identified.");
  });

  it("should execute a prologue", async () => {
    vi.mocked(LlmService.generate).mockResolvedValueOnce("Once upon a time..."); // Prologue
    vi.mocked(LlmService.generate).mockResolvedValueOnce("The adventure begins."); // Follow-up turn
    vi.mocked(Session.load_log).mockResolvedValue([]);

    await IntelligenceKernel.execute_prologue("story-123");

    expect(Session.log_turn).toHaveBeenCalledWith(
      "Once upon a time...",
      "Void",
      "fractal",
      expect.any(Object),
    );
    expect(runtime.round).toBe(1); // from executeTurn call inside executePrologue
  });

  it("should execute an epilogue", async () => {
    vi.mocked(LlmService.generate).mockResolvedValue("And so it ends.");

    const result = await IntelligenceKernel.execute_epilogue("story-123");

    expect(LlmService.generate).toHaveBeenCalled();
    expect(Session.log_turn).toHaveBeenCalledWith("And so it ends.", "Narrator", "ai");
    expect(result).toBe("And so it ends.");
  });
});
