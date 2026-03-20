/**
 * @file src/core/intelligence/DynamicsEngine.test.js
 * @description Unit tests for the Dynamics Engine (RPGlitch Engine v2).
 * Verifies Physics triggers, Tone resolution, and Prompt assembly.
 */

import { describe, expect, it } from "vitest"
import { DynamicsEngine } from "./DynamicsEngine.js"

describe("Dynamics Engine v2 (Refactored)", () => {
    describe("Mechanics: resolve_dynamics", () => {
        const createBaseState = () => ({
            ai: {
                dynamics: { intensity: 50, chaos: 50, openness: 50, affinity: 50 },
            },
            fractal: {
                dynamics: { velocity: 50, entropy: 50 },
            },
            flags: [],
            signals: {},
            signal_prompts: [],
        })

        it("should resolve Default Dynamics correctly", () => {
            const state = createBaseState()
            const triggered = []
            DynamicsEngine.resolve_dynamics(state, null, triggered)

            expect(state.ai.dynamics.intensity).toBe(50)
            expect(state.signal_prompts.length).toBe(0)
        })

        it("should trigger reflexes on high-intensity input", () => {
            const state = createBaseState()
            state.ai.dynamics.intensity = 70
            const prevState = createBaseState()
            prevState.ai.dynamics.intensity = 70

            const triggered = DynamicsEngine.scan_reflexes("I run towards the exit")
            DynamicsEngine.resolve_dynamics(state, prevState, triggered)

            // 70 + 10 (KINETICS reflex) = 80
            // Gravity: (50 - 80) * 0.25 = -7.5
            // 80 - 7.5 = 72.5 -> Round to 73
            expect(state.ai.dynamics.intensity).toBe(73)
            expect(state.signal_prompts.some((i) => i.includes("Pacing fast"))).toBe(true)
        })

        it("should trigger KINETICS reflex on combat input", () => {
            const state = createBaseState()
            const triggered = DynamicsEngine.scan_reflexes("I punch him in the face")
            DynamicsEngine.resolve_dynamics(state, null, triggered)

            // 50 + 10 (KINETICS) = 60
            // Gravity: (50 - 60) * 0.25 = -2.5
            // 60 - 2.5 = 57.5 -> Round to 58
            expect(state.ai.dynamics.intensity).toBe(58)
            expect(state.ai.dynamics.chaos).toBe(50)
        })

        describe("Flag Effects", () => {
            it("should effect Chaos when OPENNESS_HIGH_THRESHOLD is active", () => {
                const state = createBaseState()
                state.ai.dynamics.openness = 95
                // Pass baselines = 95 to keep Openness high
                const baselines = { openness: 95 }

                DynamicsEngine._process_entity_dynamics(state.ai.dynamics, baselines, [], state, null)

                expect(state.flags).toContain("OPENNESS_HIGH_THRESHOLD")
                // Openness 95 * 2.0 = 190 -> Clipped to 100
                expect(state.ai.dynamics.chaos).toBe(100)
            })
        })
    })

    describe("Simulation Orchestration", () => {
        it("should simulate a full payload", () => {
            const payload = {
                input: "I run fast",
                entities: {
                    AI: {
                        dynamics: { intensity: 70, chaos: 50, openness: 50, affinity: 50 },
                    },
                    FRACTAL: {
                        dynamics: { velocity: 50, entropy: 50 },
                    },
                },
                history: {
                    dynamics: { intensity: 70, chaos: 50, openness: 50, affinity: 50 },
                },
            }

            const snapshot = DynamicsEngine.simulate(payload)

            expect(snapshot.ai.dynamics.intensity).toBe(73)
            expect(snapshot.signal_prompts.length).toBeGreaterThan(0)
        })
    })

    describe("Naivety Index: _resolve_naivety", () => {
        it("should return null if no NAIVETY_TRIGGERS match", () => {
            const result = DynamicsEngine._resolve_naivety([], 50)
            expect(result).toBeNull()
        })

        it("should return high suspicion for low openness and a trigger match", () => {
            const suspicion = DynamicsEngine._resolve_naivety([{ id: "NAIVETY" }], 5)
            expect(suspicion).toBeGreaterThan(0.6)
        })

        it("should inject [NAIVETY] behavior via resolve_dynamics", () => {
            const state = {
                ai: { dynamics: { intensity: 50, chaos: 50, openness: 5, affinity: 50 } },
                fractal: { dynamics: { velocity: 50, entropy: 50 } },
                flags: [],
                signals: {},
                signal_prompts: [],
            }
            const triggered = DynamicsEngine.scan_reflexes("i swear i'm not lying")
            DynamicsEngine.resolve_dynamics(state, null, triggered)

            const hasNaivetyBehavior = state.signal_prompts.some((b) => b.includes("[NAIVETY] Trust breach detected"))
            expect(hasNaivetyBehavior).toBe(true)
        })
    })

    describe("Trigger Matching & Semantic Grouping", () => {
        it("resolves 'kissing' to root 'affection'", () => {
            const reflexes = DynamicsEngine.scan_reflexes("She was kissing him.")
            const reflex = reflexes.find((r) => r.trigger_word === "affection")
            expect(reflex).toBeDefined()
            expect(reflex.id).toBe("VULNERABILITY")
        })

        it("resolves 'fought' to root 'violence'", () => {
            const reflexes = DynamicsEngine.scan_reflexes("They fought bravely.")
            const reflex = reflexes.find((r) => r.trigger_word === "violence")
            expect(reflex).toBeDefined()
            expect(reflex.id).toBe("KINETICS")
        })

        it("resolves 'screamed' to root 'horror'", () => {
            const reflexes = DynamicsEngine.scan_reflexes("She screamed in terror.")
            const reflex = reflexes.find((r) => r.trigger_word === "horror")
            expect(reflex).toBeDefined()
            expect(reflex.id).toBe("ANOMALY")
        })

        it("resolves 'ran' to root 'athletics'", () => {
            const reflexes = DynamicsEngine.scan_reflexes("He ran away.")
            const reflexes_found = reflexes.filter((r) => r.trigger_word === "athletics")
            expect(reflexes_found.length).toBe(1)
            expect(reflexes_found[0].id).toBe("KINETICS")
        })

        it("resolves 'barrier' to root 'armor'", () => {
            const reflexes = DynamicsEngine.scan_reflexes("A shimmering barrier appeared.")
            const reflex = reflexes.find((r) => r.trigger_word === "armor")
            expect(reflex).toBeDefined()
            expect(reflex.id).toBe("FORTIFICATION")
        })

        it("resolves 'hidden' to root 'hide' in BOTH FORTIFICATION and ANOMALY", () => {
            const reflexes = DynamicsEngine.scan_reflexes("She kept her feelings hidden.")
            const hide_reflexes = reflexes.filter((r) => r.trigger_word === "hide")
            expect(hide_reflexes.length).toBe(2)
            const ids = hide_reflexes.map((r) => r.id)
            expect(ids).toContain("FORTIFICATION")
            expect(ids).toContain("ANOMALY")
        })
    })
})
