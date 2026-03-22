import { beforeEach, describe, expect, it } from "vitest";
import { runtime } from "./runtime.svelte.js";

describe("Narrative Vector System", () => {
  beforeEach(() => {
    // Reset state before each test
    runtime._debugInject({
      fractal: { id: "test-fractal", active: true, future: [] },
    });
  });

  it("should initialize with empty vectors", () => {
    // Default for FRACTAL is now handled by the caller or NarrativeDirector seeding
    expect(runtime.activeVectors("FRACTAL")[0]?.text).toBeUndefined();
    expect(runtime.activeVectors("FRACTAL")).toEqual([]);
  });

  it("should add a vector to the background (echoes)", () => {
    runtime.addVector("Find the key.", "FRACTAL");
    expect(runtime.active_fractal.future).toHaveLength(1);
    expect(runtime.activeVectors("FRACTAL")[0].text).toBe("Find the key.");
    
    runtime.addVector("Explore the cave.", "FRACTAL");
    expect(runtime.active_fractal.future).toHaveLength(2);
    // "Find the key" is still index 0 because we pushed
    expect(runtime.activeVectors("FRACTAL")[0].text).toBe("Find the key.");
    expect(runtime.activeVectors("FRACTAL")[1].text).toBe("Explore the cave.");
  });

  it("should add a vector to the front (is_vanguard)", () => {
    runtime.addVector("Background Task", "FRACTAL");
    runtime.addVector("Urgent Task", "FRACTAL", true); // isVanguard = true
    expect(runtime.activeVectors("FRACTAL")[0].text).toBe("Urgent Task");
    expect(runtime.activeVectors("FRACTAL")[1].text).toBe("Background Task");
  });

  it("should complete the active vector and promote the next one", () => {
    runtime.addVector("Task A", "FRACTAL");
    runtime.addVector("Task B", "FRACTAL");
    expect(runtime.activeVectors("FRACTAL")[0].text).toBe("Task A");
    runtime.completeVector("FRACTAL");
    expect(runtime.activeVectors("FRACTAL")[0].text).toBe("Task B");
    expect(runtime.active_fractal.future).toHaveLength(1);
  });

  it("should handle completeVector on empty vectors safely", () => {
    runtime.completeVector("FRACTAL");
    expect(runtime.active_fractal.future).toEqual([]);
  });
});
