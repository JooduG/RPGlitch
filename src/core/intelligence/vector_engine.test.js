import { describe, expect, it, vi } from "vitest"
import { VectorEngine } from "./vector_engine.js"

vi.mock("./DynamicsEngine.js", () => ({
    DynamicsEngine: {
        scan_reflexes: vi.fn(() => [{ id: "VIBE_CHECK" }]),
        evaluate_weight: vi.fn(() => 3),
    },
}))

describe("VectorEngine", () => {
    describe("create_vector", () => {
        it("creates a flat vector object — no score wrapper, no summary", () => {
            const vector = VectorEngine.create_vector("He felt a strange vibe.")
            expect(vector).toHaveProperty("id")
            expect(vector.text).toBe("He felt a strange vibe.")
            expect(vector).not.toHaveProperty("score")
            expect(vector).not.toHaveProperty("summary")
            expect(vector.dynamics_tags).toContain("VIBE_CHECK")
            expect(Array.isArray(vector.vector_tags)).toBe(true)
            expect(typeof vector.timestamp).toBe("number")
        })

        it("populates emotional_weight from DynamicsEngine.evaluate_weight", async () => {
            const { DynamicsEngine } = await import("./DynamicsEngine.js")
            vi.mocked(DynamicsEngine.evaluate_weight).mockReturnValueOnce(9)
            const vector = VectorEngine.create_vector("He betrayed her completely.")
            expect(vector.emotional_weight).toBe(9)
        })

        it("defaults to W=3 for plain input", () => {
            const vector = VectorEngine.create_vector("They talked for a while.")
            expect(vector.emotional_weight).toBe(3)
        })
    })

    describe("score_vectors", () => {
        it("scores +2 for axis overlap", async () => {
            const vectors = [
                { id: 1, dynamics_tags: ["STAY_METAL"], vector_tags: [], text: "A", emotional_weight: 3 },
                { id: 2, dynamics_tags: ["VIBE_CHECK"], vector_tags: [], text: "B", emotional_weight: 3 },
            ]
            const ranked = VectorEngine.score_vectors(vectors, "vibe check")
            expect(ranked[0].id).toBe(2)
        })

        it("scores +1 for entity overlap", async () => {
            const { DynamicsEngine } = await import("./DynamicsEngine.js")
            vi.mocked(DynamicsEngine.scan_reflexes).mockReturnValueOnce([])
            const vectors = [
                { id: 1, dynamics_tags: [], vector_tags: ["Iron"], text: "A", emotional_weight: 3 },
                { id: 2, dynamics_tags: [], vector_tags: ["Ghost"], text: "B", emotional_weight: 3 },
            ]
            const ranked = VectorEngine.score_vectors(vectors, "Iron Man")
            expect(ranked[0].id).toBe(1)
        })

        it("W is added as flat addend — high-W vector outscores equal-axis low-W vector", async () => {
            const { DynamicsEngine } = await import("./DynamicsEngine.js")
            vi.mocked(DynamicsEngine.scan_reflexes).mockReturnValue([{ id: "IMPACT" }])
            const vectors = [
                { id: "low", dynamics_tags: ["IMPACT"], vector_tags: [], text: "A", emotional_weight: 3 },
                { id: "high", dynamics_tags: ["IMPACT"], vector_tags: [], text: "B", emotional_weight: 9 },
            ]
            const ranked = VectorEngine.score_vectors(vectors, "he fought")
            // Both get +2 axis match. high also gets +9 vs +3. high wins.
            expect(ranked[0].id).toBe("high")
        })
    })

    describe("formatting", () => {
        it("labels W=10 vectors as CORE_MEMORY", () => {
            const past = [{ text: "She died.", dynamics_tags: [], vector_tags: [], emotional_weight: 10 }]
            const result = VectorEngine.format_past(past, "")
            expect(result).toContain("[CORE_MEMORY]: She died.")
        })

        it("labels W=9 vectors as MAJOR_MEMORY", () => {
            const past = [{ text: "He betrayed me.", dynamics_tags: [], vector_tags: [], emotional_weight: 9 }]
            const result = VectorEngine.format_past(past, "")
            expect(result).toContain("[MAJOR_MEMORY]: He betrayed me.")
        })

        it("labels W<6 vectors as ECHO", () => {
            const past = [{ text: "Met a traveler.", dynamics_tags: [], vector_tags: [], emotional_weight: 3 }]
            const result = VectorEngine.format_past(past, "")
            expect(result).toContain("[ECHO]: Met a traveler.")
        })

        it("labels W=6 future vector as FUTURE_MEMORY", () => {
            const future = [{ text: "Find the key.", dynamics_tags: [], vector_tags: [], emotional_weight: 6 }]
            const result = VectorEngine.format_future(future, "")
            expect(result).toContain("[FUTURE_MEMORY]: Find the key.")
        })
    })

    describe("resolve_vector", () => {
        it("moves a future vector to past with a resolution tag", () => {
            const entity = {
                future: { vectors: [{ id: "v1", text: "Goal", vector_tags: [] }] },
                past: { vectors: [] },
            }
            VectorEngine.resolve_vector(entity, "v1", "SUCCESS")

            expect(entity.future.vectors).toHaveLength(0)
            expect(entity.past.vectors).toHaveLength(1)
            expect(entity.past.vectors[0].text).toBe("Goal")
            expect(entity.past.vectors[0].vector_tags).toContain("RESOLUTION:SUCCESS")
        })
    })
})
