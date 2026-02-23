/**
 * @file src/core/narrative/narrative_engine.test.js
 * @description Unit tests for the Narrative Engine (RPGlitch Engine v2).
 * Verifies Physics triggers, Tone resolution, and Prompt assembly.
 */

import { SYSTEM_PROMPTS } from "@core/intelligence/intelligence_logic.js"
import { describe, expect, it } from "vitest"
import { TONE_REGISTRY } from "./narrative_atoms.js"
import { NarrativeEngine } from "./narrative_engine.js"
import { resolvePhysics } from "./narrative_logic.js"

describe("Narrative Engine v2", () => {
    describe("Physics & Tones", () => {
        it("should resolve Default Tone correctly", () => {
            const state = resolvePhysics("regular input", "DEFAULT")
            expect(state.dna.velocity).toBe(50)
            expect(state.instructions).toContain(TONE_REGISTRY.DEFAULT.instruction)
        })

        it("should trigger KINETIC reflex on high-velocity input", () => {
            const state = resolvePhysics("I run towards the exit", "DEFAULT")
            expect(state.dna.velocity).toBe(90) // Reflex override
            expect(state.instructions.some((i) => i.includes("[REFLEX:REFLEX_KINETIC]"))).toBe(true)
        })

        it("should trigger VIOLENCE reflex on combat input", () => {
            const state = resolvePhysics("I punch him in the face", "DEFAULT")
            expect(state.dna.velocity).toBe(80)
            expect(state.dna.entropy).toBe(60)
            expect(state.instructions.some((i) => i.includes("[REFLEX:REFLEX_VIOLENCE]"))).toBe(true)
        })

        it("should respect Tone overrides", () => {
            const state = resolvePhysics("regular input", "NOIR")
            expect(state.dna.velocity).toBe(40) // Noir default
            expect(state.motifs).toContain("neon")
        })
    })

    describe("Prompt Factory", () => {
        const mockContext = {
            tone: {
                dna: { velocity: 50, entropy: 20 },
                instructions: ["Be cool."],
                motifs: ["rain"],
                style: "Atmospheric",
            },
            state: {
                chrono: { turn: 5, objective: "Find the key", conflict: "High" },
                fractal: { title: "Bar", state: { time: "Midnight" } },
            },
            input: "Hello",
        }

        it("should assemble a complete XML prompt", () => {
            const prompt = SYSTEM_PROMPTS.simulation(mockContext)
            expect(prompt).toContain("<GLITCH_ENGINE v3.0>")
            expect(prompt).toContain("<SYSTEM_LAYER>")
            expect(prompt).toContain("<COGNITIVE_CORE>")
        })

        it("should include Cognitive Core with Mode", () => {
            const prompt = SYSTEM_PROMPTS.simulation(mockContext)
            expect(prompt).toContain("Mode: Atmospheric")
        })

        it("should include World and Location Layers", () => {
            const prompt = SYSTEM_PROMPTS.simulation(mockContext)
            expect(prompt).toContain('<WORLD_LAYER turn="5">')
            expect(prompt).toContain("<OBJECTIVE>Find the key</OBJECTIVE>")
            expect(prompt).toContain('<LOCATION_LAYER id="Bar">')
        })
    })

    describe("Engine Pipeline", () => {
        const engine = new NarrativeEngine()

        it("should compose a full system prompt from input", async () => {
            const context = {
                input: "I shoot the guard",
                toneKey: "CYBERPUNK",
                type: "prose",
                state: {
                    chrono: { turn: 1, objective: "Escape", conflict: "None" },
                    fractal: { title: "Alley", state: {} },
                },
            }

            const result = await engine.compose(context)

            expect(result.system).toBeDefined()
            expect(result.meta.velocity).toBe(80) // Reflex overlap or Cyberpunk base
            expect(result.meta.reflexes.length).toBeGreaterThan(0) // Should trigger Violence reflex

            // Verify prompt content
            expect(result.system).toContain("<INPUT_COMMAND>")
            expect(result.system).toContain("I shoot the guard")
        })
    })
})
