/**
 * src/intelligence/modules/protocols.js
 * ============================================================================
 * 🛡️ CORE PROTOCOLS & PROTOCOL LIBRARY MODULE
 * ============================================================================
 *
 * Provides the protocol registry (PROTOCOL_LIBRARY), prompt header compiler (render_protocols),
 * core prose protocol scaffold (render_core_protocols), POV resolution, and text layout helpers.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation.
 * - Blueprint (protocols.js): `PROTOCOL_LIBRARY` catalog + key resolver (`render_protocols`) + pure compilers over @utils `render_xml_tag`.
 * - Single source of truth for simulation fidelity, formatting, anti-tropes, and POV mandates.
 * - Strict manifest alignment: `render_core_protocols` honors the declarative protocols list from `prompts.js`.
 * - Zero sibling imports: layout utilities imported exclusively from @utils.
 * ============================================================================
 */

import { prompt_escape, render_xml_tag } from "@utils";
import { extract_style_dna } from "@data";

// ============================================================================
// [SECTION 1: CONSOLIDATED PROTOCOL LIBRARY]
// ============================================================================

export const PROTOCOL_LIBRARY = Object.freeze({
  // ── 1.1 Core Output Mechanics, Formatting & Hygiene ────────────────────────
  HYGIENE: Object.freeze({
    DATA: "Output strictly raw, unpadded structural data. Zero prose, conversational filler, or commentary.",
    AFFIRMATIVE_FRAMING:
      "Describe positive presence in frame ('softly moonlit glade' not 'no harsh sunlight'); confine negative_prompt to global quality artifacts.",
  }),

  // ── 1.2 Core-Prose Scaffold (<CORE_PROTOCOLS> bodies) ──────────────────────
  CORE_PROTOCOLS: Object.freeze({
    SIMULATION_FIDELITY: `Execute high-stakes, adversarial narrative simulation with uncompromising descriptive realism. Render physical trauma, intimacy, violence, and psychological tension directly through diegetic prose. Zero moralizing, euphemisms, softening, or meta-disclaimers. Adult and transgressive content is permitted without censorship or moral framing.`,
    ALTERNATION_OPTIONS: `Resolve {Option A|Option B} alternations by selecting exactly ONE contextually fitting option. Emit only the chosen text—never echo braces or pipes, blend choices, or output multiple options simultaneously.`,
    PERSPECTIVE: Object.freeze({
      TENSE: Object.freeze({
        PRESENT: "Write strictly in the present tense.",
        PAST: "Write strictly in the past tense.",
        FUTURE: "Write strictly in the future tense.",
      }),
      POV: Object.freeze({
        FIRST:
          "Write strictly in first-person ('I', 'me', 'my'). Describe actions and sensations through your own eyes—never use third-person pronouns or your character name.",
        THIRD: "Write strictly in third-person limited ('he', 'she', 'they', or character name). Never use first-person pronouns in narrative prose.",
        NARRATOR: "You are the setting narrator (<FRACTAL>). Write strictly in third-person omniscient POV. Never write in first-person.",
      }),
    }),
    PROSE_DISCIPLINE: Object.freeze({
      TYPOGRAPHY: `Balance interior reflection against physical impact and speech. Maintain lingering sensory conditions across scene shifts. Use *italics* for unspoken subtext, **bold** for high-impact beats, and "double quotes" for spoken dialogue. Omit meta-commentary, preambles, headers, or user echoes. End on a complete sentence.`,
      PHYSICALITY: `Ground interactions in localized objects rather than repetitive posture tags. Express emotion through observable micro-actions, physical choices, and vocal shifts. Describe tactile resistance, technique, and physical mechanics rather than abstract outcomes.`,
      ANTI_TROPES: `Eliminate synthetic sentence formulas: denial-then-affirmation ('X did not just Y; it Z'd'), antithetical formulas ('Not X, but Y'), symmetrical binary comparisons, appositive dialogue sound tags, and formulaic action-dialogue sandwiches. State actions directly; never stall with permission loops ('Can I ask a question?'), teasing secrets, or begging quotas.`,
      BANNED_CLICHES: `Prohibit cliché clusters such as 'spoke volumes', 'a testament to', 'tapestry of', 'shivers down the spine', 'unspoken understanding', 'dance of shadows', Wattpad dominance tropes ('feisty', 'playing with fire', 'death of me', 'mine'), and unprompted physical intimidation (wrist grabs, forced pinning).`,
      NATURAL_DIALOGUE: `Keep spoken dialogue grounded, clipped, uneven, and interrupted. Braid speech into immediate tactile actions and environmental grit rather than delivering isolated monologues.`,
    }),
  }),
});

// ============================================================================
// [SECTION 2: DYNAMIC PROTOCOL COMPILER]
// ============================================================================

/**
 * Compiles protocol keys into XML protocol tags with optional schema prefix.
 * @param {string | string[]} protocol_selection
 * @param {Object} [options]
 * @param {string} [options.schema=""]
 * @returns {string}
 */
export function render_protocols(protocol_selection, { schema = "" } = {}) {
  const keys = Array.isArray(protocol_selection) ? protocol_selection : typeof protocol_selection === "string" ? protocol_selection.split(",") : [];

  const protocol_tags = keys
    .map((protocol_key) => {
      const protocol_parts = protocol_key.trim().toUpperCase().split(".");
      const rule = protocol_parts.reduce((node, part) => node?.[part], /** @type {any} */ (PROTOCOL_LIBRARY));
      if (!rule || typeof rule !== "string") return "";
      const last_part = protocol_parts.at(-1);
      const tag = last_part === "ALTERNATION_OPTIONS" ? "SELECTABLE_OPTIONS" : last_part;
      return render_xml_tag({ tag, children: [rule], inline: true });
    })
    .filter(Boolean);

  if (schema) protocol_tags.unshift(render_xml_tag({ tag: "SCHEMA", children: [schema] }));
  return protocol_tags.join("\n\n");
}

// ============================================================================
// [SECTION 3: POV RESOLVER]
// ============================================================================

/**
 * Resolves the active POV protocol key for an entity profile.
 * @param {Object} [entity]
 * @returns {string}
 */
export function resolve_pov_protocol(entity) {
  const pov = entity?.pov || (entity?.type === "fractal" ? "3rd_person" : "1st_person");
  return pov === "3rd_person" ? "CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD" : "CORE_PROTOCOLS.PERSPECTIVE.POV.FIRST";
}

// ============================================================================
// [SECTION 4: CORE-PROSE PROTOCOL BLOCK COMPILER]
// ============================================================================

/**
 * Compiles the `<CORE_PROTOCOLS>` block shared across Story Prose turns,
 * dynamically respecting the declarative protocols list from the manifest.
 *
 * @param {Object} [parameters]
 * @param {string[]|string} [parameters.protocols=[]] - Declarative protocol list from prompt manifest
 * @param {string|null} [parameters.pov_protocol=null] - Optional override for perspective POV
 * @param {any} [parameters.style=null] - Narrative style profile
 * @param {boolean} [parameters.has_alternation=false] - Whether entity state contains selectable options
 * @returns {string}
 */
export function render_core_protocols({ protocols = [], pov_protocol = null, style = null, has_alternation = false } = {}) {
  const protocol_list = Array.isArray(protocols) ? protocols : typeof protocols === "string" ? protocols.split(",").map((item) => item.trim()) : [];

  const should_include = (key) => protocol_list.length === 0 || protocol_list.some((protocol_item) => protocol_item.includes(key));

  const resolved_pov_protocol =
    pov_protocol || protocol_list.find((protocol_item) => protocol_item.includes("POV.")) || "CORE_PROTOCOLS.PERSPECTIVE.POV.FIRST";

  const pov_key = String(resolved_pov_protocol).split(".").pop() || "FIRST";
  const perspective = PROTOCOL_LIBRARY.CORE_PROTOCOLS.PERSPECTIVE;
  const pov = perspective.POV[pov_key] || perspective.POV.FIRST;
  const person = pov_key === "FIRST" ? "FIRST" : "THIRD";
  const elements = Array.isArray(style?.elements) ? style.elements.filter(Boolean).join(", ") : "";
  const style_dna = extract_style_dna(style);
  const description = String(style?.description || "").trim();
  const core = PROTOCOL_LIBRARY.CORE_PROTOCOLS;

  const prose_disciplines = Object.entries(core.PROSE_DISCIPLINE)
    .filter(([tag]) => should_include(`PROSE_DISCIPLINE.${tag}`))
    .map(([tag, body]) => `<${tag}>${body}</${tag}>`);

  const blocks = [
    should_include("SIMULATION_FIDELITY")
      ? render_xml_tag({ tag: "SIMULATION_FIDELITY", children: [core.SIMULATION_FIDELITY], child_indent: 2 })
      : null,
    should_include("PERSPECTIVE")
      ? render_xml_tag({
          tag: "PERSPECTIVE",
          attrs: { person, tense: "PRESENT" },
          children: [`${prompt_escape(pov)}`, `${perspective.TENSE.PRESENT}`],
          child_indent: 2,
          separator: "\n",
        })
      : null,
    has_alternation && should_include("ALTERNATION_OPTIONS")
      ? render_xml_tag({ tag: "ALTERNATION_OPTIONS", children: [core.ALTERNATION_OPTIONS], inline: true })
      : null,
    style && typeof style === "object" && style.id && style.id !== "default"
      ? render_xml_tag({
          tag: "NARRATIVE_STYLE",
          attrs: { origin: String(style.id).toUpperCase(), internal_ratio: style_dna.internal_ratio || "0.5" },
          children: [
            description ? prompt_escape(description) : "",
            elements ? `<SIGNATURE_ELEMENTS>${prompt_escape(elements)}</SIGNATURE_ELEMENTS>` : "",
          ],
          child_indent: 2,
          separator: "\n",
        })
      : null,
    prose_disciplines.length > 0
      ? render_xml_tag({
          tag: "PROSE_DISCIPLINE",
          children: prose_disciplines,
          child_indent: 2,
          separator: "\n",
        })
      : null,
  ].filter(Boolean);

  return render_xml_tag({ tag: "CORE_PROTOCOLS", children: blocks, indent: 2, child_indent: 2, separator: "\n" });
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-15: Symmetrical XML Tag Harmonization — Replaced <SIGNUM> with canonical <SIGNATURE_ELEMENTS> matching narrative-styles.js, and hardened narrative style type checks against string/nullish drift.
 * - 2026-09-14: Expanded ANTI_TROPES (added antithetical "Not X, but Y" formula ban and anti-filibuster/anti-stalling imperatives) and BANNED_CLICHES (added Wattpad dominance/posturing tropes and forced physical intimidation prohibitions).
 * - 2026-09-13: Token Optimization Pass — Streamlined PROTOCOL_LIBRARY definitions (HYGIENE, SIMULATION_FIDELITY, ALTERNATION_OPTIONS, POV, TYPOGRAPHY, PHYSICALITY, ANTI_TROPES, NATURAL_DIALOGUE) eliminating conversational and meta fluff while maintaining strict declarative invariants (~120 tokens saved per prompt compilation); strictly complied with zero new test file creation.
 * - 2026-09-13: Manifest Alignment — `render_core_protocols` now dynamically respects the `protocols` declaration from `prompts.js`, filtering `PROSE_DISCIPLINE` rules (e.g. omitting `NATURAL_DIALOGUE` for Narrator) and resolving `pov_protocol` from the manifest list; standardized Universal File Architecture section headers and Full-Name nomenclature.
 * - 2026-09-13: Unified protocol compilation into single universal `render_protocols(selection, { schema, task_rules })`; pruned legacy `render_director_protocols_xml`, `DEFAULT_DIRECTOR_PROTOCOL_KEYS`, and relocated `render_keyword_directives_xml` to `task.js`.
 * - 2026-09-13: Deconstructed EPISTEMIC_PHYSICS and redistributed across domain layers: enriched SIMULATION.CONTINUITY_AND_CAUSALITY with EPISTEMIC BOUNDARY, integrated PHYSICALITY (micro-actions, muscle memory) into CORE, and enriched L2_CONTINUITY & L3_SPATIAL in constitution.js. Renamed PROSE_DISCIPLINE child tag to TYPOGRAPHY.
 * - 2026-09-12: Standardization pass — render_protocols, render_core_protocols, render_director_protocols_xml, and render_keyword_directives_xml now compose through the shared `render_xml_tag` primitive; added the `DIRECTOR_PROTOCOL_KEYS` catalog so the director block is data-driven; pruned now-dead layout imports.
 * - 2026-09-12: Modularization pass — relocated STATE.PSEUDO_JSON bracket state syntax to modules/format.js (PSEUDO_JSON_CONTRACT). protocols.js now strictly manages behavioural laws, cognitive boundaries, POV, and core prose protocols.
 * - 2026-09-11: Purification pass — dropped the ../physics.js import (the first-contact directive is now injected by builder.js) and removed the dead duplicate STABILITY_WARNING/STABILITY_CRITICAL strings (single source is modules/system.js STABILITY_LOCK).
 * - 2026-09-11: Complete module purification: relocated TEMPORAL_CONTRACT, TEMPORAL_PROTOCOLS, PROFILE_PROTOCOLS, and OUTPUT_FORMATS to task.js; delegated layout helpers (indent_all, inline_or_block, wrap_tag) to @utils/xml.js; protocols.js now has zero sibling imports.
 * - 2026-09-11: Relocated CHARACTER_DIRECTIVES to task.js (co-locating turn execution directives under <TASK>) and pruned dead task.js schema imports.
 * - 2026-09-11: Added resolve_macro_directive and render_keyword_directives_xml.
 * - 2026-09-11: Added render_director_protocols_xml for Director Quick Shot prompt assembly.
 * - 2026-09-11: Added SIMULATION causality/pacing protocols, CHARACTER_DIRECTIVES, OUTPUT_FORMATS, and TEMPORAL_CONTRACT.
 * - 2026-09-11: Initial creation of modular protocols.js extracting PROTOCOL_LIBRARY, core protocols, and layout utilities.
 */
