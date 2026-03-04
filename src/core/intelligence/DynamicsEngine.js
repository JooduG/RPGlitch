/**
 * @file src/core/intelligence/DynamicsEngine.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚡ DYNAMICS ENGINE — Physics Heart of the Simulation
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Simulates psychological and physical shifts based on user input and entity state.
 * Transforms an IntelligencePayload into a SimulationSnapshot.
 */

import { CONFIG } from "@core/engine/config.js"

/**
 * @typedef {Object} IntelligencePayload
 * @typedef {Object} SimulationSnapshot
 */

/************************************************************************************
 * 🧩 [SECTION: REGISTRY]
 * ----------------------------------------------------------------------------------
 * Static definitions for semantic triggers and qualitative behavior instructions.
 ************************************************************************************/

const DYNAMICS_REFLEXES = [
    {
        id: "IMPACT",
        trigger:
            /kill(ed|ing)?|shoot|shot|stabb?(ed|ing)?|punch(ed|ing)?|hit|fought|fight(ing)?|attack(ed|ing)?|gunn?(ed|ing)?|weapon|blood|hurt|destroy(ed|ing)?|br(eak|oke)n?|smash(ed|ing)?|burn(t|ed|ing)?|explosion|die(d|ing)?|fast|speed|impact|crash(ed|ing)?|loud|bang|boom|slam(med|ming)?|athletics?|run(ning)?|jump(ed|ing)?/i,
        effect: { velocity: CONFIG.DYNAMICS.REFLEX_IMPACT_VELOCITY },
    },
    {
        id: "BREATHER",
        trigger: /br(eathe|eath)(d|ing)?|wait(ed|ing)?|pause(d|ing)?|stop(ped|ping)?|still|silence|quiet|calm(ed|ing)?|rest(ed|ing)?|sleep|slow(ed|ing)?/i,
        effect: { velocity: CONFIG.DYNAMICS.REFLEX_BREATHER_VELOCITY },
    },
    {
        id: "GLITCH",
        trigger: /scream(ed|ing)?|r(un|an)(ning)?|hid(e|den|ing)?|fear(ed|ing)?|scar(ed|ing)?|dark|shadow|weird|glitch(ed|ing)?|wrong|monster|ghost|dead|rot(ted|ting)?|decay(ed|ing)?|cold|shiver(ed|ing)?|nightmare|static|noise|distortion|fracture(d|ing)?|chaos|erratic|flicker(ed|ing)?/i,
        effect: { entropy: CONFIG.DYNAMICS.REFLEX_GLITCH_ENTROPY },
    },
    {
        id: "CALCULATION",
        trigger: /logic(al)?|math(ematics)?|calculat(e|ed|ing)?|precise|clean(ed|ing)?|pure|order(ed|ing)?|structur(e|ed|ing)?|fact|prove(n|d)?|proof/i,
        effect: { entropy: CONFIG.DYNAMICS.REFLEX_CALCULATION_ENTROPY },
    },
    {
        id: "DEFENSE",
        trigger: /armor(ed)?|shield(ed|ing)?|wall|mask(ed|ing)?|guard(ed|ing)?|protect(ed|ing)?|block(ed|ing)?|shell|barrier|hide|hid(den)?/i,
        effect: { permeability: CONFIG.DYNAMICS.REFLEX_DEFENSE_PERMEABILITY },
    },
    {
        id: "EXPOSURE",
        trigger: /kiss(ed|ing)?|lov(e|ed|ing)?|h(e|o)ld(ing)?|hugg?(ed|ing)?|touch(ed|ing)?|gentle|soft|warm|caress(ed|ing)?|cheek|hand|finger|whisper(ed|ing)?|close|safe|trust(ed|ing)?|heart|blush(ed|ing)?|honesty?|truth|tear|cry(ing)?|sad|lonely|ache|naked|bare|skin/i,
        effect: {
            permeability: CONFIG.DYNAMICS.REFLEX_EXPOSURE_PERMEABILITY,
            resonance: CONFIG.DYNAMICS.REFLEX_EXPOSURE_RESONANCE,
        },
    },
    {
        id: "EMPATHY",
        trigger: /underst(ood|and)(ing)?|connect(ed|ing)?|sync(hroniz)?(ed|ing)?|resonance|empathy|harmony|together|shared|mind|soul|link(ed|ing)?|bond(ed|ing)?|mirror(ed|ing)?|echo(ed|ing)?|melody|music|rhythm|vibe|frequency|pulse/i,
        effect: { resonance: CONFIG.DYNAMICS.REFLEX_EMPATHY_RESONANCE },
    },
    {
        id: "EXAMINATION",
        trigger: /data|clinical|observ(e|ed|ing)?|watch(ed|ing)?|analy[sz](e|ed|ing)?|study(ing)?|scan(ned|ning)?|test(ed|ing)?|monitor(ed|ing)?|variable/i,
        effect: { resonance: CONFIG.DYNAMICS.REFLEX_EXAMINATION_RESONANCE },
    },
]

const SIGNAL_PROMPTS = {
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

export class DynamicsEngine {
    /************************************************************************************
     * 🧩 [SECTION: SIMULATION PHASE]
     * ----------------------------------------------------------------------------------
     * Entry point for physics resolution using the IntelligencePayload.
     ************************************************************************************/

    /**
     * Executes the simulation turn.
     * @param {IntelligencePayload} payload - The hydrated state from ContextBroker.
     * @returns {SimulationSnapshot}
     */
    static simulate(payload) {
        const { input, entities, history } = payload
        const ai_entity = entities.AI

        // 1. Resolve baselines
        const d_phys = CONFIG.DYNAMICS
        const baseline_val = d_phys.DYNAMICS_GRAVITY_BASELINE
        const baselines = ai_entity.dynamics || {
            velocity: baseline_val,
            entropy: baseline_val,
            permeability: baseline_val,
            resonance: baseline_val,
        }

        // 2. Resolve target dynamics (previous state)
        const prev_dynamics = history && history.dynamics ? history.dynamics : null

        // 3. Resolve Physics
        return DynamicsEngine.resolve_dynamics(input, baselines, prev_dynamics)
    }

    /**
     * Scans text for dynamic reflexes.
     */
    static scan_reflexes(text) {
        if (!text) return []
        return DYNAMICS_REFLEXES.filter((r) => r.trigger.test(text))
    }

    /**
     * Core resolution logic.
     */
    static resolve_dynamics(input, baselines, prev_dynamics = null) {
        const d_phys = CONFIG.DYNAMICS

        const state = {
            dynamics: prev_dynamics ? { ...prev_dynamics } : { ...baselines },
            flags: [],
            signals: {},
            behaviors: [],
        }

        // Apply Reflexes
        const triggered = DynamicsEngine.scan_reflexes(input)
        triggered.forEach((reflex) => {
            Object.keys(reflex.effect).forEach((axis) => {
                state.dynamics[axis] += reflex.effect[axis]
            })
        })

        DynamicsEngine._apply_gravity(state.dynamics, d_phys, baselines)
        DynamicsEngine._apply_laws(state, d_phys, prev_dynamics)
        DynamicsEngine._map_signals(state, d_phys)

        return state
    }

    /************************************************************************************
     * 🧩 [SECTION: PHYSICS HELPERS]
     * ----------------------------------------------------------------------------------
     * Mathematical operations for gravity, laws, and signal mapping.
     ************************************************************************************/

    static _apply_gravity(dynamics, phys, baselines) {
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

    static _apply_laws(state, phys, prev_dynamics) {
        const { velocity, entropy, resonance, permeability } = state.dynamics

        // Velocity Laws
        if (velocity >= phys.LAW_HIGH) {
            state.flags.push("ADRENALINE_OVERDRIVE")
            state.dynamics.permeability += phys.ADRENALINE_OVERDRIVE_PERMEABILITY
            state.dynamics.resonance += phys.ADRENALINE_OVERDRIVE_RESONANCE
        } else if (velocity <= phys.LAW_LOW) {
            state.flags.push("STOP")
            state.dynamics.resonance += phys.STOP_RESONANCE
            state.dynamics.entropy += phys.STOP_ENTROPY
        }

        // Entropy Laws
        if (entropy >= phys.LAW_HIGH) {
            state.flags.push("REALITY_CORRUPTION")
            state.dynamics.resonance += phys.REALITY_CORRUPTION_RESONANCE
            state.dynamics.velocity += phys.REALITY_CORRUPTION_VELOCITY
        } else if (entropy <= phys.LAW_LOW) {
            state.flags.push("PERFECT_LOGIC")
            state.dynamics.permeability += phys.PERFECT_LOGIC_PERMEABILITY
            state.dynamics.velocity += phys.PERFECT_LOGIC_VELOCITY
        }

        // Permeability Laws
        if (permeability >= phys.LAW_HIGH) {
            state.flags.push("EXPOSED_VULNERABILITY")
            state.dynamics.entropy *= phys.MODIFIER_EXPOSED_VULNERABILITY_ENTROPY
        } else if (permeability <= phys.LAW_LOW) {
            state.flags.push("IRON_BUNKER")
            state.dynamics.resonance *= phys.MODIFIER_IRON_BUNKER_RESONANCE
        }

        // Resonance Laws
        if (resonance >= phys.LAW_HIGH) {
            state.flags.push("MANIC_OBSESSION")
            state.dynamics.entropy += phys.MANIC_OBSESSION_ENTROPY
            state.dynamics.permeability += phys.MANIC_OBSESSION_PERMEABILITY
        } else if (resonance <= phys.LAW_LOW) {
            state.flags.push("TOTAL_APATHY")
            state.dynamics.velocity += phys.TOTAL_APATHY_VELOCITY
            state.dynamics.entropy += phys.TOTAL_APATHY_ENTROPY
        }

        // Composite Laws
        if (resonance >= phys.RESONANCE_CASCADE_THRESHOLD_RESONANCE && entropy <= phys.RESONANCE_CASCADE_THRESHOLD_ENTROPY) {
            state.flags.push("RESONANCE_CASCADE")
            state.dynamics.entropy = phys.MODIFIER_RESONANCE_CASCADE_ENTROPY
        }
        if (velocity <= phys.EVENT_HORIZON_THRESHOLD_VELOCITY && permeability >= phys.EVENT_HORIZON_THRESHOLD_PERMEABILITY) {
            state.flags.push("EVENT_HORIZON")
            if (prev_dynamics) {
                state.dynamics.resonance = Math.max(state.dynamics.resonance, prev_dynamics.resonance)
            }
        }
    }

    static _map_signals(state, phys) {
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
}
