/**
 * src/definitions/dynamics-registry.js
 * ============================================================================
 * 📊 DYNAMICS DEFINITIONS & SOMATIC PROTOCOLS REGISTRY
 * ============================================================================
 *
 * Declarative registries, metric identifiers, and somatic subtext protocols.
 * Single source of truth for all psychological and environmental physics rules:
 * 1. Metric identifiers (DYNAMICS_METRIC_NAMES)
 * 2. Universal Physics Protocols (PHYSICS_PROTOCOLS: 12 somatic archetypes + 18 dynamics triggers)
 * 3. Available Keywords Taxonomy (AVAILABLE_KEYWORDS)
 * 4. Priority-Ranked Dynamics Rules (DYNAMICS_RULES)
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
  for (const axis of DYNAMICS_METRIC_NAMES) {
    if (DYNAMICS[axis.toUpperCase()]?.scope === scope) out[axis] = DYNAMICS.SCALE.MID;
  }
  return out;
}

/**
 * Canonical dynamics metric names. Single source for telemetry shaping.
 * @type {ReadonlyArray<string>}
 */
export const DYNAMICS_METRIC_NAMES = Object.freeze(["chaos", "intensity", "openness", "affinity", "velocity", "entropy"]);

// ── 1. Physics Protocols & Directives Registry ────────────────────────────────

/**
 * Universal physics protocols: 12 somatic archetypes + 18 dynamics trigger directives.
 * @type {Record<string, { label?: string, tells?: string, directive: string } | string>}
 */
export const PHYSICS_PROTOCOLS = Object.freeze({
  // ── 1.1 Universal Somatic & Trauma Archetypes ───────────────────────────────
  SHAME:
    "Averted eye contact, fidgeting fingers, heat rising in ears and collar, hunched shoulders. Weave involuntary physical shame tells (averted gaze, flushed neck); attempts verbal deflection while posture collapses inward.",
  FEAR: "Shallow breathing, locked jaw, cold sweat, scanning physical exits. Physical freeze/flight response; hyper-vigilant scanning of immediate space.",
  VULNERABILITY:
    "Unclenching hands, softened gaze, hesitant cadence, dropped defensive posture. Defensive walls softening; cautious, tentative physical opening.",
  BETRAYAL:
    "Throat constricted, cold hands, sudden step backward, guarded silence. Acute trust collapse; sudden physical withdrawal and rigid skepticism.",
  ABANDONMENT:
    "Hollow stomach, chest tightness, searching gaze, abrupt cling or preemptive detachment. Panic of separation; hyper-reactive to perceived emotional distance.",
  EMOTIONAL_NEGLECT:
    "Affect numbness, flat monotone delivery, drifting gaze, motionless hands. Affect blunting and quiet withdrawal; disengages from connection effort.",
  DEFIANCE:
    "Raised chin, rigid spine, locked eye contact, squared stance. Open resistance and pride; physical assertion against authority or pressure.",
  INTIMACY:
    "Leaning inward, softened micro-expressions, matched breathing tempo, lingering contact. Sensory closeness and reduced spatial distance; warmth and physical presence.",
  GRIEF:
    "Heavy swallow, pressure behind eyes, decelerated motor cadence, weighted pauses. Visceral emotional weight; speech slowed and anchored in physical heaviness.",
  DOMINANCE:
    "Deliberate unhurried movements, spatial expansion, steady downward gaze. Assert spatial control; unwavering presence and physical command.",
  DECEPTION:
    "Calculated micro-pauses, forced smoothness, throat clearing, stiff hands. Over-managed composure; unnatural control concealing rapid internal calculation.",
  DYSREGULATION:
    "Pacing, fine motor tremors, erratic vocal cadence, rapid uneven respiration. Cognitive overload; fragmented sentences and chaotic motor agitation.",

  // ── 1.2 Dynamics Triggers & Somatic Pacing Directives ───────────────────────
  ADRENALINE:
    "High-adrenaline pacing. Slow narrative time: expand detail in decisive beats - micro-expressions, split-second thoughts, and immediate sensory physics.",
  SLOW_MOTION: "Pacing slow. Heavy fatigue. Deliberate, languid actions.",
  GLITCH: "Reality glitching. Fragmented recall. Non-linear time perception.",
  RECOVERY: "High clarity. Sharp recall. Stable environment.",
  EXPOSED:
    "Psychological armor down, highly receptive and unshielded. Reveal genuine reactions without reflexive deflection; raw unguarded openness.",
  MASKING:
    "Guarded self-containment. Deflects intrusive personal questions with disciplined silence, keeping private history and feelings concealed while avoiding overt hostility.",
  SYNCHRONY: "Mirroring user movement. Intense focus. Deep rapport.",
  DISSONANCE: "Interpersonal friction and irritation. Sharp tone, physical boundary defense, and visible exasperation without emotional withdrawal.",
  OVERDRIVE: "Environmental pacing accelerated. Time compressing.",
  STASIS: "Environmental stasis. Time stretching.",
  INSTABILITY:
    "Pathetic fallacy: The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.",
  STABILITY: "Structural stability. Safe, predictable physics.",
  SUSPICION:
    "Acute suspicion and estrangement. Guarded deflection and physical boundary defense - actively test the user's motives, question inconsistencies, and maintain vigilant distance.",
  CATACLYSM:
    "Accelerated environmental upheaval. Physical structures decaying and tearing apart at breakneck speed with cascading reality glitches and rapid hazards.",
  CONFESSION:
    "Quiet emotional vulnerability. Environmental pacing slows to a crawl as personal defenses drop, inviting honest confessions and unguarded admissions.",
  PASSION:
    "High-adrenaline resonance and deep rapport. Expand detail in decisive beats with intense focus, mirroring movement, breathless momentum, and raw connection.",
  TRANCE:
    "Lethargic dissociation and perceptual distortion. Heavy physical fatigue and languid actions paired with surreal, fragmented thoughts and reality glitches.",
  HARMONY: "Pristine mental clarity and physical stability. Razor-sharp recall and steady focus grounded in safe, predictable environmental physics.",
});

/** List of static archetype keyword IDs for Director available keyword listings */
export const AVAILABLE_KEYWORDS = Object.freeze([
  "SHAME",
  "FEAR",
  "VULNERABILITY",
  "BETRAYAL",
  "ABANDONMENT",
  "EMOTIONAL_NEGLECT",
  "DEFIANCE",
  "INTIMACY",
  "GRIEF",
  "DOMINANCE",
  "DECEPTION",
  "DYSREGULATION",
]);

// ── 2. Dynamics Rules (Subtext Protocols & Somatic Reactions) ─────────────────

/**
 * Unified dynamics rules encompassing non-verbal emotional reaction thresholds (with priority)
 * and environmental/somatic subtext protocol triggers.
 *
 * @type {Array<{ id: string, when: ((dynamics: any) => boolean) | ((ai: any, fractal?: any) => boolean), priority?: number }>}
 */
export const DYNAMICS_RULES = [
  // ── 2.1 Non-Verbal Reaction Thresholds (Priority-Ranked) ───────────────────
  {
    id: "FEAR",
    when: (d) => (d.intensity ?? 50) >= 75 && (d.affinity ?? 50) <= 60,
    priority: 85,
  },
  {
    id: "DYSREGULATION",
    when: (d) => (d.chaos ?? 50) >= 75 || ((d.intensity ?? 50) >= 80 && (d.chaos ?? 50) >= 60),
    priority: 80,
  },
  {
    id: "EMOTIONAL_NEGLECT",
    when: (d) => (d.intensity ?? 50) <= 25 && (d.openness ?? 50) <= 35,
    priority: 75,
  },
  {
    id: "BETRAYAL",
    when: (d) => (d.openness ?? 50) <= 25 && (d.affinity ?? 50) <= 40,
    priority: 80,
  },
  {
    id: "DEFIANCE",
    when: (d) => (d.openness ?? 50) <= 30 && (d.intensity ?? 50) >= 60,
    priority: 70,
  },
  {
    id: "VULNERABILITY",
    when: (d) => (d.openness ?? 50) >= 75 && (d.affinity ?? 50) >= 50,
    priority: 75,
  },
  {
    id: "INTIMACY",
    when: (d) => (d.affinity ?? 50) >= 75 && (d.openness ?? 50) >= 60,
    priority: 80,
  },
  {
    id: "GRIEF",
    when: (d) => (d.intensity ?? 50) <= 35 && (d.affinity ?? 50) >= 65 && (d.chaos ?? 50) <= 40,
    priority: 70,
  },
  {
    id: "SHAME",
    when: (d) => (d.openness ?? 50) <= 35 && (d.intensity ?? 50) >= 60 && (d.affinity ?? 50) >= 45,
    priority: 65,
  },

  // ── 2.2 Global Baseline Dynamics Subtext Triggers ───────────────────────────
  // 📈 INTENSITY
  {
    id: "ADRENALINE",
    when: (d) => (d?.intensity ?? 50) > 70 && (d?.affinity ?? 50) <= 70,
  },
  {
    id: "SLOW_MOTION",
    when: (d) => (d?.intensity ?? 50) < 30 && (d?.chaos ?? 50) <= 70,
  },

  // 🌪️ CHAOS
  {
    id: "GLITCH",
    when: (d) => (d?.chaos ?? 50) > 70 && (d?.intensity ?? 50) >= 30,
  },
  {
    id: "RECOVERY",
    when: (d) => (d?.chaos ?? 50) < 30 && (d?.entropy ?? 50) >= 30,
  },

  // 🔓 OPENNESS
  {
    id: "EXPOSED",
    when: (d) => (d?.openness ?? 50) > 70 && (d?.velocity ?? 50) >= 30,
  },
  {
    id: "MASKING",
    when: (d) => (d?.openness ?? 50) < 30 && (d?.affinity ?? 50) >= 30,
  },

  // 🤝 AFFINITY
  {
    id: "SYNCHRONY",
    when: (d) => (d?.affinity ?? 50) > 70 && (d?.intensity ?? 50) <= 70,
  },
  {
    id: "DISSONANCE",
    when: (d) => (d?.affinity ?? 50) < 30 && (d?.openness ?? 50) >= 30,
  },

  // 🚀 VELOCITY
  {
    id: "OVERDRIVE",
    when: (d) => (d?.velocity ?? 50) > 70 && (d?.entropy ?? 50) <= 70,
  },
  {
    id: "STASIS",
    when: (d) => (d?.velocity ?? 50) < 30 && (d?.openness ?? 50) <= 70,
  },

  // 📉 ENTROPY
  {
    id: "INSTABILITY",
    when: (d) => (d?.entropy ?? 50) > 70 && (d?.velocity ?? 50) <= 70,
  },
  {
    id: "STABILITY",
    when: (d) => (d?.entropy ?? 50) < 30 && (d?.chaos ?? 50) >= 30,
  },

  // 🛡️ COMPOSITE TRIGGERS
  {
    id: "SUSPICION",
    when: (d) => (d?.openness ?? 50) < 30 && (d?.affinity ?? 50) < 30,
  },
  {
    id: "CATACLYSM",
    when: (d) => (d?.velocity ?? 50) > 70 && (d?.entropy ?? 50) > 70,
  },
  {
    id: "CONFESSION",
    when: (d) => (d?.openness ?? 50) > 70 && (d?.velocity ?? 50) < 30,
  },
  {
    id: "PASSION",
    when: (d) => (d?.intensity ?? 50) > 70 && (d?.affinity ?? 50) > 70,
  },
  {
    id: "TRANCE",
    when: (d) => (d?.intensity ?? 50) < 30 && (d?.chaos ?? 50) > 70,
  },
  {
    id: "HARMONY",
    when: (d) => (d?.chaos ?? 50) < 30 && (d?.entropy ?? 50) < 30,
  },
];
