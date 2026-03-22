/**
 * @file src/core/intelligence/DynamicsEngine.js
 * @description The RPGlitch Dynamics Engine (v2).
 * Consolidates all impulses, reactions, and signals into a unified DYNAMICS registry.
 */
/**
 * 📢 THE DYNAMICS REGISTRY
 * -----------------------------------------------------------------------------
 * A unified table for all Reactive impulses, Passive state signals, and Physics Laws.
 * Rules    :
 * - trigger: "turn" -> Applies if filter passes (Passive Law/Signal).
 * - trigger: Array  -> Only applies if input matches AND filter passes (Scan Reaction).
 * - Effect : Numerical changes (ai/fractal) and Narrative (text).
 */
export const DYNAMICS = [
  // 🧬 AI SOMATICS (Passive Signals)
  {
    id: "ADRENALINE",
    trigger: "turn",
    filter: { above: { intensity: 70 } },
    effect: { text: "Pacing fast. Short sentences. High-stakes urgency." },
  },
  {
    id: "SLOW_MOTION",
    trigger: "turn",
    filter: { below: { intensity: 30 } },
    effect: {
      text: "Pacing slow. Heavy fatigue. Deliberate, languid actions.",
    },
  },
  {
    id: "HACK",
    trigger: "turn",
    filter: { above: { chaos: 70 } },
    effect: {
      text: "Reality glitching. Fragmented memory. Non-linear time perception.",
    },
  },
  {
    id: "RECOVERY",
    trigger: "turn",
    filter: { below: { chaos: 30 } },
    effect: { text: "High clarity. Sharp recall. Stable environment." },
  },
  {
    id: "VULNERABILITY",
    trigger: "turn",
    filter: { above: { openness: 70 } },
    effect: { text: "Emotional exposure. Seeking comfort. Honest admissions." },
  },
  {
    id: "IRON_CURTAIN",
    trigger: "turn",
    filter: { below: { openness: 30 } },
    effect: { text: "Cold deflection. Calculated silence. Guarded secrets." },
  },
  {
    id: "SYNCHRONY",
    trigger: "turn",
    filter: { above: { affinity: 70 } },
    effect: { text: "Mirroring user movement. Intense focus. Deep rapport." },
  },
  {
    id: "DISSONANCE",
    trigger: "turn",
    filter: { below: { affinity: 30 } },
    effect: {
      text: "Repulsion. Hostile distance. Passive-aggressive friction.",
    },
  },
  // 🌍 ENVIRONMENTAL FRACTAL (Passive Signals)
  {
    id: "HIGH_VELOCITY",
    trigger: "turn",
    filter: { above: { velocity: 70 } },
    effect: { text: "Environmental pacing accelerated. Time compressing." },
  },
  {
    id: "LOW_VELOCITY",
    trigger: "turn",
    filter: { below: { velocity: 30 } },
    effect: { text: "Environmental stasis. Time stretching." },
  },
  {
    id: "HIGH_ENTROPY",
    trigger: "turn",
    filter: { above: { entropy: 70 } },
    effect: { text: "Structural reality degrading. Hostile environment." },
  },
  {
    id: "LOW_ENTROPY",
    trigger: "turn",
    filter: { below: { entropy: 30 } },
    effect: { text: "Structural harmony. Safe, predictable physics." },
  },
  // ⚖️ PHYSICS LAWS (Ongoing Numerical Effects Each Turn)
  {
    id: "INTENSITY_AUTO_LOCK",
    trigger: "turn",
    filter: { above: { intensity: 90 } },
    effect: { ai: { openness: -10 } },
  },
  {
    id: "CHAOS_AUTO_HEAT",
    trigger: "turn",
    filter: { above: { chaos: 90 } },
    effect: { ai: { intensity: 10 } },
  },
  {
    id: "OPENNESS_AUTO_GLITCH",
    trigger: "turn",
    filter: { above: { openness: 90 } },
    effect: { ai: { chaos: 15 } },
  },
  {
    id: "AFFINITY_AUTO_OPEN",
    trigger: "turn",
    filter: { above: { affinity: 90 } },
    effect: { ai: { openness: 5 } },
  },
  // ⚡ IMPULSES (Active Triggers)
  {
    id: "SHARD",
    trigger: [
      {
        scan: "logic",
        pattern: /logic|math|calculat|precise|fact|prove|proof/i,
      },
      {
        scan: "analysis",
        pattern: /analy(ze|sis)|code|script|program|system|process/i,
      },
    ],
    effect: { ai: { chaos: -10, openness: 5 }, fractal: { entropy: -5 } },
  },
  {
    id: "VULNERABILITY",
    trigger: [
      { scan: "affection", pattern: /love|kiss|hug|hold|protect|care|soft/i },
      { scan: "sadness", pattern: /cry|weep|mourn|loss|hurt|pain|lonely/i },
    ],
    effect: { ai: { openness: 15, affinity: 10 } },
  },
  {
    id: "SYSTEM_COLLAPSE",
    trigger: [
      {
        scan: "glitch",
        pattern: /glitch|error|crash|fail|null|void|missing|broken/i,
      },
    ],
    effect: { ai: { chaos: 20 }, fractal: { entropy: 25 } },
  },
  {
    id: "ANCHOR",
    trigger: [
      {
        scan: "physicality",
        pattern: /stone|iron|ground|heavy|floor|wall|weight/i,
      },
    ],
    effect: { fractal: { velocity: -15, entropy: -10 } },
  },
  {
    id: "VIOLENCE",
    trigger: [
      {
        scan: "combat",
        pattern:
          /hit|kick|punch|shoot|strike|kill|attack|stab|slash|blood|gore|wound|fight|fought/i,
      },
      { scan: "aggression", pattern: /threat|angry|rage|furious|hate/i },
    ],
    effect: { ai: { intensity: 15, openness: -10 }, fractal: { entropy: 15 } },
  },
  {
    id: "KINETICS",
    trigger: [
      {
        scan: "impact",
        pattern: /destroy|smash|explosion|impact|crash|break|broken/i,
      },
      {
        scan: "athletics",
        pattern: /fast|speed|run|ran|sprint|dash|leap|jump/i,
      },
    ],
    effect: { ai: { intensity: 10 }, fractal: { velocity: 10 } },
  },
  {
    id: "STASIS",
    trigger: [
      { scan: "pause", pattern: /wait|pause|stop|still/i },
      { scan: "calm", pattern: /silence|quiet|calm|rest|sleep|slow/i },
    ],
    effect: { ai: { intensity: -10 }, fractal: { velocity: -10 } },
  },
  {
    id: "ANOMALY",
    trigger: [
      {
        scan: "horror",
        pattern: /scream|panic|horror|dread|fear|spooky|creepy/i,
      },
      { scan: "hide", pattern: /hide|hidden|secret|conceal|shadow/i },
    ],
    effect: { ai: { chaos: 15, openness: 10 }, fractal: { entropy: 15 } },
  },
  {
    id: "FORTIFICATION",
    trigger: [
      { scan: "armor", pattern: /armor|shield|barrier|wall|protect|defend/i },
      { scan: "hide", pattern: /hide|hidden|secret|conceal|shadow/i },
    ],
    effect: {
      ai: { openness: -10, affinity: 5 },
      fractal: { entropy: -5, velocity: -10 },
    },
  },
  // REACTIONS (Conditional Active Triggers)
  {
    id: "SUSPICIOUS",
    trigger: [
      {
        scan: "deception",
        pattern: /lie|lying|liar|fake|deceive|deception|trick|mask|disguise/i,
      },
      { scan: "trust", pattern: /trust|believe|honest|truth|promise/i },
    ],
    filter: { below: { openness: 30 } },
    effect: {
      ai: { affinity: -10, intensity: 10 },
      text: "You don't believe them.",
    },
  },
];
export class DynamicsEngine {
  static simulate(payload) {
    const { input, entities, history } = payload;
    const matches = DynamicsEngine.dynamics_scan(input);
    const nextState = {
      ai: { ...entities.AI },
      fractal: entities.FRACTAL
        ? { ...entities.FRACTAL }
        : { dynamics: { velocity: 50, entropy: 50 } },
      flags: entities.AI?.flags || [],
      signals: {},
      signal_prompts: [],
    };
    DynamicsEngine.simulation_dynamics(nextState, history, matches);
    return nextState;
  }
  /**
   * DYNAMICS SCAN (The Unified Scanner)
   * Finds every rule in the registry that matches the input text.
   * @param {string} text
   * @returns {Array<{ id: string, scan: string, config?: object }>}
   */
  static dynamics_scan(text) {
    if (!text) return [];
    const matches = [];
    for (const data of DYNAMICS) {
      if (!Array.isArray(data.trigger)) continue;
      for (const t of data.trigger) {
        if (text.match(t.pattern)) {
          matches.push({ id: data.id, config: data, scan: t.scan });
        }
      }
    }
    return matches;
  }
  /**
   * SIMULATION DYNAMICS (The Umbrella Orchestrator)
   * Processes numerical pass, baseline gravity, and narrative pass.
   */
  static simulation_dynamics(state, prevState, matches) {
    // 1. NUMERICAL PASS: Active Impulses and Passive Laws
    DynamicsEngine.dynamics_numerical(state, matches);
    // 2. PHYSICS PASS: Baseline settlement and Threshold laws (Flags only)
    const ents = Object.keys(state).filter((k) => state[k]?.dynamics);
    ents.forEach((key) => {
      DynamicsEngine._process_entity_dynamics(
        state[key].dynamics,
        DynamicsEngine._get_baselines(state[key]),
        matches,
        state,
      );
    });
    // 3. NARRATIVE PASS: Environmental prompts
    DynamicsEngine.dynamics_narrative(state, matches);
  }
  /**
   * DYNAMICS NUMERICAL (Numerical Stage)
   * Applies numerical shifts from matching triggers OR matching filters (for Laws).
   */
  static dynamics_numerical(state, matches) {
    const processed = new Set();
    DYNAMICS.forEach((data) => {
      if (processed.has(data.id)) return;
      const match = matches.find((m) => m.id === data.id);
      const active_state = {
        ...state.ai?.dynamics,
        ...state.fractal?.dynamics,
      };
      const passes_filter = DynamicsEngine._evaluate_filter(active_state, data.filter);
      const is_turn_event = data.trigger === "turn";
      // Logic: Passive Turn Law OR Active Scan Impulse
      const should_apply = is_turn_event ? passes_filter : match && passes_filter;
      if (should_apply) {
        const config = match?.config || data;
        const eff = config.effect;
        if (eff) {
          Object.keys(eff).forEach((entKey) => {
            const entState = state[entKey];
            if (entState?.dynamics) {
              Object.keys(eff[entKey]).forEach((axis) => {
                if (entState.dynamics[axis] !== undefined)
                  entState.dynamics[axis] += eff[entKey][axis];
              });
            }
          });
        }
        processed.add(data.id);
      }
    });
  }
  /**
   * DYNAMICS NARRATIVE (Narrative Stage)
   * Pushes prompts to the final output based on the settled state.
   */
  static dynamics_narrative(state, matches) {
    DYNAMICS.forEach((data) => {
      const is_triggered = matches.some((m) => m.id === data.id);
      const active_state = {
        ...state.ai?.dynamics,
        ...state.fractal?.dynamics,
      };
      const passes_filter = DynamicsEngine._evaluate_filter(active_state, data.filter);
      const is_turn_event = data.trigger === "turn";
      const should_echo = is_turn_event ? passes_filter : is_triggered && passes_filter;
      if (should_echo && data.effect?.text) {
        state.signal_prompts.push(data.effect.text);
        state.signals[data.id] = true;
      }
    });
  }
  static _evaluate_filter(d, filter) {
    if (!filter) return true;
    const above_ok = Object.entries(filter.above || {}).every(([axis, limit]) => d[axis] > limit);
    const below_ok = Object.entries(filter.below || {}).every(([axis, limit]) => d[axis] < limit);
    return above_ok && below_ok;
  }
  static _get_baselines(entity) {
    // dynamics_baseline: permanent per-entity gravitational center.
    // Set by the user outside a simulation; gravity pulls live dynamics back toward it each round.
    // Falls back to 50 (universal mid-point) if not defined.
    return entity?.dynamics_baseline || {};
  }
  /**
   * PHYSICS ENGINE (Gravity & Settlement)
   * Pulls dynamics back toward baselines and clamps results.
   * Generates persistent state flags for AI response conditioning.
   */
  static _process_entity_dynamics(d, baselines, matches, state) {
    // 1. Gravity Pull
    Object.keys(d).forEach((axis) => {
      const target = baselines[axis] ?? 50;
      d[axis] += (target - d[axis]) * 0.25;
    });
    // 2. Settlement
    Object.keys(d).forEach((axis) => (d[axis] = Math.max(0, Math.min(100, Math.round(d[axis])))));
  }
}
