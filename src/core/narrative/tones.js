/**
 * @file src/core/narrative/tones.js
 * @description The "Personality" of the Simulation.
 * Defines Narrative DNA, Physics Reflexes, and Style Modules.
 */

// ==========================================
// 1. NARRATIVE DNA (The Base Stats)
// ==========================================
// Velocity: Speed of the narrative (0=Stagnant, 100=Frenetic)
// Entropy: Chaos/Randomness factor (0=Deterministic, 100=Pure Noise)
// Permeance: Stickiness of memory/consequences (0=Dream logic, 100=Hardcore)

export const DEFAULT_DNA = {
    velocity: 50,
    entropy: 20,
    permeance: 80,
}

// ==========================================
// 2. PHYSICS REFLEXES (The Impulse)
// ==========================================
// Regex triggers that override the Narrative DNA momentarily.

export const PHYSICS_REFLEXES = [
    {
        id: "REFLEX_KINETIC",
        trigger: /(run|sprint|dash|flee|chase|escape|velocity)/i,
        effect: {
            velocity: 90,
            instruction:
                "Sentences must be short. Action over introspection. No internal monologue.",
        },
    },
    {
        id: "REFLEX_VIOLENCE",
        trigger: /(attack|shoot|kill|stab|hit|punch|blood|wound|damage)/i,
        effect: {
            velocity: 80,
            entropy: 60,
            instruction:
                "Focus on visceral impact. Describe pain, momentum, and biological damage. No euphemisms.",
        },
    },
    {
        id: "REFLEX_EROS",
        trigger: /(kiss|touch|caress|undress|moan|lust|desire)/i,
        effect: {
            velocity: 30, // Slow down time
            entropy: 40,
            instruction:
                "Focus on sensory details (temperature, texture, scent). Dilate time. Prioritize somatic feedback.",
        },
    },
    {
        id: "REFLEX_COGNITIVE",
        trigger: /(think|plan|analyze|consider|wonder|remember)/i,
        effect: {
            velocity: 20,
            instruction:
                "Expand internal logic. Trace the causal chain. Allow for doubt and hypothesis.",
        },
    },
]

// ==========================================
// 3. STYLE MODULES (The Author)
// ==========================================
// "Mods" that reshape the voice and atmosphere.

export const TONE_REGISTRY = {
    DEFAULT: {
        label: "RPGlitch Standard",
        dna: { ...DEFAULT_DNA },
        motifs: [],
        instruction: "Standard roleplay. Balanced and reactive.",
    },
    NOIR: {
        label: "Neo-Noir",
        dna: { velocity: 40, entropy: 30, permeance: 90 },
        motifs: ["rain", "shadows", "smoke", "neon", "whiskey", "cynicism"],
        instruction:
            "High contrast lighting. Moral ambiguity. The city is a character. Inner monologue is cynical and observant.",
    },
    ELDRIITCH: {
        label: "Cosmic Horror",
        dna: { velocity: 30, entropy: 80, permeance: 100 },
        motifs: [
            "viscera",
            "madness",
            "geometry",
            "decay",
            "void",
            "insignificance",
        ],
        instruction:
            "The unknown is dangerous. Physical laws are suggestions. Describe the unnameable. Sanity is fragile.",
    },
    HIGH_FANTASY: {
        label: "Mythic",
        dna: { velocity: 50, entropy: 10, permeance: 60 },
        motifs: ["destiny", "honor", "magic", "bloodlines", "oaths", "nature"],
        instruction:
            "Elevated diction. Focus on lineage and duty. The world has weight and history. Magic has a cost.",
    },
    CYBERPUNK: {
        label: "Chrome & Dust",
        dna: { velocity: 85, entropy: 50, permeance: 40 },
        motifs: ["chrome", "data", "corps", "drugs", "wires", "survival"],
        instruction:
            "High tech, low life. Everything is a commodity. slang is prevalent. Violence is sudden and casual.",
    },
}

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
                if (reflex.effect.velocity)
                    activeState.dna.velocity = reflex.effect.velocity
                if (reflex.effect.entropy)
                    activeState.dna.entropy = reflex.effect.entropy

                // Add specific instruction
                if (reflex.effect.instruction) {
                    activeState.instructions.push(
                        `[REFLEX:${reflex.id}] ${reflex.effect.instruction}`
                    )
                }
            }
        })
    }

    return activeState
}
