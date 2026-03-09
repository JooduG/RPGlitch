/**
 * @file src/core/intelligence/DynamicsEngine.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚡ DYNAMICS ENGINE — Twin-Cylinder Physics Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * This is the beating heart of the simulation. It runs two entirely separate
 * physics engines simultaneously:
 * 1. The Somatic Engine (Character Mind): Tracks adrenaline, paranoia, and emotion.
 * 2. The Environmental Engine (Fractal World): Tracks pacing, time, and physical decay.
 * * Flow: It takes the raw user input, parses it through the semantic dictionary, applies
 * gravity (pulling extremes back to normal), enforces the Laws of Physics (triggering
 * special events if stats boil over), and outputs a SimulationSnapshot.
 */

import { CONFIG } from "@core/engine/config.js"

/**
 * @typedef {Object} IntelligencePayload
 * @typedef {Object} SimulationSnapshot
 */

/************************************************************************************
 * ⚙️ [SECTION: LOCAL ENGINE MATH]
 * ----------------------------------------------------------------------------------
 * Quarantined math that used to clutter config.js. These numbers dictate exactly
 * how hard gravity pulls, and how severely stats break when they cross thresholds.
 ************************************************************************************/
const ENGINE_MATH = {
    // Universal Physics
    GRAVITY_STRENGTH: 0.25,

    // Character Law Effects (How stats shift when a breaking point is reached)
    ADRENALINE_OVERDRIVE_OPENNESS: -10,
    ADRENALINE_OVERDRIVE_AFFINITY: -5,
    STOP_AFFINITY: 10,
    STOP_CHAOS: -5,
    REALITY_CORRUPTION_AFFINITY: -5,
    REALITY_CORRUPTION_INTENSITY: 10,
    PERFECT_LOGIC_OPENNESS: -10,
    PERFECT_LOGIC_INTENSITY: -5,
    MANIC_OBSESSION_CHAOS: -10,
    MANIC_OBSESSION_OPENNESS: -5,
    TOTAL_APATHY_INTENSITY: -10,
    TOTAL_APATHY_CHAOS: 5,

    // Modifiers (Multipliers for extreme emotional states)
    MODIFIER_EXPOSED_VULNERABILITY_CHAOS: 2.0,
    MODIFIER_IRON_GUARDED_AFFINITY: 0.5,
    MODIFIER_AFFINITY_CASCADE_CHAOS: 0,

    // Composite Thresholds (Edge-case psychological breaks)
    AFFINITY_CASCADE_THRESHOLD_AFFINITY: 80,
    AFFINITY_CASCADE_THRESHOLD_CHAOS: 20,
    EVENT_HORIZON_THRESHOLD_INTENSITY: 20,
    EVENT_HORIZON_THRESHOLD_OPENNESS: 80,

    // Naivety Cognition (Bayesian Math for lie detection)
    NAIVETY_THRESHOLD: 0.6,
    NAIVETY_P_E_GIVEN_TRUST: 0.8,
    NAIVETY_P_E_GIVEN_DISTRUST: 0.3,

    // Semantic Weights (How "heavy" an event is, W=1-10)
    WEIGHT_BASELINE: 3,
    WEIGHT_CORE_THRESHOLD: 10,
    REFLEX_WEIGHT_MAP: {
        SCHISM: 9, // Major Betrayal
        EPIPHANY: 9, // Major Revelation
        ANOMALY: 8, // Existential dread
        SYSTEM_COLLAPSE: 8, // Structural catastrophe
        VULNERABILITY: 7, // Deep intimacy
        KINETICS: 7, // Physical violence/speed
        ANCHOR: 5, // Recovery, baseline shift
        FORTIFICATION: 4, // Defensive actions
        FOCUS: 3, // Clinical observation
        STASIS: 3, // Rest, stillness
    },
}

/************************************************************************************
 * 🧩 [SECTION: THE REGISTRY]
 * ----------------------------------------------------------------------------------
 * The semantic dictionary. This splits inputs into Character (Mind) and Fractal (World).
 ************************************************************************************/

export const DYNAMICS_REFLEXES = [
    // ─────────────────────────────────────────────────────────────────
    // 🧠 TIER I: SOMATIC (Character Only)
    // These triggers only affect human geometry. The Fractal remains entirely deaf
    // to these inputs. You can cry in a room without the room reacting.
    // ─────────────────────────────────────────────────────────────────
    {
        id: "FOCUS",
        triggers: [
            { root: "logic", pattern: /logic(al)?|math(ematics)?|calculat(e|ed|ing)?|precise|fact|prove(n|d)?|proof/i },
            { root: "analysis", pattern: /data|observ(e|ed|ing)?|analy[sz](e|ed|ing)?|study(ing)?|test(ed|ing)?|clinical|structur(e|ed|ing)?/i },
        ],
        effect: {
            // The character becomes cold, detached, and highly analytical.
            character: { chaos: -10, affinity: -10 },
        },
    },
    {
        id: "VULNERABILITY",
        triggers: [
            { root: "affection", pattern: /kiss(ed|ing|es)?|lov(e|ed|ing|es)?|hugg?(ed|ing)?|touch(ed|ing)?|trust(ed|ing)?|vow(ed|ing)?/i },
            { root: "emotion", pattern: /tear|cry(ing)?|whisper(ed|ing)?|sync(hroniz)?(ed|ing)?|resonance|empathy|bond(ed|ing)?/i },
        ],
        effect: {
            // Strips away emotional armor and builds trust. The Fractal ignores this.
            character: { openness: 10, affinity: 10 },
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
            // The character throws up walls, literally or metaphorically.
            character: { openness: -10 },
        },
    },

    // ─────────────────────────────────────────────────────────────────
    // 🌎 TIER II: ENVIRONMENTAL (Fractal Only)
    // These triggers govern pure physics and structural integrity. They warp the
    // world around the player without explicitly telling the player how to feel.
    // ─────────────────────────────────────────────────────────────────
    {
        id: "SYSTEM_COLLAPSE",
        triggers: [
            { root: "breach", pattern: /alarm|breach(ed|ing)?|lockdown|siren/i },
            { root: "destruction", pattern: /shatter(ed|ing)?|collaps(e|ed|ing)?|burn(t|ed|ing)?|structural/i },
        ],
        effect: {
            // The building is falling apart. Time accelerates and reality degrades.
            fractal: { velocity: 15, entropy: 10 },
        },
    },
    {
        id: "ANCHOR",
        triggers: [{ root: "stability", pattern: /dawn|clear(ed|ing)?|reboot(ed|ing)?|stabl[ey]|repair(ed|ing)?|restor(e|ed|ing)?/i }],
        effect: {
            // The storm breaks, the tech is fixed. The world returns to a safe baseline.
            fractal: { entropy: -15 },
        },
    },

    // ─────────────────────────────────────────────────────────────────
    // ⚡ TIER III: RESONANCE (Bridging Both)
    // The heavy-hitters. These actions carry so much narrative weight that they
    // cause a kinetic shockwave, forcing both the actor and the environment to react.
    // ─────────────────────────────────────────────────────────────────
    {
        id: "KINETICS",
        triggers: [
            { root: "violence", pattern: /kill(ed|ing)?|die(d|ing)?|shoot|shot|stabb?(ed|ing)?|punch(ed|ing)?|fight|fought|attack(ed|ing)?|blood/i },
            { root: "impact", pattern: /destroy(ed|ing)?|smash(ed|ing)?|explosion|impact|crash(ed|ing)?/i },
            { root: "athletics", pattern: /fast|speed|run(ning)?|ran|sprint(ing)?/i },
        ],
        effect: {
            // Violence spikes the human's adrenaline while instantly hitting the gas pedal on the scene's pacing.
            character: { intensity: 10 },
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
            // The ultimate brake pedal. Exhaustion drops, and the Director delays complications.
            character: { intensity: -10 },
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
            // The weird-fiction trigger. Human sanity fractures while physical rules simultaneously degrade.
            character: { chaos: 10 },
            fractal: { entropy: 10 },
        },
    },
    {
        id: "SCHISM",
        triggers: [{ root: "betrayal", pattern: /betray(ed|al|ing)?|deceiv(ed|ing)?|lied?|backstab(bed|bing)?|doublecross(ed|ing)?|traitor/i }],
        effect: {
            // Trust breaks. The character locks down, and the environment catches the toxic vibe.
            character: { chaos: 15, openness: -15 },
            fractal: { entropy: 15 },
        },
    },
    {
        id: "EPIPHANY",
        triggers: [{ root: "revelation", pattern: /confess(ed|ion|ing)?|reveal(ed|ing)?|disclos(ed|ing)?|secret|discover(ed|ing)?|sacrific(e|ed|ing)?/i }],
        effect: {
            // The truth comes out. The character is exposed, and the plot demands forward momentum.
            character: { openness: 10, intensity: 10 },
            fractal: { velocity: 10 },
        },
    },
]

// These are the actual prose instructions injected into the LLM's prompt when a stat boils over.
const SIGNAL_PROMPTS = {
    // --- CHARACTER (SOMATIC) ---
    intensity: {
        high: { id: "ADRENALINE", text: "Pacing fast. Short sentences. High-stakes urgency." },
        low: { id: "SLOW_MOTION", text: "Pacing slow. Heavy fatigue. Deliberate, languid actions." },
    },
    chaos: {
        high: { id: "PARANOIA", text: "Psychological fragmentation. Unreliable perceptions, erratic focus." },
        low: { id: "LOGIC", text: "High lucidity. Precise observations. Sharply defined surroundings." },
    },
    openness: {
        high: { id: "VULNERABILITY", text: "Sensory raw. Focus on visceral heat, touch, somatic feedback." },
        low: { id: "GUARDED", text: "Emotional distance. Mental barriers active. Cynical or defensive tone." },
    },
    affinity: {
        high: { id: "RESONANCE", text: "Deep empathy. Shared emotional frequency and synchronized intent." },
        low: { id: "APATHY", text: "Clinical gaze. Emotional zero. People viewed as data-points or variables." },
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
}

export class DynamicsEngine {
    /************************************************************************************
     * 🧩 [SECTION: SIMULATION PHASE]
     * ----------------------------------------------------------------------------------
     * The entry point. We gather the raw materials (baselines and history) before
     * dropping them into the physics shredder.
     ************************************************************************************/

    /**
     * Executes the simulation turn.
     * @param {IntelligencePayload} payload - The hydrated state from ContextBroker.
     * @returns {SimulationSnapshot}
     */
    static simulate(payload) {
        const { input, entities, history } = payload
        const d_phys = CONFIG.DYNAMICS // Keeps global stuff like LAW_HIGH/LOW
        const baseline_val = d_phys.DYNAMICS_GRAVITY_BASELINE // Usually 50 (dead center)

        // 1. Resolve Character (AI) Baselines: Where is their resting heart rate?
        const ai_entity = entities.AI || {}
        const ai_baselines = ai_entity.dynamics || {
            intensity: baseline_val,
            chaos: baseline_val,
            openness: baseline_val,
            affinity: baseline_val,
        }
        // Grab the stats from the last turn so we have a starting point for momentum
        const prev_ai_dynamics = history && history.dynamics ? history.dynamics : null

        // 2. Resolve Fractal (Environment) Baselines: How weird/fast is this location normally?
        const fractal_entity = entities.FRACTAL || {}
        const fractal_baselines = fractal_entity.dynamics || {
            velocity: baseline_val,
            entropy: baseline_val,
        }
        const prev_fractal_dynamics = history && history.fractal_dynamics ? history.fractal_dynamics : null

        // 3. Fire up the twin engines and resolve the math.
        return DynamicsEngine.resolve_dynamics(input, ai_baselines, prev_ai_dynamics, fractal_baselines, prev_fractal_dynamics)
    }

    /**
     * Scans text for dynamic reflexes using Regex.
     * Maps the user's raw string into mathematical payloads.
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
     * Core twin-engine resolution logic.
     * Takes the math, applies it to the previous state, runs gravity, enforces laws,
     * and maps out the final behaviors to feed to the LLM.
     */
    static resolve_dynamics(input, ai_baselines, prev_ai, fractal_baselines, prev_fractal) {
        const d_phys = CONFIG.DYNAMICS

        // Initialize our fresh state matrix
        const state = {
            dynamics: prev_ai ? { ...prev_ai } : { ...ai_baselines },
            fractal_dynamics: prev_fractal ? { ...prev_fractal } : { ...fractal_baselines },
            flags: [],
            signals: {},
            behaviors: [],
            intruders: [], // The Surprise Guest Radar for the active Fractal
        }

        // 1. Scan and Apply Reflexes to both dimensions
        const triggered = DynamicsEngine.scan_reflexes(input)
        const applied_ids = new Set() // Prevents duplicate math if a user spams trigger words

        triggered.forEach((reflex) => {
            if (applied_ids.has(reflex.id)) return

            // Route Somatic shifts to the Character's brain
            if (reflex.effect.character) {
                Object.keys(reflex.effect.character).forEach((axis) => {
                    if (state.dynamics[axis] !== undefined) state.dynamics[axis] += reflex.effect.character[axis]
                })
            }

            // Route Environmental shifts to the Fractal's weather/pacing
            if (reflex.effect.fractal) {
                Object.keys(reflex.effect.fractal).forEach((axis) => {
                    if (state.fractal_dynamics[axis] !== undefined) state.fractal_dynamics[axis] += reflex.effect.fractal[axis]
                })
            }

            applied_ids.add(reflex.id)
        })

        // 2. Execute Universal Physics (Gravity)
        // Gravity slowly pulls extreme emotional/environmental states back to their natural baseline over time.
        // E.g., This pulls the Fractal's Velocity back down to 50 if the player stands still for 3 turns.
        DynamicsEngine._apply_gravity(state.dynamics, ai_baselines)
        DynamicsEngine._apply_gravity(state.fractal_dynamics, fractal_baselines)

        // 3. Execute Domain-Specific Laws
        // If a stat hits the boiling point (>90) or freezing point (<10), we trigger cascading effects.
        DynamicsEngine._apply_character_laws(state, prev_ai, d_phys.LAW_HIGH, d_phys.LAW_LOW)
        DynamicsEngine._apply_fractal_laws(state, d_phys.LAW_HIGH)

        // 4. Map Output Signals
        // Translates the raw numbers (e.g., intensity: 95) into English prose directions for the LLM.
        DynamicsEngine._map_signals(state.dynamics, state, d_phys.SIGNAL_HIGH, d_phys.SIGNAL_LOW)
        DynamicsEngine._map_signals(state.fractal_dynamics, state, d_phys.SIGNAL_HIGH, d_phys.SIGNAL_LOW)

        // 5. Naivety Cognition Check (Character Only)
        // Does the user sound like a used car salesman? If so, make the AI suspicious.
        const suspicion = DynamicsEngine._resolve_naivety(input, state.dynamics.openness)
        if (suspicion !== null) {
            if (suspicion > ENGINE_MATH.NAIVETY_THRESHOLD) {
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
     * The underlying math that makes the simulation feel alive rather than static.
     ************************************************************************************/

    /**
     * The rubber band. Calculates the distance from the current state to the entity's
     * natural baseline, and pulls it slightly toward center using GRAVITY_STRENGTH.
     */
    static _apply_gravity(dynamics, baselines) {
        const grav = ENGINE_MATH.GRAVITY_STRENGTH
        Object.keys(dynamics).forEach((axis) => {
            const diff = baselines[axis] - dynamics[axis]
            if (diff !== 0) {
                let pull = diff * grav
                // Failsafe: if the pull is tiny, just snap it by 1 so we don't get stuck at 50.1
                if (Math.abs(pull) < 1) pull = Math.sign(diff) * 1
                dynamics[axis] += pull
            }
        })
    }

    /**
     * Psychological breaking points. If a character's mind is pushed to the extreme,
     * it cascades and affects other stats (e.g., extreme panic lowers emotional openness).
     */
    static _apply_character_laws(state, prev_dynamics, LAW_HIGH, LAW_LOW) {
        const { intensity, chaos, affinity, openness } = state.dynamics
        const math = ENGINE_MATH

        // Intensity Laws
        if (intensity >= LAW_HIGH) {
            state.flags.push("ADRENALINE_OVERDRIVE")
            state.dynamics.openness += math.ADRENALINE_OVERDRIVE_OPENNESS
            state.dynamics.affinity += math.ADRENALINE_OVERDRIVE_AFFINITY
        } else if (intensity <= LAW_LOW) {
            state.flags.push("STOP")
            state.dynamics.affinity += math.STOP_AFFINITY
            state.dynamics.chaos += math.STOP_CHAOS
        }

        // Chaos Laws
        if (chaos >= LAW_HIGH) {
            state.flags.push("REALITY_CORRUPTION")
            state.dynamics.affinity += math.REALITY_CORRUPTION_AFFINITY
            state.dynamics.intensity += math.REALITY_CORRUPTION_INTENSITY
        } else if (chaos <= LAW_LOW) {
            state.flags.push("PERFECT_LOGIC")
            state.dynamics.openness += math.PERFECT_LOGIC_OPENNESS
            state.dynamics.intensity += math.PERFECT_LOGIC_INTENSITY
        }

        // Openness Laws
        if (openness >= LAW_HIGH) {
            state.flags.push("EXPOSED_VULNERABILITY")
            state.dynamics.chaos *= math.MODIFIER_EXPOSED_VULNERABILITY_CHAOS
        } else if (openness <= LAW_LOW) {
            state.flags.push("IRON_GUARDED")
            state.dynamics.affinity *= math.MODIFIER_IRON_GUARDED_AFFINITY
        }

        // Affinity Laws
        if (affinity >= LAW_HIGH) {
            state.flags.push("MANIC_OBSESSION")
            state.dynamics.chaos += math.MANIC_OBSESSION_CHAOS
            state.dynamics.openness += math.MANIC_OBSESSION_OPENNESS
        } else if (affinity <= LAW_LOW) {
            state.flags.push("TOTAL_APATHY")
            state.dynamics.intensity += math.TOTAL_APATHY_INTENSITY
            state.dynamics.chaos += math.TOTAL_APATHY_CHAOS
        }

        // Composite Edge Cases
        if (affinity >= math.AFFINITY_CASCADE_THRESHOLD_AFFINITY && chaos <= math.AFFINITY_CASCADE_THRESHOLD_CHAOS) {
            state.flags.push("AFFINITY_CASCADE")
            state.dynamics.chaos = math.MODIFIER_AFFINITY_CASCADE_CHAOS
        }
        if (intensity <= math.EVENT_HORIZON_THRESHOLD_INTENSITY && openness >= math.EVENT_HORIZON_THRESHOLD_OPENNESS) {
            state.flags.push("EVENT_HORIZON")
            if (prev_dynamics) {
                state.dynamics.affinity = Math.max(state.dynamics.affinity, prev_dynamics.affinity)
            }
        }
    }

    /**
     * Environmental breaking points. This acts as our autonomous Director.
     * If Velocity (pacing) gets too fast, the Director throws a narrative grenade into the scene.
     */
    static _apply_fractal_laws(state, LAW_HIGH) {
        const { velocity, entropy } = state.fractal_dynamics

        // The Director's Catalyst Ignition
        if (velocity >= LAW_HIGH) {
            state.flags.push("CATALYST_IGNITION")

            // We use Entropy (the world's weirdness/hostility) to decide WHAT kind of grenade to throw.
            if (entropy >= 50) {
                state.intruders.push({
                    name: "Hostile Complication",
                    intensity: velocity,
                    flags: ["disruptive", "threat", "environmental hazard"],
                })
            } else {
                state.intruders.push({
                    name: "Benign Anomaly",
                    intensity: velocity,
                    flags: ["unexpected opportunity", "serendipitous", "sudden arrival"],
                })
            }

            // CRITICAL: After spawning a catalyst, we bleed off the velocity by 20 points.
            // If we don't do this, velocity stays > 90 and the engine spawns infinite golems every turn.
            state.fractal_dynamics.velocity -= 20
        }
    }

    /**
     * Translates the math into text.
     * Takes a stat like `intensity: 85`, sees that it crossed the SIGNAL_HIGH threshold (70),
     * and shoves the corresponding prose instruction into the behaviors array for the LLM prompt.
     */
    static _map_signals(source_dynamics, state, SIGNAL_HIGH, SIGNAL_LOW) {
        Object.keys(source_dynamics).forEach((axis) => {
            // Keep the math bounded 0-100 so it doesn't break the universe
            source_dynamics[axis] = Math.max(0, Math.min(100, Math.round(source_dynamics[axis])))
            const val = source_dynamics[axis]

            if (SIGNAL_PROMPTS[axis]) {
                if (val > SIGNAL_HIGH) {
                    const signal = SIGNAL_PROMPTS[axis].high
                    state.behaviors.push(signal.text)
                    state.signals[signal.id] = true
                } else if (val < SIGNAL_LOW) {
                    const signal = SIGNAL_PROMPTS[axis].low
                    state.behaviors.push(signal.text)
                    state.signals[signal.id] = true
                }
            }
        })
    }

    /************************************************************************************
     * 🧩 [SECTION: NAIVETY COGNITION]
     * ----------------------------------------------------------------------------------
     * A lightweight Bayesian classifier. It tests whether the NPC should believe the user.
     ************************************************************************************/

    /**
     * Calculates a Bayesian suspicion score if the user attempts persuasion.
     * Basically: "If the user says 'trust me', and the character's openness is low,
     * the character should assume they are lying."
     * @param {string} input - The raw user input.
     * @param {number} openness - The NPC's current openness axis (0-100).
     * @returns {number|null} The posterior suspicion float (0.0-1.0).
     */
    static _resolve_naivety(input, openness) {
        if (!input) return null
        const NAIVETY_TRIGGERS = /promise|swear|trust me|i (swear|promise)|i'm not lying|believe me|honest(ly)?|i tell you/i
        if (!NAIVETY_TRIGGERS.test(input)) return null // They aren't trying to persuade us.

        // Map 0-100 to 0.01-0.99 to avoid divide-by-zero math panics
        const prior_trust = Math.max(0.01, Math.min(0.99, openness / 100))
        const prior_distrust = 1.0 - prior_trust

        const p_e_given_trust = ENGINE_MATH.NAIVETY_P_E_GIVEN_TRUST
        const p_e_given_distrust = ENGINE_MATH.NAIVETY_P_E_GIVEN_DISTRUST

        // Marginal Probability of Evidence: P(E) = P(E|T)*P(T) + P(E|~T)*P(~T)
        const p_e = p_e_given_trust * prior_trust + p_e_given_distrust * prior_distrust
        if (p_e === 0) return 0.5

        // Posterior: P(Trust | Evidence)
        const posterior_trust = (p_e_given_trust * prior_trust) / p_e
        return 1.0 - posterior_trust // Return how SUSPICIOUS we are (inverse of trust)
    }

    /************************************************************************************
     * 🏷️ [SECTION: SEMANTIC WEIGHT]
     * ----------------------------------------------------------------------------------
     * Evaluates how "heavy" or "important" the current turn is.
     ************************************************************************************/

    /**
     * Maps the scan_reflexes() output to an Emotional Weight (W=1-10).
     * Used by the memory system to know whether it should save this turn forever,
     * or forget it immediately.
     */
    static evaluate_weight(reflexes) {
        if (!Array.isArray(reflexes) || reflexes.length === 0) return ENGINE_MATH.WEIGHT_BASELINE

        const ids = reflexes.map((r) => r.id)

        // Composite combo attack: Existential dread + physical shock = Core memory (Level 10)
        if (ids.includes("ANOMALY") && ids.includes("KINETICS")) return ENGINE_MATH.WEIGHT_CORE_THRESHOLD

        // Otherwise, grab the heaviest weight out of the triggered reflexes
        const weights = ids.map((id) => ENGINE_MATH.REFLEX_WEIGHT_MAP[id] ?? ENGINE_MATH.WEIGHT_BASELINE)
        return Math.max(ENGINE_MATH.WEIGHT_BASELINE, ...weights)
    }
}
