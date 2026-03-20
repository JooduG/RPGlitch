/**
 * @file src/core/intelligence/DynamicsEngine.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚡ DYNAMICS ENGINE — The Physics of Narrative
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * CONCEPTUAL OVERVIEW:
 * This is the "Engine Room" of RPGlitch. It treats narrative as a system of
 * fluid dynamics, where certain words act as "kinetic impulses" that shift
 * the emotional and physical state of the simulation.
 *
 * THE TWIN-CYLINDER PARADIGM:
 * The simulation is split into two distinct layers to prevent "Concept Bleed":
 *
 * 1. 🧠 AI (SOMATIC): The Internal Engine.
 *    Tracks the internal psychology of the entity (Intensity, Chaos, Openness, Affinity).
 *    How fast is their heart beating? How much do they trust the user?
 *
 * 2. 🌎 FRACTAL (ENVIRONMENTAL): The External Engine.
 *    Tracks the physical state of the scene (Velocity, Entropy).
 *    Is the world crumbling? Is the clock ticking?
 *
 * FLOW:
 * Input -> Reflex Scan -> Bayesian Analysis -> Gravity Offset -> Law Enforcement -> Clamping -> Snapshot.
 */

import { CONFIG } from "@core/engine/config.js"

/**
 * @typedef {Object} IntelligencePayload
 * @typedef {Object} SimulationSnapshot
 */

/************************************************************************************
 * 🧩 [SECTION: THE REGISTRY - Semantic Reflexes]
 * ----------------------------------------------------------------------------------
 * This is the mapping of "Story Concepts" to "Physics Impulses".
 * Each 'reflex' defined here is a dictionary entry that tells the engine:
 * "When the user says X, shift the world state by Y."
 ************************************************************************************/

export const DYNAMICS_REFLEXES = [
    // 🧠 TIER I: SOMATIC (AI Dynamics)
    // These triggers affect the internal state of the AI entity.
    {
        id: "FOCUS",
        triggers: [
            { root: "logic", pattern: /logic(al)?|math(ematics)?|calculat(e|ed|ing)?|precise|fact|prove(n|d)?|proof/i },
            { root: "analysis", pattern: /data|observ(e|ed|ing)?|analy[sz](e|ed|ing)?|study(ing)?|test(ed|ing)?|clinical|structur(e|ed|ing)?/i },
        ],
        effect: {
            ai: { chaos: -10, affinity: -10 }, // Logic reduces chaos but also reduces emotional affinity.
        },
    },
    {
        id: "VULNERABILITY",
        triggers: [
            { root: "affection", pattern: /kiss(ed|ing|es)?|lov(e|ed|ing|es)?|hugg?(ed|ing)?|touch(ed|ing)?|trust(ed|ing)?|vow(ed|ing)?/i },
            { root: "emotion", pattern: /tear|cry(ing)?|whisper(ed|ing)?|sync(hroniz)?(ed|ing)?|resonance|empathy|bond(ed|ing)?/i },
        ],
        effect: {
            ai: { openness: 10, affinity: 10 },
        },
    },
    {
        id: "FORTIFICATION",
        triggers: [
            { root: "armor", pattern: /armor(ed)?|shield(ed|ing)?|wall|barrier/i },
            { root: "defense", pattern: /mask(ed|ing)?|guard(ed|ing)?|protect(ed|ing)?|block(ed|ing)?/i },
            { root: "hide", pattern: /hid(e|den|ing)?/i },
        ],
        effect: {
            ai: { openness: -10 }, // Guarding behavior closes the mind.
        },
    },

    // 🌎 TIER II: ENVIRONMENTAL (Fractal Dynamics)
    // These triggers govern the physical world and the "pacing" of the environment.
    {
        id: "SYSTEM_COLLAPSE",
        triggers: [
            { root: "breach", pattern: /alarm|breach(ed|ing)?|lockdown|siren/i },
            { root: "destruction", pattern: /shatter(ed|ing)?|collaps(e|ed|ing)?|burn(t|ed|ing)?|structural/i },
        ],
        effect: {
            fractal: { velocity: 15, entropy: 10 }, // Destruction speeds up the scene and increases noise.
        },
    },
    {
        id: "ANCHOR",
        triggers: [{ root: "stability", pattern: /dawn|clear(ed|ing)?|reboot(ed|ing)?|stabl[ey]|repair(ed|ing)?|restor(e|ed|ing)?/i }],
        effect: {
            fractal: { entropy: -15 }, // Stabilizing elements reduce environmental noise.
        },
    },

    // ⚡ TIER III: RESONANCE (Hybrid Triggers)
    // These triggers are "Heavy Kinetics"—they shock both the character and the world.
    {
        id: "KINETICS",
        triggers: [
            { root: "violence", pattern: /kill(ed|ing)?|die(d|ing)?|shoot|shot|stabb?(ed|ing)?|punch(ed|ing)?|fight|fought|attack(ed|ing)?|blood/i },
            { root: "impact", pattern: /destroy(ed|ing)?|smash(ed|ing)?|explosion|impact|crash(ed|ing)?/i },
            { root: "athletics", pattern: /fast|speed|run(ning)?|ran|sprint(ing)?/i },
        ],
        effect: {
            ai: { intensity: 10 },
            fractal: { velocity: 10 },
        },
    },
    {
        id: "STASIS",
        triggers: [
            { root: "pause", pattern: /wait(ed|ing)?|pause(d|ing)?|stop(ped|ping)?|still/i },
            { root: "calm", pattern: /silence|quiet|calm(ed|ing)?|rest(ed|ing)?|sleep|slow(ed|ing)?/i },
        ],
        effect: {
            ai: { intensity: -10 },
            fractal: { velocity: -10 },
        },
    },
    {
        id: "ANOMALY",
        triggers: [
            { root: "horror", pattern: /scream(ed|ing)?|fear(ed|ing)?|dark|shadow|weird|wrong|monster|ghost|dead|rot(ted|ting)?|nightmare/i },
            { root: "glitch", pattern: /static|noise|distortion|fracture(d|ing)?|erratic|flicker(ed|ing)?|glitch(ed|ing)?/i },
            { root: "hide", pattern: /hid(e|den|ing)?/i },
        ],
        effect: {
            ai: { chaos: 10 },
            fractal: { entropy: 10 },
        },
    },
    {
        id: "SCHISM",
        triggers: [{ root: "betrayal", pattern: /betray(ed|al|ing)?|deceiv(ed|ing)?|lied?|backstab(bed|bing)?|doublecross(ed|ing)?|traitor/i }],
        effect: {
            ai: { chaos: 15, openness: -15 },
            fractal: { entropy: 15 },
        },
    },
    {
        id: "EPIPHANY",
        triggers: [{ root: "revelation", pattern: /confess(ed|ion|ing)?|reveal(ed|ing)?|disclos(ed|ing)?|secret|discover(ed|ing)?|sacrific(e|ed|ing)?/i }],
        effect: {
            ai: { openness: 10, intensity: 10 },
            fractal: { velocity: 10 },
        },
    },
    {
        id: "NAIVETY",
        triggers: [{ root: "persuasion", pattern: /promise|swear|trust me|i (swear|promise)|i'm not lying|believe me|honest(ly)?|i tell you/i }],
        effect: {
            // No direct effect. This trigger activates the Bayesian Suspicion check.
        },
    },
]

/**
 * 📢 SIGNAL PROMPTS
 * These are the text snippets injected into the LLM's system prompt
 * when a specific dynamic axis hits a threshold. This transforms naked
 * numbers back into narrative "flavors".
 */
export const SIGNAL_PROMPTS = {
    // --- AI (SOMATIC) ---
    intensity: {
        high: { id: "ADRENALINE", text: "Pacing fast. Short sentences. High-stakes urgency." },
        low: { id: "SLOW_MOTION", text: "Pacing slow. Heavy fatigue. Deliberate, languid actions." },
    },
    chaos: {
        high: { id: "HACK", text: "Reality glitching. Fragmented memory. Non-linear time perception." },
        low: { id: "RECOVERY", text: "High clarity. Sharp recall. Stable environment." },
    },
    openness: {
        high: { id: "VULNERABILITY", text: "Emotional exposure. Seeking comfort. Honest admissions." },
        low: { id: "IRON_CURTAIN", text: "Cold deflection. Calculated silence. Guarded secrets." },
    },
    affinity: {
        high: { id: "SYNCHRONY", text: "Mirroring user movement. Intense focus. Deep rapport." },
        low: { id: "DISSONANCE", text: "Repulsion. Hostile distance. Passive-aggressive friction." },
    },
    // --- FRACTAL (ENVIRONMENTAL) ---
    velocity: {
        high: { id: "HIGH_VELOCITY", text: "Environmental pacing accelerated. Time compressing. Imminent threat or rapid escalation." },
        low: { id: "LOW_VELOCITY", text: "Environmental stasis. Time stretching. Stillness and heavy atmosphere." },
    },
    entropy: {
        high: { id: "HIGH_ENTROPY", text: "Structural reality degrading. Hostile environment, bizarre weather, or failing physics." },
        low: { id: "LOW_ENTROPY", text: "Structural harmony. Safe, predictable physics and serendipitous elements." },
    },
    // --- SOCIAL/EPISTEMIC ---
    naivety: {
        breach: { id: "NAIVETY_BREACH", text: "[NAIVETY] Trust breach detected. High scepticism warranted." },
        uncertain: { id: "NAIVETY_UNCERTAIN", text: "[NAIVETY] Claim plausibility is uncertain. Proceed with caution." },
    },
}

export class DynamicsEngine {
    /**
     * SIMULATE TURN
     * -------------------------------------------------------------------------
     * The primary entry point. It takes a context payload and runs a single
     * frame of the narrative physics simulation.
     *
     * @param {IntelligencePayload} payload - The hydrated state from ContextBroker.
     * @returns {SimulationSnapshot} - The new world state after the turn.
     */
    static simulate(payload) {
        const { input, entities, history } = payload

        // 1. SCAN: Look for "kinetic words" in the user's input.
        const triggered = DynamicsEngine.scan_reflexes(input)

        // 2. STATE HYDRATION: Clone the current entities (AI & Fractal) to avoid mutating the core state too early.
        const state = {
            ai: JSON.parse(JSON.stringify(entities.AI || {})),
            fractal: JSON.parse(JSON.stringify(entities.FRACTAL || {})),
            flags: [],
            signals: {},
            signal_prompts: [],
        }

        // 3. MOMENTUM CAPTURE: Remember where we were in the previous turn to calculate changes.
        const prevState = {
            ai: { dynamics: history?.dynamics || {} },
            fractal: { dynamics: history?.fractal_dynamics || {} },
        }

        // 4. RESOLUTION: Run the physics engine.
        return DynamicsEngine.resolve_dynamics(state, prevState, triggered)
    }

    /**
     * SCAN REFLEXES
     * -------------------------------------------------------------------------
     * Iterates through the DYNAMICS_REFLEXES registry and matches the input text
     * against defined Regex patterns. Returns a list of "Impulses" to apply.
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
                        trigger_word: t.root,
                    })
                }
            }
        }
        return triggered
    }

    /**
     * RESOLVE DYNAMICS
     * -------------------------------------------------------------------------
     * The heart of the calculation. This orchestrates the flow of data through
     * the various physics tiers.
     */
    static resolve_dynamics(state, prevState, triggered) {
        const d_phys = CONFIG.DYNAMICS

        // 1. IMPULSE TIER: Apply the raw +/- shifts from the triggered reflexes.
        const applied_ids = new Set()
        triggered.forEach((reflex) => {
            if (applied_ids.has(reflex.id)) return // Prevent double-triggering the same reflex ID in one turn.

            // Dynamically route based on the effect targets defined in the reflex (e.g., 'ai', 'fractal', or eventually 'user')
            Object.keys(reflex.effect).forEach((targetKey) => {
                const targetState = state[targetKey]
                if (targetState && targetState.dynamics) {
                    Object.keys(reflex.effect[targetKey]).forEach((axis) => {
                        if (targetState.dynamics[axis] !== undefined) {
                            targetState.dynamics[axis] += reflex.effect[targetKey][axis]
                        }
                    })
                }
            })

            applied_ids.add(reflex.id)
        })

        // 2 & 3 & 4. UNIVERSAL PHYSICS & SIGNALS
        // Identifies any valid entity in the state payload that has a 'dynamics' object (ai, fractal, user, nemesis, etc.)
        const dynamic_keys = Object.keys(state).filter((k) => state[k] && typeof state[k] === "object" && state[k].dynamics)

        dynamic_keys.forEach((key) => {
            const baselines = DynamicsEngine._get_baselines(state[key])
            DynamicsEngine._process_entity_dynamics(state[key].dynamics, baselines, triggered, state, prevState?.[key]?.dynamics)
            DynamicsEngine._map_signals(state[key].dynamics, state, d_phys.SIGNAL_HIGH, d_phys.SIGNAL_LOW)
        })

        // 5. BAYESIAN SKEPTICISM (AI Only):
        // If the user tries to persuade or lie (NAIVETY trigger), we calculate how
        // suspicious the AI should be based on its current Openness (Trust) and its Personality Baseline.
        if (state.ai && state.ai.dynamics && state.ai.dynamics.openness !== undefined) {
            const ai_baselines = DynamicsEngine._get_baselines(state.ai)
            const baseline_openness = ai_baselines.openness ?? d_phys.DYNAMICS_GRAVITY_BASELINE

            const suspicion = DynamicsEngine._resolve_naivety(triggered, state.ai.dynamics.openness, baseline_openness)

            if (suspicion !== null) {
                if (suspicion > d_phys.NAIVETY_THRESHOLD) {
                    state.signal_prompts.push(SIGNAL_PROMPTS.naivety.breach.text)
                } else if (suspicion > 0.5) {
                    state.signal_prompts.push(SIGNAL_PROMPTS.naivety.uncertain.text)
                }
            }
        }

        return state
    }

    /**
     * _get_baselines
     * Pulls the personality set-points from the entity. If missing, pulls to 50.
     */
    static _get_baselines(entity) {
        return entity?.personality?.baselines || {}
    }

    /************************************************************************************
     * 🧩 [SECTION: PHYSICS HELPERS]
     * ----------------------------------------------------------------------------------
     * These internal methods handle the low-level math of the simulation.
     ************************************************************************************/

    /**
     * PROCESS ENTITY DYNAMICS
     * -------------------------------------------------------------------------
     * Runs Gravity (restoring force) and Law (threshold triggers) for a set of
     * specific dynamic axes.
     */
    static _process_entity_dynamics(d, baselines, triggered, state, prev_dynamics) {
        const { LAW_HIGH, LAW_LOW, GRAVITY_PULL, DYNAMICS_GRAVITY_BASELINE } = CONFIG.DYNAMICS

        // --- 🪐 TIER A: GRAVITY (Restoring Force) ---
        // Every turn, stats lose a bit of their charge and wander back toward their
        // natural baseline (the character's personality default).
        Object.keys(d).forEach((axis) => {
            const target = baselines[axis] ?? DYNAMICS_GRAVITY_BASELINE
            d[axis] += (target - d[axis]) * GRAVITY_PULL
        })

        // --- ⚖️ TIER B: THE LAWS (Extreme Behaviors) ---
        // If a stat boils over or freezes, it causes "Cascades"—side effects
        // that force other stats to shift in response to the trauma.
        Object.keys(d).forEach((axis) => {
            const val = d[axis]

            if (val >= LAW_HIGH) {
                state.flags.push(`${axis.toUpperCase()}_HIGH_THRESHOLD`)

                // Logic Cascades
                if (axis === "intensity") {
                    d.openness = (d.openness || 0) - 10 // Adrenaline closes the mind.
                    d.affinity = (d.affinity || 0) - 5
                } else if (axis === "chaos") {
                    d.affinity = (d.affinity || 0) - 5
                    d.intensity = (d.intensity || 0) + 10 // Chaos breeds panic.
                } else if (axis === "openness") {
                    d.chaos = (d.chaos || 0) * 2.0 // Pure openness is vulnerable to glitches.
                } else if (axis === "affinity") {
                    d.chaos = (d.chaos || 0) - 10 // Love creates order.
                    d.openness = (d.openness || 0) - 5
                }
            } else if (val <= LAW_LOW) {
                state.flags.push(`${axis.toUpperCase()}_LOW_THRESHOLD`)

                if (axis === "intensity") {
                    d.affinity = (d.affinity || 0) + 10 // Calm breeds bond.
                    d.chaos = (d.chaos || 0) - 5
                } else if (axis === "chaos") {
                    d.openness = (d.openness || 0) - 10 // Rigid order is guarded.
                    d.intensity = (d.intensity || 0) - 5
                } else if (axis === "openness") {
                    d.affinity = (d.affinity || 0) * 0.5 // Emotional isolation halves bonds.
                } else if (axis === "affinity") {
                    d.intensity = (d.intensity || 0) - 10 // Isolation is cold.
                    d.chaos = (d.chaos || 0) + 5
                }
            }
        })

        // --- 🛡️ THE CLIPPER (Mandatory 0-100 Clamping) ---
        // Final sanity check. Round and clamp between 0 and 100 before shipping.
        Object.keys(d).forEach((axis) => {
            d[axis] = Math.max(0, Math.min(100, Math.round(d[axis])))
        })
    }

    /**
     * MAP SIGNALS
     * -------------------------------------------------------------------------
     * Consults the SIGNAL_PROMPTS dictionary and pushes the appropriate
     * descriptive text into the output if axes are at their extremes.
     */
    static _map_signals(source_dynamics, state, SIGNAL_HIGH, SIGNAL_LOW) {
        Object.keys(source_dynamics).forEach((axis) => {
            const val = source_dynamics[axis]

            if (SIGNAL_PROMPTS[axis]) {
                if (val > SIGNAL_HIGH) {
                    const signal = SIGNAL_PROMPTS[axis].high
                    state.signal_prompts.push(signal.text)
                    state.signals[signal.id] = true
                } else if (val < SIGNAL_LOW) {
                    const signal = SIGNAL_PROMPTS[axis].low
                    state.signal_prompts.push(signal.text)
                    state.signals[signal.id] = true
                }
            }
        })
    }

    /**
     * RESOLVE NAIVETY (Bayesian Cognition)
     * -------------------------------------------------------------------------
     * Calculates the "Suspicion Index".
     * Formula: Posterior distrust = 1 - (likelihood * prior / evidence_prob).
     * Prior trust is a personality-weighted blend of current openness and baseline openness.
     */
    static _resolve_naivety(reflexes, current_openness, baseline_openness = 50) {
        if (!Array.isArray(reflexes)) return null
        if (!reflexes.some((r) => r.id === "NAIVETY")) return null

        // 1. Personality-weighted Prior: Blend current state with core baseline trait.
        const weighted_openness = (current_openness + baseline_openness) / 2

        // Convert 0-100 openness into a 0.0-1.0 probability of "Prior Trust".
        const prior_trust = Math.max(0.01, Math.min(0.99, weighted_openness / 100))
        const prior_distrust = 1.0 - prior_trust

        // 2. Assign Likelihoods: How likely is a "Persuasion" to be true if we trust vs distrust?
        const p_e_given_trust = 0.8
        const p_e_given_distrust = 0.3

        // 3. Evidence Probability (Marginal Likelihood)
        const p_e = p_e_given_trust * prior_trust + p_e_given_distrust * prior_distrust
        if (p_e === 0) return 0.5

        // 4. Calculate Posterior probability of Trust given the evidence (the user's persuasion).
        const posterior_trust = (p_e_given_trust * prior_trust) / p_e

        // Return Suspicion (The Inverse of Trust)
        return 1.0 - posterior_trust
    }
}
