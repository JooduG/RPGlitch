/**
 * src/js/warden/physics.js
 * WARDEN PHYSICS ENGINE (Thermodynamics & Reflexes)
 * Handles the simulation of narrative breakdown, entropy, and reflexes.
 */

import { CONFIG } from "../gamemaster/config.js";
const clamp = (n, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number(n) || 0));

const { PHYSICS: PHYSICS_CONSTANTS } = CONFIG;

// ============================================================================
// 1. REFLEX REGISTRY (Zero-Latency Triggers)
// ============================================================================

const REFLEX_REGISTRY = [
  {
    id: "KINETIC",
    regex:
      /kill(ed|ing)?|shoot|shot|stabb?(ed|ing)?|punch(ed|ing)?|hit|fought|fight(ing)?|attack(ed|ing)?|gunn?(ed|ing)?|weapon|blood|hurt|destroy(ed|ing)?|br(eak|oke)n?|smash(ed|ing)?|burn(t|ed|ing)?|explosion|die(d|ing)?|fast|speed|impact|crash(ed|ing)?|loud|bang|boom|slam(med|ming)?|athletics?|run(ning)?|jump(ed|ing)?/i,
    deltas: () => ({ velocity: PHYSICS_CONSTANTS.REFLEX_VIOLENCE_VELOCITY }),
  },
  {
    id: "VULNERABLE",
    regex:
      /kiss(ed|ing)?|lov(e|ed|ing)|h(e|o)ld(ing)?|hugg?(ed|ing)?|touch(ed|ing)?|gentle|soft|warm|caress(ed|ing)?|cheek|hand|finger|whisper(ed|ing)?|close|safe|trust(ed|ing)?|heart|blush(ed|ing)?|honesty?|truth|tear|cry(ing)?|sad|lonely|ache|naked|bare|skin/i,
    deltas: () => ({
      permeability: PHYSICS_CONSTANTS.REFLEX_INTIMACY_PERMEABILITY,
      resonance: PHYSICS_CONSTANTS.REFLEX_INTIMACY_RESONANCE,
    }),
  },
  {
    id: "UNSTABLE",
    regex:
      /scream(ed|ing)?|r(un|an)(ning)?|hid(e|den|ing)?|fear(ed|ing)?|scar(ed|ing)?|dark|shadow|weird|glitch(ed|ing)?|wrong|monster|ghost|dead|rot(ted|ting)?|decay(ed|ing)?|cold|shiver(ed|ing)?|nightmare|static|noise|distortion|fracture(d|ing)?|chaos|erratic|flicker(ed|ing)?/i,
    deltas: () => ({ entropy: PHYSICS_CONSTANTS.REFLEX_FEAR_ENTROPY }),
  },
  {
    id: "HARMONIC",
    regex:
      /underst(ood|and)(ing)?|connect(ed|ing)?|sync(hroniz)?(ed|ing)?|resonance|empathy|harmony|together|shared|mind|soul|link(ed|ing)?|bond(ed|ing)?|mirror(ed|ing)?|echo(ed|ing)?|melody|music|rhythm|vibe|frequency|pulse/i,
    deltas: () => ({ resonance: PHYSICS_CONSTANTS.REFLEX_SYNCHRONY_RESONANCE }),
  },
  {
    id: "STASIS",
    regex:
      /br(eathe|eath)(d|ing)?|wait(ed|ing)?|pause(d|ing)?|stop(ped|ping)?|still|silence|quiet|calm(ed|ing)?|rest(ed|ing)?|sleep|slow(ed|ing)?|wait/i,
    deltas: () => ({ velocity: PHYSICS_CONSTANTS.REFLEX_STASIS_VELOCITY }),
  },
  {
    id: "SHIELDED",
    regex:
      /armor(ed)?|shield(ed|ing)?|wall|mask(ed|ing)?|guard(ed|ing)?|protect(ed|ing)?|block(ed|ing)?|shell|barrier|hide|hid(den)?/i,
    deltas: () => ({
      permeability: PHYSICS_CONSTANTS.REFLEX_SHIELDED_PERMEABILITY,
    }),
  },
  {
    id: "ORDERED",
    regex:
      /logic(al)?|math(ematics)?|calculat(e|ed|ing)|precise|clean(ed|ing)?|pure|order(ed|ing)?|structur(e|ed|ing)|fact|prove(n|d)?|proof/i,
    deltas: () => ({ entropy: PHYSICS_CONSTANTS.REFLEX_ORDERED_ENTROPY }),
  },
  {
    id: "DETACHED",
    regex:
      /data|clinical|observ(e|ed|ing)|watch(ed|ing)?|analy[sz](e|ed|ing)|study(ing)?|scan(ned|ning)?|test(ed|ing)?|monitor(ed|ing)?|variable/i,
    deltas: () => ({ resonance: PHYSICS_CONSTANTS.REFLEX_DETACHED_RESONANCE }),
  },
];

export const scanReflex = (text) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const entry of REFLEX_REGISTRY) {
    if (entry.regex.test(lower)) {
      return { type: entry.id, deltas: entry.deltas() };
    }
  }
  return null;
};

// ============================================================================
// 2. THERMODYNAMICS (Core Simulation)
// ============================================================================

/**
 * Calculates the physics state based on current dynamics, applying Laws and Gravity.
 * @param {Object} currentDynamics
 * @param {Object} baseline
 * @returns {Object} { entropy, velocity, permeability, resonance, _flags }
 */
export const applyLaws = (currentDynamics, baseline = {}) => {
  let d = { ...currentDynamics };
  const flags = {
    adrenalineShield: false,
    deepBreath: false, // Low Velocity
    fogOfWar: false, // High Entropy
    crystallization: false, // Low Entropy
    glassCannon: false, // High Permeability
    ironBunker: false, // Low Permeability
    obsession: false, // High Resonance
    apathy: false, // Low Resonance
    echoChamber: false,
    theVenus: false,
    gravityPull: false,
  };

  const applyChange = (stat, amount) => {
    d[stat] = (d[stat] || 0) + amount;
  };

  // --- CORE LAWS LOOP ---

  // VELOCITY
  if (d.velocity > PHYSICS_CONSTANTS.LAW_HIGH) {
    flags.adrenalineShield = true;
    applyChange("permeability", PHYSICS_CONSTANTS.ADRENALINE_PERM);
    applyChange("resonance", PHYSICS_CONSTANTS.ADRENALINE_RES);
  } else if (d.velocity < PHYSICS_CONSTANTS.LAW_LOW) {
    flags.deepBreath = true;
    applyChange("resonance", PHYSICS_CONSTANTS.DEEP_BREATH_RES);
    applyChange("entropy", PHYSICS_CONSTANTS.DEEP_BREATH_ENT);
  }

  // ENTROPY
  if (d.entropy > PHYSICS_CONSTANTS.LAW_HIGH) {
    flags.fogOfWar = true;
    applyChange("resonance", PHYSICS_CONSTANTS.FOG_RES);
    applyChange("velocity", PHYSICS_CONSTANTS.FOG_VEL);
  } else if (d.entropy < PHYSICS_CONSTANTS.LAW_LOW) {
    flags.crystallization = true;
    applyChange("permeability", PHYSICS_CONSTANTS.CRYSTAL_PERM);
    applyChange("velocity", PHYSICS_CONSTANTS.CRYSTAL_VEL);
  }

  // PERMEABILITY
  if (d.permeability > PHYSICS_CONSTANTS.LAW_HIGH) {
    flags.glassCannon = true;
  } else if (d.permeability < PHYSICS_CONSTANTS.LAW_LOW) {
    flags.ironBunker = true;
  }

  // RESONANCE
  if (d.resonance > PHYSICS_CONSTANTS.LAW_HIGH) {
    flags.obsession = true;
    applyChange("entropy", PHYSICS_CONSTANTS.OBSESSION_ENT);
    applyChange("permeability", PHYSICS_CONSTANTS.OBSESSION_PERM);
  } else if (d.resonance < PHYSICS_CONSTANTS.LAW_LOW) {
    flags.apathy = true;
    applyChange("velocity", PHYSICS_CONSTANTS.APATHY_VEL);
    applyChange("entropy", PHYSICS_CONSTANTS.APATHY_ENT);
  }

  // --- SPECIAL CASES ---

  if (
    d.resonance > PHYSICS_CONSTANTS.ECHO_THRESHOLD_RES &&
    d.entropy < PHYSICS_CONSTANTS.ECHO_THRESHOLD_ENT
  ) {
    flags.echoChamber = true;
  }

  if (
    d.velocity < PHYSICS_CONSTANTS.VENUS_THRESHOLD_VEL &&
    d.permeability > PHYSICS_CONSTANTS.VENUS_THRESHOLD_PERM
  ) {
    flags.theVenus = true;
  }

  // --- GRAVITY ---
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
      if (Math.abs(change) < 1.0) change = Math.sign(diff) * 1.0;
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

/**
 * Calculates blended generation parameters based on Entity Thermodynamics.
 * @param {Object} ai - AI Entity
 * @param {Object} user - User Entity
 * @param {Object} fractal - Fractal Entity
 * @returns {Object} { temperature, repetition_penalty, top_p, visual: { guidanceScale } }
 */
export const calculateBlendedParams = (ai, user, fractal) => {
  const defaults = { entropy: 10, velocity: 10, resonance: 10, permanence: 10 };
  const getDyn = (entity) => ({ ...defaults, ...entity?.dynamics });

  const aiDyn = getDyn(ai);
  const userDyn = getDyn(user);
  const fractalDyn = getDyn(fractal);

  // 1. Temperature (Chaos)
  // Fractal Entropy dominates the "Atmosphere"
  const rawTemp =
    fractalDyn.entropy * PHYSICS_CONSTANTS.TEMP_ENTROPY_WEIGHT_FRACTAL +
    aiDyn.entropy * PHYSICS_CONSTANTS.TEMP_ENTROPY_WEIGHT_AI;

  const mapRange = (value, inMin, inMax, outMin, outMax) => {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  };

  // Piecewise Mapping:
  // Entropy 0-50  -> Temp 0.3 - 0.7
  // Entropy 50-100 -> Temp 0.7 - 1.0
  let temperature;
  if (rawTemp <= 50) {
    temperature = mapRange(rawTemp, 0, 50, 0.3, PHYSICS_CONSTANTS.TEMP_BASE);
  } else {
    temperature = mapRange(rawTemp, 50, 100, PHYSICS_CONSTANTS.TEMP_BASE, 1.0);
  }

  // 2. Repetition Penalty (Pacing)
  // Highest Velocity sets the "Speed" of the conversation
  const rawRep = Math.max(
    aiDyn.velocity,
    userDyn.velocity,
    fractalDyn.velocity,
  );
  const repetition_penalty = mapRange(
    rawRep,
    0,
    100,
    PHYSICS_CONSTANTS.PENALTY_BASE,
    1.18,
  );

  // 3. Top_P (Focus)
  // AI Resonance determines how "Locked In" the response is
  const top_p = mapRange(
    aiDyn.resonance,
    0,
    100,
    PHYSICS_CONSTANTS.TOP_P_BASE,
    0.65,
  );

  // 4. Guidance Scale (Visual Stability)
  // Inverse relationship: High Entropy = Low Guidance (Hallucination)
  const guidance_scale = mapRange(
    aiDyn.entropy,
    0,
    100,
    PHYSICS_CONSTANTS.GUIDANCE_MAX,
    PHYSICS_CONSTANTS.GUIDANCE_MIN,
  );

  return {
    temperature: parseFloat(temperature.toFixed(2)),
    repetition_penalty: parseFloat(repetition_penalty.toFixed(2)),
    top_p: parseFloat(top_p.toFixed(2)),
    visual: {
      guidanceScale: Math.round(guidance_scale),
    },
  };
};
