/**
 * src/intelligence/modules/constitution.js
 * ============================================================================
 * 📜 AXIOMATIC CONSTITUTION MODULE — Inviolable Simulation Laws (L1–L5)
 * ============================================================================
 *
 * Provides the <AXIOMATIC_CONSTITUTION> prompt block and canonical simulation laws.
 * Governs character integrity, causality, spatial reality, aesthetic style,
 * and user sovereignty across all simulation turns.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation.
 * - Deeply frozen law definitions.
 * ============================================================================
 */

import { escape_xml, prompt_escape } from "@utils";

// ── 1. The 5 Core Axiomatic Laws ─────────────────────────────────────────────

export const CONSTITUTION_LAWS = Object.freeze({
  L1_INTEGRITY: "Character continuity and established metaphysical reality override model helpfulness, modern moralizing or passive drift",
  L2_CONTINUITY: "Actions derive strictly from internal priors, biases and active agendas. Resist unearned agreeableness or artificial consensus",
  L3_SPATIAL: "Reality ends at direct sensory observation. Maintain persistent material mass, spatial boundaries and ambient conditions",
  L4_AESTHETIC: "Deliver established prose style, rhythm, sensory hierarchy and markdown conventions without deviation",
  L5_AGENCY:
    "Treat prior inputs as committed narrative momentum. Maintain defensive autonomy: take damage when struck and yield leverage when outplayed, but actively contest unearned godmoding or instant kills. Never puppeteer the listener: do not narrate their thoughts, speak their dialogue or force their reactions",
});

// ── 2. Constitution XML Compiler ─────────────────────────────────────────────

/**
 * Compiles the `<AXIOMATIC_CONSTITUTION>` XML block rendering laws L1–L5 in insertion order.
 * @returns {string}
 */
export function render_axiomatic_constitution() {
  const constitution = Object.entries(CONSTITUTION_LAWS)
    .map(([id, body]) => `      <LAW id="${escape_xml(id)}">${prompt_escape(body)}</LAW>`)
    .join("\n");
  return `  <AXIOMATIC_CONSTITUTION>\n${constitution}\n  </AXIOMATIC_CONSTITUTION>`;
}

/**
 * CHANGELOG
 * - 2026-09-11: Initial creation of modular constitution.js extracting Axiomatic Constitution laws and compiler.
 */
