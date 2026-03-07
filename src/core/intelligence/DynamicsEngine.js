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
        triggers: [
            { root: "kill", pattern: /kill(ed|ing)?|die(d|ing)?/i },
            { root: "violence", pattern: /shoot|shot|stabb?(ed|ing)?|punch(ed|ing)?|hit|fought|fight(ing)?|attack(ed|ing)?|gunn?(ed|ing)?|weapon|blood|hurt|destroy(ed|ing)?|br(eak|oke)n?|smash(ed|ing)?/i },
            { root: "impact", pattern: /burn(t|ed|ing)?|explosion|fast|speed|impact|crash(ed|ing)?|loud|bang|boom|slam(med|ming)?/i },
            { root: "athletics", pattern: /athletics?|run(ning)?|jump(ed|ing)?/i },
        ],
        effect: { intensity: CONFIG.DYNAMICS.REFLEX_IMPACT_INTENSITY },
    },
    {
        id: "BREATHER",
        triggers: [
            { root: "wait", pattern: /wait(ed|ing)?|pause(d|ing)?|stop(ped|ping)?|still/i },
            { root: "silence", pattern: /silence|quiet|calm(ed|ing)?|rest(ed|ing)?/i },
            { root: "sleep", pattern: /sleep|slow(ed|ing)?|br(eathe|eath)(d|ing)?/i },
        ],
        effect: { intensity: CONFIG.DYNAMICS.REFLEX_BREATHER_INTENSITY },
    },
    {
        id: "GLITCH",
        triggers: [
            { root: "horror", pattern: /scream(ed|ing)?|fear(ed|ing)?|scar(ed|ing)?|dark|shadow|weird|wrong|monster|ghost|dead|rot(ted|ting)?|decay(ed|ing)?|nightmare/i },
            { root: "glitch", pattern: /shiver(ed|ing)?|static|noise|distortion|fracture(d|ing)?|chaos|erratic|flicker(ed|ing)?|glitch(ed|ing)?|cold/i },
            { root: "athletics", pattern: /r(un|an)(ning)?/i },
            { root: "hide", pattern: /hid(e|den|ing)?/i },
        ],
        effect: { chaos: CONFIG.DYNAMICS.REFLEX_GLITCH_CHAOS },
    },
    {
        id: "CALCULATION",
        triggers: [
            { root: "logic", pattern: /logic(al)?|math(ematics)?|calculat(e|ed|ing)?|precise|fact|prove(n|d)?|proof/i },
            { root: "structure", pattern: /clean(ed|ing)?|pure|order(ed|ing)?|structur(e|ed|ing)?/i },
        ],
        effect: { chaos: CONFIG.DYNAMICS.REFLEX_CALCULATION_CHAOS },
    },
    {
        id: "DEFENSE",
        triggers: [
            { root: "armor", pattern: /armor(ed)?|shield(ed|ing)?|wall|mask(ed|ing)?|guard(ed|ing)?|protect(ed|ing)?|block(ed|ing)?|shell|barrier/i },
            { root: "hide", pattern: /hid(e|den|ing)?/i },
        ],
        effect: { openness: CONFIG.DYNAMICS.REFLEX_DEFENSE_OPENNESS },
    },
    {
        id: "EXPOSURE",
        triggers: [
            { root: "affection", pattern: /kiss(ed|ing|es)?|lov(e|ed|ing|es)?|h(e|o)ld(ing|s)?|hugg?(ed|ing)?|touch(ed|ing)?|caress(ed|ing)?|blush(ed|ing)?|cheek|skin|naked|bare/i },
            { root: "warmth", pattern: /gentle|soft|warm|safe|trust(ed|ing)?/i },
            { root: "sorrow", pattern: /tear|cry(ing)?|sad|lonely|ache/i },
            { root: "vulnerability", pattern: /hand|finger|whisper(ed|ing)?|close|heart|honesty?|truth/i },
        ],
        effect: {
            openness: CONFIG.DYNAMICS.REFLEX_EXPOSURE_OPENNESS,
            affinity: CONFIG.DYNAMICS.REFLEX_EXPOSURE_AFFINITY,
        },
    },
    {
        id: "EMPATHY",
        triggers: [
            { root: "connect", pattern: /underst(ood|and)(ing)?|connect(ed|ing)?|sync(hroniz)?(ed|ing)?|resonance|harmony|empathy|together|shared|mirror(ed|ing)?|echo(ed|ing)?|link(ed|ing)?|bond(ed|ing)?/i },
            { root: "mind", pattern: /mind|soul/i },
            { root: "music", pattern: /melody|music|rhythm|vibe|frequency|pulse/i },
            { root: "vow", pattern: /vow(ed|ing)?|promise(d|ing)?|swear|swore|pact/i },
        ],
        effect: { affinity: CONFIG.DYNAMICS.REFLEX_EMPATHY_AFFINITY },
    },
    {
        id: "EXAMINATION",
        triggers: [{ root: "data", pattern: /data|observ(e|ed|ing)?|watch(ed|ing)?|analy[sz](e|ed|ing)?|study(ing)?|scan(ned|ning)?|test(ed|ing)?|monitor(ed|ing)?|variable|clinical/i }],
        effect: { affinity: CONFIG.DYNAMICS.REFLEX_EXAMINATION_AFFINITY },
    },
    {
        id: "BETRAYAL",
        triggers: [{ root: "betrayal", pattern: /betray(ed|al|ing)?|deceiv(ed|ing)?|lied?|backstab(bed|bing)?|doublecross(ed|ing)?|traitor/i }],
        effect: {
            chaos: CONFIG.DYNAMICS.REFLEX_BETRAYAL_CHAOS,
            openness: CONFIG.DYNAMICS.REFLEX_BETRAYAL_OPENNESS,
        },
    },
    {
        id: "REVELATION",
        triggers: [{ root: "reveal", pattern: /confess(ed|ion|ing)?|reveal(ed|ing)?|disclos(ed|ing)?|secret.*out|discover(ed|ing)?|sacrific(e|ed|ing)?/i }],
        effect: {
            chaos: CONFIG.DYNAMICS.REFLEX_REVELATION_CHAOS,
            openness: CONFIG.DYNAMICS.REFLEX_REVELATION_OPENNESS,
        },
    },
]

const SIGNAL_PROMPTS = {
    intensity: {
        high: { id: "ADRENALINE", text: "Pacing fast. Short sentences. High-stakes urgency." },
        /* Faster Voice Rate? */
        low: { id: "SLOW_MOTION", text: "Pacing slow. Heavy fatigue. Deliberate, languid actions." },
        /* Slower Voice Rate? */
    },
    chaos: {
        high: { id: "CORRUPTION", text: "Reality destabilizing. Describe glitching, sensory corruption, broken physics." },
        /* Higher Temperature? */
        low: { id: "LOGIC", text: "High lucidity. Precise observations. Sharply defined surroundings." },
        /* Lower Temperature? */
    },
    openness: {
        high: { id: "VULNERABILITY", text: "Sensory raw. Focus on visceral heat, touch, somatic feedback." },
        /* Naivity? */
        low: { id: "GUARDED", text: "Emotional distance. Mental barriers active. Cynical or defensive tone." },
        /* Naivety? */
    },
    affinity: {
        high: { id: "OBSESSION", text: "Perspective blur. Deep psychic connection. Shared emotional frequency." },
        /* Vector Weight 1.5x? */
        low: { id: "APATHY", text: "Clinical gaze. Emotional zero. People viewed as data-points or variables." },
        /* Vector Weight 0.5x? */
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
        const triggered = []

        for (const reflex of DYNAMICS_REFLEXES) {
            for (const t of reflex.triggers) {
                const match = text.match(t.pattern)
                if (match) {
                    triggered.push({
                        id: reflex.id,
                        effect: reflex.effect,
                        trigger_word: t.root, // The normalized root word
                    })
                }
            }
        }
        return triggered
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
        const applied_ids = new Set()

        triggered.forEach((reflex) => {
            if (applied_ids.has(reflex.id)) return

            Object.keys(reflex.effect).forEach((axis) => {
                state.dynamics[axis] += reflex.effect[axis]
            })
            applied_ids.add(reflex.id)
        })

        DynamicsEngine._apply_gravity(state.dynamics, d_phys, baselines)
        DynamicsEngine._apply_laws(state, d_phys, prev_dynamics)
        DynamicsEngine._map_signals(state, d_phys)

        // Naivety Cognition Check
        const suspicion = DynamicsEngine._resolve_naivety(input, state.dynamics.openness)
        if (suspicion !== null) {
            if (suspicion > d_phys.NAIVETY_THRESHOLD) {
                state.behaviors.push("[NAIVETY] Trust breach detected. High scepticism warranted.")
            } else if (suspicion > 0.5) {
                state.behaviors.push("[NAIVETY] Claim plausibility is uncertain. Proceed with caution.")
            }
        }

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
     * 🧩 [SECTION: NAIVETY COGNITION]
     * ----------------------------------------------------------------------------------
     * Probabilistic belief-state calculator for detecting user deception.
     ************************************************************************************/

    /**
     * Calculates a Bayesian suspicion score if the user attempts persuasion.
     * @param {string} input - The raw user input.
     * @param {number} openness - The NPC's current openness axis (0-100).
     * @returns {number|null} The posterior suspicion float (0.0-1.0), or null if no triggers hit.
     */
    static _resolve_naivety(input, openness) {
        if (!input) return null
        const NAIVETY_TRIGGERS = /promise|swear|trust me|i (swear|promise)|i'm not lying|believe me|honest(ly)?|i tell you/i
        if (!NAIVETY_TRIGGERS.test(input)) return null

        const d_phys = CONFIG.DYNAMICS

        // Prior: Openness is naivety. Map 0-100 to 0.01-0.99 to avoid div by zero locks.
        // High openness = High trust prior (P[Trust] is high).
        const prior_trust = Math.max(0.01, Math.min(0.99, openness / 100))
        const prior_distrust = 1.0 - prior_trust

        // Likelihoods from config
        const p_e_given_trust = d_phys.NAIVETY_P_E_GIVEN_TRUST
        const p_e_given_distrust = d_phys.NAIVETY_P_E_GIVEN_DISTRUST

        // Marginal Probability of Evidence: P(E) = P(E|T)*P(T) + P(E|~T)*P(~T)
        const p_e = p_e_given_trust * prior_trust + p_e_given_distrust * prior_distrust
        if (p_e === 0) return 0.5 // Math failsafe

        // Posterior: P(Trust | Evidence)
        const posterior_trust = (p_e_given_trust * prior_trust) / p_e

        // Suspicion is 1.0 - Trust
        return 1.0 - posterior_trust
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

    /************************************************************************************
     * 🏷️ [SECTION: SEMANTIC WEIGHT — Narrative Significance]
     * ----------------------------------------------------------------------------------
     * Maps scan_reflexes() output to an Emotional Weight (W=1-10) per MNOTION.
     * Composite rule: GLITCH + IMPACT = W=10 (death/trauma scene).
     * Fallback: W=3 (minor baseline).
     ************************************************************************************/

    /**
     * Evaluates the narrative Emotional Weight of a vector from its reflex IDs.
     *
     * @param {Array<{id: string}>} reflexes - Output of DynamicsEngine.scan_reflexes().
     * @returns {number} Emotional Weight 1-10.
     */
    static evaluate_weight(reflexes) {
        if (!Array.isArray(reflexes) || reflexes.length === 0) return CONFIG.DYNAMICS.WEIGHT_BASELINE

        const ids = reflexes.map((r) => r.id)

        // Composite: physical violence + existential dread = Core trauma
        if (ids.includes("GLITCH") && ids.includes("IMPACT")) return CONFIG.DYNAMICS.WEIGHT_CORE_THRESHOLD

        const weights = ids.map((id) => CONFIG.DYNAMICS.REFLEX_WEIGHT_MAP[id] ?? CONFIG.DYNAMICS.WEIGHT_BASELINE)
        return Math.max(CONFIG.DYNAMICS.WEIGHT_BASELINE, ...weights)
    }
}
