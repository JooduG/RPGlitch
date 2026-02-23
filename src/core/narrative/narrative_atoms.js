/**
 * @file src/core/narrative/narrative_atoms.js
 * @description The Registry of DNA and Physics triggers.
 * Pure data atoms.
 */

export const DEFAULT_DNA = {
    velocity: 50,
    entropy: 20,
    permeance: 80,
}

export const PHYSICS_REFLEXES = [
    {
        id: "REFLEX_KINETIC",
        trigger: /(run|sprint|dash|flee|chase|escape|velocity)/i,
        effect: {
            velocity: 90,
            instruction: "Sentences must be short. Action over introspection. No internal monologue.",
        },
    },
    {
        id: "REFLEX_VIOLENCE",
        trigger: /(attack|shoot|kill|stab|hit|punch|blood|wound|damage)/i,
        effect: {
            velocity: 80,
            entropy: 60,
            instruction: "Focus on visceral impact. Describe pain, momentum, and biological damage. No euphemisms.",
        },
    },
    {
        id: "REFLEX_EROS",
        trigger: /(kiss|touch|caress|undress|moan|lust|desire)/i,
        effect: {
            velocity: 30, // Slow down time
            entropy: 40,
            instruction: "Focus on sensory details (temperature, texture, scent). Dilate time. Prioritize somatic feedback.",
        },
    },
    {
        id: "REFLEX_COGNITIVE",
        trigger: /(think|plan|analyze|consider|wonder|remember)/i,
        effect: {
            velocity: 20,
            instruction: "Expand internal logic. Trace the causal chain. Allow for doubt and hypothesis.",
        },
    },
]

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
        instruction: "High contrast lighting. Moral ambiguity. The city is a character. Inner monologue is cynical and observant.",
    },
    ELDRIITCH: {
        label: "Cosmic Horror",
        dna: { velocity: 30, entropy: 80, permeance: 100 },
        motifs: ["viscera", "madness", "geometry", "decay", "void", "insignificance"],
        instruction: "The unknown is dangerous. Physical laws are suggestions. Describe the unnameable. Sanity is fragile.",
    },
    HIGH_FANTASY: {
        label: "Mythic",
        dna: { velocity: 50, entropy: 10, permeance: 60 },
        motifs: ["destiny", "honor", "magic", "bloodlines", "oaths", "nature"],
        instruction: "Elevated diction. Focus on lineage and duty. The world has weight and history. Magic has a cost.",
    },
    CYBERPUNK: {
        label: "Chrome & Dust",
        dna: { velocity: 85, entropy: 50, permeance: 40 },
        motifs: ["chrome", "data", "corps", "drugs", "wires", "survival"],
        instruction: "High tech, low life. Everything is a commodity. slang is prevalent. Violence is sudden and casual.",
    },
}
