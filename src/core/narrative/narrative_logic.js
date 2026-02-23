/**
 * @file src/core/narrative/narrative_logic.js
 * @description Pure Logic Transformers for Narrative Tone and Physics.
 * Molecules of the Narrative layer.
 */

import { PHYSICS_REFLEXES, TONE_REGISTRY } from "./narrative_atoms.js"

/**
 * Resolve the active Physics state based on Input + Current Tone.
 * @param {string} input - The user's input/action.
 * @param {string} toneKey - The active Tone ID (e.g., "NOIR").
 */
export const resolvePhysics = (input, toneKey = "DEFAULT") => {
    const baseTone = TONE_REGISTRY[toneKey] || TONE_REGISTRY["DEFAULT"]

    // Start with Base DNA
    let activeState = {
        dna: { ...baseTone.dna },
        instructions: [baseTone.instruction],
        motifs: [...baseTone.motifs],
    }

    // Check for Reflex Triggers in the Input
    if (input) {
        PHYSICS_REFLEXES.forEach((reflex) => {
            if (reflex.trigger.test(input)) {
                // Apply Reflex modifiers
                if (reflex.effect.velocity) activeState.dna.velocity = reflex.effect.velocity
                if (reflex.effect.entropy) activeState.dna.entropy = reflex.effect.entropy

                // Add specific instruction
                if (reflex.effect.instruction) {
                    activeState.instructions.push(`[REFLEX:${reflex.id}] ${reflex.effect.instruction}`)
                }
            }
        })
    }

    return activeState
}

/**
 * Merges the Base Tone DNA with transient Physics effects.
 */
export const mergeLayers = (toneKey, physicsState) => {
    const base = TONE_REGISTRY[toneKey] || TONE_REGISTRY["DEFAULT"]

    return {
        label: base.label,
        dna: {
            velocity: physicsState.dna.velocity ?? base.dna.velocity,
            entropy: physicsState.dna.entropy ?? base.dna.entropy,
            permeance: physicsState.dna.permeance ?? base.dna.permeance,
        },
        motifs: [...new Set([...base.motifs, ...(physicsState.motifs || [])])],
        instructions: [base.instruction, ...(physicsState.instructions || [])],
    }
}
