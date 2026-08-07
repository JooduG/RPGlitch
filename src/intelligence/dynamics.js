/**
 * src/intelligence/dynamics.js
 * ⚙️ DYNAMICS ENGINE — Physics engine slider metadata, settlement calculations,
 * image-trigger gating, and the DYNAMICS_SIGNALS prompt-directive registry
 * (signals.js merged in here).
 */

/**
 * @typedef {Object} AxisMeta
 * @property {string} label - UI display label
 * @property {string} desc - Axis description for LLM prompt legend calibration
 */

/** @type {Record<string, AxisMeta>} */
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

export const dynamics_engine = {
  /**
   * Evaluates and settles physics (Gravity & Clamping).
   * Used after the Director applies explicit state mutations to settle the physics before the next turn.
   * @param {Record<string, number>} dynamics - The current dynamics state for an entity
   * @param {Record<string, number>} [baselines={}] - The baseline gravitational centers
   * @param {number} [active_entropy=50] - The current world entropy (0-100)
   * @param {number} [base_gravity=0.1] - The baseline gravity strength (e.g. 0.1)
   */
  settle_physics(dynamics, baselines = {}, active_entropy = 50, base_gravity = 0.1) {
    if (!dynamics || typeof dynamics !== "object") return;

    // 1. Gravity Pull & Settlement (Clamp to 0-100 bounds)
    const variance = (active_entropy / 100) * 0.05;

    Object.keys(dynamics).forEach((axis) => {
      const target = baselines[axis] ?? 50;
      const randomized_gravity = base_gravity + (Math.random() * 2 - 1) * variance;
      const applied_gravity = Math.max(0, Math.min(1, randomized_gravity)); // Clamp [0, 1]

      const next_val = dynamics[axis] + (target - dynamics[axis]) * applied_gravity;
      dynamics[axis] = Math.max(0, Math.min(100, Math.round(next_val)));
    });
  },

  /**
   * @param {any} entity - The entity to extract baselines from.
   * @returns {Record<string, number>} The entity's baseline dynamics.
   */
  _get_baselines(entity) {
    return entity?.dynamics_baseline || {};
  },
};

/**
 * 🖼️ EVALUATE IMAGE TRIGGER — Source A: Pure-JS Dynamics Gate.
 *
 * Runs deterministically (no LLM call) after director settlement to decide whether
 * an automatic image beat should fire this round.
 *
 * Signals:
 *  - Signal B (Band Entry): any axis ENTERS an extreme band (>= band_high or <= band_low).
 *    Transitioning INTO the band triggers (82 -> 88, 18 -> 12). Leaving the band
 *    (88 -> 74) or moving within the band (76 -> 74) never triggers.
 *  - Signal A (Movement Displacement): the sum of |Δaxis| across all six axes
 *    exceeds `displacement_threshold`.
 *
 * @param {Record<string, Record<string, number>>} current - Post-director-settlement dynamics, keyed by entity (`ai` / `fractal`), each an axis map.
 * @param {Record<string, Record<string, number>>} previous - Pre-turn dynamics (last settled state), same nested shape.
 * @param {object} [options]
 * @param {number} [options.band_high=85]
 * @param {number} [options.band_low=15]
 * @param {number} [options.displacement_threshold=60]
 * @param {string} [options.default_tier="story_scene"]
 * @returns {{ triggered: boolean, signals: { band_entry: { axis: string, from: number, to: number, band: "high"|"low" } | null, displacement: number, displacement_threshold: number }, tier: string, deltas: Array<{ axis: string, from: number, to: number, delta: number }> }}
 */
export function evaluate_image_trigger(current = {}, previous = {}, options = {}) {
  const band_high = options.band_high ?? 85;
  const band_low = options.band_low ?? 15;
  const displacement_threshold = options.displacement_threshold ?? 60;
  const default_tier = options.default_tier ?? "story_scene";

  // Entity keys that belong to the character domain (portraits) rather than the
  // environmental domain (scenes). Used to break multi-axis band-entry ties.
  const CHARACTER_DOMAIN_ENTITIES = new Set(["ai", "user"]);

  const entities = new Set([...Object.keys(current || {}), ...Object.keys(previous || {})]);
  const axis_names = new Set();
  for (const ent of entities) {
    for (const axis of Object.keys((current || {})[ent] || {})) axis_names.add(axis);
    for (const axis of Object.keys((previous || {})[ent] || {})) axis_names.add(axis);
  }

  const deltas = [];
  const band_entries = [];
  let band_entry = null;
  let displacement = 0;

  for (const axis of axis_names) {
    let from = null;
    let to = null;
    let from_entity = null;
    let to_entity = null;
    for (const ent of entities) {
      const p = (previous || {})[ent] || {};
      const c = (current || {})[ent] || {};
      if (from === null && Number.isFinite(p[axis])) {
        from = p[axis];
        from_entity = ent;
      }
      if (to === null && Number.isFinite(c[axis])) {
        to = c[axis];
        to_entity = ent;
      }
    }
    // Guard against NaN poisoning: any non-finite axis value is skipped entirely
    // so it can't corrupt the displacement sum or band-entry math.
    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;

    const delta = Math.round((to - from) * 10) / 10;
    deltas.push({ axis, from, to, delta, entity: to_entity || from_entity });
    displacement += Math.abs(to - from);

    const entry_entity = to_entity || from_entity;
    if (to >= band_high && from < band_high) {
      band_entries.push({ axis, from, to, band: "high", entity: entry_entity });
      if (!band_entry) band_entry = { axis, from, to, band: "high" };
    } else if (to <= band_low && from > band_low) {
      band_entries.push({ axis, from, to, band: "low", entity: entry_entity });
      if (!band_entry) band_entry = { axis, from, to, band: "low" };
    }
  }

  displacement = Math.round(displacement * 10) / 10;
  const triggered = band_entry !== null || displacement >= displacement_threshold;

  // Tier precedence when multiple axes cross extreme bands in one turn:
  // character-domain entries (story_character) win over environmental (story_scene);
  // plain displacement triggers fall through to the configured default tier.
  const character_band_entry = band_entries.find((be) => CHARACTER_DOMAIN_ENTITIES.has(be.entity));
  const tier = character_band_entry ? "story_character" : band_entries.length > 0 ? "story_scene" : default_tier;

  return {
    triggered,
    signals: {
      band_entry,
      displacement,
      displacement_threshold,
    },
    tier,
    deltas,
  };
}

// ---------------------------------------------------------------------------
// 📡 DYNAMICS SIGNALS — dynamics-threshold → prompt-directive injection
// (merged from signals.js). One declarative registry, one evaluator, and a thin
// renderer. Adding a new directive = one registry entry.
// ---------------------------------------------------------------------------
// Scope guards vs. the legacy DYNAMICS registry:
//  - NO user-input keyword scanning (active impulses) — intentionally excluded.
//  - NO numerical axis mutation — the Director owns state mutations.

/**
 * Narrative signal registry.
 * Each entry triggers when its axis crosses the threshold on the owning domain:
 *  - domain "ai"      → the AI character's dynamics (intensity, chaos, ...)
 *  - domain "fractal" → the fractal's dynamics (entropy, velocity, ...)
 * At most one of `above`/`below` may be set.
 */
export const DYNAMICS_SIGNALS = [
  {
    id: "PACING_HIGH",
    domain: "ai",
    axis: "intensity",
    above: 70,
    text: "High-adrenaline pacing. Slow narrative time: expand detail in decisive beats — micro-expressions, split-second thoughts, immediate sensory physics. Use short, urgent sentences.",
  },
  {
    id: "PACING_LOW",
    domain: "ai",
    axis: "intensity",
    below: 30,
    text: "Low-energy pacing. Compress routine transitions; draw out actions with heavy, deliberate, languid detail.",
  },
  {
    id: "ATMOSPHERE_TENSE",
    domain: "fractal",
    axis: "entropy",
    above: 70,
    text: "Pathetic fallacy: the environment mirrors the scene's emotional tension — sharp sounds, cold drafts, oppressive light, close space.",
  },
  {
    id: "ATMOSPHERE_CALM",
    domain: "fractal",
    axis: "entropy",
    below: 30,
    text: "Pathetic fallacy: the environment mirrors calm — ambient hum, warmth, expansive views, rhythmic sounds.",
  },
];

/**
 * Evaluates which narrative signals are active for the given dynamics.
 * Emits nothing for unknown/non-numeric axis values and stays silent at
 * neutral values so mid-range turns are free of prompt noise.
 * @param {Record<string, number>} [ai_dynamics]
 * @param {Record<string, number>} [fractal_dynamics]
 * @returns {Array<{id: string, domain: string, axis: string, value: number, text: string}>}
 */
export function evaluate_dynamics_signals(ai_dynamics = {}, fractal_dynamics = {}) {
  const active = [];
  for (const signal of DYNAMICS_SIGNALS) {
    const dynamics = signal.domain === "fractal" ? fractal_dynamics : ai_dynamics;
    const value = dynamics?.[signal.axis];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const passes = signal.above !== undefined ? value > signal.above : signal.below !== undefined ? value < signal.below : false;
    if (passes) active.push({ id: signal.id, domain: signal.domain, axis: signal.axis, value: Math.round(value), text: signal.text });
  }
  return active;
}

/**
 * Renders the active narrative signals as a <DYNAMICS_SIGNALS> XML block.
 * @param {Record<string, number>} [ai_dynamics]
 * @param {Record<string, number>} [fractal_dynamics]
 * @param {{ domains?: Array<"ai" | "fractal"> }} [options]
 * @returns {string} XML block string, or "" when no signals are active.
 */
export function build_signals_xml(ai_dynamics = {}, fractal_dynamics = {}, options = {}) {
  const domains = options.domains ?? ["ai", "fractal"];
  const active = evaluate_dynamics_signals(ai_dynamics, fractal_dynamics).filter((s) => domains.includes(s.domain));
  if (active.length === 0) return "";
  const inner = active.map((s) => `      ${s.text}`).join("\n");
  return `    <DYNAMICS_SIGNALS>\n${inner}\n    </DYNAMICS_SIGNALS>`;
}
