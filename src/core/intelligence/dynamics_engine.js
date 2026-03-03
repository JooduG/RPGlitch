/**
 * @file src/core/intelligence/dynamics_engine.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚡ DYNAMICS ENGINE  —  Physics Heart of the Simulation
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * Converts raw user input into a fully resolved physics state, then assembles
 * the final system prompt. This acts as the sensory intake and physics
 * calculator for the digital terrarium.
 *
 * THE KINETIC PIPELINE (Cause & Effect)
 * 1. REFLEX (The Spark)   : User input triggers a semantic regex (e.g., IMPACT).
 * 2. AXIS (The Math)      : Invisible sliders shift (e.g., Velocity rises).
 * 3. GRAVITY (The Anchor) : The axis is pulled back toward the Entity's unique baseline.
 * 4. SIGNAL (The Burn)    : Axis hits a threshold, changing the vibe (e.g., ADRENALINE).
 * 5. LAW (The Inferno)    : Axis maxes out, locking the state (e.g., ADRENALINE_OVERDRIVE).
 *
 * SECTIONS
 * 1. REGISTRY   — Static maps: YOLO triggers + qualitative state instructions.
 * 2. SCAN       — Input pattern matching.
 * 3. PHYSICS    — State resolution (Reflexes -> Gravity -> Laws -> Signals).
 * 4. ASSEMBLY   — Prompt composition and output packaging.
 */

import { CONFIG } from "@core/engine/config.js"
import { SYSTEM_PROMPTS } from "@core/intelligence/prompt_builder.js"

/************************************************************************************
 * 🧩 [SECTION: 1. REGISTRY]
 * ----------------------------------------------------------------------------------
 * Static definitions for semantic triggers and qualitative behavior instructions.
 ************************************************************************************/

/**
 * REFLEXES: The YOLO Stimulus.
 * Maps raw, messy user input patterns to precise physics axis effects.
 */
export const DYNAMICS_REFLEXES = [
    {
        // KINETIC (+): Fast, violent, or high-energy actions.
        id: "IMPACT",
        trigger:
            /kill(ed|ing)?|shoot|shot|stabb?(ed|ing)?|punch(ed|ing)?|hit|fought|fight(ing)?|attack(ed|ing)?|gunn?(ed|ing)?|weapon|blood|hurt|destroy(ed|ing)?|br(eak|oke)n?|smash(ed|ing)?|burn(t|ed|ing)?|explosion|die(d|ing)?|fast|speed|impact|crash(ed|ing)?|loud|bang|boom|slam(med|ming)?|athletics?|run(ning)?|jump(ed|ing)?/i,
        effect: { velocity: CONFIG.DYNAMICS.REFLEX_IMPACT_VELOCITY },
    },
    {
        // KINETIC (-): Slowing down, waiting, resting.
        id: "BREATHER",
        trigger: /br(eathe|eath)(d|ing)?|wait(ed|ing)?|pause(d|ing)?|stop(ped|ping)?|still|silence|quiet|calm(ed|ing)?|rest(ed|ing)?|sleep|slow(ed|ing)?/i,
        effect: { velocity: CONFIG.DYNAMICS.REFLEX_BREATHER_VELOCITY },
    },
    {
        // ENTROPIC (+): Chaos, fear, systemic breakdown.
        id: "GLITCH",
        trigger: /scream(ed|ing)?|r(un|an)(ning)?|hid(e|den|ing)?|fear(ed|ing)?|scar(ed|ing)?|dark|shadow|weird|glitch(ed|ing)?|wrong|monster|ghost|dead|rot(ted|ting)?|decay(ed|ing)?|cold|shiver(ed|ing)?|nightmare|static|noise|distortion|fracture(d|ing)?|chaos|erratic|flicker(ed|ing)?/i,
        effect: { entropy: CONFIG.DYNAMICS.REFLEX_GLITCH_ENTROPY },
    },
    {
        // ENTROPIC (-): Logic, math, structuring reality.
        id: "CALCULATION",
        trigger: /logic(al)?|math(ematics)?|calculat(e|ed|ing)?|precise|clean(ed|ing)?|pure|order(ed|ing)?|structur(e|ed|ing)?|fact|prove(n|d)?|proof/i,
        effect: { entropy: CONFIG.DYNAMICS.REFLEX_CALCULATION_ENTROPY },
    },
    {
        // PERMEABILITY (-): Walling off, physical or emotional defense.
        id: "DEFENSE",
        trigger: /armor(ed)?|shield(ed|ing)?|wall|mask(ed|ing)?|guard(ed|ing)?|protect(ed|ing)?|block(ed|ing)?|shell|barrier|hide|hid(den)?/i,
        effect: { permeability: CONFIG.DYNAMICS.REFLEX_DEFENSE_PERMEABILITY },
    },
    {
        // PERMEABILITY & RESONANCE (+): Empathy, vulnerability, emotional exposure & connection, closeness, physical touch.
        id: "EXPOSURE",
        trigger: /kiss(ed|ing)?|lov(e|ed|ing)?|h(e|o)ld(ing)?|hugg?(ed|ing)?|touch(ed|ing)?|gentle|soft|warm|caress(ed|ing)?|cheek|hand|finger|whisper(ed|ing)?|close|safe|trust(ed|ing)?|heart|blush(ed|ing)?|honesty?|truth|tear|cry(ing)?|sad|lonely|ache|naked|bare|skin/i,
        effect: {
            permeability: CONFIG.DYNAMICS.REFLEX_EXPOSURE_PERMEABILITY,
            resonance: CONFIG.DYNAMICS.REFLEX_EXPOSURE_RESONANCE,
        },
    },
    {
        // RESONANCE (+): Deep connection, shared wavelengths.
        id: "EMPATHY",
        trigger: /underst(ood|and)(ing)?|connect(ed|ing)?|sync(hroniz)?(ed|ing)?|resonance|empathy|harmony|together|shared|mind|soul|link(ed|ing)?|bond(ed|ing)?|mirror(ed|ing)?|echo(ed|ing)?|melody|music|rhythm|vibe|frequency|pulse/i,
        effect: { resonance: CONFIG.DYNAMICS.REFLEX_EMPATHY_RESONANCE },
    },
    {
        // RESONANCE (-): Clinical distance, viewing as data.
        id: "EXAMINATION",
        trigger: /data|clinical|observ(e|ed|ing)?|watch(ed|ing)?|analy[sz](e|ed|ing)?|study(ing)?|scan(ned|ning)?|test(ed|ing)?|monitor(ed|ing)?|variable/i,
        effect: { resonance: CONFIG.DYNAMICS.REFLEX_EXAMINATION_RESONANCE },
    },
]

/**
 * SIGNALS: The State.
 * Maps physics axis thresholds to qualitative behavior instructions for the LLM.
 */
export const SIGNAL_PROMPTS = {
    velocity: {
        high: { id: "ADRENALINE", text: "Pacing fast. Short sentences. High-stakes urgency." },
        low: { id: "SLOW_MOTION", text: "Pacing slow. Heavy fatigue. Deliberate, languid actions." },
    },
    entropy: {
        high: { id: "CORRUPTION", text: "Reality destabilizing. Describe glitching, sensory corruption, broken physics." },
        low: { id: "LOGIC", text: "High lucidity. Precise observations. Sharply defined surroundings." },
    },
    permeability: {
        high: { id: "VULNERABILITY", text: "Sensory raw. Focus on visceral heat, touch, somatic feedback." },
        low: { id: "BUNKER", text: "Emotional distance. Mental barriers active. Cynical or defensive tone." },
    },
    resonance: {
        high: { id: "OBSESSION", text: "Perspective blur. Deep psychic connection. Shared emotional frequency." },
        low: { id: "APATHY", text: "Clinical gaze. Emotional zero. People viewed as data-points or variables." },
    },
}

/************************************************************************************
 * 🧩 [SECTION: 2. SCAN]
 * ----------------------------------------------------------------------------------
 * Intercepts user input and matches it against the Reflex registry.
 ************************************************************************************/

/**
 * Sweeps the input string for semantic triggers.
 *
 * @param {string} input - Raw user command.
 * @returns {Array<Object>} Activated reflex objects.
 */
export function scan_reflexes(input) {
    if (!input) return []
    return DYNAMICS_REFLEXES.filter((reflex) => reflex.trigger.test(input))
}

/************************************************************************************
 * 🧩 [SECTION: 3. PHYSICS]
 * ----------------------------------------------------------------------------------
 * The mathematical heart. Applies reflexes, gravity, laws, and signal mapping.
 * All private helpers mutate the shared `state` object by reference.
 ************************************************************************************/

/**
 * Applies Gravity: Pulls each axis toward the character's specific baseline attractor.
 * The entity's DNA defines their psychological homeostasis.
 * @private
 */
function _apply_gravity(dynamics, phys, baselines) {
    const grav = phys.DYNAMICS_GRAVITY_STRENGTH

    Object.keys(dynamics).forEach((axis) => {
        const diff = baselines[axis] - dynamics[axis]
        if (diff !== 0) {
            let pull = diff * grav
            if (Math.abs(pull) < 1) pull = Math.sign(diff) * 1
            dynamics[axis] += pull
        }
    })
}

/**
 * LAWS: The Extreme State Lock-In.
 * Evaluates axis thresholds. If breached, injects strict narrative flags
 * and forces mathematical spillover into adjacent axes.
 * @private
 */
function _apply_laws(state, phys, prev_dynamics) {
    const { velocity, entropy, resonance, permeability } = state.dynamics

    // --- VELOCITY LAWS ---
    if (velocity >= phys.LAW_HIGH) {
        state.flags.push("ADRENALINE_OVERDRIVE")
        state.dynamics.permeability += phys.ADRENALINE_OVERDRIVE_PERMEABILITY
        state.dynamics.resonance += phys.ADRENALINE_OVERDRIVE_RESONANCE
    } else if (velocity <= phys.LAW_LOW) {
        state.flags.push("STOP")
        state.dynamics.resonance += phys.STOP_RESONANCE
        state.dynamics.entropy += phys.STOP_ENTROPY
    }

    // --- ENTROPY LAWS ---
    if (entropy >= phys.LAW_HIGH) {
        state.flags.push("REALITY_CORRUPTION")
        state.dynamics.resonance += phys.REALITY_CORRUPTION_RESONANCE
        state.dynamics.velocity += phys.REALITY_CORRUPTION_VELOCITY
    } else if (entropy <= phys.LAW_LOW) {
        state.flags.push("PERFECT_LOGIC")
        state.dynamics.permeability += phys.PERFECT_LOGIC_PERMEABILITY
        state.dynamics.velocity += phys.PERFECT_LOGIC_VELOCITY
    }

    // --- PERMEABILITY LAWS ---
    if (permeability >= phys.LAW_HIGH) {
        state.flags.push("EXPOSED_VULNERABILITY")
        state.dynamics.entropy *= phys.MODIFIER_EXPOSED_VULNERABILITY_ENTROPY
    } else if (permeability <= phys.LAW_LOW) {
        state.flags.push("IRON_BUNKER")
        state.dynamics.resonance *= phys.MODIFIER_IRON_BUNKER_RESONANCE
    }

    // --- RESONANCE LAWS ---
    if (resonance >= phys.LAW_HIGH) {
        state.flags.push("MANIC_OBSESSION")
        state.dynamics.entropy += phys.MANIC_OBSESSION_ENTROPY
        state.dynamics.permeability += phys.MANIC_OBSESSION_PERMEABILITY
    } else if (resonance <= phys.LAW_LOW) {
        state.flags.push("TOTAL_APATHY")
        state.dynamics.velocity += phys.TOTAL_APATHY_VELOCITY
        state.dynamics.entropy += phys.TOTAL_APATHY_ENTROPY
    }

    // --- COMPOSITE LAWS (Multi-Axis Lock-ins) ---
    // RESONANCE_CASCADE: High empathy + extreme order locks the system into an echo loop.
    if (resonance >= phys.RESONANCE_CASCADE_THRESHOLD_RESONANCE && entropy <= phys.RESONANCE_CASCADE_THRESHOLD_ENTROPY) {
        state.flags.push("RESONANCE_CASCADE")
        state.dynamics.entropy = phys.MODIFIER_RESONANCE_CASCADE_ENTROPY
    }
    // EVENT_HORIZON: Arrested momentum + sensory vulnerability traps the entity in the moment.
    if (velocity <= phys.EVENT_HORIZON_THRESHOLD_VELOCITY && permeability >= phys.EVENT_HORIZON_THRESHOLD_PERMEABILITY) {
        state.flags.push("EVENT_HORIZON")
        if (prev_dynamics) {
            state.dynamics.resonance = Math.max(state.dynamics.resonance, prev_dynamics.resonance)
        }
    }
}

/**
 * Clamps raw axis math to [0, 100], mapping the values to qualitative
 * behavior descriptions via the SIGNAL_PROMPTS registry.
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
 * The Master Resolution Pipeline.
 *
 * Runs a single simulation tick:
 * 1. Reflexes (Add user momentum)
 * 2. Gravity (Bleed off old momentum toward the entity's baseline)
 * 3. Laws (Enforce extreme limits)
 * 4. Signals (Translate to language)
 *
 * @param {string}      input            - Raw user input.
 * @param {Object}      [entity_baselines] - The strict { velocity, entropy, permeability, resonance } DNA of the entity.
 * @param {Object|null} [prev_dynamics=null] - The resolved state from the previous turn.
 * @returns {{ dynamics: Object, flags: string[], signals: Object, behaviors: string[] }}
 */
export function resolve_dynamics(input, entity_baselines, prev_dynamics = null) {
    const phys = CONFIG.DYNAMICS
    const baseline = phys.DYNAMICS_GRAVITY_BASELINE
    const resolved_baselines = entity_baselines || {
        velocity: baseline,
        entropy: baseline,
        permeability: baseline,
        resonance: baseline,
    }

    const state = {
        // If no previous dynamics exist, the entity starts exactly at their baseline.
        dynamics: prev_dynamics ? { ...prev_dynamics } : { ...resolved_baselines },
        flags: [],
        signals: {}, // Maps string ID (e.g., "ADRENALINE") to true
        behaviors: [], // Extracted text injected into the final prompt
    }

    scan_reflexes(input).forEach((reflex) => {
        Object.keys(reflex.effect).forEach((axis) => {
            state.dynamics[axis] += reflex.effect[axis]
        })
    })

    _apply_gravity(state.dynamics, phys, resolved_baselines)
    _apply_laws(state, phys, prev_dynamics)
    _map_signals(state, phys)

    return state
}

/************************************************************************************
 * 🧩 [SECTION: 4. ASSEMBLY]
 * ----------------------------------------------------------------------------------
 * Assembles the final, logic-enriched system prompt.
 ************************************************************************************/

/**
 * Orchestrates a physics turn and wraps it into the Prompt Builder.
 *
 * @param {Object} context
 * @param {string} context.input                             - The user's input string.
 * @param {string} context.type                              - Prompt type identifier (e.g., "simulation").
 * @param {Object} context.state                             - Application payload wrapper.
 * @param {Object} context.state.entity                      - Entity container.
 * @param {Array} context.state.entity.list                 - List of active entities.
 * @param {string|{dynamics?: Object}|null} [context.state.snapshot] - Contains narrative beat-map or previous physics state.
 * @returns {{ system: string, meta: Object }}
 */
export function compose(context) {
    const prev_dynamics = typeof context.state?.snapshot === "object" ? context.state.snapshot?.dynamics || null : null

    // Extract strict baselines. If they aren't here, the data layer failed its job.
    const ai_entity = context.state?.entity?.list?.find((e) => e.role === "AI")
    const baseline = CONFIG.DYNAMICS.DYNAMICS_GRAVITY_BASELINE
    const entity_baselines = ai_entity?.data?.dynamics ||
        ai_entity?.dynamics || {
            velocity: baseline,
            entropy: baseline,
            permeability: baseline,
            resonance: baseline,
        }

    const physics = resolve_dynamics(context.input, entity_baselines, prev_dynamics)

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
 * Singleton export matching the required interface.
 */
export const Engine = { compose }
