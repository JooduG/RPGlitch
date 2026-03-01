/**
 * @file src/core/intelligence/dynamics_engine.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚡ DYNAMICS ENGINE  —  Physics Heart of the Simulation
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * Converts raw user input into a fully resolved physics state, then assembles
 * the final system prompt from that state. This is the main entry point for
 * every simulation turn.
 *
 * DATA FLOW
 *   User input
 *     → scan_reflexes()       — semantic trigger detection
 *     → resolve_dynamics()    — physics state resolution (gravity + laws)
 *     → compose()             — prompt assembly via SYSTEM_PROMPTS.simulation
 *
 * SECTIONS
 *   1. REGISTRY   — Static maps: semantic triggers + axis-to-behavior text
 *   2. SCAN       — Input pattern matching
 *   3. PHYSICS    — State resolution (reflexes, gravity, laws, signals)
 *   4. ASSEMBLY   — Prompt composition and output packaging
 */

import { CONFIG } from "@core/engine/config.js"
import { SYSTEM_PROMPTS } from "@core/intelligence/narrative_logic.js"

/************************************************************************************
 * 🧩 [SECTION: 1. REGISTRY]
 * ----------------------------------------------------------------------------------
 * Static definitions for semantic triggers and qualitative behavior instructions.
 ************************************************************************************/

/**
 * Maps semantic input patterns to physics axis effects.
 * Each entry has an `id`, a `trigger` regex, and an `effect` (axis deltas).
 */
export const DYNAMICS_REFLEXES = [
    {
        id: "VIOLENCE",
        trigger:
            /kill(ed|ing)?|shoot|shot|stabb?(ed|ing)?|punch(ed|ing)?|hit|fought|fight(ing)?|attack(ed|ing)?|gunn?(ed|ing)?|weapon|blood|hurt|destroy(ed|ing)?|br(eak|oke)n?|smash(ed|ing)?|burn(t|ed|ing)?|explosion|die(d|ing)?|fast|speed|impact|crash(ed|ing)?|loud|bang|boom|slam(med|ming)?|athletics?|run(ning)?|jump(ed|ing)?/i,
        effect: { velocity: CONFIG.PHYSICS.REFLEX_VIOLENCE_VELOCITY },
    },
    {
        id: "INTIMACY",
        trigger: /kiss(ed|ing)?|lov(e|ed|ing)|h(e|o)ld(ing)?|hugg?(ed|ing)?|touch(ed|ing)?|gentle|soft|warm|caress(ed|ing)?|cheek|hand|finger|whisper(ed|ing)?|close|safe|trust(ed|ing)?|heart|blush(ed|ing)?|honesty?|truth|tear|cry(ing)?|sad|lonely|ache|naked|bare|skin/i,
        effect: {
            permeability: CONFIG.PHYSICS.REFLEX_INTIMACY_PERMEABILITY,
            resonance: CONFIG.PHYSICS.REFLEX_INTIMACY_RESONANCE,
        },
    },
    {
        id: "FEAR",
        trigger: /scream(ed|ing)?|r(un|an)(ning)?|hid(e|den|ing)?|fear(ed|ing)?|scar(ed|ing)?|dark|shadow|weird|glitch(ed|ing)?|wrong|monster|ghost|dead|rot(ted|ting)?|decay(ed|ing)?|cold|shiver(ed|ing)?|nightmare|static|noise|distortion|fracture(d|ing)?|chaos|erratic|flicker(ed|ing)?/i,
        effect: { entropy: CONFIG.PHYSICS.REFLEX_FEAR_ENTROPY },
    },
    {
        id: "SYNCHRONY",
        trigger: /underst(ood|and)(ing)?|connect(ed|ing)?|sync(hroniz)?(ed|ing)?|resonance|empathy|harmony|together|shared|mind|soul|link(ed|ing)?|bond(ed|ing)?|mirror(ed|ing)?|echo(ed|ing)?|melody|music|rhythm|vibe|frequency|pulse/i,
        effect: { resonance: CONFIG.PHYSICS.REFLEX_SYNCHRONY_RESONANCE },
    },
    {
        id: "STASIS",
        trigger: /br(eathe|eath)(d|ing)?|wait(ed|ing)?|pause(d|ing)?|stop(ped|ping)?|still|silence|quiet|calm(ed|ing)?|rest(ed|ing)?|sleep|slow(ed|ing)?/i,
        effect: { velocity: CONFIG.PHYSICS.REFLEX_STASIS_VELOCITY },
    },
    {
        id: "SHIELDED",
        trigger: /armor(ed)?|shield(ed|ing)?|wall|mask(ed|ing)?|guard(ed|ing)?|protect(ed|ing)?|block(ed|ing)?|shell|barrier|hide|hid(den)?/i,
        effect: { permeability: CONFIG.PHYSICS.REFLEX_SHIELDED_PERMEABILITY },
    },
    {
        id: "ORDERED",
        trigger: /logic(al)?|math(ematics)?|calculat(e|ed|ing)|precise|clean(ed|ing)?|pure|order(ed|ing)?|structur(e|ed|ing)|fact|prove(n|d)?|proof/i,
        effect: { entropy: CONFIG.PHYSICS.REFLEX_ORDERED_ENTROPY },
    },
    {
        id: "DETACHED",
        trigger: /data|clinical|observ(e|ed|ing)|watch(ed|ing)?|analy[sz](e|ed|ing)|study(ing)?|scan(ned|ning)?|test(ed|ing)?|monitor(ed|ing)?|variable/i,
        effect: { resonance: CONFIG.PHYSICS.REFLEX_DETACHED_RESONANCE },
    },
]

/**
 * Maps physics axis thresholds to qualitative behavior instruction strings.
 * Keyed by axis name, then `high` / `low` threshold band.
 */
export const SIGNAL_PROMPTS = {
    velocity: {
        high: { id: "ADRENALINE", text: "Pacing fast. Short sentences. High-stakes urgency." },
        low: { id: "STASIS", text: "Pacing slow. Heavy fatigue. Deliberate, languid actions." },
    },
    entropy: {
        high: { id: "FOG_OF_WAR", text: "Reality destabilizing. Describe glitching, sensory corruption, broken physics." },
        low: { id: "CRYSTALLIZATION", text: "High lucidity. Precise observations. Sharply defined surroundings." },
    },
    permeability: {
        high: { id: "GLASS_CANNON", text: "Sensory raw. Focus on visceral heat, touch, visceral somatic feedback." },
        low: { id: "IRON_BUNKER", text: "Emotional distance. Mental barriers active. Cynical or defensive tone." },
    },
    resonance: {
        high: { id: "OBSESSION", text: "Perspective blur. Deep psychic connection. Shared emotional frequency." },
        low: { id: "APATHY", text: "Clinical gaze. Emotional zero. People viewed as data-points or variables." },
    },
}

/************************************************************************************
 * 🧩 [SECTION: 2. SCAN]
 * ----------------------------------------------------------------------------------
 * Scans input for active semantic triggers.
 ************************************************************************************/

/**
 * Tests input text against all reflex patterns and returns those that match.
 *
 * @param {string} input - Raw user input string.
 * @returns {Array<Object>} Triggered reflex definitions.
 */
export function scan_reflexes(input) {
    if (!input) return []
    return DYNAMICS_REFLEXES.filter((reflex) => reflex.trigger.test(input))
}

/************************************************************************************
 * 🧩 [SECTION: 3. PHYSICS]
 * ----------------------------------------------------------------------------------
 * Dynamics resolution: reflexes, gravity, laws, and signal qualification.
 * The three private helpers all mutate the shared `state` object by reference.
 ************************************************************************************/

/**
 * Pulls each axis value toward the baseline attractor.
 * Ensures a minimum pull of 1 to guarantee eventual convergence.
 * @private
 */
function _apply_gravity(dynamics, phys) {
    const grav = phys.DYNAMICS_GRAVITY_STRENGTH
    const base = phys.DYNAMICS_GRAVITY_BASELINE

    Object.keys(dynamics).forEach((axis) => {
        const diff = base - dynamics[axis]
        if (diff !== 0) {
            let pull = diff * grav
            if (Math.abs(pull) < 1) pull = Math.sign(diff) * 1
            dynamics[axis] += pull
        }
    })
}

/**
 * Applies threshold-based physics laws: flags active states and propagates
 * spillover effects between axes. Reads `prev_dynamics` for lock-in rules.
 * @private
 */
function _apply_laws(state, phys, prev_dynamics) {
    const { velocity, entropy, resonance, permeability } = state.dynamics

    // Velocity Laws
    if (velocity >= phys.LAW_HIGH) {
        state.flags.push("ADRENALINE")
        state.dynamics.permeability += phys.ADRENALINE_PERMEABILITY
        state.dynamics.resonance += phys.ADRENALINE_RESONANCE
    } else if (velocity <= phys.LAW_LOW) {
        state.flags.push("DEEP_BREATH")
        state.dynamics.resonance += phys.DEEP_BREATH_RESONANCE
        state.dynamics.entropy += phys.DEEP_BREATH_ENTROPY
    }

    // Entropy Laws
    if (entropy >= phys.LAW_HIGH) {
        state.flags.push("FOG_OF_WAR")
        state.dynamics.resonance += phys.FOG_RESONANCE
        state.dynamics.velocity += phys.FOG_VELOCITY
    } else if (entropy <= phys.LAW_LOW) {
        state.flags.push("CRYSTALLIZATION")
        state.dynamics.permeability += phys.CRYSTAL_PERMEABILITY
        state.dynamics.velocity += phys.CRYSTAL_VELOCITY
    }

    // Permeability Laws
    if (permeability >= phys.LAW_HIGH) {
        state.flags.push("GLASS_CANNON")
        state.dynamics.entropy *= phys.MODIFIER_GLASS_CANNON_ENTROPY
    } else if (permeability <= phys.LAW_LOW) {
        state.flags.push("IRON_BUNKER")
        state.dynamics.resonance *= phys.MODIFIER_IRON_BUNKER_RESONANCE
    }

    // Resonance Laws
    if (resonance >= phys.LAW_HIGH) {
        state.flags.push("OBSESSION")
        state.dynamics.entropy += phys.OBSESSION_ENTROPY
        state.dynamics.permeability += phys.OBSESSION_PERMEABILITY
    } else if (resonance <= phys.LAW_LOW) {
        state.flags.push("APATHY")
        state.dynamics.velocity += phys.APATHY_VELOCITY
        state.dynamics.entropy += phys.APATHY_ENTROPY
    }

    // Composite Laws
    // ECHO_CHAMBER: High resonance + low entropy → reality lock
    if (resonance >= phys.ECHO_THRESHOLD_RESONANCE && entropy <= phys.ECHO_THRESHOLD_ENTROPY) {
        state.flags.push("ECHO_CHAMBER")
        state.dynamics.entropy = phys.MODIFIER_ECHO_CHAMBER_ENTROPY
    }
    // THE_VENUS: Slow velocity + high permeability → resonance lock-in
    if (velocity <= phys.VENUS_THRESHOLD_VELOCITY && permeability >= phys.VENUS_THRESHOLD_PERMEABILITY) {
        state.flags.push("THE_VENUS")
        if (prev_dynamics) {
            state.dynamics.resonance = Math.max(state.dynamics.resonance, prev_dynamics.resonance)
        }
    }
}

/**
 * Clamps all axis values to [0, 100], then maps them to qualitative
 * behavior texts and named signal flags for the prompt.
 * @private
 */
function _map_signals(state, phys) {
    Object.keys(state.dynamics).forEach((axis) => {
        state.dynamics[axis] = Math.max(0, Math.min(100, Math.round(state.dynamics[axis])))
        const val = state.dynamics[axis]

        if (val > phys.SIGNAL_HIGH) {
            const signal = SIGNAL_PROMPTS[axis].high
            state.behaviors.push(signal.text)
            state.signals[signal.id] = true
        } else if (val < phys.SIGNAL_LOW) {
            const signal = SIGNAL_PROMPTS[axis].low
            state.behaviors.push(signal.text)
            state.signals[signal.id] = true
        }
    })
}

/**
 * Full physics resolution pipeline for one simulation turn.
 *
 * 1. Applies triggered reflexes (axis deltas from input).
 * 2. Applies gravity (pulls axes toward baseline).
 * 3. Applies laws (threshold flags + spillover).
 * 4. Maps signals (clamp + qualify to behavior texts).
 *
 * @param {string}      input            - Raw user input.
 * @param {Object|null} prev_dynamics    - Physics state from the previous turn.
 * @returns {{ dynamics: Object, flags: string[], signals: Object, behaviors: string[] }}
 */
export function resolve_dynamics(input, prev_dynamics = null) {
    const phys = CONFIG.PHYSICS
    const baseline = phys.DYNAMICS_GRAVITY_BASELINE

    const state = {
        dynamics: prev_dynamics ? { ...prev_dynamics } : { velocity: baseline, entropy: baseline, permeability: baseline, resonance: baseline },
        flags: [],
        signals: {}, // signal id → true; used for prompt label selection
        behaviors: [], // qualitative behavior texts injected into the prompt
    }

    // 1. Apply reflexes
    scan_reflexes(input).forEach((reflex) => {
        Object.keys(reflex.effect).forEach((axis) => {
            state.dynamics[axis] += reflex.effect[axis]
        })
    })

    // 2. Apply gravity (before laws, so laws operate on stabilized values)
    _apply_gravity(state.dynamics, phys)

    // 3. Apply laws
    _apply_laws(state, phys, prev_dynamics)

    // 4. Map signals
    _map_signals(state, phys)

    return state
}

/************************************************************************************
 * 🧩 [SECTION: 4. ASSEMBLY]
 * ----------------------------------------------------------------------------------
 * Composes the complete simulation prompt from a resolved physics state.
 ************************************************************************************/

/**
 * Entry point for a single simulation turn.
 * Resolves physics from user input, then builds the full system prompt.
 *
 * @param {Object} context
 * @param {string} context.input                              - Raw user command.
 * @param {string} context.type                              - Prompt type (e.g. "simulation").
 * @param {Object} context.state                             - Current bus state.
 * @param {string|{dynamics?: Object}|null} [context.state.snapshot] - Narrative beat-map string (from ContextBroker) OR a dynamics state object for direct callers (enables physics continuity).
 * @returns {{ system: string, meta: Object }}
 */
export function compose(context) {
    // Read previous dynamics for Gravity continuity.
    // snapshot may be a string (broker beat-map) or an object with a .dynamics field (direct callers).
    const prev_dynamics = typeof context.state?.snapshot === "object" ? context.state.snapshot?.dynamics || null : null

    const physics = resolve_dynamics(context.input, prev_dynamics)

    const system = SYSTEM_PROMPTS.simulation({
        ...context,
        active_signals: physics,
    })

    return {
        system,
        meta: {
            ...physics.dynamics,
            behaviors: physics.behaviors,
            flags: physics.flags,
        },
    }
}

/**
 * Singleton engine interface. Use `Engine.compose(context)` in production code.
 */
export const Engine = { compose }
