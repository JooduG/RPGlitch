/**
 * @file src/intelligence/dynamics.js
 * @version 2.0
 * @description A unified registry and execution engine for all Reactive impulses, Passive state signals, and Physics Laws within the simulation.
 */

/**
 * @typedef {Object} DynamicsPayload
 * @property {string} input
 * @property {Record<string, any>} entities
 * @property {any} [history]
 */

/**
 * @typedef {Object} DynamicsState
 * @property {Record<string, any>} ai
 * @property {Record<string, any>} fractal
 * @property {string[]} flags
 * @property {Record<string, any>} signals
 * @property {string[]} signal_prompts
 * @property {Record<string, string[]>} contributors
 * @property {Object.<string, *>} [index]
 */

/**
 * @typedef {Object} DynamicsMatch
 * @property {string} id
 * @property {string} scan
 * @property {any} [config]
 */

export const DYNAMICS_META = {
  // Character (Somatic) axes
  chaos: { label: "Chaos", desc: "Randomness vs Control" },
  intensity: { label: "Intensity", desc: "Internal Energy / Adrenaline" },
  openness: { label: "Openness", desc: "Receptivity vs Guardedness" },
  affinity: { label: "Affinity", desc: "Inter-Entity Bond / Empathy" },

  // Fractal (Environmental) axes
  velocity: { label: "Velocity", desc: "Environmental Pacing / Speed" },
  entropy: { label: "Entropy", desc: "Structural Reality / Weirdness" },
};

/**
 * 📢 THE DYNAMICS REGISTRY
 * A unified table for all Reactive impulses, Passive state signals, and Physics Laws.
 *
 * Rules:
 * - `trigger: "turn"` -> Applies if filter passes (Passive Law/Signal).
 * - `trigger: Array`  -> Only applies if input matches AND filter passes (Scan Reaction).
 * - `effect` -> Numerical changes (ai/fractal) and Narrative (text).
 *
 * @type {DynamicsMatch[]}
 */

export const DYNAMICS = {
  // 📈 INTENSITY METRIC (AI Somatics & Physics)
  ADRENALINE: {
    id: "ADRENALINE",
    trigger: "turn",
    filter: { above: { intensity: 70 } },
    effect: { text: "The pacing is high-adrenaline. Express this intensity strictly through short sentences and immediate sensory physics." },
  },
  SLOW_MOTION: {
    id: "SLOW_MOTION",
    trigger: "turn",
    filter: { below: { intensity: 30 } },
    effect: { text: "Pacing slow. Heavy fatigue. Deliberate, languid actions." },
  },
  INTENSITY_AUTO_LOCK: {
    id: "INTENSITY_AUTO_LOCK",
    trigger: "turn",
    filter: { above: { intensity: 90 } },
    effect: { openness: -10 },
  },

  // 🌪️ CHAOS METRIC (AI Somatics & Physics)
  HACK: {
    id: "HACK",
    trigger: "turn",
    filter: { above: { chaos: 70 } },
    effect: { text: "Reality glitching. Fragmented memory. Non-linear time perception." },
  },
  RECOVERY: {
    id: "RECOVERY",
    trigger: "turn",
    filter: { below: { chaos: 30 } },
    effect: { text: "High clarity. Sharp recall. Stable environment." },
  },
  CHAOS_AUTO_HEAT: {
    id: "CHAOS_AUTO_HEAT",
    trigger: "turn",
    filter: { above: { chaos: 90 } },
    effect: { intensity: 10 },
  },

  // 🔓 OPENNESS METRIC (AI Somatics & Physics)
  VULNERABILITY: {
    id: "VULNERABILITY",
    trigger: "turn",
    filter: { above: { openness: 70 } },
    effect: { text: "Emotional exposure. Seeking comfort. Honest admissions." },
  },
  IRON_CURTAIN: {
    id: "IRON_CURTAIN",
    trigger: "turn",
    filter: { below: { openness: 30 } },
    effect: { text: "The character maintains cold distance, deflecting personal inquiries with calculated silence and guarded secrets." },
  },
  OPENNESS_AUTO_GLITCH: {
    id: "OPENNESS_AUTO_GLITCH",
    trigger: "turn",
    filter: { above: { openness: 90 } },
    effect: { chaos: 15 },
  },

  // 🤝 AFFINITY METRIC (AI Somatics & Physics)
  SYNCHRONY: {
    id: "SYNCHRONY",
    trigger: "turn",
    filter: { above: { affinity: 70 } },
    effect: { text: "Mirroring user movement. Intense focus. Deep rapport." },
  },
  DISSONANCE: {
    id: "DISSONANCE",
    trigger: "turn",
    filter: { below: { affinity: 30 } },
    effect: { text: "Repulsion. Hostile distance. Passive-aggressive friction." },
  },
  AFFINITY_AUTO_OPEN: {
    id: "AFFINITY_AUTO_OPEN",
    trigger: "turn",
    filter: { above: { affinity: 90 } },
    effect: { openness: 5 },
  },

  // 🚀 VELOCITY METRIC (World / Fractal Dynamics)
  HIGH_VELOCITY: {
    id: "HIGH_VELOCITY",
    trigger: "turn",
    filter: { above: { velocity: 70 } },
    effect: { text: "Environmental pacing accelerated. Time compressing." },
  },
  LOW_VELOCITY: {
    id: "LOW_VELOCITY",
    trigger: "turn",
    filter: { below: { velocity: 30 } },
    effect: { text: "Environmental stasis. Time stretching." },
  },

  // 📉 ENTROPY METRIC (World / Fractal Dynamics)
  HIGH_ENTROPY: {
    id: "HIGH_ENTROPY",
    trigger: "turn",
    filter: { above: { entropy: 70 } },
    effect: {
      text: "The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.",
    },
  },
  LOW_ENTROPY: {
    id: "LOW_ENTROPY",
    trigger: "turn",
    filter: { below: { entropy: 30 } },
    effect: { text: "Structural harmony. Safe, predictable physics." },
  },

  // ⚡ ACTIVE IMPULSES (Active Triggers)
  SHARD: {
    id: "SHARD",
    trigger: [
      { scan: "logic", pattern: /logic|math|calculat|precise|fact|prove|proof/i },
      { scan: "analysis", pattern: /analy(ze|sis)|code|script|program|system|process/i },
    ],
    effect: { chaos: -10, openness: 5, entropy: -5 },
  },
  VULNERABILITY_IMPULSE: {
    id: "VULNERABILITY_IMPULSE",
    trigger: [
      { scan: "affection", pattern: /love|kiss|hug|hold|protect|care|soft/i },
      { scan: "sadness", pattern: /cry|weep|mourn|loss|hurt|pain|lonely/i },
    ],
    effect: { openness: 15, affinity: 10 },
  },
  SYSTEM_COLLAPSE: {
    id: "SYSTEM_COLLAPSE",
    trigger: [{ scan: "glitch", pattern: /glitch|error|crash|fail|null|void|missing|broken/i }],
    effect: { chaos: 20, entropy: 25 },
  },
  ANCHOR: {
    id: "ANCHOR",
    trigger: [{ scan: "physicality", pattern: /stone|iron|ground|heavy|floor|wall|weight/i }],
    effect: { velocity: -15, entropy: -10 },
  },
  VIOLENCE: {
    id: "VIOLENCE",
    trigger: [
      { scan: "combat", pattern: /hit|kick|punch|shoot|strike|kill|attack|stab|slash|blood|gore|wound|fight|fought/i },
      { scan: "aggression", pattern: /threat|angry|rage|furious|hate/i },
    ],
    effect: { intensity: 15, openness: -10, entropy: 15 },
  },
  KINETICS: {
    id: "KINETICS",
    trigger: [
      { scan: "impact", pattern: /destroy|smash|explosion|impact|crash|break|broken/i },
      { scan: "athletics", pattern: /fast|speed|run|ran|sprint|dash|leap|jump/i },
    ],
    effect: { intensity: 10, velocity: 10 },
  },
  STASIS: {
    id: "STASIS",
    trigger: [
      { scan: "pause", pattern: /wait|pause|stop|still/i },
      { scan: "calm", pattern: /silence|quiet|calm|rest|sleep|slow/i },
    ],
    effect: { intensity: -10, velocity: -10 },
  },
  ANOMALY: {
    id: "ANOMALY",
    trigger: [
      { scan: "horror", pattern: /scream|panic|horror|dread|fear|spooky|creepy/i },
      { scan: "hide", pattern: /hide|hidden|secret|conceal|shadow/i },
    ],
    effect: { chaos: 15, openness: 10, entropy: 15 },
  },
  FORTIFICATION: {
    id: "FORTIFICATION",
    trigger: [
      { scan: "armor", pattern: /armor|shield|barrier|wall|protect|defend/i },
      { scan: "hide", pattern: /hide|hidden|secret|conceal|shadow/i },
    ],
    effect: { openness: -10, affinity: 5, entropy: -5, velocity: -10 },
  },

  // ⚖️ REACTIONS (Conditional Active Triggers)
  SUSPICIOUS: {
    id: "SUSPICIOUS",
    trigger: [
      { scan: "deception", pattern: /lie|lying|liar|fake|deceive|deception|trick|mask|disguise/i },
      { scan: "trust", pattern: /trust|believe|honest|truth|promise/i },
    ],
    filter: { below: { openness: 30 } },
    effect: {
      affinity: -10,
      intensity: 10,
      text: "Trust is broken. Treat every statement with suspicion. Deflect with cold precision and scale your defensiveness inverse to Openness.",
    },
  },
  SNAP: {
    id: "SNAP",
    trigger: [{ scan: "hostility", pattern: /attack|strike|hit|threat|violence|hurt|kill/i }],
    filter: { below: { openness: 20 } },
    effect: {
      affinity: -15,
      intensity: 20,
      text: "An overt threat has been perceived while defenses are completely raised. Escalate into an immediate, cold defensive retaliation.",
    },
  },
};

export const dynamics_engine = {
  /**
   * @param {DynamicsPayload} payload
   * @returns {DynamicsState}
   */
  simulate(payload) {
    const { input, entities, history } = payload;
    const matches = dynamics_engine.dynamics_scan(input);
    /** @type {DynamicsState} */
    const next_state = {
      ai: { ...entities.AI },
      fractal: entities.FRACTAL ? { ...entities.FRACTAL } : { dynamics: { velocity: 50, entropy: 50 } },
      flags: entities.AI?.flags || [],
      signals: {},
      signal_prompts: [],
      contributors: {}, // Tracks which rules caused specific changes { "AI.intensity": ["VIOLENCE"] }
    };
    dynamics_engine.simulation_dynamics(next_state, history, matches);
    return next_state;
  },

  /**
   * DYNAMICS SCAN (The Unified Scanner)
   * Finds every rule in the registry that matches the input text.
   * @param {string} text
   * @returns {DynamicsMatch[]}
   */

  dynamics_scan(text) {
    if (!text) return [];
    const matches = [];
    for (const data of Object.values(DYNAMICS)) {
      if (!Array.isArray(data.trigger)) continue;
      for (const t of data.trigger) {
        if (text.match(t.pattern)) {
          matches.push({ id: data.id, config: data, scan: t.scan });
        }
      }
    }
    return matches;
  },

  /**
   * SIMULATION DYNAMICS (The Umbrella Orchestrator)
   * Processes numerical pass, baseline gravity, and narrative pass.
   * @param {DynamicsState & Record<string, any>} state
   * @param {any} _prev_state
   * @param {DynamicsMatch[]} matches
   */

  simulation_dynamics(state, _prev_state, matches) {
    // 1. NUMERICAL PASS: Active Impulses and Passive Laws
    dynamics_engine.dynamics_numerical(state, matches);
    // 2. PHYSICS PASS: Baseline settlement and Threshold laws (Flags only)
    const ents = Object.keys(state).filter((k) => state[k]?.dynamics);
    ents.forEach((key) => {
      dynamics_engine._process_entity_dynamics(state[key].dynamics, dynamics_engine._get_baselines(state[key]), matches, state, state[key]);
    });
    // 3. NARRATIVE PASS: Environmental prompts
    dynamics_engine.dynamics_narrative(state, matches);
  },

  /**
   * DYNAMICS NUMERICAL (Numerical Stage)
   * Applies numerical shifts from matching triggers OR matching filters (for Laws).
   * @param {DynamicsState & Record<string, any>} state
   * @param {DynamicsMatch[]} matches
   */

  dynamics_numerical(state, matches) {
    if (!state.contributors) state.contributors = {};
    const processed = new Set();
    const matchMap = new Map();
    for (const m of matches || []) {
      matchMap.set(m.id, m);
    }
    Object.values(DYNAMICS).forEach((data) => {
      if (processed.has(data.id)) return;
      const match = matchMap.get(data.id);
      const active_state = {
        ...state.ai?.dynamics,
        ...state.fractal?.dynamics,
      };
      const passes_filter = dynamics_engine._evaluate_filter(active_state, data.filter);
      const is_turn_event = data.trigger === "turn";
      // Logic: Passive Turn Law OR Active Scan Impulse
      const should_apply = is_turn_event ? passes_filter : match && passes_filter;
      if (should_apply) {
        const config = match?.config || data;
        const eff = config.effect;
        if (eff) {
          Object.keys(eff).forEach((axis) => {
            if (axis === "text") return; // Narrative text handled elsewhere
            if (state.ai?.dynamics && state.ai.dynamics[axis] !== undefined) {
              state.ai.dynamics[axis] = Math.min(100, Math.max(0, state.ai.dynamics[axis] + eff[axis]));
              const track_key = `AI.${axis}`;
              if (!state.contributors[track_key]) state.contributors[track_key] = [];
              state.contributors[track_key].push(data.id);
            } else if (state.fractal?.dynamics && state.fractal.dynamics[axis] !== undefined) {
              state.fractal.dynamics[axis] = Math.min(100, Math.max(0, state.fractal.dynamics[axis] + eff[axis]));
              const track_key = `FRACTAL.${axis}`;
              if (!state.contributors[track_key]) state.contributors[track_key] = [];
              state.contributors[track_key].push(data.id);
            }
          });
        }
        processed.add(data.id);
      }
    });
  },

  /**
   * DYNAMICS NARRATIVE (Narrative Stage)
   * Pushes prompts to the final output based on the settled state.
   * @param {DynamicsState & Record<string, any>} state
   * @param {DynamicsMatch[]} matches
   */

  dynamics_narrative(state, matches) {
    const matchSet = new Set();
    for (const m of matches) {
      matchSet.add(m.id);
    }
    Object.values(DYNAMICS).forEach((data) => {
      const is_triggered = matchSet.has(data.id);
      const active_state = {
        ...state.ai?.dynamics,
        ...state.fractal?.dynamics,
      };
      const passes_filter = dynamics_engine._evaluate_filter(active_state, data.filter);
      const is_turn_event = data.trigger === "turn";
      const should_echo = is_turn_event ? passes_filter : is_triggered && passes_filter;
      if (should_echo && data.effect?.text) {
        state.signal_prompts.push(data.effect.text);
        state.signals[data.id] = true;
      }
    });
  },

  /**
   * @param {Record<string, number>} d - The current dynamics state.
   * @param {any} filter - The filter configuration.
   * @returns {boolean} True if the filter passes.
   */

  _evaluate_filter(d, filter) {
    if (!filter) return true;
    const above_ok = Object.entries(filter.above || {}).every(([axis, limit]) => d[axis] > limit);
    const below_ok = Object.entries(filter.below || {}).every(([axis, limit]) => d[axis] < limit);
    const between_ok = Object.entries(filter.between || {}).every(([axis, [lo, hi]]) => d[axis] >= lo && d[axis] <= hi);
    return above_ok && below_ok && between_ok;
  },

  /**
   * @param {any} entity - The entity to extract baselines from.
   * @returns {Record<string, number>} The entity's baseline dynamics.
   */

  _get_baselines(entity) {
    // dynamics_baseline: permanent per-entity gravitational center.
    // Set by the user outside a simulation; gravity pulls live dynamics back toward it each round.
    // Falls back to 50 (universal mid-point) if not defined.
    return entity?.dynamics_baseline || {};
  },

  /**
   * Generates persistent state flags for AI response conditioning.
   * @param {Record<string, number>} d
   * @param {Record<string, number>} baselines
   * @param {DynamicsMatch[]} _matches
   * @param {DynamicsState} _state
   */

  _process_entity_dynamics(d, baselines, _matches, _state, entity) {
    // 1. Gravity Pull
    const active_entropy = _state.fractal?.dynamics?.entropy ?? 50;
    const variance = (active_entropy / 100) * 0.05;

    Object.keys(d).forEach((axis) => {
      const target = baselines[axis] ?? 50;
      const base_gravity = entity?.dynamics_config?.gravity ?? 0.1; // Fallback default altered to 0.1
      const randomized_gravity = base_gravity + (Math.random() * 2 - 1) * variance;
      const applied_gravity = Math.max(0, Math.min(1, randomized_gravity)); // Clamp [0, 1]

      d[axis] += (target - d[axis]) * applied_gravity;
    });
    // 2. Settlement
    Object.keys(d).forEach((axis) => (d[axis] = Math.max(0, Math.min(100, Math.round(d[axis])))));
  },
};
