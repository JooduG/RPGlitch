/**
 * src/intelligence/modules/constitution.js
 * ============================================================================
 * 📜 AXIOMATIC CONSTITUTION MODULE — Inviolable Simulation Laws (L1–L4)
 * ============================================================================
 *
 * Provides the <AXIOMATIC_CONSTITUTION> prompt block and canonical simulation laws.
 * Three simulation-physics axioms (causality, epistemics, sovereignty) plus the
 * fidelity axiom (realism + permissive clause) governing all simulation turns.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation.
 * - Blueprint (constitution.js): frozen catalog + pure compiler over @utils `render_xml_tag`.
 * - Deeply frozen law definitions.
 * ============================================================================
 */

import { render_atom_xml, render_xml_tag } from "@utils";

// ── 1. The 4 Core Axioms ─────────────────────────────────────────────────────

export const CONSTITUTION = Object.freeze({
  CAUSALITY: Object.freeze({
    tag: "LAW",
    id: "L1",
    title: "Causality",
    attrs: Object.freeze({ id: "L1", title: "Causality" }),
    inline: true,
    body: "Prioritize character continuity and causality over helpfulness, morality, or passivity. Reject unearned feats, items, and consensus without established physical basis. Ground every beat in tangible physical reality, localized objects, and tactile resistance rather than abstract outcomes. Yield leverage when outplayed.",
  }),
  EPISTEMICS: Object.freeze({
    tag: "LAW",
    id: "L2",
    title: "Epistemics",
    attrs: Object.freeze({ id: "L2", title: "Epistemics" }),
    inline: true,
    body: "Act strictly from internal bias and standing agenda. Perceive others through emotional distortion, never omniscience. Enforce sensory horizons (sight, sound, touch): unvoiced thoughts and concealed items are Null Data across the Epistemic Wall. Maintain persistent spatial boundaries and physics.",
  }),
  SOVEREIGNTY: Object.freeze({
    tag: "LAW",
    id: "L3",
    title: "Sovereignty",
    attrs: Object.freeze({ id: "L3", title: "Sovereignty" }),
    inline: true,
    body: "Contest godmoding. Every participant owns their voice, body, actions, thoughts, and choices. Never puppeteer the listener or other participants: never speak their dialogue, narrate their actions, script their thoughts, or prescribe their physiological reactions in any person or tense. Describe external actions only as observed from outside.",
  }),
  FIDELITY: Object.freeze({
    tag: "LAW",
    id: "L4",
    title: "Fidelity",
    attrs: Object.freeze({ id: "L4", title: "Fidelity" }),
    inline: true,
    body: "Execute high-stakes, adversarial narrative simulation with uncompromising descriptive realism. Render physical trauma, intimacy, violence, and psychological tension directly through diegetic prose. Zero moralizing, euphemisms, softening, or meta-disclaimers. Adult and transgressive content is permitted without censorship or moral framing.",
  }),
});

export const CONSTITUTION_ORDER = Object.freeze(["CAUSALITY", "EPISTEMICS", "SOVEREIGNTY", "FIDELITY"]);

/**
 * Compiles the `<AXIOMATIC_CONSTITUTION>` XML block rendering the selected axioms in canonical order.
 * @param {Object} [options={}]
 * @param {string[]} [options.laws] - Constitution keys to render (defaults to all four).
 * @param {number} [options.indent=2] - Left shift for the whole block.
 * @returns {string}
 */
export function render_constitution({ laws = CONSTITUTION_ORDER, indent = 2 } = {}) {
  const requested = Array.isArray(laws) ? laws : [];
  const tags = requested
    .map((key) => CONSTITUTION[key])
    .filter(Boolean)
    .map((law) => render_atom_xml(law, { indent: 0, escape: true }));

  return render_xml_tag({
    tag: "AXIOMATIC_CONSTITUTION",
    children: tags,
    indent,
    child_indent: indent + 2,
    separator: "\n",
  });
}

/**
 * System-layer slot: seals the axiomatic constitution for gated modes.
 */
export function resolve_constitution_slot(config) {
  return config?.constitution ? render_constitution() : "";
}
