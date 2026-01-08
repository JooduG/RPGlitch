/**
 * src/js/engine/physics/config.js
 * The Single Source of Truth for Prometheus Physics.
 */

export const PHYSICS_CONSTANTS = {
  // --- THE HEARTBEAT ---
  HEARTBEAT_RATE: 3,

  // --- THRESHOLDS ---
  ADRENALINE_THRESHOLD: 90, // Velocity > 90 triggers Adrenaline Shield
  FOG_THRESHOLD: 85, // Entropy > 85 triggers Fog of War
  PANIC_THRESHOLD: 95, // Entropy > 95 triggers Panic Spiral
  COOLDOWN_THRESHOLD: 15, // Velocity < 15 triggers Cool-Down
  ECHO_THRESHOLD_RES: 80, // Resonance > 80 (Echo Chamber condition 1)
  ECHO_THRESHOLD_ENT: 20, // Entropy < 20 (Echo Chamber condition 2)
  GLASS_THRESHOLD: 90, // Permeability > 90 (Glass Cannon)

  // --- MODIFIERS ---
  ADRENALINE_PENALTY: 10, // Permeability reduction
  ADRENALINE_MIN_PERM: 10, // Don't reduce if below this
  FOG_DAMPENING: 5, // Resonance reduction
  PANIC_BOOST: 15, // Velocity increase
  COOLDOWN_REDUCTION: 10, // Entropy reduction
  GRAVITY_STRENGTH: 0.1, // 10% drift towards baseline per pulse
  GRAVITY_BASELINE: 50, // Universal baseline

  // --- INPUT SCALARS (Reflex) ---
  REFLEX_VIOLENCE_VELOCITY: 20,
  REFLEX_INTIMACY_PERMEABILITY: 20,
  REFLEX_FEAR_ENTROPY: 20,
};
