/**
 * @file src/core/narrative/engine.js
 * @description The Narrative Engine Core.
 * Orchestrates the interaction between Physics, Tone, and the Prompt Factory.
 */

import { PromptFactory } from "@core/narrative/prompt.js"
import { TONE_REGISTRY, resolvePhysics } from "./tones.js"

export class NarrativeEngine {
    constructor() {
        this.promptFactory = new PromptFactory()
    }

    /**
     * The Main Pipeline: Input -> Physics -> Tone -> Prompt -> Output
     * @param {Object} context - The full simulation context.
     * @param {string} context.input - User's raw input.
     * @param {string} context.toneKey - Current Tone ID (e.g., "NOIR").
     * @param {Object} context.state - Current Simulation State (Chrono, Entity, etc.).
     */
    async compose(context) {
        // 1. Physics Layer: Analyze Input for Reflexes
        const physicsState = resolvePhysics(context.input, context.toneKey)

        // 2. Tone Layer: Merge Base Tone with Physics Modifiers
        const activeTone = this.mergeLayers(context.toneKey, physicsState)

        // 3. Logic Layer: Construct the System Prompt
        const systemPrompt = this.promptFactory.assemble({
            ...context,
            tone: activeTone,
        })

        return {
            system: systemPrompt,
            meta: {
                velocity: activeTone.dna.velocity,
                entropy: activeTone.dna.entropy,
                reflexes: physicsState.instructions.filter((i) =>
                    i.startsWith("[REFLEX")
                ),
            },
        }
    }

    /**
     * Merges the Base Tone DNA with transient Physics effects.
     */
    mergeLayers(toneKey, physicsState) {
        const base = TONE_REGISTRY[toneKey] || TONE_REGISTRY["DEFAULT"]

        return {
            label: base.label,
            dna: {
                velocity: physicsState.dna.velocity ?? base.dna.velocity,
                entropy: physicsState.dna.entropy ?? base.dna.entropy,
                permeance: physicsState.dna.permeance ?? base.dna.permeance,
            },
            motifs: [
                ...new Set([...base.motifs, ...(physicsState.motifs || [])]),
            ],
            instructions: [
                base.instruction,
                ...(physicsState.instructions || []),
            ],
        }
    }
}

export const Engine = new NarrativeEngine()
