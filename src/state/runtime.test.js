import { beforeEach, describe, expect, it } from "vitest";
import { runtime } from "@state/runtime.svelte.js";

describe("Narrative Vector System", () => {
  beforeEach(() => {
    // Reset state before each test
    runtime._debug_inject({
      fractal: { id: "test-fractal", active: true, future: [] },
    });
  });

  it("should initialize with empty vectors", () => {
    // Default for FRACTAL is now handled by the caller or Simulation seeding
    expect(runtime.active_vectors("FRACTAL")[0]?.text).toBeUndefined();
    expect(runtime.active_vectors("FRACTAL")).toEqual([]);
  });

  it("should add a vector to the background (echoes)", () => {
    runtime.add_vector("Find the key.", "FRACTAL");
    expect(runtime.active_fractal.future).toHaveLength(1);
    expect(runtime.active_vectors("FRACTAL")[0].text).toBe("Find the key.");

    runtime.add_vector("Explore the cave.", "FRACTAL");
    expect(runtime.active_fractal.future).toHaveLength(2);
    // "Find the key" is still index 0 because we pushed
    expect(runtime.active_vectors("FRACTAL")[0].text).toBe("Find the key.");
    expect(runtime.active_vectors("FRACTAL")[1].text).toBe("Explore the cave.");
  });

  it("should add a vector to the front (is_vanguard)", () => {
    runtime.add_vector("Background Task", "FRACTAL");
    runtime.add_vector("Urgent Task", "FRACTAL", true); // isVanguard = true
    expect(runtime.active_vectors("FRACTAL")[0].text).toBe("Urgent Task");
    expect(runtime.active_vectors("FRACTAL")[1].text).toBe("Background Task");
  });

  it("should complete the active vector and promote the next one", () => {
    runtime.add_vector("Task A", "FRACTAL");
    runtime.add_vector("Task B", "FRACTAL");
    expect(runtime.active_vectors("FRACTAL")[0].text).toBe("Task A");
    runtime.complete_vector("FRACTAL");
    expect(runtime.active_vectors("FRACTAL")[0].text).toBe("Task B");
    expect(runtime.active_fractal.future).toHaveLength(1);
  });

  it("should handle completeVector on empty vectors safely", () => {
    runtime.complete_vector("FRACTAL");
    expect(runtime.active_fractal.future).toEqual([]);
  });
});
