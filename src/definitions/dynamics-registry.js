/**
 * src/definitions/dynamics-registry.js
 * ============================================================================
 * 📊 DYNAMICS DEFINITIONS & CHARACTER PROTOCOLS REGISTRY
 * ============================================================================
 *
 * Declarative registries, metric identifiers, and character subtext protocols.
 * Single source of truth for all psychological and environmental physics rules:
 * 1. Metric identifiers (DYNAMICS.AXES)
 * 2. Unified Dynamics Rules & Character Protocols (DYNAMICS_RULES)
 * ============================================================================
 */

import { DYNAMICS } from "@config";

/**
 * Builds a fresh neutral-equilibrium dynamics snapshot for one scope.
 * Single-sources the "all meters start at MID" default: axis membership comes
 * from DYNAMICS axis scopes, values from DYNAMICS.SCALE.MID.
 * @param {"character" | "fractal"} scope
 * @returns {Record<string, number>}
 */
export function default_dynamics_for_scope(scope) {
  const out = {};
  for (const [axis, def] of Object.entries(DYNAMICS.AXES)) {
    if (def.scope === scope) out[axis] = DYNAMICS.SCALE.MID;
  }
  return out;
}

const { LOW, HIGH } = DYNAMICS.SCALE;

/**
 * Unified dynamics rules & somatic subtext protocols (12 single-axis baselines + 6 Paradox Compounds).
 *
 * @type {ReadonlyArray<{ id: string, directive: string, when: (dynamics: Record<string, number>) => boolean }>}
 */
export const DYNAMICS_RULES = Object.freeze([
  // ── Baselines (12 Keywords Across 6 Stats) ──────────────────────────────────
  // 📈 INTENSITY
  {
    id: "ADRENALINE",
    when: (d) => d.intensity >= HIGH && d.velocity > LOW, // Suppressed by TENSION
    directive:
      "Spiked pulse and heightened sensory urgency. Expand decisive micro-beats, immediate physical reactions, and sharp focus on threats or leverage.",
  },
  {
    id: "HUSH",
    when: (d) => d.intensity <= LOW && d.chaos < HIGH && d.velocity < HIGH, // Suppressed by GLIDING
    directive:
      "Lowered vocal and physical volume. Soften movements, quiet the room's register, and keep energy muted without forcing exhaustion or sleepiness.",
  },

  // 🤝 AFFINITY
  {
    id: "ATTUNEMENT",
    when: (d) => d.affinity >= HIGH && d.entropy < HIGH, // Suppressed by SOLACE
    directive: "Deep interpersonal sync and shared timing. Track subtle shifts in posture, breath, and unspoken cues between characters.",
  },
  {
    id: "AVERSION",
    when: (d) => d.affinity <= LOW && d.openness > LOW && d.entropy > LOW, // Suppressed by STERILE
    directive: "Visceral pushback and distance. Create natural friction, physical space, or sharp resistance without turning every line into a speech.",
  },

  // 🔓 OPENNESS
  {
    id: "EXPOSURE",
    when: (d) => d.openness >= HIGH && d.chaos > LOW, // Suppressed by DEVOTION
    directive:
      "Defenses lowered and internal states laid bare. Let honest impulses, raw reactions, and unprotected feelings show through without reflexive deflection.",
  },
  {
    id: "RESERVE",
    when: (d) => d.openness <= LOW && d.affinity > LOW && d.chaos < HIGH, // Suppressed by SUPPRESSED
    directive: "Controlled privacy and held-back interiority. Keep inner motives and deeper feelings under wraps while staying naturally responsive.",
  },

  // 🚀 VELOCITY
  {
    id: "MOMENTUM",
    when: (d) => d.velocity >= HIGH && d.entropy < HIGH && d.intensity > LOW, // Suppressed by GLIDING
    directive: "Rapid forward drive and brisk transitions. Keep scenes moving decisively with tight beats and minimal stalling.",
  },
  {
    id: "SUSPENSION",
    when: (d) => d.velocity <= LOW && d.intensity < HIGH, // Suppressed by TENSION
    directive: "Time stretched taut and unhurried. Linger on suspended moments, held breaths, and deliberate beats before anything moves on.",
  },

  // 📉 ENTROPY
  {
    id: "DISTORTION",
    when: (d) => d.entropy >= HIGH && d.affinity < HIGH, // Suppressed by SOLACE
    directive:
      "Unreliable physical reality and warped sensory geometry. Weave shifting light, spatial glitches, strange proportions, or fractured physics straight into the environment.",
  },
  {
    id: "STABILITY",
    when: (d) => d.entropy <= LOW && d.chaos > LOW && d.affinity > LOW, // Suppressed by STERILE
    directive: "Solid, predictable physical grounding. Keep setting physics, spatial layout, and material details consistent and reliable.",
  },

  // ⚡ CHAOS
  {
    id: "UNBOUND",
    when: (d) => d.chaos >= HIGH && d.intensity > LOW && d.openness > LOW, // Suppressed by SUPPRESSED
    directive: "Off-leash impulse and rule-breaking energy. Favor bold, unconventional, boundary-pushing choices over safe or expected beats.",
  },
  {
    id: "RESTRAINT",
    when: (d) => d.chaos <= LOW && d.openness < HIGH, // Suppressed by DEVOTION
    directive: "Tight self-command and deliberate holding back. Channel energy through measured control rather than reckless release.",
  },

  // ── Compounds (6 Paradoxes Across All 12 Baselines) ────────────────────────
  {
    id: "DEVOTION",
    when: (d) => d.openness >= HIGH && d.chaos <= LOW,
    directive:
      "Unshielded vulnerability held under strict self-control. Deep, unmistakable investment with zero recklessness—every guarded gesture or held-back impulse carries heavy weight.",
  },
  {
    id: "TENSION",
    when: (d) => d.intensity >= HIGH && d.velocity <= LOW,
    directive:
      "High-charge pressure frozen inside stretched time. Pulse running hot while the moment holds on a razor's edge—every micro-shift feels loaded before anything breaks.",
  },
  {
    id: "SOLACE",
    when: (d) => d.affinity >= HIGH && d.entropy >= HIGH,
    directive:
      "Intense interpersonal anchor amidst a warping, unstable world. Even as surrounding reality bends or fractures, connection stays sharp, grounding, and fiercely real.",
  },
  {
    id: "SUPPRESSED",
    when: (d) => d.openness <= LOW && d.chaos >= HIGH,
    directive:
      "Contained volatility beneath a locked front. Keep inner motives, vulnerability, and private intent tightly guarded while letting sharp, rule-breaking impulses leak through in action, timing, or edge.",
  },
  {
    id: "GLIDING",
    when: (d) => d.intensity <= LOW && d.velocity >= HIGH,
    directive:
      "Effortless, low-volume forward motion. Keep the scene advancing briskly with smooth transitions and minimal friction, while holding emotional charge and sensory volume quiet and unhurried.",
  },
  {
    id: "STERILE",
    when: (d) => d.affinity <= LOW && d.entropy <= LOW,
    directive:
      "Cool emotional detachment inside steady, predictable physical space. Maintain crisp distance and low warmth between characters while keeping the environment grounded, orderly, and consistent.",
  },
]);
