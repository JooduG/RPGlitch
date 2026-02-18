/**
 * @file src/core/narrative/engine.test.js
 * @description Unit tests for the Narrative Engine (RPGlitch Engine v2).
 * Verifies Physics triggers, Tone resolution, and Prompt assembly.
 */

import { describe, expect, it } from "vitest"
import { NarrativeEngine } from "./engine.js"
import { PromptFactory } from "./prompt.js"
import { TONE_REGISTRY, resolvePhysics } from "./tones.js"

describe("Narrative Engine v2", () => {
    describe("Physics & Tones", () => {
        it("should resolve Default Tone correctly", () => {
            const state = resolvePhysics("regular input", "DEFAULT")
            expect(state.dna.velocity).toBe(50)
            expect(state.instructions).toContain(
                TONE_REGISTRY.DEFAULT.instruction
            )
        })

        it("should trigger KINETIC reflex on high-velocity input", () => {
            const state = resolvePhysics("I run towards the exit", "DEFAULT")
            expect(state.dna.velocity).toBe(90) // Reflex override
            expect(
                state.instructions.some((i) =>
                    i.includes("[REFLEX:REFLEX_KINETIC]")
                )
            ).toBe(true)
        })

        it("should trigger VIOLENCE reflex on combat input", () => {
            const state = resolvePhysics("I punch him in the face", "DEFAULT")
            expect(state.dna.velocity).toBe(80)
            expect(state.dna.entropy).toBe(60)
            expect(
                state.instructions.some((i) =>
                    i.includes("[REFLEX:REFLEX_VIOLENCE]")
                )
            ).toBe(true)
        })

        it("should respect Tone overrides", () => {
            const state = resolvePhysics("regular input", "NOIR")
            expect(state.dna.velocity).toBe(40) // Noir default
            expect(state.motifs).toContain("neon")
        })
    })

    describe("Prompt Factory", () => {
        const factory = new PromptFactory()
        const mockContext = {
            tone: {
                dna: { velocity: 50, entropy: 20 },
                instructions: ["Be cool."],
                motifs: ["rain"],
            },
            state: { location: "Bar", time: "Midnight" },
            input: "Hello",
        }

        it("should assemble a complete XML prompt", () => {
            const prompt = factory.assemble(mockContext)
            expect(prompt).toContain("<GLITCH_ENGINE v2.0>")
            expect(prompt).toContain('<COGNITIVE_CORE Priority="IMMUTABLE">')
            expect(prompt).toContain("<PHYSICS_ENGINE>")
        })

        it("should include Cognitive Core with DNA stats", () => {
            const prompt = factory.assemble(mockContext)
            expect(prompt).toContain("Velocity=50")
            expect(prompt).toContain("Entropy=20")
        })

        it("should include Physics Rules", () => {
            const prompt = factory.assemble(mockContext)
            expect(prompt).toContain("<RULE>Be cool.</RULE>")
            expect(prompt).toContain("rain")
        })

        it("should include Epistemic Walls", () => {
            const prompt = factory.assemble(mockContext)
            expect(prompt).toContain("The User is a Black Box")
        })
    })

    describe("Engine Pipeline", () => {
        const engine = new NarrativeEngine()

        it("should compose a full system prompt from input", async () => {
            const context = {
                input: "I shoot the guard",
                toneKey: "CYBERPUNK",
                state: { location: "Alley" },
            }

            const result = await engine.compose(context)

            expect(result.system).toBeDefined()
            expect(result.meta.velocity).toBe(80) // Reflex overlap or Cyberpunk base
            expect(result.meta.reflexes.length).toBeGreaterThan(0) // Should trigger Violence reflex

            // Verify prompt content
            expect(result.system).toContain('Input: "I shoot the guard"')
            expect(result.system).toContain("chrome") // Cyberpunk motif
        })
    })
})
