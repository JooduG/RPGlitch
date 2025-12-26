// apps/rpglitch/js/engine-physics.js
import { PHYSICS_CONFIG } from "./config.js";
import { log } from "../../core/utils.js";

/**
 * THE PROMETHEUS PHYSICS ENGINE (V4.2)
 * Calculates the "Thermodynamics" of the narrative.
 * * @param {Object} currentDynamics - { entropy, permeability, velocity, resonance }
 * @returns {Object} - The mutated dynamics and narrative flags
 */
export function calculateDynamics(currentDynamics) {
  // 1. Clone & Sanitize
  // Default to neutral (10/50/10/10) if missing
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
  // IF Velocity > 80 (Rushing/Combat), THEN Permeability MUST decrease (Defenses Up).
  // "You can't be vulnerable while dodging bullets."
  if (d.velocity > PHYSICS_CONFIG.ADRENALINE_VELOCITY_THRESHOLD) {
    const penalty = PHYSICS_CONFIG.ADRENALINE_PENALTY;
    if (d.permeability > PHYSICS_CONFIG.ADRENALINE_PERMEABILITY_MIN) {
      d.permeability = clamp(d.permeability - penalty);
      log(`[PHYSICS] Adrenaline Shield: Permeability -${penalty}`);
    }
  }

  // --- LAW 2: THE FOG OF WAR ---
  // IF Entropy > 80 (Chaos), THEN Resonance MUST decrease (Noise kills Signal).
  // "Meaning is lost in the noise."
  if (d.entropy > PHYSICS_CONFIG.FOG_ENTROPY_THRESHOLD) {
    d.resonance = clamp(d.resonance - PHYSICS_CONFIG.FOG_RESONANCE_DAMPENING);
    flags.fogOfWar = true;
    log("[PHYSICS] Fog of War: Resonance dampened.");
  }

  // --- LAW 3: THE COOL-DOWN ---
  // IF Velocity < 20 (Calm), THEN Entropy decreases (Stillness restores order).
  if (d.velocity < PHYSICS_CONFIG.CALM_VELOCITY_THRESHOLD) {
    d.entropy = clamp(d.entropy - PHYSICS_CONFIG.CALM_ENTROPY_REDUCTION);
    log("[PHYSICS] Cool-Down: Entropy reduced.");
  }

  // --- LAW 4: THE PANIC SPIRAL (New) ---
  // IF Entropy > 90 (Total Chaos) → FORCE Velocity +20.
  // "Chaos creates panic. Panic creates speed."
  if (d.entropy > PHYSICS_CONFIG.PANIC_ENTROPY_THRESHOLD) {
    d.velocity = clamp(d.velocity + PHYSICS_CONFIG.PANIC_VELOCITY_BOOST);
    flags.panicSpiral = true;
    log("[PHYSICS] Panic Spiral: Velocity forced up.");
  }

  // --- LAW 5: THE ECHO CHAMBER (Logic Only) ---
  // IF Resonance > 90 (Impact) AND Entropy < 20 (Quiet) → Trigger Life Change.
  if (
    d.resonance > PHYSICS_CONFIG.ECHO_RESONANCE_THRESHOLD &&
    d.entropy < PHYSICS_CONFIG.ECHO_ENTROPY_MAX
  ) {
    flags.echoChamber = true;
  }

  // --- LAW 6: THE GLASS CANNON (Logic Only) ---
  // IF Permeability > 80 (Open Heart) → Double Resonance Gains.
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
}

// V5: Extracted Parsing Logic for Unit Testing
export function parseLlmResponse(text) {
  const result = {
    updates: {},
    explanations: {},
    error: null,
  };

  try {
    // 1. Extract Explanations from HUD before cleaning
    const hudMatch = text.match(/\[STATUS_HUD\]([\s\S]*?)\[\/STATUS_HUD\]/);
    if (hudMatch) {
      const hudContent = hudMatch[1];
      const lines = hudContent.split("\n");
      lines.forEach((line) => {
        // Match "Entropy: 85 (Because reasons...)"
        // Cap groups: 1=Key, 2=Explanation
        const match = line.match(/^\s*(\w+):\s*\d+\s*(\(.*?\))/);
        if (match) {
          const key = match[1].toLowerCase();
          result.explanations[key] = match[2];
        }
      });
    }

    // 2. Clean Text (Think, HUD, Comments)
    let cleanJson = text
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/\[STATUS_HUD\][\s\S]*?\[\/STATUS_HUD\]/g, "")
      .replace(/\s+\/\/.*$/gm, "") // FIX: Remove // comments (EOL or Inline)
      .trim();

    // 3. Extract JSON
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      result.updates = JSON.parse(jsonMatch[0]);
    } else {
      result.error = "No JSON block found";
    }
  } catch (e) {
    result.error = e.message;
  }

  return result;
}
