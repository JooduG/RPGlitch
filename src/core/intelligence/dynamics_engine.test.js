/**
 * @file src/core/intelligence/dynamics_engine.test.js
 * @description Unit tests for the Dynamics Engine (RPGlitch Engine v2).
 * Verifies Physics triggers, Tone resolution, and Prompt assembly.
 */

import { SYSTEM_PROMPTS } from "@core/intelligence/prompt_builder.js"
import { describe, expect, it } from "vitest"
import { Engine, resolve_dynamics } from "./dynamics_engine.js"

describe("Dynamics Engine v2 (Rename)", () => {
    describe("Mechanics: resolve_dynamics", () => {
        it("should resolve Default Dynamics correctly", () => {
            const state = resolve_dynamics("regular input")
            expect(state.dynamics.velocity).toBe(50)
            expect(state.behaviors.length).toBe(0)
        })

        it("should trigger reflexes on high-velocity input", () => {
            const start_dynamics = { velocity: 60, entropy: 50, permeability: 50, resonance: 50 }
            const state = resolve_dynamics("I run towards the exit", start_dynamics)

            // 60 + 20 (VIOLENCE reflex) = 80
            // Dynamics Gravity diff = 50 - 80 = -30 => pull = -30 * 0.25 = -7.5
            // 80 - 7.5 = 72.5 => Math.round(72.5) = 73
            expect(state.dynamics.velocity).toBe(73)
            expect(state.behaviors.some((i) => i.includes("Pacing fast"))).toBe(true)
        })

        it("should trigger VIOLENCE reflex on combat input", () => {
            const state = resolve_dynamics("I punch him in the face")

            // 50 + 20 (VIOLENCE) = 70
            // Dynamics Gravity diff = 50 - 70 = -20 => pull = -20 * 0.25 = -5
            // 70 - 5 = 65
            expect(state.dynamics.velocity).toBe(65)
            expect(state.dynamics.entropy).toBe(50)
        })

        describe("Flag Effects", () => {
            it("should double Entropy when GLASS_CANNON is active", () => {
                // Permeability 90+ triggers GLASS_CANNON
                const start = { velocity: 50, entropy: 40, permeability: 95, resonance: 50 }
                const state = resolve_dynamics("regular input", start)

                // Base Entropy 40 -> Gravity pull (50-40)*0.25 = 2.5 -> 42.5
                // GLASS_CANNON multiplier 2.0 -> 42.5 * 2 = 85
                expect(state.flags).toContain("GLASS_CANNON")
                expect(state.dynamics.entropy).toBe(85)
            })

            it("should halve Resonance when IRON_BUNKER is active", () => {
                // Permeability <= 10 triggers IRON_BUNKER
                const start = { velocity: 50, entropy: 50, permeability: 5, resonance: 60 }
                const state = resolve_dynamics("regular input", start)

                // Base Resonance 60 -> Gravity pull (50-60)*0.25 = -2.5 -> 57.5
                // IRON_BUNKER multiplier 0.5 -> 57.5 * 0.5 = 28.75 -> round 29
                expect(state.flags).toContain("IRON_BUNKER")
                expect(state.dynamics.resonance).toBe(29)
            })

            it("should reject Entropy (0) when ECHO_CHAMBER is active", () => {
                // Resonance >= 80, Entropy <= 20 triggers ECHO_CHAMBER
                const start = { velocity: 50, entropy: 10, permeability: 50, resonance: 90 }
                const state = resolve_dynamics("regular input", start)

                expect(state.flags).toContain("ECHO_CHAMBER")
                expect(state.dynamics.entropy).toBe(0)
            })

            it("should ignore Resonance loss when THE_VENUS is active", () => {
                // Velocity <= 20, Permeability >= 80 triggers THE_VENUS
                const start = { velocity: 10, entropy: 50, permeability: 90, resonance: 70 }

                // Gravity pulls 70 -> 65 (50-70)*0.25 = -5
                // DEEP_BREATH triggers at this velocity: adds +10 -> 75
                // THE_VENUS ignores net loss relative to 70: 75 > 70, so 75
                const state = resolve_dynamics("regular input", start)

                expect(state.flags).toContain("THE_VENUS")
                expect(state.dynamics.resonance).toBe(75)
            })
        })
    })

    describe("Voice: Prompt Assembly", () => {
        const mock_context = {
            active_signals: {
                dynamics: { velocity: 50, entropy: 20, permeability: 30, resonance: 10 },
                instructions: [],
                flags: [],
            },
            state: {
                turn: 5,
                objective: "Find the key",
                entity: {
                    list: [
                        { role: "AI", name: "Viper", fragments: [] },
                        { role: "USER", name: "User", fragments: [] },
                    ],
                },
            },
            input: "Hello",
            type: "simulation",
        }

        it("should assemble a complete XML prompt with Dynamics Layer", () => {
            const prompt = SYSTEM_PROMPTS.simulation(mock_context)
            expect(prompt).toContain("<SYSTEM_PROMPT>")
            expect(prompt).toContain("<NARRATIVE_CORE>")
            expect(prompt).toContain("<TURN>5</TURN>")
            expect(prompt).toContain("<OBJECTIVE>Find the key</OBJECTIVE>")
            expect(prompt).toContain("<ENTITIES>")
            expect(prompt).not.toContain('<COGNITIVE_CORE status="ACTIVE">')
            expect(prompt).toContain("<PROTOCOL>")
        })

        // NARRATIVE_STYLE is currently commented out pending Tone system design.
        // it("should include Narrative Style in Protocol", () => {
        //     const prompt = SYSTEM_PROMPTS.simulation(mock_context)
        //     expect(prompt).toContain("<PROTOCOL:NARRATIVE_STYLE>")
        // })
    })

    describe("Engine Orchestration", () => {
        const engine = Engine

        it("should compose a full system prompt from input", () => {
            const context = {
                input: "I shoot the guard",
                type: "simulation",
                state: {
                    snapshot: {
                        turn: 1,
                        objective: "Escape",
                        dynamics: { velocity: 60, entropy: 50, permeability: 50, resonance: 50 },
                    },
                    entity: {
                        list: [{ role: "AI", name: "Viper", fragments: [] }],
                    },
                },
            }

            const result = engine.compose(context)

            expect(result.system).toBeDefined()
            expect(result.meta.velocity).toBe(73) // 60 + 20 (Violence) - 7.5 (Dynamics Gravity)
            expect(result.meta.behaviors.length).toBeGreaterThan(0) // Should trigger Violence behavior

            // Verify prompt content
            expect(result.system).toContain("<INPUT_COMMAND>")
            expect(result.system).toContain("I shoot the guard")
            expect(result.system).toContain("<NARRATIVE_CORE>")
        })
    })
})
