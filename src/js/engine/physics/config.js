/**
 * src/js/engine/physics/config.js
 * The Single Source of Truth for Prometheus Physics.
 */

export const PHYSICS_CONSTANTS = {
  // --- THE HEARTBEAT ---
  HEARTBEAT_RATE: 3,

  // --- THRESHOLDS (Symmetric Model) ---
  LAW_HIGH: 90, // Triggers "Extreme State" Law
  SIGNAL_HIGH: 70, // Triggers "High State" Voice Instruction
  SIGNAL_LOW: 30, // Triggers "Low State" Voice Instruction
  LAW_LOW: 10, // Triggers "Critical Low" Law

  // --- SPECIAL CASE THRESHOLDS ---
  ECHO_THRESHOLD_RES: 80, // Resonance > 80 (Echo Chamber Condition 1)
  ECHO_THRESHOLD_ENT: 20, // Entropy < 20 (Echo Chamber Condition 2)
  VENUS_THRESHOLD_VEL: 20, // Velocity < 20 (Venus Condition 1 - Slow)
  VENUS_THRESHOLD_PERM: 80, // Permeability > 80 (Venus Condition 2 - Open)

  // --- MODIFIERS (Laws) ---
  // High Laws (90+)
  ADRENALINE_PERM: -10, // Combat reduces openness (Armor)
  ADRENALINE_RES: -5, // Combat reduces feeling (Numb)
  FOG_RES: -5, // Panic reduces feeling (Numb)
  FOG_VEL: 10, // Panic increases speed (Manic)
  GLASS_ENT_MULT: 2, // Double Incoming Entropy (Sensitivity)
  OBSESSION_ENT: -10, // Love reduces chaos (Focus)
  OBSESSION_PERM: -5, // Love reduces openness (Tunnel Vision)

  // Low Laws (<10)
  DEEP_BREATH_RES: 10, // Stillness increases feeling
  DEEP_BREATH_ENT: -5, // Stillness reduces chaos
  CRYSTAL_PERM: -10, // Rigidity reduces openness
  CRYSTAL_VEL: -5, // Rigidity reduces speed
  BUNKER_RES_MULT: 0.5, // Iron Bunker reduces Incoming Resonance (Resistance)
  APATHY_VEL: -10, // Depression reduces speed (Stagnation)
  APATHY_ENT: 5, // Depression increases chaos (Rot)

  GRAVITY_STRENGTH: 0.1, // 10% drift towards baseline
  GRAVITY_BASELINE: 50, // Universal baseline

  // --- INPUT SCALARS (Reflex) ---
  REFLEX_VIOLENCE_VELOCITY: 20,
  REFLEX_INTIMACY_PERMEABILITY: 20,
  REFLEX_INTIMACY_RESONANCE: 10,
  REFLEX_FEAR_ENTROPY: 20,
};
