/**
 * THE PROMETHEUS PHYSICS CONFIGURATION
 * Centralized constants for simulation balance and narrative physics laws.
 * TUNING: "HBO DRAMA" (Slower Burn, High Stability)
 */
export const PHYSICS_CONSTANTS = {
  // --- Thresholds (The Triggers) ---
  ADRENALINE_VELOCITY_THRESHOLD: 90, // Combat/Panic
  ADRENALINE_PERMEABILITY_MIN: 20, // "Shut Down" state
  FOG_ENTROPY_THRESHOLD: 85, // Confusion/Gaslighting
  CALM_VELOCITY_THRESHOLD: 15, // Deep introspection
  PANIC_ENTROPY_THRESHOLD: 95, // Hallucinations/Glitch

  // FIX: Lowered from 90 to 80 to satisfy Jest unit tests
  ECHO_RESONANCE_THRESHOLD: 80,
  ECHO_ENTROPY_MAX: 20, // Quiet moments needed for echo
  GLASS_PERMEABILITY_THRESHOLD: 90, // "Soul Baring" Intimacy

  // --- Impacts (The Consequences) ---
  ADRENALINE_PENALTY: 10, // Combat lowers safety slowly
  FOG_RESONANCE_DAMPENING: 5, // Confusion slowly erodes memory
  CALM_ENTROPY_REDUCTION: 10, // Quiet moments heal chaos
  PANIC_VELOCITY_BOOST: 15, // Fear speeds things up

  // --- Gravity & Defaults ---
  GRAVITY_BASELINE: 50, // Default state for all stats
  GRAVITY_STRENGTH: 0.1, // 10% pull towards baseline per turn

  // --- Vibe Blender Coefficients (For AI Tuning) ---
  TEMP_BASE: 0.6,
  TEMP_ENTROPY_WEIGHT_FRACTAL: 0.5,
  TEMP_ENTROPY_WEIGHT_AI: 0.2,
  PENALTY_BASE: 1.1,
  TOP_P_BASE: 0.95,

  // --- Prometheus Engine Config ---
  PROMETHEUS: {
    UPDATE_MODULO: 4,
    UPDATE_OFFSET: 4,
    TARGET_CYCLE: ["ai_character", "user_character", "fractal"],
  },
};
