import { beforeEach, describe, expect, it } from "vitest"
import { runtime } from "./runtime.svelte.js"

describe("Narrative State", () => {
    beforeEach(() => {
        // Reset state before each test
        if (runtime.narrative && runtime.narrative.objectives) {
            runtime.narrative.objectives.length = 0 // Clear array
        }
    })

    it("should initialize with empty objectives", () => {
        expect(runtime.narrative.objectives).toEqual([])
        expect(runtime.activeObjective).toBe("Continue the journey.") // Default
        expect(runtime.echoes).toEqual([])
    })

    it("should add an objective to the background (echoes)", () => {
        runtime.addThread("Find the key.")
        expect(runtime.narrative.objectives).toHaveLength(1)
        expect(runtime.activeObjective).toBe("Find the key.")
        expect(runtime.echoes).toEqual([])

        runtime.addThread("Explore the cave.")
        expect(runtime.narrative.objectives).toHaveLength(2)
        // "Find the key" is still index 0 (active objective) because we pushed
        expect(runtime.activeObjective).toBe("Find the key.")
        expect(runtime.echoes[0].text).toBe("Explore the cave.")
    })

    it("should add an objective to the front (urgent)", () => {
        runtime.addThread("Background Task")
        runtime.addThread("Urgent Task", true) // isVanguard = true

        expect(runtime.activeObjective).toBe("Urgent Task")
        expect(runtime.echoes[0].text).toBe("Background Task")
    })

    it("should complete the active objective and promote the next one", () => {
        runtime.addThread("Task A") // Index 0
        runtime.addThread("Task B") // Index 1

        expect(runtime.activeObjective).toBe("Task A")

        runtime.completeVanguard()

        expect(runtime.activeObjective).toBe("Task B")
        expect(runtime.narrative.objectives).toHaveLength(1)
    })

    it("should handle completeVanguard on empty objectives safely", () => {
        runtime.completeVanguard()
        expect(runtime.narrative.objectives).toEqual([])
    })
})
