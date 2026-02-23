/**
 * @file src/core/narrative/narrative_engine.js
 * @description The Narrative Engine Core.
 * Orchestrates the interaction between Physics, Tone, and the Prompt Factory.
 */

import { SYSTEM_PROMPTS } from "@core/intelligence/intelligence_logic.js"
import { mergeLayers, resolvePhysics } from "./narrative_logic.js"

export class NarrativeEngine {
    /**
     * The Main Pipeline: Input -> Physics -> Tone -> Prompt -> Output
     * @param {Object} context - The full simulation context.
     * @param {string} context.input - User's raw input.
     * @param {string} context.toneKey - Current Tone ID (e.g., "NOIR").
     * @param {Object} context.state - Current Simulation State (Chrono, Entity, etc.).
     * @param {string} context.type - Generation type (prose | visual | physics).
     */
    async compose(context) {
        // 1. Physics Layer: Analyze Input for Reflexes
        const physicsState = resolvePhysics(context.input, context.toneKey)

        // 2. Tone Layer: Merge Base Tone with Physics Modifiers
        const activeTone = mergeLayers(context.toneKey, physicsState)

        // 3. Logic Layer: Construct the System Prompt
        const systemPrompt = SYSTEM_PROMPTS.simulation({
            ...context,
            tone: activeTone,
            visualsAuthorized: context.type === "visual",
        })

        return {
            system: systemPrompt,
            meta: {
                velocity: activeTone.dna.velocity,
                entropy: activeTone.dna.entropy,
                visuals: context.type === "visual",
                reflexes: physicsState.instructions.filter((i) => i.startsWith("[REFLEX")),
            },
        }
    }
}

export const Engine = new NarrativeEngine()
