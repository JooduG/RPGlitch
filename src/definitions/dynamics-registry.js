/**
 * src/definitions/dynamics-registry.js
 * ============================================================================
 * 📊 DYNAMICS DEFINITIONS & SOMATIC PROTOCOLS REGISTRY
 * ============================================================================
 *
 * Declarative registries, metric identifiers, and somatic subtext protocols.
 * Single source of truth for all psychological and environmental physics rules:
 * 1. Metric identifiers (DYNAMICS.AXES)
 * 2. Unified Dynamics Rules & Somatic Protocols (DYNAMICS_RULES)
 * ============================================================================
 */

import { DYNAMICS } from "@config";

/**
 * Builds a fresh neutral-equilibrium dynamics snapshot for one scope.
 * Single-sources the "all meters start at MID" default: axis membership comes
 * from DYNAMICS axis scopes, values from DYNAMICS.SCALE.MID.
 * @param {"somatic" | "fractal"} scope
 * @returns {Record<string, number>}
 */
export function default_dynamics_for_scope(scope) {
  const out = {};
  for (const [axis, def] of Object.entries(DYNAMICS.AXES)) {
    if (def.scope === scope) out[axis] = DYNAMICS.SCALE.MID;
  }
  return out;
}

/**
 * Unified dynamics rules & somatic subtext protocols (12 somatic archetypes + 18 dynamics triggers).
 *
 * @type {Array<{ id: string, directive: string, when?: ((dynamics: any) => boolean) | ((ai: any, fractal?: any) => boolean), priority?: number }>}
 */
export const DYNAMICS_RULES = [
  // ── Non-Verbal Reaction Thresholds (Priority-Ranked) ────────────────────────
  {
    id: "FEAR",
    when: (d) => (d.intensity ?? 50) >= 75 && (d.affinity ?? 50) <= 60,
    priority: 85,
    directive:
      "Shallow breathing, locked jaw, cold sweat, scanning physical exits. Physical freeze/flight response; hyper-vigilant scanning of immediate space.",
  },
  {
    id: "DYSREGULATION",
    when: (d) => (d.chaos ?? 50) >= 75 || ((d.intensity ?? 50) >= 80 && (d.chaos ?? 50) >= 60),
    priority: 80,
    directive:
      "Pacing, fine motor tremors, erratic vocal cadence, rapid uneven respiration. Cognitive overload; fragmented sentences and chaotic motor agitation.",
  },
  {
    id: "EMOTIONAL_NEGLECT",
    when: (d) => (d.intensity ?? 50) <= 25 && (d.openness ?? 50) <= 35,
    priority: 75,
    directive:
      "Affect numbness, flat monotone delivery, drifting gaze, motionless hands. Affect blunting and quiet withdrawal; disengages from connection effort.",
  },
  {
    id: "BETRAYAL",
    when: (d) => (d.openness ?? 50) <= 25 && (d.affinity ?? 50) <= 40,
    priority: 80,
    directive: "Throat constricted, cold hands, sudden step backward, guarded silence. Acute trust collapse; sudden physical withdrawal and rigid skepticism.",
  },
  {
    id: "DEFIANCE",
    when: (d) => (d.openness ?? 50) <= 30 && (d.intensity ?? 50) >= 60,
    priority: 70,
    directive: "Raised chin, rigid spine, locked eye contact, squared stance. Open resistance and pride; physical assertion against authority or pressure.",
  },
  {
    id: "VULNERABILITY",
    when: (d) => (d.openness ?? 50) >= 75 && (d.affinity ?? 50) >= 50,
    priority: 75,
    directive:
      "Unclenching hands, softened gaze, hesitant cadence, dropped defensive posture. Defensive walls softening; cautious, tentative physical opening.",
  },
  {
    id: "INTIMACY",
    when: (d) => (d.affinity ?? 50) >= 75 && (d.openness ?? 50) >= 60,
    priority: 80,
    directive:
      "Leaning inward, softened micro-expressions, matched breathing tempo, lingering contact. Sensory closeness and reduced spatial distance; warmth and physical presence.",
  },
  {
    id: "GRIEF",
    when: (d) => (d.intensity ?? 50) <= 35 && (d.affinity ?? 50) >= 65 && (d.chaos ?? 50) <= 40,
    priority: 70,
    directive:
      "Heavy swallow, pressure behind eyes, decelerated motor cadence, weighted pauses. Visceral emotional weight; speech slowed and anchored in physical heaviness.",
  },
  {
    id: "SHAME",
    when: (d) => (d.openness ?? 50) <= 35 && (d.intensity ?? 50) >= 60 && (d.affinity ?? 50) >= 45,
    priority: 65,
    directive:
      "Averted eye contact, fidgeting fingers, heat rising in ears and collar, hunched shoulders. Weave involuntary physical shame tells (averted gaze, flushed neck); attempts verbal deflection while posture collapses inward.",
  },

  // ── Archetype Directives (no automatic threshold) ───────────────────────────
  {
    id: "ABANDONMENT",
    directive:
      "Hollow stomach, chest tightness, searching gaze, abrupt cling or preemptive detachment. Panic of separation; hyper-reactive to perceived emotional distance.",
  },
  {
    id: "DOMINANCE",
    directive: "Deliberate unhurried movements, spatial expansion, steady downward gaze. Assert spatial control; unwavering presence and physical command.",
  },
  {
    id: "DECEPTION",
    directive:
      "Calculated micro-pauses, forced smoothness, throat clearing, stiff hands. Over-managed composure; unnatural control concealing rapid internal calculation.",
  },

  // ── Global Baseline Dynamics Subtext Triggers ───────────────────────────────
  // 📈 INTENSITY
  {
    id: "ADRENALINE",
    when: (d) => (d?.intensity ?? 50) > 70 && (d?.affinity ?? 50) <= 70,
    directive:
      "High-adrenaline pacing. Slow narrative time: expand detail in decisive beats - micro-expressions, split-second thoughts, and immediate sensory physics.",
  },
  {
    id: "SLOW_MOTION",
    when: (d) => (d?.intensity ?? 50) < 30 && (d?.chaos ?? 50) <= 70,
    directive: "Pacing slow. Heavy fatigue. Deliberate, languid actions.",
  },

  // 🌪️ CHAOS
  {
    id: "GLITCH",
    when: (d) => (d?.chaos ?? 50) > 70 && (d?.intensity ?? 50) >= 30,
    directive: "Reality glitching. Fragmented recall. Non-linear time perception.",
  },
  { id: "RECOVERY", when: (d) => (d?.chaos ?? 50) < 30 && (d?.entropy ?? 50) >= 30, directive: "High clarity. Sharp recall. Stable environment." },

  // 🔓 OPENNESS
  {
    id: "EXPOSED",
    when: (d) => (d?.openness ?? 50) > 70 && (d?.velocity ?? 50) >= 30,
    directive: "Psychological armor down, highly receptive and unshielded. Reveal genuine reactions without reflexive deflection; raw unguarded openness.",
  },
  {
    id: "MASKING",
    when: (d) => (d?.openness ?? 50) < 30 && (d?.affinity ?? 50) >= 30,
    directive:
      "Guarded self-containment. Deflects intrusive personal questions with disciplined silence, keeping private history and feelings concealed while avoiding overt hostility.",
  },

  // 🤝 AFFINITY
  { id: "SYNCHRONY", when: (d) => (d?.affinity ?? 50) > 70 && (d?.intensity ?? 50) <= 70, directive: "Mirroring user movement. Intense focus. Deep rapport." },
  {
    id: "DISSONANCE",
    when: (d) => (d?.affinity ?? 50) < 30 && (d?.openness ?? 50) >= 30,
    directive: "Interpersonal friction and irritation. Sharp tone, physical boundary defense, and visible exasperation without emotional withdrawal.",
  },

  // 🚀 VELOCITY
  { id: "OVERDRIVE", when: (d) => (d?.velocity ?? 50) > 70 && (d?.entropy ?? 50) <= 70, directive: "Environmental pacing accelerated. Time compressing." },
  { id: "STASIS", when: (d) => (d?.velocity ?? 50) < 30 && (d?.openness ?? 50) <= 70, directive: "Environmental stasis. Time stretching." },

  // 📉 ENTROPY
  {
    id: "INSTABILITY",
    when: (d) => (d?.entropy ?? 50) > 70 && (d?.velocity ?? 50) <= 70,
    directive:
      "Pathetic fallacy: The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.",
  },
  { id: "STABILITY", when: (d) => (d?.entropy ?? 50) < 30 && (d?.chaos ?? 50) >= 30, directive: "Structural stability. Safe, predictable physics." },

  // 🛡️ COMPOSITE TRIGGERS
  {
    id: "SUSPICION",
    when: (d) => (d?.openness ?? 50) < 30 && (d?.affinity ?? 50) < 30,
    directive:
      "Acute suspicion and estrangement. Guarded deflection and physical boundary defense - actively test the user's motives, question inconsistencies, and maintain vigilant distance.",
  },
  {
    id: "CATACLYSM",
    when: (d) => (d?.velocity ?? 50) > 70 && (d?.entropy ?? 50) > 70,
    directive:
      "Accelerated environmental upheaval. Physical structures decaying and tearing apart at breakneck speed with cascading reality glitches and rapid hazards.",
  },
  {
    id: "CONFESSION",
    when: (d) => (d?.openness ?? 50) > 70 && (d?.velocity ?? 50) < 30,
    directive:
      "Quiet emotional vulnerability. Environmental pacing slows to a crawl as personal defenses drop, inviting honest confessions and unguarded admissions.",
  },
  {
    id: "PASSION",
    when: (d) => (d?.intensity ?? 50) > 70 && (d?.affinity ?? 50) > 70,
    directive:
      "High-adrenaline resonance and deep rapport. Expand detail in decisive beats with intense focus, mirroring movement, breathless momentum, and raw connection.",
  },
  {
    id: "TRANCE",
    when: (d) => (d?.intensity ?? 50) < 30 && (d?.chaos ?? 50) > 70,
    directive:
      "Lethargic dissociation and perceptual distortion. Heavy physical fatigue and languid actions paired with surreal, fragmented thoughts and reality glitches.",
  },
  {
    id: "HARMONY",
    when: (d) => (d?.chaos ?? 50) < 30 && (d?.entropy ?? 50) < 30,
    directive: "Pristine mental clarity and physical stability. Razor-sharp recall and steady focus grounded in safe, predictable environmental physics.",
  },
];
