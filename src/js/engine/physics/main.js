import { PHYSICS_CONSTANTS } from "./config.js";
import { log, clamp } from "../../core/utils.js";

/**
 * THE PROMETHEUS PHYSICS ENGINE (V5.0)
 * Calculates the "Thermodynamics" of the narrative.
 */
export const calculateDynamics = (currentDynamics, baseline = {}) => {
  const d = {
    entropy: 10,
    permeability: 50,
    velocity: 10,
    resonance: 10,
    ...currentDynamics,
  };

  const flags = {
    echoChamber: false,
    glassCannon: false,
    panicSpiral: false,
    fogOfWar: false,
    gravityPull: false,
  };

  // --- LAW 1: THE ADRENALINE SHIELD ---
  if (d.velocity > PHYSICS_CONSTANTS.ADRENALINE_THRESHOLD) {
    const penalty = PHYSICS_CONSTANTS.ADRENALINE_PENALTY;
    if (d.permeability > PHYSICS_CONSTANTS.ADRENALINE_MIN_PERM) {
      d.permeability = clamp(d.permeability - penalty);
      log(`[PHYSICS] Adrenaline Shield: Permeability -${penalty}`);
    }
  }

  // --- LAW 2: THE FOG OF WAR ---
  if (d.entropy > PHYSICS_CONSTANTS.FOG_THRESHOLD) {
    d.resonance = clamp(d.resonance - PHYSICS_CONSTANTS.FOG_DAMPENING);
    flags.fogOfWar = true;
    log("[PHYSICS] Fog of War: Resonance dampened.");
  }

  // --- LAW 3: THE COOL-DOWN ---
  if (d.velocity < PHYSICS_CONSTANTS.COOLDOWN_THRESHOLD) {
    d.entropy = clamp(d.entropy - PHYSICS_CONSTANTS.COOLDOWN_REDUCTION);
    log("[PHYSICS] Cool-Down: Entropy reduced.");
  }

  // --- LAW 4: THE PANIC SPIRAL ---
  if (d.entropy > PHYSICS_CONSTANTS.PANIC_THRESHOLD) {
    d.velocity = clamp(d.velocity + PHYSICS_CONSTANTS.PANIC_BOOST);
    flags.panicSpiral = true;
    log("[PHYSICS] Panic Spiral: Velocity forced up.");
  }

  // --- LAW 5: THE ECHO CHAMBER ---
  if (
    d.resonance > PHYSICS_CONSTANTS.ECHO_THRESHOLD_RES &&
    d.entropy < PHYSICS_CONSTANTS.ECHO_THRESHOLD_ENT
  ) {
    flags.echoChamber = true;
  }

  // --- LAW 6: THE GLASS CANNON ---
  if (d.permeability > PHYSICS_CONSTANTS.GLASS_THRESHOLD) {
    flags.glassCannon = true;
  }

  // --- LAW 7: RELATIVE GRAVITY ---
  const keys = ["entropy", "velocity", "permeability", "resonance"];
  const GRAVITY_FACTOR = PHYSICS_CONSTANTS.GRAVITY_STRENGTH;

  keys.forEach((key) => {
    // If entity has a custom baseline (e.g. Orions Velocity: 70), use it. Else default (50).
    const target =
      typeof baseline[key] === "number"
        ? baseline[key]
        : PHYSICS_CONSTANTS.GRAVITY_BASELINE;

    const current = d[key];
    const diff = target - current;

    // Apply gravity
    if (Math.abs(diff) > 1) {
      d[key] += diff * GRAVITY_FACTOR;
      flags.gravityPull = true;
    }
  });

  return {
    entropy: clamp(Math.round(d.entropy)),
    permeability: clamp(Math.round(d.permeability)),
    velocity: clamp(Math.round(d.velocity)),
    resonance: clamp(Math.round(d.resonance)),
    _flags: flags,
  };
};

export const parseLlmResponse = (text) => {
  const result = {
    updates: {},
    explanations: {},
    error: null,
  };

  try {
    const hudMatch = text.match(/\[STATUS_HUD\]([\s\S]*?)\[\/STATUS_HUD\]/);
    if (hudMatch) {
      hudMatch[1].split("\n").forEach((line) => {
        const match = line.match(/^\s*(\w+):\s*\d+\s*(\(.*?\))/);
        if (match) result.explanations[match[1].toLowerCase()] = match[2];
      });
    }

    const cleanJson = text
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/\[STATUS_HUD\][\s\S]*?\[\/STATUS_HUD\]/g, "")
      .replace(/\s+\/\/.*$/gm, "")
      .trim();

    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) result.updates = JSON.parse(jsonMatch[0]);
    else result.error = "No JSON block found";
  } catch (e) {
    result.error = e.message;
  }

  return result;
};
