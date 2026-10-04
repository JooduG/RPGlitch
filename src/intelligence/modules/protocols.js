/**
 * src/intelligence/modules/protocols.js
 * ============================================================================
 * 🛡️ CORE PROTOCOLS & PROTOCOL LIBRARY MODULE
 * ============================================================================
 *
 * Provides the protocol registry (PROTOCOL_LIBRARY), pure-data protocol plans
 * (resolve_protocol_plan), the thin Layer 3 compiler (render_protocol_plan /
 * render_core_protocols), narrative and visual style XML composition, POV
 * resolution, and text layout helpers.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure data plans, then pure string compilation.
 * - Blueprint (protocols.js): `PROTOCOL_LIBRARY` catalog + `resolve_protocol_plan`
 *   over @utils `render_xml_tag`; `render_core_protocols` is a one-line composition.
 * - Single source of truth for formatting, anti-tropes, and POV mandates; simulation fidelity is a constitution axiom, not a protocol.
 * - Strict manifest alignment: `render_core_protocols` honors the declarative protocols list from `prompts.js`.
 * ============================================================================
 */

import { prompt_escape, render_xml_tag } from "@utils";
import { render_narrative_style_xml, render_visual_style_xml } from "./style.js";
import { render_alternation_protocol } from "./reflex.js";
import { OUTPUT_DIRECTIVES } from "./output.js";

// ============================================================================
// [SECTION 1: CONSOLIDATED PROTOCOL LIBRARY]
// ============================================================================

/**
 * Per-type macro subject lists plus the shared prefix/suffix/pronoun rule.
 * Single source for the entity sets so the three MACROS records share one
 * wording — the catalog below stays a scannable frozen record.
 */
const MACRO_PREFIX = "Use placeholder macros for entities: ";
const MACRO_SUFFIX = " or specific '@ENTITY_NAME'.";
const MACRO_SUBJECTS = Object.freeze({
  CHARACTER: "'@ME' / '@SPEAKER' (self, actor), '@YOU' / '@LISTENER' (user persona, addressee), '@FRACTAL' (setting, environment),",
  FRACTAL: "'@USER' (user persona), '@CHAR' (AI character), '@FRACTAL' (setting, environment),",
  SORTING: "'@ME' / '@SPEAKER' (self), '@YOU' / '@LISTENER' (user persona), '@CHAR' (AI character), '@FRACTAL' (environment),",
});
const MACRO_PRONOUN_RULE = " Never use raw pronouns ambiguously.";

export const PROTOCOL_LIBRARY = Object.freeze({
  // ── 1.1 Shared Grounding & Core-Prose Scaffold (<CORE_PROTOCOLS> bodies) ──
  CORE_PROTOCOLS: Object.freeze({
    GROUNDING:
      "Ground every beat in tangible physical reality: localized objects over repetitive posture tags, emotion through observable micro-actions, vocal shifts, and tactile resistance rather than abstract outcomes. Anchor scenes with concrete light fixtures and physical surfaces.",
    PERSPECTIVE: Object.freeze({
      TENSE: Object.freeze({
        PRESENT: "Write strictly in the present tense.",
        PAST: "Write strictly in the past tense.",
        FUTURE: "Write strictly in the active future tense.",
      }),
      POV: Object.freeze({
        FIRST:
          "Write strictly in first-person ('I', 'me', 'my'). Describe actions and sensations through your own eyes—never use third-person pronouns or your character name.",
        THIRD: "Write strictly in third-person limited ('he', 'she', 'they', or character name). Never use first-person pronouns in narrative prose.",
      }),
    }),
    PROSE_DISCIPLINE: Object.freeze({
      TYPOGRAPHY: `Balance interior reflection against physical impact and speech. Maintain lingering sensory conditions across scene shifts. Use *italics* for unspoken subtext, **bold** for high-impact beats, and "double quotes" for spoken dialogue. Omit meta-commentary, preambles, headers, or user echoes. End on a complete sentence.`,
      SENTENCE_FORMULAS: `Eliminate synthetic sentence formulas: denial-then-affirmation ('X did not just Y; it Z'd'), antithetical formulas ('Not X, but Y'), symmetrical binary comparisons, appositive dialogue sound tags, and formulaic action-dialogue sandwiches.`,
      SCENE_MOMENTUM: `State actions directly and keep the scene moving; never stall with permission loops ('Can I ask a question?'), teasing secrets, or begging quotas.`,
      CLICHES: `Prohibit cliché clusters such as 'spoke volumes', 'a testament to', 'tapestry of', 'shivers down the spine', 'unspoken understanding', 'dance of shadows', and Wattpad dominance tropes ('feisty', 'playing with fire', 'death of me', 'mine').`,
      CONSENT: `Never stage non-consensual physical domination: no forced grabs, pinning, or intimidation framing unless the other party explicitly invites it. Write desire and vulnerability; never write coercion.`,
      NATURAL_DIALOGUE: `Keep spoken dialogue grounded, clipped, uneven, and interrupted. Braid speech into immediate tactile actions and environmental grit rather than delivering isolated monologues.`,
    }),
  }),

  // ── 1.2 Sensory Optics Invariants (<CORE_PROTOCOLS> bodies) ────────────────
  OPTICS: Object.freeze({
    IMAGE_VOCABULARY:
      "Enforce FLUX_T5_WEIGHTING — NEVER emit bracket weight math ('(x:1.3)', '((x))', '[x:0.4]'): FLUX/T5 reads words, not weights. Emphasize via descriptors, varied rephrasing, and attenuation phrasing ('faint', 'subtle touch of', 'barely visible in the distance'). Describe positive presence in frame ('softly moonlit glade' not 'no harsh sunlight'); confine negative_prompt to global quality artifacts.",
    TEXT_RENDERING:
      'Render on-screen text ONLY when the scene itself calls for it — signs, graffiti, titles, or UI that are part of the subject matter. Never add text artificially. When text IS present, spell it out exactly with placement, font, and color — never invent, garble, or approximate lettering, and never emit generic placeholders like "text" or "sign".',
  }),

  // ── 1.3 Entity Macro Directives ─────────────────────────────────────────────
  MACROS: Object.freeze({
    CHARACTER: `${MACRO_PREFIX}${MACRO_SUBJECTS.CHARACTER}${MACRO_SUFFIX}${MACRO_PRONOUN_RULE}`,
    FRACTAL: `${MACRO_PREFIX}${MACRO_SUBJECTS.FRACTAL}${MACRO_SUFFIX}`,
    SORTING: `${MACRO_PREFIX}${MACRO_SUBJECTS.SORTING}${MACRO_SUFFIX}`,
  }),
});

/**
 * Resolves the macro placeholder directive according to the entity type or mode.
 * @param {string} [entity_type="character"]
 * @returns {string}
 */
export function resolve_macro_directive(entity_type = "character") {
  if (entity_type === "sorting") return PROTOCOL_LIBRARY.MACROS.SORTING;
  return entity_type === "fractal" ? PROTOCOL_LIBRARY.MACROS.FRACTAL : PROTOCOL_LIBRARY.MACROS.CHARACTER;
}

// ============================================================================
// [SECTION 2: DYNAMIC PROTOCOL COMPILER]
// ============================================================================

/**
 * Resolves one dotted registry key to its leaf tag + body, or null when the
 * key names a branch or nothing at all. Looks in `PROTOCOL_LIBRARY` first,
 * then the `OUTPUT.*` output-shape directives in output.js. The single exact
 * matcher for static emission — substring/prefix guessing lives only in plan
 * selection.
 *
 * @param {string} protocol_key - Dotted registry path (e.g. "OPTICS.IMAGE_VOCABULARY", "OUTPUT.DATA")
 * @returns {{ tag: string, body: string }|null}
 */
function resolve_static_rule(protocol_key) {
  const protocol_parts = String(protocol_key).trim().toUpperCase().split(".");
  const catalog = protocol_parts[0] === "OUTPUT" ? OUTPUT_DIRECTIVES : PROTOCOL_LIBRARY;
  const lookup_parts = catalog === OUTPUT_DIRECTIVES ? protocol_parts.slice(1) : protocol_parts;
  const rule = lookup_parts.reduce((node, part) => node?.[part], /** @type {any} */ (catalog));
  if (!rule || typeof rule !== "string") return null;
  return { tag: lookup_parts.at(-1), body: rule };
}

// ============================================================================
// [SECTION 3: PROTOCOL PLANS — PURE DATA, NO XML]
// ============================================================================

/**
 * Resolves protocol inputs into a frozen, render-ready plan. Every selection,
 * tense fold, style choice, and drop decision happens here — the renderer maps
 * plan fields to envelopes without branching.
 *
 * @param {Object} [parameters={}]
 * @param {string[]|string} [parameters.protocols=[]] - Declarative protocol list from prompt manifest
 * @param {string|null} [parameters.pov_protocol=null] - Optional override for perspective POV
 * @param {any} [parameters.style=null] - Narrative or visual style record
 * @param {any} [parameters.visual_style=null] - Explicit visual style record override
 * @param {Record<string, any>} [parameters.engine_tokens={}] - Resolved visual engine tokens
 * @param {boolean} [parameters.has_alternation=false] - Whether entity state contains selectable options
 * @returns {Readonly<{ static_rules: ReadonlyArray<Readonly<{ tag: string, body: string }>>,
 *   perspective: Readonly<{ person: string|null, tense: string, pov_body: string, tense_command: string }>|null,
 *   alternation: boolean, style_kind: "visual"|"narrative"|null, style_xml: string,
 *   disciplines: ReadonlyArray<Readonly<{ tag: string, body: string }>>,
 *   dropped: Readonly<{ unknown: number }> }>}
 */
export function resolve_protocol_plan({
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
  const pov_body = pov_key ? perspective.POV[pov_key] || "" : "";
  const person = pov_key ? (pov_key === "FIRST" ? "FIRST" : "THIRD") : null;

  const is_specially_laid_out = (protocol_key) =>
    protocol_key === "CORE_PROTOCOLS.ALTERNATION_OPTIONS" ||
    protocol_key.startsWith("CORE_PROTOCOLS.PERSPECTIVE.") ||
    protocol_key.startsWith("CORE_PROTOCOLS.PROSE_DISCIPLINE.");
  let unknown_count = 0;
  const static_rules = protocol_list
    .filter((protocol_key) => !is_specially_laid_out(protocol_key))
    .map((protocol_key) => {
      const rule = resolve_static_rule(protocol_key);
      if (!rule) unknown_count += 1;
      return rule;
    })
    .filter(Boolean);

  const layer_tense_keys = protocol_list.filter((protocol_key) => String(protocol_key).startsWith("CORE_PROTOCOLS.PERSPECTIVE.TENSE."));
  const layer_tense_rules = layer_tense_keys.map((protocol_key) => perspective.TENSE[String(protocol_key).split(".").pop()]).filter(Boolean);

  const perspective_tense =
    layer_tense_rules.length > 1 ? "LAYER" : layer_tense_rules.length === 1 ? String(layer_tense_keys[0]).split(".").pop() : "PRESENT";
  const tense_command =
    layer_tense_rules.length > 1
      ? `Match tense to the layer being written: ${layer_tense_rules
          .map((rule) =>
            String(rule)
              .replace(/\s*\.\s*$/, "")
              .replace(/^[A-Z]/, (letter) => letter.toLowerCase()),
          )
          .join("; ")}.`
      : layer_tense_rules[0] || (should_include("TENSE.PRESENT") ? perspective.TENSE.PRESENT : "");

  const core = PROTOCOL_LIBRARY.CORE_PROTOCOLS;
  const disciplines = Object.entries(core.PROSE_DISCIPLINE)
    .filter(([tag]) => should_include(`PROSE_DISCIPLINE.${tag}`))
    .map(([tag, body]) => ({ tag, body }));

  const active_visual_style = visual_style || (Object.keys(engine_tokens).length > 0 ? style : null);
  const style_kind = active_visual_style ? "visual" : "narrative";
  const style_xml = active_visual_style ? render_visual_style_xml(active_visual_style, engine_tokens) : render_narrative_style_xml(style);

  return Object.freeze({
    static_rules: Object.freeze(static_rules.map((rule) => Object.freeze(rule))),
    perspective:
      resolved_pov_protocol || layer_tense_rules.length > 0 ? Object.freeze({ person, tense: perspective_tense, pov_body, tense_command }) : null,
    alternation: Boolean(has_alternation && should_include("ALTERNATION_OPTIONS")),
    style_kind,
    style_xml,
    disciplines: Object.freeze(disciplines.map((discipline) => Object.freeze(discipline))),
    dropped: Object.freeze({ unknown: unknown_count }),
  });
}

// ============================================================================
// [SECTION 4: THIN PLAN RENDERER — NO DECISIONS, ONLY XML]
// ============================================================================

/**
 * Maps a protocol plan to the Layer 3 `<CORE_PROTOCOLS>` envelope. Every
 * selection is already plan data — this function only wraps.
 *
 * @param {ReturnType<typeof resolve_protocol_plan>|null|undefined} plan
 * @returns {string} XML formatted `<CORE_PROTOCOLS>` block, or "" when empty
 */
export function render_protocol_plan(plan) {
  if (!plan) return "";
  const blocks = [
    plan.static_rules.length > 0
      ? plan.static_rules.map(({ tag, body }) => render_xml_tag({ tag, children: [body], inline: true })).join("\n\n")
      : "",
    plan.perspective
      ? render_xml_tag({
          tag: "PERSPECTIVE",
          attrs: { person: plan.perspective.person, tense: plan.perspective.tense },
          children: [prompt_escape(plan.perspective.pov_body), plan.perspective.tense_command],
          child_indent: 2,
          separator: "\n",
        })
      : null,
    plan.alternation ? render_alternation_protocol("", { force: true }) : null,
    plan.style_xml,
    plan.disciplines.length > 0
      ? render_xml_tag({
          tag: "PROSE_DISCIPLINE",
          children: plan.disciplines.map(({ tag, body }) => render_xml_tag({ tag, children: [body], inline: true })),
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

// ============================================================================
// [SECTION 5: POV RESOLVERS]
// ============================================================================

/**
 * Resolves the active POV protocol key for an entity profile.
 * @param {Object} [entity]
 * @returns {string}
 */
export function resolve_pov_protocol(source) {
  if (typeof source === "string") {
    const pov_name = source.toUpperCase();
    return pov_name === "FIRST" || pov_name === "THIRD" ? `CORE_PROTOCOLS.PERSPECTIVE.POV.${pov_name}` : null;
  }
  const pov = source?.pov || "3rd_person";
  return pov === "3rd_person" ? "CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD" : "CORE_PROTOCOLS.PERSPECTIVE.POV.FIRST";
}

/**
 * Resolves the layer-tense protocol key for a temporal profile field, so every
 * field carries exactly its own layer tense (single-field enhancement resolves
 * dynamically; schema modes declare all four statically in their manifest
 * `protocols` list). Returns null for non-temporal fields.
 * @param {string} [field_id=""] - Dot-notation field id (e.g. "eternal.non_physical", "past")
 * @param {string} [layer_key=""] - Uppercase layer key (e.g. "ETERNAL")
 * @returns {string|null}
 */
export function resolve_layer_tense_protocol(field_id = "", layer_key = "") {
  const raw_layer =
    String(layer_key || "")
      .trim()
      .toUpperCase() ||
    String(field_id || "")
      .trim()
      .toUpperCase()
      .split(".")[0];
  const layer = raw_layer === "ETERNAL" ? "PRESENT" : ["PRESENT", "PAST", "FUTURE"].includes(raw_layer) ? raw_layer : null;
  return layer ? `CORE_PROTOCOLS.PERSPECTIVE.TENSE.${layer}` : null;
}

// ============================================================================
// [SECTION 6: PUBLIC CORE PROTOCOL COMPILER — ONE-LINE PLAN + RENDER]
// ============================================================================

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
  return render_protocol_plan(resolve_protocol_plan({ protocols, pov_protocol, style, visual_style, engine_tokens, has_alternation }));
}

/**
 * CHANGELOG
 * - 2026-10-04: Renumbered duplicate section headers (1 library, 2 matcher, 3 plans, 4 renderer, 5 POV, 6 public compiler); plan-gated alternation renders via reflex.js render_alternation_block instead of a dummy-text has_alternations probe — byte-identical output.
 * - 2026-10-04: Catalog restructure (Suggestion 2 hybrid) — orthogonal single-concern atoms: ANTI_TROPES splits into SENTENCE_FORMULAS + SCENE_MOMENTUM, BANNED_CLICHES into CLICHES + standalone CONSENT, PHYSICALITY + ENVIRONMENTAL_GROUNDING fuse into shared GROUNDING, WEIGHTING + AFFIRMATIVE fuse into IMAGE_VOCABULARY, optics TYPOGRAPHY renamed TEXT_RENDERING (was colliding with prose TYPOGRAPHY); DATA moves to output.js OUTPUT_DIRECTIVES (manifests use OUTPUT.DATA); ALTERNATION atom + render_alternation_protocol move to reflex.js; MACROS records derive from shared MACRO_SUBJECTS (SORTING prefix normalized, byte-neutral in practice).
 * - 2026-10-04: Plan/render split (Plan 2) — `resolve_protocol_plan` owns all selection/tense-fold/style/drop decisions as frozen pure data (with `dropped.unknown` counts), `render_protocol_plan` maps plans to envelopes without branching, `render_core_protocols` is a one-line composition; retired the private `compile_protocol_tags` in favor of the exact `resolve_static_rule` matcher.
 * - 2026-10-04: Retired CORE_PROTOCOLS.SIMULATION_FIDELITY — fidelity is now constitution axiom L4 (rendered in <AXIOMATIC_CONSTITUTION>); protocols.js has zero constitution imports.
 * - 2026-10-04: Removed MACRO_DIRECTIVES alias (P4) — consumers read PROTOCOL_LIBRARY.MACROS.
 * - 2026-10-04: Optics invariants merged inline into PROTOCOL_LIBRARY.OPTICS (standalone const deleted) — one registry, no indirection.
 * - 2026-10-04: Reverted OPTICS_INVARIANTS here (was media/optics.js) — optics protocol texts live in the behavior catalog; style renderers stay in style.js.
 * - 2026-10-04: Sourced SIMULATION_FIDELITY from constitution.js and style renderers from style.js; protocols.js keeps the behavior catalog + core compiler only.
 * - 2026-10-04: Dropped the `PERSPECTIVE.MANDATE` line (pure throat-clearing — the tense/POV atoms already command; ~30 tokens saved per prompt).
 * - 2026-10-04: Retired the `POV.NARRATOR` atom (narrator mode resolves normal `THIRD`; the role line already establishes the Fractal-itself identity).
 * - 2026-10-04: Dropped the fractal type-sniffing fallback in `resolve_pov_protocol` (normal 3rd-person default; entities always carry explicit `pov`); fixtures now stamp `pov` like production entities.
 * - 2026-10-04: Tense atoms cut to pure grammar (truth-state lives in field directives) — `TENSE` is now three one-line tense commands.
 * - 2026-10-04: Unified tense — `LAYER_TENSE` folded into `TENSE` with reworded atoms that command grammar and truth-state together (prose narration and profile data share one wording); `MANDATE`/`TENSE_MANDATE` merged into one mandate.
 * - 2026-10-04: PERSPECTIVE merge — added `PERSPECTIVE.MANDATE`/`TENSE_MANDATE`; `render_core_protocols` folds `LAYER_TENSE.*` selections into the single `<PERSPECTIVE person tense>` element (tense attr + composed command + mandate) and no longer emits a `<LAYER_TENSE>` block; `<PERSPECTIVE>` now also renders for tense-only modes (no `person` attr then).
 * - 2026-10-04: Simplified LAYER_TENSE to three reusable tenses (PAST/PRESENT/FUTURE) - ETERNAL merges into PRESENT and every atom is phrased as a generic writing rule with no field references, usable anywhere in the application.
 * - 2026-10-04: PERSPECTIVE is now the single tense/person authority - added LAYER_TENSE (per-layer ETERNAL/PRESENT/PAST/FUTURE atoms) plus resolve_layer_tense_protocol, and render_core_protocols renders selected layer-tense atoms as one <LAYER_TENSE> block (POV.* still only via pov_protocol).
 * - 2026-10-01: Repatriated MACRO_DIRECTIVES and resolve_macro_directive to PROTOCOL_LIBRARY.MACROS per Layer 3 prompt architecture.
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
