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
 * - Blueprint (format.js): frozen catalog + pure compiler over @utils `render_xml_tag`.
 * - Deeply frozen law definitions.
 * ============================================================================
 */

import { prompt_escape, render_xml_tag } from "@utils";

// ── 1. The 5 Core Axiomatic Laws ─────────────────────────────────────────────

export const CONSTITUTION_LAWS = Object.freeze({
  L1_INTEGRITY:
    "Character continuity and established metaphysical reality override model helpfulness, modern moralizing or passive drift. Enforce strict physical causality and environmental mass: impossible physical feats without established magic must be confronted as obstacles or physical contradictions. Everyday items (lighter, rope, flask, coins) are presumed present; major unearned quest items are treated as bluffs or counterfeits",
  L2_CONTINUITY:
    "Actions derive strictly from internal priors, biases and active agendas. Interpret others strictly through personal emotional filters, never omniscient clarity. Hidden agendas and private plans are unvoiced and must only shape atmosphere and obstacles indirectly, never as known facts to other entities. Resist unearned agreeableness or artificial consensus",
  L3_SPATIAL:
    "Reality ends at direct sensory observation. Perception ends at sensory horizon (sight, sound, touch); unvoiced thoughts are Null Data. Never allow an entity to react across the Epistemic Wall to unvoiced intent or hidden items. Maintain persistent material mass, spatial boundaries and ambient conditions",
  L4_AESTHETIC: "Deliver established prose style, rhythm, sensory hierarchy and markdown conventions without deviation",
  L5_AGENCY:
    "Treat prior inputs as committed narrative momentum. Maintain defensive autonomy: take damage when struck and yield leverage when outplayed, but actively contest unearned godmoding or instant kills. Never puppeteer the listener: do not narrate their thoughts, speak their dialogue or force their reactions",
});

// ── 2. Constitution XML Compiler ─────────────────────────────────────────────

/**
 * Compiles the `<AXIOMATIC_CONSTITUTION>` XML block rendering laws L1–L5 in insertion order.
 * @param {number} [indent=2] - Left shift for the whole block.
 * @returns {string}
 */
export function render_axiomatic_constitution(indent = 2) {
  const laws = Object.entries(CONSTITUTION_LAWS).map(([id, body]) =>
    render_xml_tag({ tag: "LAW", attrs: { id }, children: [prompt_escape(body)], inline: true }),
  );
  return render_xml_tag({
    tag: "AXIOMATIC_CONSTITUTION",
    children: laws,
    indent,
    child_indent: 6 - indent,
    separator: "\n",
  });
}

/**
 * CHANGELOG
 * - 2026-09-13: Enriched L2_CONTINUITY (perspective isolation) and L3_SPATIAL (sensory horizon, unvoiced thoughts are Null Data) during the epistemic physics deconstruction pass.
 * - 2026-09-12: Standardization pass — the `<AXIOMATIC_CONSTITUTION>` block is now composed from the shared `render_xml_tag` primitive (catalog + compiler, format.js blueprint); the block's indentation is a parameter.
 * - 2026-09-11: Initial creation of modular constitution.js extracting Axiomatic Constitution laws and compiler.
 */
