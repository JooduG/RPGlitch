import { PHYSICS_CONSTANTS } from "./config.js";
import { log, clamp } from "../../core/utils.js";

/**
 * THE PROMETHEUS PHYSICS ENGINE (V5.0)
 * Calculates the "Thermodynamics" of the narrative.
 */
export const calculateDynamics = (currentDynamics, baseline = {}) => {
  let d = { ...currentDynamics };
  const flags = {
    echoChamber: false,
    glassCannon: false,
    ironBunker: false, // New
    theVenus: false, // New
    gravityPull: false,
    // Add dynamic law flags
    adrenalineShield: false,
    deepBreath: false, // New
    fogOfWar: false,
    crystallization: false, // New
    obsession: false, // New
    apathy: false, // New
  };

  const applyChange = (stat, amount) => {
    d[stat] += amount;
  };

  // --- 1. CORE LAWS LOOP (High/Low) ---

  // VELOCITY
  if (d.velocity > PHYSICS_CONSTANTS.LAW_HIGH) {
    flags.adrenalineShield = true;
    applyChange("permeability", PHYSICS_CONSTANTS.ADRENALINE_PERM);
    applyChange("resonance", PHYSICS_CONSTANTS.ADRENALINE_RES);
    log(
      `[PHYSICS] Adrenaline: Perm ${PHYSICS_CONSTANTS.ADRENALINE_PERM}, Res ${PHYSICS_CONSTANTS.ADRENALINE_RES}`,
    );
  } else if (d.velocity < PHYSICS_CONSTANTS.LAW_LOW) {
    flags.deepBreath = true;
    applyChange("resonance", PHYSICS_CONSTANTS.DEEP_BREATH_RES);
    applyChange("entropy", PHYSICS_CONSTANTS.DEEP_BREATH_ENT);
    log(
      `[PHYSICS] Deep Breath: Res +${PHYSICS_CONSTANTS.DEEP_BREATH_RES}, Ent ${PHYSICS_CONSTANTS.DEEP_BREATH_ENT}`,
    );
  }

  // ENTROPY
  if (d.entropy > PHYSICS_CONSTANTS.LAW_HIGH) {
    flags.fogOfWar = true;
    applyChange("resonance", PHYSICS_CONSTANTS.FOG_RES);
    applyChange("velocity", PHYSICS_CONSTANTS.FOG_VEL);
    log(
      `[PHYSICS] Fog of War: Res ${PHYSICS_CONSTANTS.FOG_RES}, Vel +${PHYSICS_CONSTANTS.FOG_VEL}`,
    );
  } else if (d.entropy < PHYSICS_CONSTANTS.LAW_LOW) {
    flags.crystallization = true;
    applyChange("permeability", PHYSICS_CONSTANTS.CRYSTAL_PERM);
    applyChange("velocity", PHYSICS_CONSTANTS.CRYSTAL_VEL);
    log(
      `[PHYSICS] Crystallization: Perm ${PHYSICS_CONSTANTS.CRYSTAL_PERM}, Vel ${PHYSICS_CONSTANTS.CRYSTAL_VEL}`,
    );
  }

  // PERMEABILITY
  if (d.permeability > PHYSICS_CONSTANTS.LAW_HIGH) {
    flags.glassCannon = true; // Logged for Director
  } else if (d.permeability < PHYSICS_CONSTANTS.LAW_LOW) {
    flags.ironBunker = true; // Logged for Director
  }

  // RESONANCE
  if (d.resonance > PHYSICS_CONSTANTS.LAW_HIGH) {
    flags.obsession = true;
    applyChange("entropy", PHYSICS_CONSTANTS.OBSESSION_ENT);
    applyChange("permeability", PHYSICS_CONSTANTS.OBSESSION_PERM);
    log(
      `[PHYSICS] Obsession: Ent ${PHYSICS_CONSTANTS.OBSESSION_ENT}, Perm ${PHYSICS_CONSTANTS.OBSESSION_PERM}`,
    );
  } else if (d.resonance < PHYSICS_CONSTANTS.LAW_LOW) {
    flags.apathy = true;
    applyChange("velocity", PHYSICS_CONSTANTS.APATHY_VEL);
    applyChange("entropy", PHYSICS_CONSTANTS.APATHY_ENT);
    log(
      `[PHYSICS] Apathy: Vel ${PHYSICS_CONSTANTS.APATHY_VEL}, Ent +${PHYSICS_CONSTANTS.APATHY_ENT}`,
    );
  }

  // --- 2. SPECIAL CASES ---

  // THE ECHO CHAMBER
  if (
    d.resonance > PHYSICS_CONSTANTS.ECHO_THRESHOLD_RES &&
    d.entropy < PHYSICS_CONSTANTS.ECHO_THRESHOLD_ENT
  ) {
    flags.echoChamber = true;
  }

  // THE VENUS
  if (
    d.velocity < PHYSICS_CONSTANTS.VENUS_THRESHOLD_VEL &&
    d.permeability > PHYSICS_CONSTANTS.VENUS_THRESHOLD_PERM
  ) {
    flags.theVenus = true;
  }

  // --- 3. GRAVITY ---
  const keys = ["entropy", "velocity", "permeability", "resonance"];
  const GRAVITY_FACTOR = PHYSICS_CONSTANTS.GRAVITY_STRENGTH;

  keys.forEach((key) => {
    const target =
      typeof baseline[key] === "number"
        ? baseline[key]
        : PHYSICS_CONSTANTS.GRAVITY_BASELINE;

    const current = d[key];
    const diff = target - current;

    if (Math.abs(diff) > 0) {
      let change = diff * GRAVITY_FACTOR;
      // Ensure minimum tick of 1.0
      if (Math.abs(change) < 1.0) {
        change = Math.sign(diff) * 1.0;
      }
      d[key] += change;
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
