import { Engine } from "@engine";
import { Shield } from "@platform";
import { app, runtime, simulationState } from "@state";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Chrono } from "./chrono.svelte.js";

// Mock Security/Shield and Engine
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

vi.mock("@engine/kernel.js", () => ({
  Engine: {
    generate_ai_response: vi.fn(),
  },
}));

vi.mock("@engine/session.svelte.js", () => ({
  session_driver: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Chrono Non-Blocking AI Generation & Interruption", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    app.simulation.loading = false;
    app.streaming.active = false;
    app.streaming.content = "";
    app.streaming.abort_controller = null;
    simulationState.phase = "idle";
    runtime.story_id = "test-story-id";
    runtime.round = 0;
    runtime.save = vi.fn().mockResolvedValue(undefined);
    /** @type {any} */ (Shield.process).mockResolvedValue({ causality: { result: "success" } });
  });

  it("should advance turn in a non-blocking background process and succeed", async () => {
    let resolveGeneration = () => {};
    const generationPromise = new Promise((resolve) => {
      resolveGeneration = /** @type {any} */ (resolve);
    });

    /** @type {any} */ (Engine.generate_ai_response).mockImplementation(() => generationPromise);

    // Call advance_turn. Since it's non-blocking, it should return immediately!
    const advancePromise = Chrono.advance_turn("hello");
    expect(advancePromise).toBeInstanceOf(Promise);
    await advancePromise; // The advance_turn function itself returns immediately!

    // Assert that loading lock is set to true and abort controller is set
    expect(app.simulation.loading).toBe(true);
    expect(app.streaming.abort_controller).toBeInstanceOf(AbortController);

    // Now resolve the generation
    resolveGeneration();

    // Wait for the background macro-task to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Assert that the turn successfully completed:
    // 1. Round is incremented
    expect(runtime.round).toBe(1);
    // 2. runtime.save was called
    expect(runtime.save).toHaveBeenCalledWith(1);
    // 3. UI stasis locks are released
    expect(app.simulation.loading).toBe(false);
    expect(simulationState.phase).toBe("idle");
    expect(app.streaming.abort_controller).toBeNull();
  });

  it("should allow immediate interruption and cleanly bypass persistence", async () => {
    let rejectGeneration = (/** @type {any} */ _err) => {};
    const generationPromise = new Promise((resolve, reject) => {
      rejectGeneration = reject;
    });

    /** @type {any} */ (Engine.generate_ai_response).mockImplementation(
      (/** @type {any} */ storyId, /** @type {any} */ options) => {
        // Simulate AbortController behavior when signal is aborted
        if (options?.signal) {
          if (options.signal.aborted) {
            const err = new Error("aborted");
            err.name = "AbortError";
            rejectGeneration(err);
          } else {
            options.signal.addEventListener("abort", () => {
              const err = new Error("aborted");
              err.name = "AbortError";
              rejectGeneration(err);
            });
          }
        }
        return generationPromise;
      },
    );

    // Advance turn (starts non-blocking background generator)
    await Chrono.advance_turn("hello");

    expect(app.simulation.loading).toBe(true);
    const controller = app.streaming.abort_controller;
    expect(controller).toBeInstanceOf(AbortController);

    // Wait a tick so `session_driver.send` can resolve and `Engine.generate_ai_response` can be called
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Trigger instant interruption
    app.trigger_interrupt();

    // Verify abort is called on the controller
    expect(controller?.signal.aborted).toBe(true);

    // Wait for the background macro-task catch and finally blocks to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Assert interruption results:
    // 1. Generation process terminates, round is STILL incremented (since it increments before generation)
    expect(runtime.round).toBe(1);
    expect(runtime.save).not.toHaveBeenCalled();
    // 2. State & locks are cleanly reset/released
    expect(app.simulation.loading).toBe(false);
    expect(simulationState.phase).toBe("idle");
    expect(app.streaming.abort_controller).toBeNull();
    expect(app.streaming.active).toBe(false);
    expect(app.streaming.content).toBe("");
  });
});
