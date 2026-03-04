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
        effect: { intensity: CONFIG.DYNAMICS.REFLEX_IMPACT_INTENSITY },
    },
    {
        id: "BREATHER",
        trigger: /br(eathe|eath)(d|ing)?|wait(ed|ing)?|pause(d|ing)?|stop(ped|ping)?|still|silence|quiet|calm(ed|ing)?|rest(ed|ing)?|sleep|slow(ed|ing)?/i,
        effect: { intensity: CONFIG.DYNAMICS.REFLEX_BREATHER_INTENSITY },
    },
    {
        id: "GLITCH",
        trigger: /scream(ed|ing)?|r(un|an)(ning)?|hid(e|den|ing)?|fear(ed|ing)?|scar(ed|ing)?|dark|shadow|weird|glitch(ed|ing)?|wrong|monster|ghost|dead|rot(ted|ting)?|decay(ed|ing)?|cold|shiver(ed|ing)?|nightmare|static|noise|distortion|fracture(d|ing)?|chaos|erratic|flicker(ed|ing)?/i,
        effect: { chaos: CONFIG.DYNAMICS.REFLEX_GLITCH_CHAOS },
    },
    {
        id: "CALCULATION",
        trigger: /logic(al)?|math(ematics)?|calculat(e|ed|ing)?|precise|clean(ed|ing)?|pure|order(ed|ing)?|structur(e|ed|ing)?|fact|prove(n|d)?|proof/i,
        effect: { chaos: CONFIG.DYNAMICS.REFLEX_CALCULATION_CHAOS },
    },
    {
        id: "DEFENSE",
        trigger: /armor(ed)?|shield(ed|ing)?|wall|mask(ed|ing)?|guard(ed|ing)?|protect(ed|ing)?|block(ed|ing)?|shell|barrier|hide|hid(den)?/i,
        effect: { openness: CONFIG.DYNAMICS.REFLEX_DEFENSE_OPENNESS },
    },
    {
        id: "EXPOSURE",
        trigger: /kiss(ed|ing)?|lov(e|ed|ing)?|h(e|o)ld(ing)?|hugg?(ed|ing)?|touch(ed|ing)?|gentle|soft|warm|caress(ed|ing)?|cheek|hand|finger|whisper(ed|ing)?|close|safe|trust(ed|ing)?|heart|blush(ed|ing)?|honesty?|truth|tear|cry(ing)?|sad|lonely|ache|naked|bare|skin/i,
        effect: {
            openness: CONFIG.DYNAMICS.REFLEX_EXPOSURE_OPENNESS,
            affinity: CONFIG.DYNAMICS.REFLEX_EXPOSURE_AFFINITY,
        },
    },
    {
        id: "EMPATHY",
        trigger: /underst(ood|and)(ing)?|connect(ed|ing)?|sync(hroniz)?(ed|ing)?|resonance|empathy|harmony|together|shared|mind|soul|link(ed|ing)?|bond(ed|ing)?|mirror(ed|ing)?|echo(ed|ing)?|melody|music|rhythm|vibe|frequency|pulse/i,
        effect: { affinity: CONFIG.DYNAMICS.REFLEX_EMPATHY_AFFINITY },
    },
    {
        id: "EXAMINATION",
        trigger: /data|clinical|observ(e|ed|ing)?|watch(ed|ing)?|analy[sz](e|ed|ing)?|study(ing)?|scan(ned|ning)?|test(ed|ing)?|monitor(ed|ing)?|variable/i,
        effect: { affinity: CONFIG.DYNAMICS.REFLEX_EXAMINATION_AFFINITY },
    },
]

const SIGNAL_PROMPTS = {
    intensity: {
        high: { id: "ADRENALINE", text: "Pacing fast. Short sentences. High-stakes urgency." },
        low: { id: "SLOW_MOTION", text: "Pacing slow. Heavy fatigue. Deliberate, languid actions." },
    },
    chaos: {
        high: { id: "CORRUPTION", text: "Reality destabilizing. Describe glitching, sensory corruption, broken physics." },
        low: { id: "LOGIC", text: "High lucidity. Precise observations. Sharply defined surroundings." },
    },
    openness: {
        high: { id: "VULNERABILITY", text: "Sensory raw. Focus on visceral heat, touch, somatic feedback." },
        low: { id: "GUARDED", text: "Emotional distance. Mental barriers active. Cynical or defensive tone." },
    },
    affinity: {
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
            intensity: baseline_val,
            chaos: baseline_val,
            openness: baseline_val,
            affinity: baseline_val,
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
        const { intensity, chaos, affinity, openness } = state.dynamics

        // Intensity Laws
        if (intensity >= phys.LAW_HIGH) {
            state.flags.push("ADRENALINE_OVERDRIVE")
            state.dynamics.openness += phys.ADRENALINE_OVERDRIVE_OPENNESS
            state.dynamics.affinity += phys.ADRENALINE_OVERDRIVE_AFFINITY
        } else if (intensity <= phys.LAW_LOW) {
            state.flags.push("STOP")
            state.dynamics.affinity += phys.STOP_AFFINITY
            state.dynamics.chaos += phys.STOP_CHAOS
        }

        // Chaos Laws
        if (chaos >= phys.LAW_HIGH) {
            state.flags.push("REALITY_CORRUPTION")
            state.dynamics.affinity += phys.REALITY_CORRUPTION_AFFINITY
            state.dynamics.intensity += phys.REALITY_CORRUPTION_INTENSITY
        } else if (chaos <= phys.LAW_LOW) {
            state.flags.push("PERFECT_LOGIC")
            state.dynamics.openness += phys.PERFECT_LOGIC_OPENNESS
            state.dynamics.intensity += phys.PERFECT_LOGIC_INTENSITY
        }

        // Openness Laws
        if (openness >= phys.LAW_HIGH) {
            state.flags.push("EXPOSED_VULNERABILITY")
            state.dynamics.chaos *= phys.MODIFIER_EXPOSED_VULNERABILITY_CHAOS
        } else if (openness <= phys.LAW_LOW) {
            state.flags.push("IRON_GUARDED")
            state.dynamics.affinity *= phys.MODIFIER_IRON_GUARDED_AFFINITY
        }

        // Affinity Laws
        if (affinity >= phys.LAW_HIGH) {
            state.flags.push("MANIC_OBSESSION")
            state.dynamics.chaos += phys.MANIC_OBSESSION_CHAOS
            state.dynamics.openness += phys.MANIC_OBSESSION_OPENNESS
        } else if (affinity <= phys.LAW_LOW) {
            state.flags.push("TOTAL_APATHY")
            state.dynamics.intensity += phys.TOTAL_APATHY_INTENSITY
            state.dynamics.chaos += phys.TOTAL_APATHY_CHAOS
        }

        // Composite Laws
        if (affinity >= phys.AFFINITY_CASCADE_THRESHOLD_AFFINITY && chaos <= phys.AFFINITY_CASCADE_THRESHOLD_CHAOS) {
            state.flags.push("AFFINITY_CASCADE")
            state.dynamics.chaos = phys.MODIFIER_AFFINITY_CASCADE_CHAOS
        }
        if (intensity <= phys.EVENT_HORIZON_THRESHOLD_INTENSITY && openness >= phys.EVENT_HORIZON_THRESHOLD_OPENNESS) {
            state.flags.push("EVENT_HORIZON")
            if (prev_dynamics) {
                state.dynamics.affinity = Math.max(state.dynamics.affinity, prev_dynamics.affinity)
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

    /************************************************************************************
     * 🧩 [SECTION: OFF-SCREEN ENTROPY]
     * ----------------------------------------------------------------------------------
     * Audits background T3 entities for autonomous momentum. Flags intruders whose
     * intensity breaches LAW_HIGH after a lightweight physics tick.
     ************************************************************************************/

    /**
     * Calculates off-screen dynamics for background entities.
     * Runs a mini-dynamics tick per entity without polluting the active scene.
     *
     * @param {string} input - The current user input (drives reflex scanning).
     * @param {Array<{name: string, id: string, dynamics?: object}>} background_entities
     * @returns {{ intruders: Array<{name: string, id: string, intensity: number, flags: string[]}>, updates: Array<object> }}
     */
    static calculate_offscreen_dynamics(input, background_entities) {
        if (!Array.isArray(background_entities) || background_entities.length === 0) return { intruders: [], updates: [] }

        const d_phys = CONFIG.DYNAMICS
        const baseline_val = d_phys.DYNAMICS_GRAVITY_BASELINE
        const flagged_intruders = []
        const updates = []

        for (const entity of background_entities) {
            const baselines = {
                intensity: baseline_val,
                chaos: baseline_val,
                openness: baseline_val,
                affinity: baseline_val,
            }

            const prev_dynamics = entity.dynamics || { ...baselines }

            // Run a lightweight physics tick (same math as active entity)
            const tick = DynamicsEngine.resolve_dynamics(input, baselines, prev_dynamics)

            // Track the update for persistence
            updates.push({
                id: entity.id,
                dynamics: tick.dynamics,
            })

            if (tick.dynamics.intensity >= d_phys.LAW_HIGH) {
                flagged_intruders.push({
                    name: entity.name || "Unknown",
                    id: entity.id,
                    intensity: tick.dynamics.intensity,
                    flags: tick.flags,
                })
            }
        }

        return { intruders: flagged_intruders, updates }
    }
}
