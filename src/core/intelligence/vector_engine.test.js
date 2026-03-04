import { describe, expect, it, vi } from "vitest"
import { VectorEngine } from "./vector_engine.js"

vi.mock("./DynamicsEngine.js", () => ({
    DynamicsEngine: {
        scan_reflexes: vi.fn(() => [{ id: "VIBE_CHECK" }]),
    },
}))

describe("VectorEngine", () => {
    describe("create_vector", () => {
        it("creates a strict vector object", () => {
            const vector = VectorEngine.create_vector("He felt a strange vibe.", "Summary text")
            expect(vector).toHaveProperty("id")
            expect(vector.text).toBe("He felt a strange vibe.")
            expect(vector.summary).toBe("Summary text")
            expect(vector.axis_tags).toContain("VIBE_CHECK")
            expect(Array.isArray(vector.entity_tags)).toBe(true)
            expect(typeof vector.timestamp).toBe("number")
        })

        it("uses text if summary is missing", () => {
            const vector = VectorEngine.create_vector("Base text")
            expect(vector.summary).toBe("Base text")
        })
    })

    describe("score_vectors", () => {
        const vectors = [
            { id: 1, axis_tags: ["STAY_METAL"], entity_tags: ["Iron"], text: "A" },
            { id: 2, axis_tags: ["VIBE_CHECK"], entity_tags: ["Ghost"], text: "B" },
        ]

        it("scores +2 for axis overlap", () => {
            // scan_reflexes mocked to return VIBE_CHECK
            const ranked = VectorEngine.score_vectors(vectors, "vibe check")
            expect(ranked[0].id).toBe(2)
        })

        it("scores +1 for entity overlap", async () => {
            // Need to ensure the mock doesn't give vector 2 +2 points here
            const { DynamicsEngine } = await import("./DynamicsEngine.js")
            vi.mocked(DynamicsEngine.scan_reflexes).mockReturnValueOnce([])
            const ranked = VectorEngine.score_vectors(vectors, "Iron Man")
            expect(ranked[0].id).toBe(1)
        })
    })

    describe("formatting", () => {
        const past = [{ summary: "Met a traveler.", axis_tags: [], entity_tags: [] }]
        const future = [
            { text: "Find the key.", axis_tags: ["QUEST"], entity_tags: [] },
            { text: "Eat dinner.", axis_tags: [], entity_tags: [] },
        ]

        it("formats past vectors as PAST_VECTOR", () => {
            const result = VectorEngine.format_past(past, "")
            expect(result).toContain("[PAST_VECTOR]: Met a traveler.")
        })

        it("formats future vectors as FUTURE_VECTOR", () => {
            const result = VectorEngine.format_future(future, "")
            expect(result).toContain("[FUTURE_VECTOR]: Find the key.")
            expect(result).toContain("[FUTURE_VECTOR]: Eat dinner.")
        })
    })
})
