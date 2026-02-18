import { beforeEach, describe, expect, it } from "vitest"
import { runtime } from "./runtime.svelte.js"

describe("Narrative State", () => {
    beforeEach(() => {
        // Reset state if possible, or just rely on runtime being a singleton
        // For this test, we might need to manually clear the array if the store is a singleton
        if (runtime.narrative && runtime.narrative.threads) {
            runtime.narrative.threads.length = 0 // Clear array
        }
    })

    it("should initialize with empty threads", () => {
        expect(runtime.narrative.threads).toEqual([])
        expect(runtime.vanguard).toBe("Continue the journey.") // Default
        expect(runtime.echoes).toEqual([])
    })

    it("should add a thread to the background (echoes)", () => {
        runtime.addThread("Find the key.")
        expect(runtime.narrative.threads).toHaveLength(1)
        expect(runtime.vanguard).toBe("Find the key.")
        expect(runtime.echoes).toEqual([])

        runtime.addThread("Explore the cave.")
        expect(runtime.narrative.threads).toHaveLength(2)
        // "Find the key" is still 0 (vanguard) because we pushed
        expect(runtime.vanguard).toBe("Find the key.")
        expect(runtime.echoes[0].text).toBe("Explore the cave.")
    })

    it("should add a thread to the vanguard (front)", () => {
        runtime.addThread("Background Task")
        runtime.addThread("Urgent Task", true) // isVanguard = true

        expect(runtime.vanguard).toBe("Urgent Task")
        expect(runtime.echoes[0].text).toBe("Background Task")
    })

    it("should complete the vanguard and promote the next thread", () => {
        runtime.addThread("Task A") // Index 0
        runtime.addThread("Task B") // Index 1

        expect(runtime.vanguard).toBe("Task A")

        runtime.completeVanguard()

        expect(runtime.vanguard).toBe("Task B")
        expect(runtime.narrative.threads).toHaveLength(1)
    })

    it("should handle completeVanguard on empty threads safely", () => {
        runtime.completeVanguard()
        expect(runtime.narrative.threads).toEqual([])
    })
})
