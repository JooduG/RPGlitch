import { Chrono } from "@engine";
import { gamemaster } from "@intelligence";
import { Shield } from "@platform";
import { app, runtime, simulationState } from "@state";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Security/Shield and Engine to avoid network requests and db access
vi.mock("@platform/security.js", () => {
  const mockSecurity = {
    sanitize: (/** @type {any} */ val) => val,
    sanitizeToFragment: (/** @type {any} */ val) => val,
    escape: (/** @type {any} */ val) => val,
    checkRefusal: () => false,
    clean: (/** @type {any} */ val) => (val ? val.trim() : ""),
    validateImage: async () => true,
    authorizeVisuals: () => true,
    process: vi.fn(),
  };
  return {
    Security: mockSecurity,
    Shield: mockSecurity,
    Snitch: mockSecurity,
    default: {
      Security: mockSecurity,
    },
  };
});

vi.mock("@intelligence", () => ({
  gamemaster: {
    execute_turn: vi.fn(),
  },
}));

describe("Chrono Intent Lock State Lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    app.simulation.loading = false;
    app.streaming.active = false;
    app.streaming.content = "";
    app.streaming.abort_controller = null;
    simulationState.phase = "idle";
    simulationState.set_intent_active(false);
    runtime.story_id = "test-story-id";
    runtime.round = 0;
    runtime.save = vi.fn().mockResolvedValue(undefined);
    /** @type {any} */ (Shield.process).mockResolvedValue({ causality: { result: "success" } });
  });

  it("should trigger intent lock immediately upon entering advance_turn and release after finally block", async () => {
    let resolveGeneration = () => {};
    const generationPromise = new Promise((resolve) => {
      resolveGeneration = /** @type {any} */ (resolve);
    });

    /** @type {any} */ (gamemaster.execute_turn).mockImplementation(() => generationPromise);

    // Call advance_turn. It starts a non-blocking background generator.
    const advancePromise = Chrono.advance_turn("hello");
    expect(advancePromise).toBeInstanceOf(Promise);

    // Verify intent lock triggers immediately (exact sub-millisecond)
    expect(simulationState.intent_active).toBe(true);
    expect(app.simulation.loading).toBe(true);

    // Complete the call to advance_turn
    await advancePromise;

    // Resolve the background generation to enter the finally cleanup block
    resolveGeneration();

    // Wait for macro-task catch/finally block queue to run
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify intent lock and loading are cleanly released
    expect(simulationState.intent_active).toBe(false);
    expect(app.simulation.loading).toBe(false);
    expect(simulationState.phase).toBe("idle");
  });
});
