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
 * - Instruction grammar (Track 0.1): one XML tag per instruction block, list-shaped bodies, no per-step tags;
 *   `@` output vocabulary lives only in bracket directives and macro rules (Track 0.2).
 * ============================================================================
 */

import { prompt_escape, render_xml_tag, interpolate_tokens } from "@utils";
import { render_narrative_style_xml, render_visual_style_xml } from "./style.js";
import { render_alternation_protocol } from "./reflex.js";
import { DYNAMICS_FRAGMENTATION_THRESHOLD } from "../temporal.js";

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
const MACRO_TOKEN_RULE = " Emit @-tokens only inside bracket directives — never in narrative prose.";

export const PROTOCOL_LIBRARY = Object.freeze({
  // ── 1.1 Shared Grounding & Core-Prose Scaffold (<CORE_PROTOCOLS> bodies) ──
  CORE_PROTOCOLS: Object.freeze({
    PERSPECTIVE: Object.freeze({
      TENSE: Object.freeze({
        PRESENT: Object.freeze({ tag: "TENSE", body: "Write strictly in the present tense." }),
        PAST: Object.freeze({ tag: "TENSE", body: "Write strictly in the past tense." }),
        FUTURE: Object.freeze({ tag: "TENSE", body: "Write strictly in the active future tense." }),
      }),
      POV: Object.freeze({
        FIRST: Object.freeze({
          tag: "POV",
          body: "Write strictly in first-person ('I', 'me', 'my'). Describe actions and sensations through your own eyes—never use third-person pronouns or your character name.",
        }),
        THIRD: Object.freeze({
          tag: "POV",
          body: "Write strictly in third-person limited ('he', 'she', 'they', or character name). Never use first-person pronouns in narrative prose.",
        }),
      }),
    }),
    PROSE_DISCIPLINE: Object.freeze({
      TYPOGRAPHY: Object.freeze({
        tag: "TYPOGRAPHY",
        body: `Balance interior reflection against physical impact and speech: prefer localized objects over repetitive posture tags. Maintain lingering sensory conditions across scene shifts. Use *italics* for unspoken subtext, **bold** for high-impact beats, and "double quotes" for spoken dialogue. Omit meta-commentary, preambles, headers, or user echoes. End on a complete sentence. Never emit @-tokens outside bracket directives in narrative prose.`,
      }),
      SENTENCE_FORMULAS: Object.freeze({
        tag: "SENTENCE_FORMULAS",
        body: `Eliminate synthetic sentence formulas: denial-then-affirmation ('X did not just Y; it Z'd'), antithetical formulas ('Not X, but Y'), symmetrical binary comparisons, appositive dialogue sound tags, and formulaic action-dialogue sandwiches.`,
      }),
      SCENE_MOMENTUM: Object.freeze({
        tag: "SCENE_MOMENTUM",
        body: `State actions directly and keep the scene moving; never stall with permission loops ('Can I ask a question?'), teasing secrets, or begging quotas.`,
      }),
      CLICHES: Object.freeze({
        tag: "CLICHES",
        body: `Prohibit cliché clusters such as 'spoke volumes', 'a testament to', 'tapestry of', 'shivers down the spine', 'unspoken understanding', 'dance of shadows', and Wattpad dominance tropes ('feisty', 'playing with fire', 'death of me', 'mine').`,
      }),
      NATURAL_DIALOGUE: Object.freeze({
        tag: "NATURAL_DIALOGUE",
        body: `Keep spoken dialogue grounded, clipped, uneven, and interrupted. Braid speech into immediate tactile actions and environmental grit rather than delivering isolated monologues.`,
      }),
      SOMATIC_INTERFERENCE: Object.freeze({
        tag: "SOMATIC_INTERFERENCE",
        body: "Somatic Interference: Past entries marked with ■ represent degraded recall. Treat these as cognitive gaps or static—do not invent missing facts.",
      }),
    }),
  }),

  // ── 1.2 Sensory Optics Invariants (<CORE_PROTOCOLS> bodies) ────────────────
  OPTICS: Object.freeze({
    IMAGE_VOCABULARY: Object.freeze({
      tag: "IMAGE_VOCABULARY",
      body: "Enforce FLUX_T5_WEIGHTING — NEVER emit bracket weight math ('(x:1.3)', '((x))', '[x:0.4]'): FLUX/T5 reads words, not weights. Emphasize via descriptors, varied rephrasing, and attenuation phrasing ('faint', 'subtle touch of', 'barely visible in the distance'). Describe positive presence in frame ('softly moonlit glade' not 'no harsh sunlight'); confine negative_prompt to global quality artifacts.",
    }),
    TEXT_RENDERING: Object.freeze({
      tag: "TEXT_RENDERING",
      body: 'Render on-screen text ONLY when the scene itself calls for it — signs, graffiti, titles, or UI that are part of the subject matter. Never add text artificially. When text IS present, spell it out exactly with placement, font, and color — never invent, garble, or approximate lettering, and never emit generic placeholders like "text" or "sign".',
    }),
    MANDATE: Object.freeze({
      tag: "MANDATE",
      body: "Convert narrative intent into a structured image prompt payload depicting {subject_description}.",
    }),

    SUBJECT_RULES: Object.freeze({
      DYNAMIC_OVERRIDES: Object.freeze({
        tag: "DYNAMIC_OVERRIDES",
        body: "DYNAMIC OVERRIDES: Follow a strict bottom-up hierarchy where the most recent (bottom-most) physical condition update ALWAYS overrides preceding static tags like «SHIRT» or «JACKET». If a conflicting state appears later (e.g. 'no clothes' then later 'shirt: white'), the most recent/latest state wins.",
      }),
      GARMENT_ANATOMY: Object.freeze({
        tag: "GARMENT_ANATOMY",
        body: "GARMENT ANATOMY: When rendering specialized or revealing garments (e.g., jockstraps, thongs, harnesses), explicitly specify their physical mechanics and bare skin exposure in natural prose. For a jockstrap, describe: 'wearing an athletic jockstrap featuring a supportive front pouch, open sides and back with bare exposed butt cheeks, and dual wide elastic straps circling under the glutes/thighs'. For thongs, describe: 'a narrow string back leaving the rear completely bare'. Never allow jockstraps to collapse into generic briefs or full-coverage shorts.",
      }),
      IDENTIFIERS: Object.freeze({
        tag: "IDENTIFIERS",
        body: 'IDENTIFIERS: Always explicitly state gender and physical identifiers (e.g., "a handsome young male high-elf man").',
      }),
      CREATURE_DISAMBIGUATION: Object.freeze({
        tag: "CREATURE_DISAMBIGUATION",
        body: 'CREATURE DISAMBIGUATION: Never use bare animal/creature proper names (e.g., "Beast"). Translate to explicit physical traits (e.g., "a massive grey-green male orc warrior").',
      }),
      SIGNATURE_COLORS: Object.freeze({
        tag: "SIGNATURE_COLORS",
        body: "SIGNATURE COLORS: Every character's distinctive visual anchors — declared hair color AND length, eye color, skin markings, and signature accent colors — are non-negotiable. Copy them EXACTLY as written in the ENTITIES sheet; never recolor, lengthen, shorten, or substitute them, and never derive a subject's hair or eye color from the environment (silver fog, twilight, moonlight), the lighting, or accessories (e.g., silver jewelry). If the sheet declares a specific hair color or length, the output prompt MUST state that exact value.",
      }),
    }),

    SOLO_FRAME: Object.freeze({
      tag: "SOLO_FRAME",
      body: "**SOLO FRAME PROTOCOL.** Isolated single-subject portrait. No secondary characters, no story scene context. The backdrop must be drawn solely from the subject's own identity and signature colors.",
    }),
    ENVIRONMENTAL_SCALE: Object.freeze({
      tag: "ENVIRONMENTAL_SCALE",
      body: "**AFFIRMATIVE ENVIRONMENTAL SCALE.** Focus completely on vast landscape architecture, atmospheric density, weather effects, and physical spatial structures.",
    }),
    BACKGROUND: Object.freeze({
      tag: "BACKGROUND",
      body: "You MUST synthesize an evocative, atmospheric background environment that naturally fits the personality, visual theme, and signature colors of {subject_name}.",
    }),

    FIRST_SENTENCE_MANDATE: Object.freeze({
      SCENE: Object.freeze({
        tag: "FIRST_SENTENCE_MANDATE",
        body: "Always establish vast environmental geometry, architectural structures, terrain scale, and atmospheric lighting in the VERY FIRST sentence before any secondary elements.",
      }),
      ENTITY: Object.freeze({
        tag: "FIRST_SENTENCE_MANDATE",
        body: "Always place main entities and active physical interactions in the VERY FIRST sentence.",
      }),
    }),
    SPATIAL_GEOMETRY: Object.freeze({
      tag: "SPATIAL_GEOMETRY",
      body: "Spatial orientation: direct depiction of focal elements, absolute geometry, camera angles, elevations, lighting positions, and depth layers without metaphor or narrative scaffolding.",
    }),
    ENVIRONMENTAL_GROUNDING: Object.freeze({
      tag: "ENVIRONMENTAL_GROUNDING",
      body: "Anchor scenes with concrete lighting sources, luminary fixtures, and physical surfaces.",
    }),
    SELFIE_DIRECTIVE: Object.freeze({
      tag: "SELFIE_DIRECTIVE",
      body: 'Generate a short, in-character social media caption inside "caption".',
    }),
    CINEMATOGRAPHY: Object.freeze({
      STAGING_DIRECTIVE: Object.freeze({
        tag: "STAGING_DIRECTIVE",
        body: "\n  Staging Directive: {visual_staging}",
      }),
      NARRATIVE_CONTEXT: Object.freeze({
        GROUP: Object.freeze({
          tag: "NARRATIVE_CONTEXT",
          body: "\n  Group Mandate: Feature both {ai_name} and {user_name} engaged together in their active positions within the fractal environment.",
        }),
        CHARACTER_IN_SCENE: Object.freeze({
          tag: "NARRATIVE_CONTEXT",
          body: "\n  Character In Scene: Depict {character_name} situated directly within {setting_name}.",
        }),
      }),
    }),
  }),

  // ── 1.3 Entity Macro Directives ─────────────────────────────────────────────
  MACROS: Object.freeze({
    CHARACTER: Object.freeze({
      tag: "MACRO",
      body: `${MACRO_PREFIX}${MACRO_SUBJECTS.CHARACTER}${MACRO_SUFFIX}${MACRO_PRONOUN_RULE}${MACRO_TOKEN_RULE}`,
    }),
    FRACTAL: Object.freeze({
      tag: "MACRO",
      body: `${MACRO_PREFIX}${MACRO_SUBJECTS.FRACTAL}${MACRO_SUFFIX}${MACRO_TOKEN_RULE}`,
    }),
    SORTING: Object.freeze({
      tag: "MACRO",
      body: `${MACRO_PREFIX}${MACRO_SUBJECTS.SORTING}${MACRO_SUFFIX}${MACRO_TOKEN_RULE}`,
    }),
  }),
});

/**
 * Resolves the macro placeholder directive according to the entity type or mode.
 * @param {string} [entity_type="character"]
 * @returns {string}
 */
export function resolve_macro_directive(entity_type = "character") {
  if (entity_type === "sorting") return PROTOCOL_LIBRARY.MACROS.SORTING.body;
  return entity_type === "fractal" ? PROTOCOL_LIBRARY.MACROS.FRACTAL.body : PROTOCOL_LIBRARY.MACROS.CHARACTER.body;
}

// ============================================================================
// [SECTION 2: DYNAMIC PROTOCOL COMPILER]
// ============================================================================

/**
 * Resolves one dotted registry key to its leaf tag + body, or null when the
 * key names a branch or nothing at all. The single exact matcher for static
 * emission — substring/prefix guessing lives only in plan selection.
 *
 * @param {string} protocol_key - Dotted registry path (e.g. "OPTICS.IMAGE_VOCABULARY")
 * @param {Record<string, any>} [values={}] - Interpolation bag for {placeholder} atoms
 * @returns {{ tag: string, body: string }|null}
 */
function resolve_static_rule(protocol_key, values = {}) {
  const normalized_key = String(protocol_key).trim().toUpperCase();
  const parts = normalized_key.split(".");
  const leaf = parts.reduce((o, k) => o?.[k], PROTOCOL_LIBRARY);
  if (!leaf) return null;
  const tag = typeof leaf === "object" && leaf.tag ? leaf.tag : parts.at(-1);
  const raw_body = typeof leaf === "object" && leaf.body ? leaf.body : String(leaf);
  return { tag, body: interpolate_tokens(raw_body, values) };
}

// ============================================================================
/**
 * Resolves one optics atom against PROTOCOL_LIBRARY.OPTICS with values
 * interpolation (retires sensory.js get_sensory_atom; key names kept).
 * Accepts OPTICS-prefixed or bare keys; missing keys resolve to "".
 * @param {string|null|undefined} key
 * @param {Record<string, any>} [values={}]
 * @returns {string}
 */
export function resolve_optics_atom(key, values = {}) {
  const key_text = String(key == null ? "" : key);
  const full_key = key_text.slice(0, 7) === "OPTICS." ? key_text : "OPTICS." + key_text;
  const leaf = full_key.split(".").reduce((o, k) => o?.[k], PROTOCOL_LIBRARY);
  if (!leaf) return "";
  const raw_body = typeof leaf === "object" ? leaf.body || "" : String(leaf);
  return interpolate_tokens(raw_body, values);
}

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
  player_name = null,
  constraints_xml = null,
} = {}) {
  const protocol_list = Array.isArray(protocols) ? protocols : typeof protocols === "string" ? protocols.split(",").map((item) => item.trim()) : [];

  const should_include = (key) => protocol_list.length === 0 || protocol_list.some((protocol_item) => protocol_item.includes(key));

  const resolved_pov_protocol = pov_protocol || null;

  const pov_key = resolved_pov_protocol ? String(resolved_pov_protocol).split(".").pop() : null;
  const perspective = PROTOCOL_LIBRARY.CORE_PROTOCOLS.PERSPECTIVE;
  const pov_atom = pov_key ? perspective.POV[pov_key] : null;
  const pov_body = pov_atom ? (typeof pov_atom === "object" ? pov_atom.body : String(pov_atom)) : "";
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
  const layer_tense_rules = layer_tense_keys
    .map((protocol_key) => {
      const item = perspective.TENSE[String(protocol_key).split(".").pop()];
      return item ? (typeof item === "object" ? item.body : String(item)) : null;
    })
    .filter(Boolean);

  const perspective_tense =
    layer_tense_rules.length > 1 ? "LAYER" : layer_tense_rules.length === 1 ? String(layer_tense_keys[0]).split(".").pop() : "PRESENT";
  const default_present_atom = perspective.TENSE.PRESENT;
  const default_present_body = typeof default_present_atom === "object" ? default_present_atom.body : String(default_present_atom);
  const tense_command =
    layer_tense_rules.length > 1
      ? `Match tense to the layer being written: ${layer_tense_keys
          .map((key) => {
            const short_key = String(key).split(".").pop();
            const tense_label = short_key === "PRESENT" ? "present" : short_key === "PAST" ? "past" : "active future";
            return `${short_key.toLowerCase()} layer in the ${tense_label} tense`;
          })
          .join("; ")}.`
      : layer_tense_rules[0] || (should_include("TENSE.PRESENT") ? default_present_body : "");

  const core = PROTOCOL_LIBRARY.CORE_PROTOCOLS;
  const disciplines = Object.entries(core.PROSE_DISCIPLINE)
    .filter(([tag]) => should_include(`PROSE_DISCIPLINE.${tag}`))
    .map(([tag, atom]) => ({ tag, body: typeof atom === "object" ? atom.body : String(atom) }));

  const active_visual_style = visual_style || (Object.keys(engine_tokens).length > 0 ? style : null);
  const style_kind = active_visual_style ? "visual" : "narrative";
  const style_xml = active_visual_style
    ? render_visual_style_xml(active_visual_style, engine_tokens)
    : render_narrative_style_xml(style, player_name);

  const format_unified_perspective = (person_key, tense_key, pov_text, tense_cmd) => {
    const tense_phrases = {
      PRESENT: "in the present tense",
      PAST: "in the past tense",
      FUTURE: "in the active future tense",
    };
    const phrase = tense_phrases[tense_key];
    if (person_key === "THIRD" && phrase) {
      return `Narrate in third-person limited ('he', 'she', 'they', or character name) ${phrase}. Never use first-person pronouns in narrative prose.`;
    }
    if (person_key === "FIRST" && phrase) {
      return `Narrate in first-person ('I', 'me', 'my') ${phrase}. Describe actions and sensations through your own eyes—never use third-person pronouns or your character name.`;
    }
    if (person_key === "THIRD" && tense_key === "LAYER") {
      return `Narrate in third-person limited ('he', 'she', 'they', or character name). Never use first-person pronouns in narrative prose. ${tense_cmd}`.trim();
    }
    if (person_key === "FIRST" && tense_key === "LAYER") {
      return `Narrate in first-person ('I', 'me', 'my'). Describe actions and sensations through your own eyes—never use third-person pronouns or your character name. ${tense_cmd}`.trim();
    }
    return [pov_text, tense_cmd].filter(Boolean).join(" ");
  };

  const perspective_body = format_unified_perspective(person, perspective_tense, pov_body, tense_command);

  return Object.freeze({
    static_rules: Object.freeze(static_rules.map((rule) => Object.freeze(rule))),
    perspective:
      resolved_pov_protocol || layer_tense_rules.length > 0
        ? Object.freeze({ person, tense: perspective_tense, pov_body, tense_command, body: perspective_body })
        : null,
    alternation: Boolean(has_alternation && should_include("ALTERNATION_OPTIONS")),
    style_kind,
    style_xml,
    disciplines: Object.freeze(disciplines.map((discipline) => Object.freeze(discipline))),
    constraints_xml: constraints_xml || null,
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
          children: [prompt_escape(plan.perspective.body || plan.perspective.pov_body)],
          inline: true,
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
    plan.constraints_xml,
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

/**
 * Resolves the somatic interference protocol key when Chaos or Entropy exceeds threshold (Track 8 / 5.3).
 * @param {{ chaos?: number, entropy?: number }|null|undefined} dynamics
 * @returns {string|null}
 */
export function resolve_somatic_interference_protocol(dynamics) {
  const chaos = Number(dynamics?.chaos);
  const entropy = Number(dynamics?.entropy);
  if (
    (Number.isFinite(chaos) && chaos > DYNAMICS_FRAGMENTATION_THRESHOLD) ||
    (Number.isFinite(entropy) && entropy > DYNAMICS_FRAGMENTATION_THRESHOLD)
  ) {
    return "CORE_PROTOCOLS.PROSE_DISCIPLINE.SOMATIC_INTERFERENCE";
  }
  return null;
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
  player_name = null,
  constraints_xml = null,
} = {}) {
  return render_protocol_plan(
    resolve_protocol_plan({
      protocols,
      pov_protocol,
      style,
      visual_style,
      engine_tokens,
      has_alternation,
      player_name,
      constraints_xml,
    }),
  );
}
