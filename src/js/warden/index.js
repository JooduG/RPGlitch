/**
 * src/js/warden/index.js
 * THE WARDEN (Global Overseer)
 *
 * This is the unified interface for the "Warden" domain.
 * It delegates responsibilities to specialized sub-modules:
 * - Security: Sanitization & Policy
 * - Physics: Simulation & Reflexes
 * - Variance: Creative Direction & Styles
 * - Parser: Prompt Engineering & Response Parsing
 */

import { entities } from "../scholar/repository.js";
import { log } from "../gamemaster/utils.js";

// Sub-Modules
import * as Security from "./security.js";
import * as Physics from "./physics.js";
import * as Variance from "./variance.js";
import * as Parser from "./parser.js";

import { CONFIG } from "../gamemaster/config.js";
const { PHYSICS: PHYSICS_CONSTANTS } = CONFIG;

export const Warden = {
  // =========================================================================
  // 1. SECURITY & HYGIENE (The Shield)
  // =========================================================================

  scan: (text) => Physics.scanReflex(text),
  clean: (text) => Security.cleanLlmOutput(text),
  checkRefusal: (text) => Security.checkRefusal(text),

  sanitize: (html) => Security.sanitizeHtml(html),
  escape: (str) => Security.escapeHtml(str),

  // =========================================================================
  // 2. PHYSICS ORCHESTRATION (The Engine)
  // =========================================================================

  /**
   * Pure Physics Calculation (Delegate).
   */
  applyLaws: (dynamics, baseline) => Physics.applyLaws(dynamics, baseline),

  /**
   * Reconciles AI's absolute assessment with the Physics Ledger.
   * Calculates the delta, clamps it, applies laws, and clears ledger.
   * @Return {Object} { updates: Object, needsSave: boolean }
   */
  reconcile: (entity, aiDynamics) => {
    if (!aiDynamics) return { updates: {}, needsSave: false };

    const currentDynamics = entity.dynamics || {
      entropy: 50,
      velocity: 50,
      resonance: 50,
      permeability: 50,
    };
    const ledger = entity.customData?.reflex_ledger || {
      entropy: 0,
      velocity: 0,
      resonance: 0,
      permeability: 0,
    };
    const finalDynamics = { ...currentDynamics };
    const updates = { dynamics: {} };

    // 1. Calculate Net Change (AI Goal - What Reflex Did)
    Object.keys(currentDynamics).forEach((key) => {
      const aiDelta = parseInt(aiDynamics[key]) || 0;
      const reflexAlreadyApplied = ledger[key] || 0;
      const correction = aiDelta - reflexAlreadyApplied;
      let newVal = (currentDynamics[key] || 0) + correction;
      newVal = Math.max(0, Math.min(100, newVal));
      finalDynamics[key] = newVal;
    });

    // 2. Apply Laws (Feedback Loops)
    const processedDynamics = Physics.applyLaws(
      finalDynamics,
      entity.baseline || entity.dynamics || {},
    );

    updates.dynamics = {
      entropy: processedDynamics.entropy,
      velocity: processedDynamics.velocity,
      permeability: processedDynamics.permeability,
      resonance: processedDynamics.resonance,
    };

    if (processedDynamics._flags) {
      log(`[Warden] 🚩 Flags:`, processedDynamics._flags);
    }

    // 3. Return (Ledger Cleared)
    return {
      updates,
      ledger: { entropy: 0, velocity: 0, resonance: 0, permeability: 0 },
      needsSave: true,
    };
  },

  /**
   * Applies Reflex Deltas to an Entity, handling immediate effects.
   * @Return {Promise<Object>} The new dynamics state.
   */
  apply: async (entity, reflex) => {
    log(`[Warden] ⚡ Applying Reflex: ${reflex.type}`, reflex.deltas);
    const currentDynamics = entity.dynamics || {};
    const newDynamics = { ...currentDynamics };
    const ledger = entity.customData?.reflex_ledger || {
      velocity: 0,
      entropy: 0,
      resonance: 0,
      permeability: 0,
    };

    // 1. Apply Deltas with Special Modifier Logic (Glass Cannon etc.)
    // Note: We replicate the logic here because it applies to DELTAS, not States.
    Object.entries(reflex.deltas).forEach(([key, value]) => {
      let finalValue = value;

      if (
        key === "entropy" &&
        currentDynamics.permeability > PHYSICS_CONSTANTS.LAW_HIGH
      ) {
        finalValue *= PHYSICS_CONSTANTS.GLASS_ENT_MULT;
        log(`[PHYSICS] 💎 Glass Cannon: Entropy Doubled!`);
      }
      if (
        key === "resonance" &&
        currentDynamics.permeability < PHYSICS_CONSTANTS.LAW_LOW
      ) {
        finalValue *= PHYSICS_CONSTANTS.BUNKER_RES_MULT;
        log(`[PHYSICS] 🛡️ Iron Bunker: Resonance Resisted (0.5x)`);
      }
      if (
        key === "entropy" &&
        currentDynamics.resonance > PHYSICS_CONSTANTS.ECHO_THRESHOLD_RES &&
        currentDynamics.entropy < PHYSICS_CONSTANTS.ECHO_THRESHOLD_ENT
      ) {
        finalValue = 0;
        log(`[PHYSICS] 🕸️ Echo Chamber: Entropy Rejected (0x)`);
      }
      if (
        key === "resonance" &&
        currentDynamics.velocity < PHYSICS_CONSTANTS.VENUS_THRESHOLD_VEL &&
        currentDynamics.permeability > PHYSICS_CONSTANTS.VENUS_THRESHOLD_PERM
      ) {
        if (finalValue > 0) {
          finalValue *= 2;
          log(`[PHYSICS] 🌺 The Venus: Resonance Absorbed (2x)`);
        } else {
          finalValue = 0;
          log(`[PHYSICS] 🌺 The Venus: Resonance Loss Ignored`);
        }
      }

      newDynamics[key] = (newDynamics[key] || 0) + finalValue;
      ledger[key] = (ledger[key] || 0) + finalValue;
    });

    // 2. Persist Reflex
    await entities.upsert("character", {
      ...entity,
      dynamics: newDynamics,
      customData: { ...entity.customData, reflex_ledger: ledger },
    });

    // 3. Apply Laws (Check if Reflex triggered a Threshold)
    const lawsAppliedDynamics = Physics.applyLaws(
      newDynamics,
      entity.baseline || entity.dynamics || {},
    );

    // 4. Persist Final (if Laws changed it)
    if (JSON.stringify(lawsAppliedDynamics) !== JSON.stringify(newDynamics)) {
      log(`[Warden] ⚖️ Physics Laws Applied`);
      await entities.upsert("character", {
        ...entity,
        dynamics: lawsAppliedDynamics,
        customData: { ...entity.customData, reflex_ledger: ledger },
      });
      Object.assign(newDynamics, lawsAppliedDynamics);
    }
    return newDynamics;
  },

  // =========================================================================
  // 3. NARRATIVE DIRECTION (The Director)
  // =========================================================================

  /**
   * Generates instructions based on Physics Flags or Variance logic.
   */
  instruct: (context = {}) => {
    const { dynamics, rejectedText, userLastInput, mode } = context;

    // A. Reroll / Correction
    if (mode === "reroll" || rejectedText) {
      const noteKey = Variance.analyzeRejection(rejectedText, userLastInput);
      return Variance.getDirectorInstruction(noteKey);
    }

    // B. Physics Enforcement
    if (dynamics) {
      const physicsInstr = Warden.enforce(dynamics);
      if (physicsInstr) return physicsInstr;
    }

    // C. Random Injection
    if (mode === "random") {
      const noteKey = Variance.analyzeRejection(""); // Helper returns random
      return Variance.getDirectorInstruction(noteKey);
    }

    return "";
  },

  /**
   * Translates Physics State (Flags) into Narrative Instructions.
   */
  enforce: (dynamics) => {
    if (!dynamics || !dynamics._flags) return "";
    const f = dynamics._flags;
    const d = dynamics;
    const instructions = [];

    // Map Physics Flags -> Variance Director Notes
    if (f.adrenalineShield)
      instructions.push({
        code: "HIGH_VELOCITY",
        val: d.velocity,
        task: Variance.DIRECTOR_NOTES["High Velocity"],
      });
    if (f.deepBreath)
      instructions.push({
        code: "LOW_VELOCITY",
        val: d.velocity,
        task: Variance.DIRECTOR_NOTES["Low Velocity"],
      });

    if (f.fogOfWar)
      instructions.push({
        code: "HIGH_ENTROPY",
        val: d.entropy,
        task: Variance.DIRECTOR_NOTES["High Entropy"],
      });
    if (f.crystallization)
      instructions.push({
        code: "LOW_ENTROPY",
        val: d.entropy,
        task: Variance.DIRECTOR_NOTES["Low Entropy"],
      });

    if (f.glassCannon)
      instructions.push({
        code: "HIGH_PERMEABILITY",
        val: d.permeability,
        task: Variance.DIRECTOR_NOTES["High Permeability"],
      });
    if (f.ironBunker)
      instructions.push({
        code: "LOW_PERMEABILITY",
        val: d.permeability,
        task: Variance.DIRECTOR_NOTES["Low Permeability"],
      });

    if (f.obsession)
      instructions.push({
        code: "HIGH_RESONANCE",
        val: d.resonance,
        task: Variance.DIRECTOR_NOTES["High Resonance"],
      });
    if (f.apathy)
      instructions.push({
        code: "LOW_RESONANCE",
        val: d.resonance,
        task: Variance.DIRECTOR_NOTES["Low Resonance"],
      });

    if (instructions.length === 0) return "";

    // Format Output
    const content = instructions
      .map(
        (i) => `[PHYSICS: ${i.code}]
INPUT SIGNAL: ${i.val.toFixed(1)}
INSTRUCTION: ${i.task}`,
      )
      .join("\n\n");

    const isCritical = Object.values(d).some(
      (val) => typeof val === "number" && (val >= 90 || val <= 10),
    );
    const visualAuth = isCritical ? "\n[VISUALS_AUTHORIZED]" : "";

    return `
<WARDEN_PROTOCOL>
${content}${visualAuth}
</WARDEN_PROTOCOL>`;
  },

  authorizeVisuals: (instruction, options) => {
    return Variance.analyzeVisualAuthorization(instruction, options);
  },

  // =========================================================================
  // 4. INTELLIGENCE (Parser)
  // =========================================================================

  parse: (text) => Parser.parse(text),
  template: (ai, others, history, activeThreads) =>
    Parser.template(ai, others, history, activeThreads),
  compose: (target, others, history, activeThreads) =>
    Parser.compose(target, others, history, activeThreads),
};
