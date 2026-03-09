/**
 * @file src/core/intelligence/DynamicsEngine.test.js
 * @description Unit tests for the Dynamics Engine (RPGlitch Engine v2).
 * Verifies Physics triggers, Tone resolution, and Prompt assembly.
 */

import { describe, expect, it } from "vitest"
import { DynamicsEngine } from "./DynamicsEngine.js"

describe("Dynamics Engine v2 (Refactored)", () => {
    describe("Mechanics: resolve_dynamics", () => {
        it("should resolve Default Dynamics correctly", () => {
            const state = DynamicsEngine.resolve_dynamics("regular input", {
                intensity: 50,
                chaos: 50,
                openness: 50,
                affinity: 50,
            })
            expect(state.dynamics.intensity).toBe(50)
            expect(state.behaviors.length).toBe(0)
        })

        it("should trigger reflexes on high-intensity input", () => {
            const baselines = { intensity: 50, chaos: 50, openness: 50, affinity: 50 }
            const start_dynamics = { intensity: 70, chaos: 50, openness: 50, affinity: 50 }
            const state = DynamicsEngine.resolve_dynamics("I run towards the exit", baselines, start_dynamics)

            // 70 + 10 (IMPACT reflex) = 80
            // Dynamics Gravity diff = 50 - 80 = -30 => pull = -30 * 0.25 = -7.5
            // 80 - 7.5 = 72.5 => Math.round(72.5) = 73
            expect(state.dynamics.intensity).toBe(73)
            expect(state.behaviors.some((i) => i.includes("Pacing fast"))).toBe(true)
        })

        it("should trigger IMPACT reflex on combat input", () => {
            const baselines = { intensity: 50, chaos: 50, openness: 50, affinity: 50 }
            const state = DynamicsEngine.resolve_dynamics("I punch him in the face", baselines)

            // 50 + 10 (IMPACT) = 60
            // Dynamics Gravity diff = 50 - 60 = -10 => pull = -10 * 0.25 = -2.5
            // 60 - 2.5 = 57.5 => Round to 58
            expect(state.dynamics.intensity).toBe(58)
            expect(state.dynamics.chaos).toBe(50)
        })

        describe("Flag Effects", () => {
            it("should effect Chaos when EXPOSED_VULNERABILITY is active", () => {
                // Openness >= 90 triggers EXPOSED_VULNERABILITY
                const start = { intensity: 50, chaos: 40, openness: 95, affinity: 50 }
                // Pass baselines = start to prevent gravity from pulling Openness out of LAW_HIGH
                const state = DynamicsEngine.resolve_dynamics("regular input", start, start)

                // Chaos 40 -> No gravity pull -> Law EXPOSED_VULNERABILITY (95 >= 90) triggers
                // 40 * 2.0 = 80
                expect(state.flags).toContain("EXPOSED_VULNERABILITY")
                expect(state.dynamics.chaos).toBe(80)
            })

            it("should effect Affinity when IRON_GUARDED is active", () => {
                // Openness <= 10 triggers IRON_GUARDED
                const start = { intensity: 50, chaos: 50, openness: 5, affinity: 60 }
                // Pass baselines = start to keep Openness <= 10
                const state = DynamicsEngine.resolve_dynamics("regular input", start, start)

                // Affinity 60 -> No gravity pull -> Law IRON_GUARDED (5 <= 10) triggers
                // 60 * 0.5 = 30
                expect(state.flags).toContain("IRON_GUARDED")
                expect(state.dynamics.affinity).toBe(30)
            })

            it("should reject Chaos (0) when AFFINITY_CASCADE is active", () => {
                // Affinity >= 80, Chaos <= 20 triggers AFFINITY_CASCADE
                const baselines = { intensity: 50, chaos: 50, openness: 50, affinity: 50 }
                const start = { intensity: 50, chaos: 10, openness: 50, affinity: 90 }
                const state = DynamicsEngine.resolve_dynamics("regular input", baselines, start)

                expect(state.flags).toContain("AFFINITY_CASCADE")
                expect(state.dynamics.chaos).toBe(0)
            })

            it("should ignore Affinity loss when EVENT_HORIZON is active", () => {
                // Intensity <= 20, Openness >= 80 triggers EVENT_HORIZON
                const baselines = { intensity: 50, chaos: 50, openness: 50, affinity: 50 }
                const start = { intensity: 10, chaos: 50, openness: 90, affinity: 70 }

                // Gravity pulls intensity: 10 -> 20 (pull 10 toward 50)
                // Gravity pulls affinity: 70 -> 65 (pull -5 toward 50)
                // EVENT_HORIZON (intensity <= 20, openness >= 80) TRIGGERS
                // It blocks the drop from 70 to 65. Result = 70.
                const state = DynamicsEngine.resolve_dynamics("regular input", baselines, start)

                expect(state.flags).toContain("EVENT_HORIZON")
                expect(state.dynamics.affinity).toBe(70)
            })
        })
    })

    describe("Simulation Orchestration", () => {
        it("should simulate a full payload", () => {
            const payload = {
                input: "I run fast",
                entities: {
                    AI: {
                        dynamics: { intensity: 50, chaos: 50, openness: 50, affinity: 50 },
                    },
                },
                history: {
                    dynamics: { intensity: 70, chaos: 50, openness: 50, affinity: 50 },
                },
            }

            const snapshot = DynamicsEngine.simulate(payload)

            expect(snapshot.dynamics.intensity).toBe(73)
            expect(snapshot.behaviors.length).toBeGreaterThan(0)
        })
    })

    describe("Naivety Index: _resolve_naivety", () => {
        it("should return null if no NAIVETY_TRIGGERS match", () => {
            const result = DynamicsEngine._resolve_naivety("I am going to the store", 50)
            expect(result).toBeNull()
        })

        it("should return high suspicion for low openness and a trigger match", () => {
            // Low openness (10) = cold skeptic.
            const suspicion = DynamicsEngine._resolve_naivety("trust me on this", 10)
            expect(suspicion).toBeGreaterThan(0.6) // NAIVETY_THRESHOLD is 0.6
        })

        it("should return low suspicion for high openness and a trigger match", () => {
            // High openness (90) = naive/credulous.
            const suspicion = DynamicsEngine._resolve_naivety("i promise to help", 90)
            expect(suspicion).toBeLessThan(0.6)
            expect(suspicion).toBeGreaterThan(0) // Still calculates a probability
        })

        it("should inject [NAIVETY] behavior via resolve_dynamics when suspicion breaches threshold", () => {
            const baselines = { intensity: 50, chaos: 50, openness: 10, affinity: 50 }
            const state = DynamicsEngine.resolve_dynamics("i swear i'm not lying", baselines)

            // openness 10 + trigger => high suspicion => injects threshold behavior
            const hasNaivetyBehavior = state.behaviors.some((b) => b.includes("[NAIVETY] Trust breach detected"))
            expect(hasNaivetyBehavior).toBe(true)
        })
    })

    describe("Trigger Matching & Semantic Grouping", () => {
        it("resolves 'kissing' to root 'affection'", () => {
            const reflexes = DynamicsEngine.scan_reflexes("She was kissing him.")
            const reflex = reflexes.find((r) => r.trigger_word === "affection")
            expect(reflex).toBeDefined()
            expect(reflex.id).toBe("EXPOSURE")
        })

        it("resolves 'fought' to root 'violence'", () => {
            const reflexes = DynamicsEngine.scan_reflexes("They fought bravely.")
            const reflex = reflexes.find((r) => r.trigger_word === "violence")
            expect(reflex).toBeDefined()
            expect(reflex.id).toBe("IMPACT")
        })

        it("resolves 'screamed' to root 'horror'", () => {
            const reflexes = DynamicsEngine.scan_reflexes("She screamed in terror.")
            const reflex = reflexes.find((r) => r.trigger_word === "horror")
            expect(reflex).toBeDefined()
            expect(reflex.id).toBe("GLITCH")
        })

        it("resolves 'ran' to root 'athletics'", () => {
            const reflexes = DynamicsEngine.scan_reflexes("He ran away.")
            const reflexes_found = reflexes.filter((r) => r.trigger_word === "athletics")
            expect(reflexes_found.length).toBe(1)
            expect(reflexes_found[0].id).toBe("GLITCH")
        })

        it("resolves 'barrier' to root 'armor'", () => {
            const reflexes = DynamicsEngine.scan_reflexes("A shimmering barrier appeared.")
            const reflex = reflexes.find((r) => r.trigger_word === "armor")
            expect(reflex).toBeDefined()
            expect(reflex.id).toBe("DEFENSE")
        })

        it("resolves 'hidden' to root 'hide' in BOTH DEFENSE and GLITCH", () => {
            const reflexes = DynamicsEngine.scan_reflexes("She kept her feelings hidden.")
            const hide_reflexes = reflexes.filter((r) => r.trigger_word === "hide")
            expect(hide_reflexes.length).toBe(2)
            const ids = hide_reflexes.map((r) => r.id)
            expect(ids).toContain("DEFENSE")
            expect(ids).toContain("GLITCH")
        })
    })
})
