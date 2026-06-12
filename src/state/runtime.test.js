import { app, runtime } from "@state";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Narrative Vector System", () => {
  beforeEach(() => {
    runtime.init_effects();
    // Reset state before each test
    runtime._debug_inject({
      fractal: /** @type {any} */ ({ id: "test-fractal", active: true, future: [] }),
    });
  });

  afterEach(() => {
    runtime.teardown_effects();
  });

  it("should initialize with empty vectors", () => {
    // Default for FRACTAL is now handled by the caller or Simulation seeding
    expect(runtime.active_fractal?.future?.[0]?.text).toBeUndefined();
    expect(runtime.active_fractal?.future).toEqual([]);
  });

  it("should add a vector to the background (echoes)", () => {
    runtime.add_vector("Find the key.", "FRACTAL");
    expect(runtime.active_fractal?.future).toHaveLength(1);
    expect(runtime.active_fractal?.future?.[0].text).toBe("Find the key.");

    runtime.add_vector("Explore the cave.", "FRACTAL");
    expect(runtime.active_fractal?.future).toHaveLength(2);
    // "Find the key" is still index 0 because we pushed
    expect(runtime.active_fractal?.future?.[0].text).toBe("Find the key.");
    expect(runtime.active_fractal?.future?.[1].text).toBe("Explore the cave.");
  });

  it("should add a vector to the front (is_vanguard)", () => {
    runtime.add_vector("Background Task", "FRACTAL");
    runtime.add_vector("Urgent Task", "FRACTAL", true); // isVanguard = true
    expect(runtime.active_fractal?.future?.[0].text).toBe("Urgent Task");
    expect(runtime.active_fractal?.future?.[1].text).toBe("Background Task");
  });

  it("should complete the active vector and promote the next one", () => {
    runtime.add_vector("Task A", "FRACTAL");
    runtime.add_vector("Task B", "FRACTAL");
    expect(runtime.active_fractal?.future?.[0].text).toBe("Task A");
    runtime.complete_vector("FRACTAL");
    expect(runtime.active_fractal?.future?.[0].text).toBe("Task B");
    expect(runtime.active_fractal?.future).toHaveLength(1);
  });

  it("should handle completeVector on empty vectors safely", () => {
    runtime.complete_vector("FRACTAL");
    expect(runtime.active_fractal?.future).toEqual([]);
  });

  describe("State Synchronization", () => {
    it("should synchronize app-level selected entities on debug inject", () => {
      const mockUser = {
        id: "user-1",
        name: "User One",
        eternal: { non_physical: "", physical: "" },
        present: { non_physical: "", physical: "" },
        past: [],
        future: [],
        dynamics: { chaos: 50, openness: 50, intensity: 50, affinity: 50 },
      };
      const mockAi = {
        id: "ai-1",
        name: "AI One",
        eternal: { non_physical: "", physical: "" },
        present: { non_physical: "", physical: "" },
        past: [],
        future: [],
        dynamics: { chaos: 50, openness: 50, intensity: 50, affinity: 50 },
      };
      const mockFractal = {
        id: "fractal-1",
        name: "Fractal One",
        eternal: { non_physical: "", physical: "" },
        present: { non_physical: "", physical: "" },
        past: [],
        future: [],
        dynamics: { velocity: 50, entropy: 50 },
      };

      runtime._debug_inject({
        user: mockUser,
        ai: mockAi,
        fractal: mockFractal,
      });

      expect(app.selected_user).toEqual(mockUser);
      expect(app.selected_ai).toEqual(mockAi);
      expect(app.selected_fractal).toEqual(mockFractal);
    });
  });
});
