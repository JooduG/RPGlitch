import { beforeEach, describe, expect, it } from "vitest";
import { runtime } from "./runtime.svelte.js";
describe("Narrative Vector System", () => {
  beforeEach(() => {
    // Reset state before each test
    runtime._debug_inject({
      fractal: { id: "test-fractal", active: true, future: [] },
    });
  });
  it("should initialize with empty vectors", () => {
    expect(runtime.active_vector("FRACTAL")).toBe("Continue the journey."); // Default for FRACTAL
    expect(runtime.active_echoes("FRACTAL")).toEqual([]);
  });
  it("should add a vector to the background (echoes)", () => {
    runtime.add_vector("Find the key.", "FRACTAL");
    expect(runtime.active_fractal.future).toHaveLength(1);
    expect(runtime.active_vector("FRACTAL")).toBe("Find the key.");
    expect(runtime.active_echoes("FRACTAL")).toEqual([]);
    runtime.add_vector("Explore the cave.", "FRACTAL");
    expect(runtime.active_fractal.future).toHaveLength(2);
    // "Find the key" is still index 0 because we pushed
    expect(runtime.active_vector("FRACTAL")).toBe("Find the key.");
    expect(runtime.active_echoes("FRACTAL")[0].text).toBe("Explore the cave.");
  });
  it("should add a vector to the front (is_vanguard)", () => {
    runtime.add_vector("Background Task", "FRACTAL");
    runtime.add_vector("Urgent Task", "FRACTAL", true); // isVanguard = true
    expect(runtime.active_vector("FRACTAL")).toBe("Urgent Task");
    expect(runtime.active_echoes("FRACTAL")[0].text).toBe("Background Task");
  });
  it("should complete the active vector and promote the next one", () => {
    runtime.add_vector("Task A", "FRACTAL");
    runtime.add_vector("Task B", "FRACTAL");
    expect(runtime.active_vector("FRACTAL")).toBe("Task A");
    runtime.complete_vector("FRACTAL");
    expect(runtime.active_vector("FRACTAL")).toBe("Task B");
    expect(runtime.active_fractal.future).toHaveLength(1);
  });
  it("should handle complete_vector on empty vectors safely", () => {
    runtime.complete_vector("FRACTAL");
    expect(runtime.active_fractal.future).toEqual([]);
  });
});
