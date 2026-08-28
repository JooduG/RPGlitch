/**
 * src/intelligence/physics.js
 * ⚙️ PHYSICS ENGINE — 6-Axis Dynamics simulation, gravity settlement,
 * mathematical delta computation, and unified signals evaluator.
 *
 * Core Laws:
 * - Pure data & math calculations only — zero prompt XML strings.
 * - Settle physics pulls volatile dynamics toward baselines with randomized gravity.
 * - Single-pass evaluation of global triggers and active narrative style triggers.
 */

// ── 1. Dynamics Metadata ──────────────────────────────────────────────────────

/**
 * 6 core dynamics axes: 4 somatic (character) and 2 environmental (fractal).
 * @type {Record<string, { label: string, desc: string }>}
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

// ── 2. Global Dynamics Triggers ───────────────────────────────────────────────

/**
 * Baseline global dynamics signals that apply across all scenes for all 6 dynamics axes.
 * @type {Array<{ id: string, when: (ai: any, fractal?: any) => boolean, directive: string }>}
 */
export const GLOBAL_TRIGGERS = [
  // 📈 INTENSITY (AI Somatics & Pacing)
  {
    id: "ADRENALINE",
    when: (ai) => (ai?.intensity ?? 50) > 70 && (ai?.affinity ?? 50) <= 70,
    directive:
      "High-adrenaline pacing. Slow narrative time: expand detail in decisive beats — micro-expressions, split-second thoughts, and immediate sensory physics.",
  },
  {
    id: "SLOW_MOTION",
    when: (ai) => (ai?.intensity ?? 50) < 30 && (ai?.chaos ?? 50) <= 70,
    directive: "Pacing slow. Heavy fatigue. Deliberate, languid actions.",
  },

  // 🌪️ CHAOS (AI Somatics & Perception)
  {
    id: "GLITCH",
    when: (ai) => (ai?.chaos ?? 50) > 70 && (ai?.intensity ?? 50) >= 30,
    directive: "Reality glitching. Fragmented memory. Non-linear time perception.",
  },
  {
    id: "RECOVERY",
    when: (ai, fractal) => (ai?.chaos ?? 50) < 30 && (fractal?.entropy ?? 50) >= 30,
    directive: "High clarity. Sharp recall. Stable environment.",
  },

  // 🔓 OPENNESS (AI Somatics & Receptivity)
  {
    id: "VULNERABILITY",
    when: (ai, fractal) => (ai?.openness ?? 50) > 70 && (fractal?.velocity ?? 50) >= 30,
    directive: "Emotional exposure. Seeking comfort. Honest admissions.",
  },
  {
    id: "MASKING",
    when: (ai) => (ai?.openness ?? 50) < 30 && (ai?.affinity ?? 50) >= 30,
    directive:
      "Guarded self-containment. Deflects intrusive personal questions with disciplined silence, keeping private history and feelings concealed while avoiding overt hostility.",
  },

  // 🤝 AFFINITY (AI Somatics & Inter-Entity Bond)
  {
    id: "SYNCHRONY",
    when: (ai) => (ai?.affinity ?? 50) > 70 && (ai?.intensity ?? 50) <= 70,
    directive: "Mirroring user movement. Intense focus. Deep rapport.",
  },
  {
    id: "DISSONANCE",
    when: (ai) => (ai?.affinity ?? 50) < 30 && (ai?.openness ?? 50) >= 30,
    directive: "Interpersonal friction and irritation. Sharp tone, physical boundary defense, and visible exasperation without emotional withdrawal.",
  },

  // 🚀 VELOCITY (World / Fractal Environmental Pacing)
  {
    id: "OVERDRIVE",
    when: (ai, fractal) => (fractal?.velocity ?? 50) > 70 && (fractal?.entropy ?? 50) <= 70,
    directive: "Environmental pacing accelerated. Time compressing.",
  },
  {
    id: "STASIS",
    when: (ai, fractal) => (fractal?.velocity ?? 50) < 30 && (ai?.openness ?? 50) <= 70,
    directive: "Environmental stasis. Time stretching.",
  },

  // 📉 ENTROPY (World / Fractal Structural Reality)
  {
    id: "INSTABILITY",
    when: (ai, fractal) => (fractal?.entropy ?? 50) > 70 && (fractal?.velocity ?? 50) <= 70,
    directive:
      "Pathetic fallacy: The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.",
  },
  {
    id: "STABILITY",
    when: (ai, fractal) => (fractal?.entropy ?? 50) < 30 && (ai?.chaos ?? 50) >= 30,
    directive: "Structural stability. Safe, predictable physics.",
  },

  // 🛡️ COMPOSITE TRIGGERS (Unique Dual-Axis Resonances)
  {
    id: "SUSPICION",
    when: (ai) => (ai?.openness ?? 50) < 30 && (ai?.affinity ?? 50) < 30,
    directive:
      "Acute suspicion and estrangement. Guarded deflection and physical boundary defense — actively test the user's motives, question inconsistencies, and maintain vigilant distance.",
  },
  {
    id: "CATACLYSM",
    when: (ai, fractal) => (fractal?.velocity ?? 50) > 70 && (fractal?.entropy ?? 50) > 70,
    directive:
      "Accelerated environmental upheaval. Physical structures decaying and tearing apart at breakneck speed with cascading reality glitches and rapid hazards.",
  },
  {
    id: "CONFESSION",
    when: (ai, fractal) => (ai?.openness ?? 50) > 70 && (fractal?.velocity ?? 50) < 30,
    directive:
      "Quiet emotional vulnerability. Environmental pacing slows to a crawl as personal defenses drop, inviting honest confessions and unguarded admissions.",
  },
  {
    id: "PASSION",
    when: (ai) => (ai?.intensity ?? 50) > 70 && (ai?.affinity ?? 50) > 70,
    directive:
      "High-adrenaline resonance and deep rapport. Expand detail in decisive beats with intense focus, mirroring movement, breathless momentum, and raw connection.",
  },
  {
    id: "TRANCE",
    when: (ai) => (ai?.intensity ?? 50) < 30 && (ai?.chaos ?? 50) > 70,
    directive:
      "Lethargic dissociation and perceptual distortion. Heavy physical fatigue and languid actions paired with surreal, fragmented thoughts and reality glitches.",
  },
  {
    id: "HARMONY",
    when: (ai, fractal) => (ai?.chaos ?? 50) < 30 && (fractal?.entropy ?? 50) < 30,
    directive:
      "Pristine mental clarity and physical stability. Razor-sharp recall and steady focus grounded in safe, predictable environmental physics.",
  },
];

// ── 3. Dynamic Somatic Threshold Rules ────────────────────────────────────────

/**
 * Deterministic threshold mapping from emotional dynamics axes to somatic archetype keys.
 */
export const DYNAMIC_SOMATIC_RULES = [
  {
    id: "fear",
    when: (d) => (d.intensity ?? 50) >= 75 && (d.affinity ?? 50) <= 60,
    priority: 85,
  },
  {
    id: "dysregulation",
    when: (d) => (d.chaos ?? 50) >= 75 || ((d.intensity ?? 50) >= 80 && (d.chaos ?? 50) >= 60),
    priority: 80,
  },
  {
    id: "emotional_neglect",
    when: (d) => (d.intensity ?? 50) <= 25 && (d.openness ?? 50) <= 35,
    priority: 75,
  },
  {
    id: "betrayal",
    when: (d) => (d.openness ?? 50) <= 25 && (d.affinity ?? 50) <= 40,
    priority: 80,
  },
  {
    id: "defiance",
    when: (d) => (d.openness ?? 50) <= 30 && (d.intensity ?? 50) >= 60,
    priority: 70,
  },
  {
    id: "vulnerability",
    when: (d) => (d.openness ?? 50) >= 75 && (d.affinity ?? 50) >= 50,
    priority: 75,
  },
  {
    id: "intimacy",
    when: (d) => (d.affinity ?? 50) >= 75 && (d.openness ?? 50) >= 60,
    priority: 80,
  },
  {
    id: "grief",
    when: (d) => (d.intensity ?? 50) <= 35 && (d.affinity ?? 50) >= 65 && (d.chaos ?? 50) <= 40,
    priority: 70,
  },
  {
    id: "shame",
    when: (d) => (d.openness ?? 50) <= 35 && (d.intensity ?? 50) >= 60 && (d.affinity ?? 50) >= 45,
    priority: 65,
  },
];

// ── 4. Physics Engine (Settlement & Gravity) ──────────────────────────────────

export const physics_engine = {
  /**
   * Evaluates and settles physics (Gravity & Clamping).
   * Used after the Director applies explicit state mutations to settle the physics before the next turn.
   * @param {Record<string, number>} dynamics - The current dynamics state for an entity
   * @param {Record<string, number>} [baselines={}] - The baseline gravitational centers
   * @param {number} [active_entropy=50] - The current world entropy (0-100)
   * @param {number} [base_gravity=0.1] - The baseline gravity strength (e.g. 0.1)
   * @param {Set<string>|null} [skip_axes=null] - Axes the Director explicitly calibrated this turn; they are exempt from gravity so its deltas stay authoritative.
   */
  settle_physics(dynamics, baselines = {}, active_entropy = 50, base_gravity = 0.1, skip_axes = null) {
    if (!dynamics || typeof dynamics !== "object") return;

    // 1. Gravity Pull & Settlement (Clamp to 0-100 bounds)
    const variance = (active_entropy / 100) * 0.05;

    for (const axis of Object.keys(dynamics)) {
      if (skip_axes && skip_axes.has(axis)) continue;
      const target = baselines[axis] ?? 50;
      const randomized_gravity = base_gravity + (Math.random() * 2 - 1) * variance;
      const applied_gravity = Math.max(0, Math.min(1, randomized_gravity)); // Clamp [0, 1]

      const next_val = dynamics[axis] + (target - dynamics[axis]) * applied_gravity;
      dynamics[axis] = Math.max(0, Math.min(100, Math.round(next_val)));
    }
  },

  /**
   * @param {any} entity - The entity to extract baselines from.
   * @returns {Record<string, number>} The entity's baseline dynamics.
   */
  _get_baselines(entity) {
    return entity?.dynamics_baseline || {};
  },
};

// ── 5. Delta Computation & Signal Evaluator ───────────────────────────────────

/**
 * Computes dynamics deltas for a single target (ai or fractal) and appends to accumulators.
 * @param {string} target
 * @param {Record<string, number>} dynamics
 * @param {any} runtime_target
 * @param {any[]} deltas
 * @param {string[]} log_strings
 */
export function compute_deltas(target, dynamics, runtime_target, deltas, log_strings) {
  for (const [axis, val] of Object.entries(dynamics || {})) {
    const old_value = /** @type {any} */ (runtime_target)?.[axis] ?? 50;
    const diff = val - old_value;
    if (diff !== 0) {
      deltas.push({ axis, target, old_value, new_value: val, diff });

      const capitalized_axis = axis.charAt(0).toUpperCase() + axis.slice(1);
      log_strings.push(`${capitalized_axis} ${diff > 0 ? "+" : ""}${diff}`);
    }
  }
}

/**
 * Evaluates active physics signals and style triggers for current dynamics.
 * Single-pass evaluator for both baseline global signals and narrative style triggers.
 *
 * @param {Record<string, number>|{ ai_dynamics?: Record<string, number>, fractal_dynamics?: Record<string, number>, style?: object }} [ai_dynamics={}]
 * @param {Record<string, number>} [fractal_dynamics={}]
 * @param {object|null} [style=null]
 * @returns {Array<{ id: string, text: string }>}
 */
export function evaluate_physics_signals(ai_dynamics = {}, fractal_dynamics = {}, style = null) {
  let ai = ai_dynamics || {};
  let fractal = fractal_dynamics || {};
  let active_style = style;

  if (
    ai_dynamics &&
    typeof ai_dynamics === "object" &&
    (ai_dynamics.ai_dynamics || ai_dynamics.fractal_dynamics || ai_dynamics.style !== undefined)
  ) {
    ai = ai_dynamics.ai_dynamics || {};
    fractal = ai_dynamics.fractal_dynamics || {};
    active_style = ai_dynamics.style || null;
  }

  const active = [];

  for (const trigger of GLOBAL_TRIGGERS) {
    if (typeof trigger.when === "function") {
      try {
        if (trigger.when(ai, fractal)) {
          active.push({ id: trigger.id, text: trigger.directive });
        }
      } catch (_err) {
        /* ignore error */
      }
    }
  }

  if (active_style && typeof active_style === "object" && Array.isArray(active_style.triggers) && active_style.id !== "default") {
    for (const trigger of active_style.triggers) {
      if (typeof trigger.when === "function") {
        try {
          if (trigger.when(ai, fractal)) {
            active.push({ id: trigger.id, text: trigger.directive });
          }
        } catch (_err) {
          /* ignore error */
        }
      }
    }
  }

  return active;
}

/**
 * Evaluates entity dynamics against somatic threshold rules and merges with manual keywords.
 * @param {Record<string, number>} [dynamics={}]
 * @param {string[]} [manual_keywords=[]]
 * @param {number} [max_directives=2]
 * @returns {string[]}
 */
export function evaluate_automatic_somatics(dynamics = {}, manual_keywords = [], max_directives = 2) {
  const result = [];
  const seen = new Set();

  if (Array.isArray(manual_keywords)) {
    for (const k of manual_keywords) {
      if (typeof k === "string" && k.trim() && !seen.has(k.trim())) {
        const cleaned = k.trim();
        seen.add(cleaned);
        result.push(cleaned);
        if (result.length >= max_directives) return result;
      }
    }
  }

  if (!dynamics || typeof dynamics !== "object") return result;

  const candidates = [];
  for (const rule of DYNAMIC_SOMATIC_RULES) {
    if (seen.has(rule.id)) continue;
    try {
      if (typeof rule.when === "function" && rule.when(dynamics)) {
        candidates.push(rule);
      }
    } catch (_err) {
      /* ignore */
    }
  }

  candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const c of candidates) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      result.push(c.id);
      if (result.length >= max_directives) break;
    }
  }

  return result;
}

/**
 * CHANGELOG
 * - 2026-08-28: Reconstructed physics.js as a pure calculation and signal evaluation engine:
 *   1. Relocated prompt XML rendering (build_signals_xml) to physics-prompts.js.
 *   2. Co-located DYNAMIC_SOMATIC_RULES and evaluate_automatic_somatics directly in physics.js.
 *   3. Replaced imperative .forEach loops with performant for...of iterators.
 */
