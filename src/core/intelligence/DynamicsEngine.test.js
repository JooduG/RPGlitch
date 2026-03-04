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
                velocity: 50,
                entropy: 50,
                permeability: 50,
                resonance: 50,
            })
            expect(state.dynamics.velocity).toBe(50)
            expect(state.behaviors.length).toBe(0)
        })

        it("should trigger reflexes on high-velocity input", () => {
            const baselines = { velocity: 50, entropy: 50, permeability: 50, resonance: 50 }
            const start_dynamics = { velocity: 70, entropy: 50, permeability: 50, resonance: 50 }
            const state = DynamicsEngine.resolve_dynamics("I run towards the exit", baselines, start_dynamics)

            // 70 + 10 (IMPACT reflex) = 80
            // Dynamics Gravity diff = 50 - 80 = -30 => pull = -30 * 0.25 = -7.5
            // 80 - 7.5 = 72.5 => Math.round(72.5) = 73
            expect(state.dynamics.velocity).toBe(73)
            expect(state.behaviors.some((i) => i.includes("Pacing fast"))).toBe(true)
        })

        it("should trigger IMPACT reflex on combat input", () => {
            const baselines = { velocity: 50, entropy: 50, permeability: 50, resonance: 50 }
            const state = DynamicsEngine.resolve_dynamics("I punch him in the face", baselines)

            // 50 + 10 (IMPACT) = 60
            // Dynamics Gravity diff = 50 - 60 = -10 => pull = -10 * 0.25 = -2.5
            // 60 - 2.5 = 57.5 => Round to 58
            expect(state.dynamics.velocity).toBe(58)
            expect(state.dynamics.entropy).toBe(50)
        })

        describe("Flag Effects", () => {
            it("should effect Entropy when EXPOSED_VULNERABILITY is active", () => {
                // Permeability >= 90 triggers EXPOSED_VULNERABILITY
                const start = { velocity: 50, entropy: 40, permeability: 95, resonance: 50 }
                // Pass baselines = start to prevent gravity from pulling Permeability out of LAW_HIGH
                const state = DynamicsEngine.resolve_dynamics("regular input", start, start)

                // Entropy 40 -> No gravity pull -> Law EXPOSED_VULNERABILITY (95 >= 90) triggers
                // 40 * 2.0 = 80
                expect(state.flags).toContain("EXPOSED_VULNERABILITY")
                expect(state.dynamics.entropy).toBe(80)
            })

            it("should effect Resonance when IRON_BUNKER is active", () => {
                // Permeability <= 10 triggers IRON_BUNKER
                const start = { velocity: 50, entropy: 50, permeability: 5, resonance: 60 }
                // Pass baselines = start to keep Permeability <= 10
                const state = DynamicsEngine.resolve_dynamics("regular input", start, start)

                // Resonance 60 -> No gravity pull -> Law IRON_BUNKER (5 <= 10) triggers
                // 60 * 0.5 = 30
                expect(state.flags).toContain("IRON_BUNKER")
                expect(state.dynamics.resonance).toBe(30)
            })

            it("should reject Entropy (0) when RESONANCE_CASCADE is active", () => {
                // Resonance >= 80, Entropy <= 20 triggers RESONANCE_CASCADE
                const baselines = { velocity: 50, entropy: 50, permeability: 50, resonance: 50 }
                const start = { velocity: 50, entropy: 10, permeability: 50, resonance: 90 }
                const state = DynamicsEngine.resolve_dynamics("regular input", baselines, start)

                expect(state.flags).toContain("RESONANCE_CASCADE")
                expect(state.dynamics.entropy).toBe(0)
            })

            it("should ignore Resonance loss when EVENT_HORIZON is active", () => {
                // Velocity <= 20, Permeability >= 80 triggers EVENT_HORIZON
                const baselines = { velocity: 50, entropy: 50, permeability: 50, resonance: 50 }
                const start = { velocity: 10, entropy: 50, permeability: 90, resonance: 70 }

                // Gravity pulls velocity: 10 -> 20 (pull 10 toward 50)
                // Gravity pulls resonance: 70 -> 65 (pull -5 toward 50)
                // EVENT_HORIZON (velocity <= 20, permeability >= 80) TRIGGERS
                // It blocks the drop from 70 to 65. Result = 70.
                const state = DynamicsEngine.resolve_dynamics("regular input", baselines, start)

                expect(state.flags).toContain("EVENT_HORIZON")
                expect(state.dynamics.resonance).toBe(70)
            })
        })
    })

    describe("Simulation Orchestration", () => {
        it("should simulate a full payload", () => {
            const payload = {
                input: "I run fast",
                entities: {
                    AI: {
                        dynamics: { velocity: 50, entropy: 50, permeability: 50, resonance: 50 },
                    },
                },
                history: {
                    dynamics: { velocity: 70, entropy: 50, permeability: 50, resonance: 50 },
                },
            }

            const snapshot = DynamicsEngine.simulate(payload)

            expect(snapshot.dynamics.velocity).toBe(73)
            expect(snapshot.behaviors.length).toBeGreaterThan(0)
        })
    })
})
