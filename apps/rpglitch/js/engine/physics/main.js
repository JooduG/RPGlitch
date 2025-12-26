// apps/rpglitch/js/engine-physics.js
import { PHYSICS_CONFIG } from "./config.js";
import { log } from "../../core/utils.js";

/**
 * THE PROMETHEUS PHYSICS ENGINE (V4.2)
 * Calculates the "Thermodynamics" of the narrative.
 */
export const calculateDynamics = (currentDynamics) => {
  const d = {
    entropy: 10,
    permeability: 50,
    velocity: 10,
    resonance: 10,
    ...currentDynamics,
  };

  const clamp = (n) => Math.min(100, Math.max(0, Math.round(n)));
  const flags = {
    echoChamber: false,
    glassCannon: false,
    panicSpiral: false,
    fogOfWar: false,
  };

  // --- LAW 1: THE ADRENALINE SHIELD ---
  if (d.velocity > PHYSICS_CONFIG.ADRENALINE_VELOCITY_THRESHOLD) {
    const penalty = PHYSICS_CONFIG.ADRENALINE_PENALTY;
    if (d.permeability > PHYSICS_CONFIG.ADRENALINE_PERMEABILITY_MIN) {
      d.permeability = clamp(d.permeability - penalty);
      log(`[PHYSICS] Adrenaline Shield: Permeability -${penalty}`);
    }
  }

  // --- LAW 2: THE FOG OF WAR ---
  if (d.entropy > PHYSICS_CONFIG.FOG_ENTROPY_THRESHOLD) {
    d.resonance = clamp(d.resonance - PHYSICS_CONFIG.FOG_RESONANCE_DAMPENING);
    flags.fogOfWar = true;
    log("[PHYSICS] Fog of War: Resonance dampened.");
  }

  // --- LAW 3: THE COOL-DOWN ---
  if (d.velocity < PHYSICS_CONFIG.CALM_VELOCITY_THRESHOLD) {
    d.entropy = clamp(d.entropy - PHYSICS_CONFIG.CALM_ENTROPY_REDUCTION);
    log("[PHYSICS] Cool-Down: Entropy reduced.");
  }

  // --- LAW 4: THE PANIC SPIRAL ---
  if (d.entropy > PHYSICS_CONFIG.PANIC_ENTROPY_THRESHOLD) {
    d.velocity = clamp(d.velocity + PHYSICS_CONFIG.PANIC_VELOCITY_BOOST);
    flags.panicSpiral = true;
    log("[PHYSICS] Panic Spiral: Velocity forced up.");
  }

  // --- LAW 5: THE ECHO CHAMBER ---
  if (
    d.resonance > PHYSICS_CONFIG.ECHO_RESONANCE_THRESHOLD &&
    d.entropy < PHYSICS_CONFIG.ECHO_ENTROPY_MAX
  ) {
    flags.echoChamber = true;
  }

  // --- LAW 6: THE GLASS CANNON ---
  if (d.permeability > PHYSICS_CONFIG.GLASS_PERMEABILITY_THRESHOLD) {
    flags.glassCannon = true;
  }

  return {
    entropy: clamp(d.entropy),
    permeability: clamp(d.permeability),
    velocity: clamp(d.velocity),
    resonance: clamp(d.resonance),
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
