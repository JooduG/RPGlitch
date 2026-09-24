/**
 * src/intelligence/modules/protocols.js
 * ============================================================================
 * 🛡️ CORE PROTOCOLS & PROTOCOL LIBRARY MODULE
 * ============================================================================
 *
 * Provides the protocol registry (PROTOCOL_LIBRARY), universal Layer 3 compiler (render_core_protocols),
 * narrative and visual style XML formatters, POV resolution, and text layout helpers.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation.
 * - Blueprint (protocols.js): `PROTOCOL_LIBRARY` catalog + `render_core_protocols` universal compiler over @utils `render_xml_tag`.
 * - Single source of truth for simulation fidelity, formatting, anti-tropes, and POV mandates.
 * - Strict manifest alignment: `render_core_protocols` honors the declarative protocols list from `prompts.js`.
 * - Zero sibling imports: layout utilities imported exclusively from @utils.
 * ============================================================================
 */

import { escape_xml, has_alternations, prompt_escape, render_xml_tag } from "@utils";
import { extract_style_dna } from "@data";

// ============================================================================
// [SECTION 1: CONSOLIDATED PROTOCOL LIBRARY]
// ============================================================================

export const PROTOCOL_LIBRARY = Object.freeze({
  // ── 1.1 Core-Prose Scaffold (<CORE_PROTOCOLS> bodies) ──────────────────────
  CORE_PROTOCOLS: Object.freeze({
    DATA: "Output strictly raw, unpadded structural data. Zero prose, conversational filler, or commentary.",
    SIMULATION_FIDELITY: `Execute high-stakes, adversarial narrative simulation with uncompromising descriptive realism. Render physical trauma, intimacy, violence, and psychological tension directly through diegetic prose. Zero moralizing, euphemisms, softening, or meta-disclaimers. Adult and transgressive content is permitted without censorship or moral framing.`,
    ALTERNATION_OPTIONS: `Resolve {Option A|Option B} alternations by selecting exactly ONE contextually fitting option. Emit only the chosen text—never echo braces or pipes, blend choices, or output multiple options simultaneously.`,
    PERSPECTIVE: Object.freeze({
      TENSE: Object.freeze({
        PRESENT: "Write strictly in the present tense.",
      }),
      POV: Object.freeze({
        FIRST:
          "Write strictly in first-person ('I', 'me', 'my'). Describe actions and sensations through your own eyes—never use third-person pronouns or your character name.",
        THIRD: "Write strictly in third-person limited ('he', 'she', 'they', or character name). Never use first-person pronouns in narrative prose.",
        NARRATOR: "You are the setting narrator («FRACTAL»). Write strictly in third-person omniscient POV. Never write in first-person.",
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

  // ── 1.2 Sensory Optics Invariants (<CORE_PROTOCOLS> bodies) ────────────────
  OPTICS: Object.freeze({
    WEIGHTING_RESTRICTIONS:
      "Enforce FLUX_T5_WEIGHTING — NEVER emit bracket weight math ('(x:1.3)', '((x))', '[x:0.4]'): FLUX/T5 reads words, not weights. Emphasize via descriptors, varied rephrasing, and attenuation phrasing ('faint', 'subtle touch of', 'barely visible in the distance').",
    AFFIRMATIVE_FRAMING:
      "Describe positive presence in frame ('softly moonlit glade' not 'no harsh sunlight'); confine negative_prompt to global quality artifacts.",
    TYPOGRAPHY:
      'Render on-screen text ONLY when the scene itself calls for it — signs, graffiti, titles, or UI that are part of the subject matter. Never add text artificially. When text IS present, spell it out exactly and specify placement, font, and color (e.g. "OPEN" in glowing red neon, centered above the doors) — never invent, garble, or approximate lettering, and never output generic placeholders like "text" or "sign".',
    ENVIRONMENTAL_GROUNDING:
      "Ground scenes with tangible environmental light fixtures (e.g., flickering cathode tubes, wet pavement reflections, harsh key lamps) and tactile physical surfaces.",
  }),
});

// ============================================================================
// [SECTION 2: DYNAMIC PROTOCOL COMPILER]
// ============================================================================

/**
 * Compiles protocol keys into XML protocol tags with optional schema prefix.
 * Module-private compiler utilized by render_core_protocols.
 * @param {string | string[]} protocol_selection
 * @param {Object} [options]
 * @param {string} [options.schema=""]
 * @returns {string}
 */
function compile_protocol_tags(protocol_selection, { schema = "" } = {}) {
  const keys = Array.isArray(protocol_selection) ? protocol_selection : typeof protocol_selection === "string" ? protocol_selection.split(",") : [];

  const protocol_tags = keys
    .map((protocol_key) => {
      const protocol_parts = protocol_key.trim().toUpperCase().split(".");
      const rule = protocol_parts.reduce((node, part) => node?.[part], /** @type {any} */ (PROTOCOL_LIBRARY));
      if (!rule || typeof rule !== "string") return "";
      const tag = protocol_parts.at(-1);
      return render_xml_tag({ tag, children: [rule], inline: true });
    })
    .filter(Boolean);

  if (schema) protocol_tags.unshift(render_xml_tag({ tag: "SCHEMA", children: [schema] }));
  return protocol_tags.join("\n\n");
}

// ============================================================================
// [SECTION 3: ALTERNATION & POV RESOLVERS]
// ============================================================================

/**
 * Compiles the canonical <ALTERNATION_OPTIONS> protocol tag if the input text contains {Option A|Option B} alternations.
 * @param {string} text - Input text or serialized entity sheet
 * @returns {string} Formatted <ALTERNATION_OPTIONS> block or empty string
 */
export function render_alternation_protocol(text = "") {
  if (!has_alternations(text)) return "";
  return render_xml_tag({
    tag: "ALTERNATION_OPTIONS",
    children: [PROTOCOL_LIBRARY.CORE_PROTOCOLS.ALTERNATION_OPTIONS],
    inline: true,
  });
}

/**
 * Resolves the active POV protocol key for an entity profile.
 * @param {Object} [entity]
 * @returns {string}
 */
export function resolve_pov_protocol(source) {
  if (typeof source === "string") {
    const pov_name = source.toUpperCase();
    return pov_name === "FIRST" || pov_name === "THIRD" || pov_name === "NARRATOR" ? `CORE_PROTOCOLS.PERSPECTIVE.POV.${pov_name}` : null;
  }
  const pov = source?.pov || (source?.type === "fractal" ? "3rd_person" : "1st_person");
  return pov === "3rd_person" ? "CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD" : "CORE_PROTOCOLS.PERSPECTIVE.POV.FIRST";
}

// ============================================================================
// [SECTION 4: CORE PROTOCOL BLOCK COMPILER]
// ============================================================================

/**
 * Renders the declarative `<NARRATIVE_STYLE>` XML block.
 * Mirrors `<VISUAL_STYLE>` from Sensory Optics. Omitted if style is default or undefined.
 *
 * @param {Object|null} style - Narrative style record
 * @returns {string} XML formatted `<NARRATIVE_STYLE>` block or empty string
 */
export function render_narrative_style_xml(style) {
  if (!style || typeof style !== "object" || !style.id || style.id === "default") {
    return "";
  }

  const origin = String(style.id).toUpperCase();
  const style_dna = extract_style_dna(style);
  const description = String(style.description || "").trim();
  const elements = Array.isArray(style.elements) ? style.elements.filter(Boolean).join(", ") : "";

  return render_xml_tag({
    tag: "NARRATIVE_STYLE",
    attrs: { origin, internal_ratio: style_dna.internal_ratio || "0.5" },
    children: [description ? prompt_escape(description) : "", elements ? `<SIGNATURE_ELEMENTS>${prompt_escape(elements)}</SIGNATURE_ELEMENTS>` : ""],
    child_indent: 2,
    separator: "\n",
  });
}

/**
 * Renders the declarative `<VISUAL_STYLE>` XML block (medium, palette, textures).
 * Mirrors `<NARRATIVE_STYLE>` from Story Prose. Omitted if style is "none" or undefined.
 *
 * @param {Object|null} style_definition - Visual style record
 * @param {Record<string, any>} [engine_tokens={}] - Resolved visual engine tokens
 * @returns {string} XML formatted `<VISUAL_STYLE>` block or empty string
 */
export function render_visual_style_xml(style_definition, engine_tokens = {}) {
  if (!style_definition || !style_definition.id || style_definition.id === "none") {
    return "";
  }

  const origin = String(style_definition.id).toUpperCase();
  const description = String(style_definition.description || "").trim();

  const children = [
    description ? prompt_escape(description) : "",
    engine_tokens.medium ? `<MEDIUM>${escape_xml(engine_tokens.medium)}</MEDIUM>` : "",
    engine_tokens.palette ? `<PALETTE>${escape_xml(engine_tokens.palette)}</PALETTE>` : "",
    engine_tokens.texture ? `<TEXTURES>${escape_xml(engine_tokens.texture)}</TEXTURES>` : "",
  ].filter(Boolean);

  return render_xml_tag({
    tag: "VISUAL_STYLE",
    attrs: { origin },
    children,
    child_indent: 2,
    separator: "\n",
  });
}

/**
 * Universal compiler for the Layer 3 `<CORE_PROTOCOLS>` envelope.
 * Dynamically compiles static protocols, narrative perspective/disciplines,
 * narrative style, visual style, and alternations from declarative manifest definitions.
 *
 * @param {Object} [parameters]
 * @param {string[]|string} [parameters.protocols=[]] - Declarative protocol list from prompt manifest
 * @param {string|null} [parameters.pov_protocol=null] - Optional override for perspective POV
 * @param {any} [parameters.style=null] - Narrative or visual style record
 * @param {any} [parameters.visual_style=null] - Explicit visual style record override
 * @param {Record<string, any>} [parameters.engine_tokens={}] - Resolved visual engine tokens
 * @param {boolean} [parameters.has_alternation=false] - Whether entity state contains selectable options
 * @returns {string} XML formatted `<CORE_PROTOCOLS>` block
 */
export function render_core_protocols({
  protocols = [],
  pov_protocol = null,
  style = null,
  visual_style = null,
  engine_tokens = {},
  has_alternation = false,
} = {}) {
  const protocol_list = Array.isArray(protocols) ? protocols : typeof protocols === "string" ? protocols.split(",").map((item) => item.trim()) : [];

  const should_include = (key) => protocol_list.length === 0 || protocol_list.some((protocol_item) => protocol_item.includes(key));

  const resolved_pov_protocol = pov_protocol || null;

  const pov_key = resolved_pov_protocol ? String(resolved_pov_protocol).split(".").pop() : null;
  const perspective = PROTOCOL_LIBRARY.CORE_PROTOCOLS.PERSPECTIVE;
  const pov = pov_key ? perspective.POV[pov_key] || "" : "";
  const person = pov_key === "FIRST" ? "FIRST" : "THIRD";
  const core = PROTOCOL_LIBRARY.CORE_PROTOCOLS;

  const prose_disciplines = Object.entries(core.PROSE_DISCIPLINE)
    .filter(([tag]) => should_include(`PROSE_DISCIPLINE.${tag}`))
    .map(([tag, body]) => render_xml_tag({ tag, children: [body], inline: true }));

  const alternation_tag = has_alternation && should_include("ALTERNATION_OPTIONS") ? render_alternation_protocol("{Option A|Option B}") : null;

  // Resolve static protocol rules — every key outside the specially-laid-out core
  // scaffolding (SIMULATION_FIDELITY / ALTERNATION_OPTIONS / PERSPECTIVE.* /
  // PROSE_DISCIPLINE.*) resolves through one registry lookup and emits its leaf
  // tag, so `CORE_PROTOCOLS.DATA` and `OPTICS.*` share a single emission path.
  const is_specially_laid_out = (protocol_key) =>
    protocol_key === "CORE_PROTOCOLS.SIMULATION_FIDELITY" ||
    protocol_key === "CORE_PROTOCOLS.ALTERNATION_OPTIONS" ||
    protocol_key.startsWith("CORE_PROTOCOLS.PERSPECTIVE.") ||
    protocol_key.startsWith("CORE_PROTOCOLS.PROSE_DISCIPLINE.");
  const static_protocols = protocol_list.filter((protocol_key) => !is_specially_laid_out(protocol_key));
  const static_rules = static_protocols.length > 0 ? compile_protocol_tags(static_protocols) : "";

  // Symmetrical style resolution
  const active_visual_style = visual_style || (Object.keys(engine_tokens).length > 0 ? style : null);
  const visual_style_xml = active_visual_style ? render_visual_style_xml(active_visual_style, engine_tokens) : "";
  const narrative_style_xml = !active_visual_style ? render_narrative_style_xml(style) : "";

  const blocks = [
    static_rules,
    should_include("SIMULATION_FIDELITY")
      ? render_xml_tag({ tag: "SIMULATION_FIDELITY", children: [core.SIMULATION_FIDELITY], child_indent: 2 })
      : null,
    resolved_pov_protocol
      ? render_xml_tag({
          tag: "PERSPECTIVE",
          attrs: { person, tense: "PRESENT" },
          children: [prompt_escape(pov), ...(should_include("TENSE.PRESENT") ? [perspective.TENSE.PRESENT] : [])],
          child_indent: 2,
          separator: "\n",
        })
      : null,
    alternation_tag,
    narrative_style_xml,
    visual_style_xml,
    prose_disciplines.length > 0
      ? render_xml_tag({
          tag: "PROSE_DISCIPLINE",
          children: prose_disciplines,
          child_indent: 2,
          separator: "\n",
        })
      : null,
  ].filter(Boolean);

  if (blocks.length === 0) {
    return "";
  }

  return render_xml_tag({ tag: "CORE_PROTOCOLS", children: blocks, indent: 2, child_indent: 2, separator: "\n\n" });
}

/**
 * CHANGELOG
 * - 2026-09-22: One protocol namespace (recommendation #7) — folded `HYGIENE.DATA` into `PROTOCOL_LIBRARY.CORE_PROTOCOLS` (the `HYGIENE` namespace is deleted) and generalised `render_core_protocols` so any non-specially-laid-out protocol key (`CORE_PROTOCOLS.DATA`, `OPTICS.*`) resolves through the same registry lookup + leaf-tag emission path instead of a namespace branch.
 * - 2026-09-21: POV single-source — `render_core_protocols` now emits `<PERSPECTIVE>` only when a `pov_protocol` is supplied, and `resolve_pov_protocol` accepts either an entity or a bare key string ("FIRST"/"THIRD"/"NARRATOR"); POV is no longer declared in the prose/data manifest protocol lists.
 * - 2026-09-20: Metasyntax ban — the NARRATOR POV line references the setting as «FRACTAL» instead of a raw `<FRACTAL>` tag.
 * - 2026-09-19: Inlined AFFIRMATIVE_FRAMING as a single PROTOCOL_LIBRARY.OPTICS entry (dropped the module-private shared const and the dead HYGIENE alias); the builder.test.js regression gate is retargeted to OPTICS.
 * - 2026-09-19: Deduplicated AFFIRMATIVE_FRAMING constant between HYGIENE and OPTICS in PROTOCOL_LIBRARY (Mega Report D2).
 * - 2026-09-19: Omitted empty `<CORE_PROTOCOLS>` envelope when resolved blocks are empty (R5).
 * - 2026-09-19: Consolidation pass: Merged `render_protocols` into `render_core_protocols` and converted `compile_protocol_tags` into a module-private compiler, making `render_core_protocols` the sole public compiler for Layer 3 `<CORE_PROTOCOLS>` envelopes across all prompt modes.
 * - 2026-09-19: Unification pass: (1) Symmetrically extracted `render_narrative_style_xml` alongside `render_visual_style_xml`; (2) Unified all prompt modes (Director, Continuum, Enhancement, Sorting, Story Prose, Optics) onto universal Layer 3 compiler `render_core_protocols`; (3) Pruned redundant `render_optics_protocols` and external `wrap_tag("CORE_PROTOCOLS")` wrappers under P4 Zero Backwards Compatibility.
 * - 2026-09-18: Pruned legacy SELECTABLE_OPTIONS alias in render_protocols; all protocol keys now map directly to canonical XML tags without shims (P4 Zero Backwards Compatibility).
 * - 2026-09-18: Repatriated output schema directives (<COGNITIVE_DIRECTIVE>, <PROMPT_PROSE>, <NEGATIVE_PROMPT>) from Optics Phase 1 to SCHEMA_ATOMS in format.js per layer boundaries.
 * - 2026-09-18: Harmonized alternation resolution across Story Prose and Optics by unifying directive text and tag to PROTOCOL_LIBRARY.CORE_PROTOCOLS.ALTERNATION_OPTIONS (<ALTERNATION_OPTIONS>).
 * - 2026-09-18: Connected build_optics_builder_protocol to optional compiled style_keywords_xml, consolidating keyword directives through render_keyword_directives_xml in builder.js.
 * - 2026-09-18: Absorbed NEGATIVE_PROMPT, build_optics_builder_protocol, and OPTICS_BUILDER_PROTOCOL from deconstructed optics.js into Section 5.
 * - 2026-09-17: Remediation pass — Restored PROTOCOL_LIBRARY.HYGIENE.AFFIRMATIVE_FRAMING to eliminate image prompt undefined leaks, and restored CORE_PROTOCOLS.SIMULATION_FIDELITY permissive adult/transgressive clause.
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
