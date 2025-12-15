/**
 * THE PROMETHEUS PHYSICS CONFIGURATION
 * Centralized constants for simulation balance and narrative physics laws.
 */
export const PHYSICS_CONFIG = {
  // --- Thresholds (The Triggers) ---
  ADRENALINE_VELOCITY_THRESHOLD: 80,
  ADRENALINE_PERMEABILITY_MIN: 30,
  FOG_ENTROPY_THRESHOLD: 80,
  CALM_VELOCITY_THRESHOLD: 20,
  PANIC_ENTROPY_THRESHOLD: 90,
  ECHO_RESONANCE_THRESHOLD: 90,
  ECHO_ENTROPY_MAX: 20,
  GLASS_PERMEABILITY_THRESHOLD: 80,

  // --- Impacts (The Consequences) ---
  ADRENALINE_PENALTY: 20,
  FOG_RESONANCE_DAMPENING: 10,
  CALM_ENTROPY_REDUCTION: 10,
  PANIC_VELOCITY_BOOST: 20,

  // --- Vibe Blender Coefficients (For AI Tuning) ---
  TEMP_BASE: 0.5,
  TEMP_ENTROPY_WEIGHT_FRACTAL: 0.7,
  TEMP_ENTROPY_WEIGHT_AI: 0.3,
  PENALTY_BASE: 1.0,
  TOP_P_BASE: 1.0,

  // --- Prometheus Engine Config ---
  PROMETHEUS: {
    UPDATE_MODULO: 4,
    UPDATE_OFFSET: 4,
    TARGET_CYCLE: ["ai_character", "user_character", "fractal"],
  },
};
