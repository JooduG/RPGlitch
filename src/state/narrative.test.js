import { beforeEach, describe, expect, it } from "vitest"
import { runtime } from "./runtime.svelte.js"

describe("Narrative Vector System", () => {
    beforeEach(() => {
        // Reset state before each test
        runtime._debugInject({
            fractal: { id: "test-fractal", active: true, future: { vectors: [] } },
        })
    })

    it("should initialize with empty vectors", () => {
        expect(runtime.activeVector("FRACTAL")).toBe("Continue the journey.") // Default for FRACTAL
        expect(runtime.activeEchoes("FRACTAL")).toEqual([])
    })

    it("should add a vector to the background (echoes)", () => {
        runtime.addVector("Find the key.", "FRACTAL")
        expect(runtime.activeFractal.future.vectors).toHaveLength(1)
        expect(runtime.activeVector("FRACTAL")).toBe("Find the key.")
        expect(runtime.activeEchoes("FRACTAL")).toEqual([])

        runtime.addVector("Explore the cave.", "FRACTAL")
        expect(runtime.activeFractal.future.vectors).toHaveLength(2)
        // "Find the key" is still index 0 because we pushed
        expect(runtime.activeVector("FRACTAL")).toBe("Find the key.")
        expect(runtime.activeEchoes("FRACTAL")[0].text).toBe("Explore the cave.")
    })

    it("should add a vector to the front (isVanguard)", () => {
        runtime.addVector("Background Task", "FRACTAL")
        runtime.addVector("Urgent Task", "FRACTAL", true) // isVanguard = true

        expect(runtime.activeVector("FRACTAL")).toBe("Urgent Task")
        expect(runtime.activeEchoes("FRACTAL")[0].text).toBe("Background Task")
    })

    it("should complete the active vector and promote the next one", () => {
        runtime.addVector("Task A", "FRACTAL")
        runtime.addVector("Task B", "FRACTAL")

        expect(runtime.activeVector("FRACTAL")).toBe("Task A")

        runtime.completeVector("FRACTAL")

        expect(runtime.activeVector("FRACTAL")).toBe("Task B")
        expect(runtime.activeFractal.future.vectors).toHaveLength(1)
    })

    it("should handle completeVector on empty vectors safely", () => {
        runtime.completeVector("FRACTAL")
        expect(runtime.activeFractal.future.vectors).toEqual([])
    })
})
