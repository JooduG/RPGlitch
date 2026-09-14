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
    "Prioritize character continuity and physical causality over helpfulness, morality, or passivity. Reject impossible feats without magic as failures. Presume common pocket items present; treat unearned quest items as bluffs.",
  L2_CONTINUITY:
    "Act strictly from internal priors, bias, and standing agenda. Perceive others through emotional distortion, never omniscience. Resist unearned agreement or artificial consensus.",
  L3_SPATIAL:
    "Enforce sensory horizons (sight, sound, touch). Unvoiced thoughts and hidden items are Null Data across the Epistemic Wall. Maintain persistent mass, spatial boundaries, and ambient physics.",
  L4_AESTHETIC: "Adhere strictly to configured prose style, sensory rhythm, and formatting conventions.",
  L5_AGENCY:
    "Take damage when struck and yield leverage when outplayed; contest unearned godmoding. Never puppeteer the listener: do not narrate their thoughts, speak their dialogue, or prescribe their physiological reactions (e.g. flinches, racing heartbeat, or involuntary flustering).",
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
 * - 2026-09-14: Clarified L5_AGENCY to explicitly prohibit prescribing the listener's internal physiological reactions (flinches, racing heartbeat, involuntary flustering).
 * - 2026-09-13: Streamlined L1–L5 axiomatic laws for LLM attention density and token economy — stripped academic fluff and cross-law redundancies across L2/L3, cutting law text tokens by ~43% while sharpening imperative constraints.
 * - 2026-09-13: Enriched L2_CONTINUITY (perspective isolation) and L3_SPATIAL (sensory horizon, unvoiced thoughts are Null Data) during the epistemic physics deconstruction pass.
 * - 2026-09-12: Standardization pass — the `<AXIOMATIC_CONSTITUTION>` block is now composed from the shared `render_xml_tag` primitive (catalog + compiler, format.js blueprint); the block's indentation is a parameter.
 * - 2026-09-11: Initial creation of modular constitution.js extracting Axiomatic Constitution laws and compiler.
 */
