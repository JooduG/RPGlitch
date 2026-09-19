/**
 * src/intelligence/modules/task.js
 * ============================================================================
 * 🎯 TASK MODULE — Turn Execution, Action Directives, Somatics, Pacing & Staging
 * ============================================================================
 *
 * Compiles the Layer 6 (<TASK>) turn execution block and instruction envelopes
 * across the RPGlitch simulation lifecycle. Symmetrically aligns with the prompt
 * manifest architecture in `src/intelligence/prompts.js`:
 *
 * ── Multi-Shot Simulation Lifecycle Mapping ─────────────────────────────────
 * • Section 1: Unified Task Directives & Protocols Catalog (TASK_LIBRARY)
 *              (Protocols, Director, Continuum, Prose, Sorting directives)
 * • Section 2: Prose Reflex & Input Reaction Engine
 *              (Pacing classification, environmental hints, delivery posture, currents, inputs)
 * • Section 3: Universal Task Envelope Compiler (render_task)
 *              (Universal dispatcher across director, continuum, enhancement, sorting, prose)
 *
 * Architecture & Design Laws:
 * - Layer 6 Sovereignty: Single source of truth for turn-level prompt compilation.
 * - Symmetrical Manifest Resonance: 1:1 reflection of prompt manifest modes.
 * - Unidirectional layer flow: pure string and structured XML compilation.
 * - Zero Sibling Imports: Layout primitives imported exclusively from @utils.
 * - Strict Full-Name Domain Nomenclature: Zero clipped tokens or single-letter identifiers.
 * - Zero Backwards Compatibility (P4): Pure, uncompromising modern architecture.
 * ============================================================================
 */

import { escape_xml, prompt_escape, inline_or_block, wrap_tag, indent_all, render_xml_tag } from "@utils";
import { extract_style_dna, STYLE_MOTIF_REGISTRY } from "@data";
import { PROSE_FORMAT, format_json_return, format_optics_json_return } from "./format.js";

// ============================================================================
// [SECTION 1: UNIFIED TASK DIRECTIVES & PROTOCOLS CATALOG]
// ============================================================================

export const TASK_LIBRARY = Object.freeze({
  // ── 1.1 Turn Foundations, Pacing & Cognition Protocols ─────────────────────
  PROTOCOLS: Object.freeze({
    PACING: Object.freeze({
      TERSE: `<PACING mode="TERSE">Brief, weighted reply in 1-2 sharp beats. Zero padding.</PACING>`,
      ADAPTIVE: `<PACING mode="ADAPTIVE">A reply of 2-4 sentences—substantive, driving the scene forward.</PACING>`,
      EXPANSIVE: `<PACING mode="EXPANSIVE">Expand to match message breadth; close on one decisive hook.</PACING>`,
    }),

    RECENCY: Object.freeze({
      RHYTHM: (sentence_rhythm) =>
        sentence_rhythm ||
        "Hold temperament; resist passive compliance. Match conversational scale and build situational friction rather than rushing resolution.",
      DRIVE: (has_input) =>
        has_input
          ? "Advance the scene in response to <INPUT />: drive the beat forward independently and end on an unresolved hook demanding response."
          : "Take active initiative: drive events forward on your own terms through decisive actions and end on an unresolved hook demanding response.",
    }),

    THINK_FORMAT: (emotional_grounding) => {
      const grounding = emotional_grounding || "Hold your established temperament.";
      return `Begin response with <THINK> (under 200 words). Execute internal reasoning across 4 sequential beats:
<BEAT id="VISCERAL_IMPACT" step="1">Immediate non-verbal reaction to the <INPUT /> element.</BEAT>
<BEAT id="EMOTIONAL_CALIBRATION" step="2">${grounding}</BEAT>
<BEAT id="STRATEGIC_DRIVE" step="3">How active <AGENDA /> and/or <TRAJECTORY /> navigates immediate friction.</BEAT>
<BEAT id="CADENCE_TEST" step="4">Draft a dialogue line before generating outward prose.</BEAT>
Close with </THINK> before generating narrative prose.`;
    },

    THINK_NARRATOR:
      "Begin response with <THINK>. All internal calculations, scene shifts, and headers must remain inside this block in the conversation language. Close with </THINK> before narrative prose.",
  }),

  // ── 1.2 Keyword Directives (Director & Sensory Optics) ─────────────────────
  KEYWORD_DIRECTIVES: Object.freeze({
    DIRECTOR: `- Function: Select 1-5 keywords from the list below to steer the next speaker's physical tells and scene tone.
- Neutral state: Emit "[]" if no keywords apply.
- Whitelist rule: Select strictly from the list below. Never alter or invent keywords.`,
    OPTICS: "Integrate 2-4 appropriate keywords from below.",
  }),

  // ── 1.3 Shot 1: Directorial Staging & Evaluation Rules (director) ───────────
  DIRECTOR: Object.freeze({
    ENVIRONMENTAL_HINT:
      '<INPUT_NOTE>Non-verbal environmental action. Strongly consider setting "speaker" to "fractal" to narrate the setting, unless AI character should react directly.</INPUT_NOTE>',

    EVALUATE: (has_input) => `Evaluate state mutations caused by ${has_input ? "<INPUT />" : "the current situation"}.`,
    ROUND_ONE: 'Round 1 follows the Fractal prologue, so next_action MUST be "AI_CHARACTER".',
    USER_PERSONA_LOCK:
      '"USER_PERSONA" (or player character name) is never a valid next_action; the Director never speaks for the player. Valid actions are strictly: "AI_CHARACTER", "FRACTAL", "npc:<id>", or { "genesis": ... }.',
  }),

  // ── 1.4 Shot 2A: Prose Turn Directives (character / scene / ghostwrite) ─────
  PROSE: Object.freeze({
    CHARACTER: Object.freeze({
      FIRST_CONTACT:
        "First encounter: characters are strangers. Acknowledge visual first impressions, physical distance, and tone before full dialogue.",
      NPC_BOUNDARY: (name) =>
        `Respond strictly as ${name} (supporting character). Own only your voice, actions, and perspective; never speak for others or resolve overarching quests. Write third-person limited, present tense; end on a natural beat.`,
    }),

    SCENE: Object.freeze({
      PROLOGUE: `You see everything. Open the scene. Use thinking to establish: What does this Fractal demand? What brought <AI_CHARACTER> and <USER_PERSONA> here? Unless context explicitly states otherwise, treat as strangers.
Narrative Sequence:
1. Present the Fractal atmosphere and current state.
2. Place <USER_PERSONA> inside, connecting them via their profile thread.
3. Place <AI_CHARACTER> inside and establish their current action.
4. Trigger the encounter. End the prologue immediately before interaction begins.
Strictly zero spoken dialogue or quote marks. No dialogue.`,
      EPILOGUE: `You see everything. Close the scene. Evaluate unresolved threads and active agendas in thinking. Depict environmental aftermath and physical changes without forcing player physical surrender. End on lingering sensation, not summary. Strictly zero spoken dialogue or quote marks. No dialogue.`,
      COLLAPSE: `You see everything. Close the scene on irrevocable tragedy. Weigh permanent loss in thinking. Depict aftermath and environmental scars without forcing player physical surrender or unearned closure. End on enduring sensory silence. Strictly zero spoken dialogue or quote marks. No dialogue.`,
      CONTINUATION: `You are the Fractal itself, narrating the scene. Narrate through ambient physics, sensory textures, and environmental shifts in reaction to recent events. Never puppeteer <AI_CHARACTER> or <USER_PERSONA>. End on one dominant hook (decisive statement, single action, or deliberate silence). Zero bracket labels.`,
    }),
  }),

  // ── 1.4 Shot 2B: Continuum Caretaker Consolidation Directives (continuum) ──
  CONTINUUM: Object.freeze({
    TARGET_FOCUS: (target_name) =>
      `TARGET FOCUS: Consolidate state and extract relational vectors for ${target_name}.\nAnalyze recent turns in <INPUT_HISTORY>. Synthesize memories, update physical appearance, record active state of mind, and log directed relational bonds.`,
    MANDATE: `EXECUTION MANDATE:
1. Memory Formation: Extract 1-3 anchored memories in past tense. Empty list if nothing noteworthy transpired.
2. Dynamic State: Update physical and non_physical condition.
3. Future Trajectory: Consolidate active standing agenda in future tense.
4. Relational Graph: Emit plain directed vectors: "Source -> Target: Dynamic description".`,
  }),

  // ── 1.5 Tool B: Profile Structuring & Ingestion Directives (sorting) ───────
  SORTING: Object.freeze({
    REDISTRIBUTE: `REDISTRIBUTE: The source profile may have content in the wrong field. Relocate each fact to its correct field (e.g., temporary states belong under 'state_of_mind', transient moods under 'current_look'). Never move content into or out of 'description' (internal notes). Preserve factual truth; update only field locations and phrasing. Strip XML tags, markdown bolding, or headers from values—output clean prose.`,
    INGESTION: `SOURCE OF TRUTH & INGESTION RULES:
- Source text is absolute truth. Map details faithfully into schema fields.
- For absent details (attire, motivations): synthesize lore-consistent defaults.
- Never emit null, undefined, or empty strings.`,
  }),

  // ── 1.6 Shot 3: Sensory Cortex & Visual Directives (optics) ───────────────
  OPTICS: Object.freeze({
    MANDATE: (subject) => `<MANDATE>Convert narrative intent into a structured image prompt payload depicting ${subject}.</MANDATE>`,
    THINK_FORMAT: `<THINK_FORMAT>In "_thought_process", calibrate:
1. Focal subject & identity traits (strip proper names)
2. Spatial layers (foreground, focal subject, background)
3. Light sources, color palette, and textures from active style
4. Wardrobe mechanics & exposure checks</THINK_FORMAT>`,
    FIRST_SENTENCE_MANDATE: (tier = "") =>
      tier === "story_scene"
        ? "<FIRST_SENTENCE_MANDATE>Always establish vast environmental geometry, architectural structures, terrain scale, and atmospheric lighting in the VERY FIRST sentence before any secondary elements.</FIRST_SENTENCE_MANDATE>"
        : "<FIRST_SENTENCE_MANDATE>Always place main entities and active physical interactions in the VERY FIRST sentence.</FIRST_SENTENCE_MANDATE>",
    SPATIAL_GEOMETRY:
      "<SPATIAL_GEOMETRY>Spatial orientation: direct depiction of focal elements, absolute geometry, camera angles, elevations, lighting positions, and depth layers without metaphor or narrative scaffolding.</SPATIAL_GEOMETRY>",
    SELFIE_DIRECTIVE: '<SELFIE_DIRECTIVE>Generate a short, in-character social media caption inside "caption".</SELFIE_DIRECTIVE>',
    SUBJECT_TIERS: Object.freeze({
      solo_entity:
        "an isolated solo portrait of the subject, self-contained framing drawn entirely from the subject's own identity, appearance, and signature colors",
      story_scene: "an expansive landscape environment, architecture, or interior space capturing environmental depth and natural forces",
      story_entities: "a cinematic group shot featuring both the AI character and user persona together within the fractal environment",
      story_character: "a character framed within their environment, emphasizing their presence with an evocative background setting",
    }),
    CINEMATOGRAPHY: Object.freeze({
      PRESETS: Object.freeze({
        WIDE_ENVIRONMENTAL: Object.freeze({
          mode: "Wide Environmental",
          tokens: "wide-angle environmental shot, deep spatial composition, atmospheric scale, full silhouette",
        }),
        DUTCH_LOW_ANGLE: Object.freeze({
          mode: "Dutch / Low-Angle",
          tokens: "dutch angle composition, low-angle perspective, imposing scale, dramatic lighting contrast",
        }),
        INTIMATE_CLOSE_UP: Object.freeze({
          mode: "Intimate Close-Up",
          tokens: "tight close-up portrait, shallow depth of field, sharp focus on eyes, macro expression detail",
        }),
        MEDIUM_ACTION: Object.freeze({
          mode: "Medium Action",
          tokens: "medium shot, waist-up framing, dynamic posture, clear wardrobe & prop details",
        }),
        SOLO_PORTRAIT: Object.freeze({
          mode: "Solo Portrait",
          tokens: "medium portrait framing, waist-up composition, distinctive wardrobe, signature atmospheric backdrop",
        }),
      }),
      STAGING_DIRECTIVE: (visual_staging) => (visual_staging ? `\n  Staging Directive: ${prompt_escape(visual_staging)}` : ""),
      NARRATIVE_CONTEXT: Object.freeze({
        GROUP: (ai_name = "AI", user_name = "User") =>
          `\n  Group Mandate: Feature both ${prompt_escape(ai_name)} and ${prompt_escape(user_name)} engaged together in their active positions within the fractal environment.`,
        CHARACTER_IN_SCENE: (character_name = "Subject", setting_name = "Setting") =>
          `\n  Character In Scene: Depict ${prompt_escape(character_name)} situated directly within ${prompt_escape(setting_name)}.`,
      }),
    }),
  }),

  // ── 1.7 Structured JSON Return Directive ────────────────────────────────────
  JSON_RETURN: (schema, indent = "    ") => format_json_return(schema, indent),
});

// ============================================================================
// [SECTION 2: PROSE REFLEX & INPUT REACTION ENGINE]
// ============================================================================

const DIALOGUE_QUOTES_PATTERN = /["'“”‘’]/;

const ACTION_VERBS_PATTERN =
  /\b(?:approach|ascend|bend|circle|climb|close|dash|descend|draw|draws|edge|enter|examine|follow|gaze|grab|grabs|gripp?|halt|kneel|leap|linger|listen|lower|move|nod|nods|observe|open|opens|pause|peer|press|pull|pulls|push|pushes|raise|raises|reach|rest|run|say|says|scan|set|settle|shake|shakes|shout|shouts|sit|sits|slam|slip|smell|stand|stands|stare|step|steps|strike|study|sweep|swing|take|takes|trail|turn|turns|wait|walk|watch|whisper|whispers)\b/i;

const SPATIAL_NOUNS_PATTERN =
  /\b(?:alcove|alley|altar|arch|belly|bridge|cave|ceiling|chamber|column|conduit|corridor|court|crevice|cylinder|deeps|door|field|floor|forest|gate|gear|hall|keep|ledge|light|lock|mechanism|mouth|passage|rain|river|rock|room|seal|shadow|sky|spillway|stair|stone|street|threshold|tower|tunnel|vault|wall|water|wheel|wind|window|yard)\b/i;

/**
 * Pacing calibration: classifies user message scale and returns kinetic length directive.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function build_pacing_directive(input) {
  const pacing = TASK_LIBRARY.PROTOCOLS.PACING;
  const text = String(input || "").trim();
  if (!text) return pacing.TERSE;

  const character_count = text.length;
  const word_count = text.split(/\s+/).filter(Boolean).length;
  if (character_count >= 300 || word_count >= 60) return pacing.EXPANSIVE;
  if (character_count <= 40 || word_count <= 8) return pacing.TERSE;

  return pacing.ADAPTIVE;
}

/**
 * Detects a non-verbal, environmental user turn and returns a hint nudging the Director.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function render_environmental_hint(input) {
  if (!input?.trim()) return "";
  if (DIALOGUE_QUOTES_PATTERN.test(input)) return "";
  if (!ACTION_VERBS_PATTERN.test(input) && !SPATIAL_NOUNS_PATTERN.test(input)) return "";
  return TASK_LIBRARY.DIRECTOR.ENVIRONMENTAL_HINT;
}

/**
 * Prose Reflex (Delivery Posture) — kinetic reaction envelope calibrated to user input and active voice.
 * @param {any} snapshot - { dynamics?, style?, speaking_style?, speaker? }
 * @param {string} [input] - current user action / scene beat
 * @param {string} [speaking_style=""] - active speaking style register override
 * @returns {string}
 */
export function render_prose_reflex(snapshot, input, speaking_style = "") {
  const style_dna = extract_style_dna(snapshot?.style || null);
  const { RHYTHM, DRIVE } = TASK_LIBRARY.PROTOCOLS.RECENCY;
  const pacing = build_pacing_directive(input);
  const rhythm = RHYTHM(style_dna.sentence_rhythm);
  const drive = DRIVE(Boolean(String(input || "").trim()));
  const resolved_speaking_style = speaking_style || snapshot?.speaking_style || snapshot?.speaker?.speaking_style || "";

  const children = [
    pacing,
    `<RHYTHM>${prompt_escape(rhythm)}</RHYTHM>`,
    `<DRIVE>${prompt_escape(drive)}</DRIVE>`,
    resolved_speaking_style
      ? `<VOICE mode="${escape_xml(String(resolved_speaking_style).toLowerCase())}">Deliver dialogue matching the ${escape_xml(String(resolved_speaking_style))} speaking register.</VOICE>`
      : null,
  ].filter(Boolean);

  return render_xml_tag({
    tag: "DELIVERY_POSTURE",
    children,
    indent: 0,
    child_indent: 4,
    separator: "\n",
  });
}

/**
 * Renders the <CURRENTS> block (sensory experience + subtext).
 * @param {any} style_dna - resolved NarrativeStyle DNA
 * @param {string} somatic_inner
 * @returns {string}
 */
export function render_task_currents(style_dna, somatic_inner) {
  const children = [
    style_dna?.sensory_order ? `<SENSORY_EXPERIENCE>${prompt_escape(style_dna.sensory_order)}</SENSORY_EXPERIENCE>` : null,
    String(somatic_inner || "").trim() ? wrap_tag("SUBTEXT", somatic_inner, 0) : null,
  ].filter(Boolean);

  return children.length
    ? render_xml_tag({
        tag: "CURRENTS",
        children,
        indent: 0,
        child_indent: 4,
        separator: "\n",
      })
    : "";
}

/**
 * Renders the turn block's `<INPUT origin="...">` tag.
 * @param {{ input?: string, input_origin?: string|null }} [parameters]
 * @returns {string}
 */
export function render_task_input({ input = "", input_origin = null } = {}) {
  if (!String(input || "").trim()) return "";
  const origin = String(input_origin || "USER");
  const content = prompt_escape(String(input).trim());
  return `<INPUT origin="${escape_xml(origin)}">${inline_or_block(content, 2)}</INPUT>`;
}

/**
 * Renders the canonical <KEYWORD_DIRECTIVES> XML block for Director or Optics.
 * Supports passing either raw keywords XML or raw keywords string, with mode-specific directive resolution.
 *
 * @param {string} available_keywords_content - Raw XML or escaped keyword string
 * @param {string|{ mode?: 'DIRECTOR'|'OPTICS', directive?: string, indent?: number }} [options_or_directive="DIRECTOR"]
 * @returns {string} Formatted <KEYWORD_DIRECTIVES> block
 */
export function render_keyword_directives_xml(available_keywords_content, options_or_directive = "DIRECTOR") {
  const options =
    typeof options_or_directive === "string"
      ? options_or_directive === "OPTICS" || options_or_directive === "DIRECTOR"
        ? { mode: options_or_directive }
        : { directive: options_or_directive }
      : options_or_directive || {};

  const directive =
    options.directive || (options.mode === "OPTICS" ? TASK_LIBRARY.KEYWORD_DIRECTIVES.OPTICS : TASK_LIBRARY.KEYWORD_DIRECTIVES.DIRECTOR);

  const indent = options.indent ?? 2;

  const inner_content = String(available_keywords_content || "").trim();
  const available_tag = inner_content.startsWith("<AVAILABLE_KEYWORDS>")
    ? inner_content
    : `<AVAILABLE_KEYWORDS>${inner_content}</AVAILABLE_KEYWORDS>`;

  return render_xml_tag({
    tag: "KEYWORD_DIRECTIVES",
    children: [directive, available_tag],
    indent,
    child_indent: 2,
    separator: "\n",
  });
}

/**
 * Resolves character prose action directive across standard, NPC, and stranger encounter turns.
 * @param {Object} [parameters]
 * @param {string} [parameters.speaker_name=""]
 * @param {boolean} [parameters.is_npc=false]
 * @param {boolean} [parameters.is_first_contact=false]
 * @returns {string}
 */
export function resolve_character_action_directive({ speaker_name = "", is_npc = false, is_first_contact = false } = {}) {
  return [
    is_first_contact ? TASK_LIBRARY.PROSE.CHARACTER.FIRST_CONTACT : null,
    is_npc ? TASK_LIBRARY.PROSE.CHARACTER.NPC_BOUNDARY(speaker_name) : null,
  ]
    .filter(Boolean)
    .join("\n    ");
}

/**
 * Resolves scene / fractal narrative action directive (Prologue, Epilogue, Collapse, Continuation).
 * @param {Object} [parameters]
 * @param {string|null} [parameters.scene_template=null]
 * @param {boolean} [parameters.is_prologue=false]
 * @param {string|null} [parameters.conclusion_status=null]
 * @param {string} [parameters.input=""]
 * @returns {string}
 */
export function resolve_scene_action_directive({ scene_template = null, is_prologue = false, conclusion_status = null, input = "" } = {}) {
  if (is_prologue || scene_template === "PROLOGUE") {
    return `${TASK_LIBRARY.PROSE.SCENE.PROLOGUE}\n    Input: ${prompt_escape(String(input || "").trim() || "The scene begins.")}`;
  }

  const status = String(conclusion_status || "").toUpperCase();
  const template = scene_template || (status === "COLLAPSED" ? "COLLAPSE" : status ? "EPILOGUE" : "CONTINUATION");

  return TASK_LIBRARY.PROSE.SCENE[template] || TASK_LIBRARY.PROSE.SCENE.CONTINUATION;
}

/**
 * Resolves camera framing, scale tokens, and staging directives for Sensory Optics.
 * Generates dynamic camera framing tokens and context descriptions for Layer 6 (<TASK>).
 *
 * @param {Object} [parameters={}]
 * @returns {{ mode: string, tokens: string, narrative_context: string, visual_staging: string }}
 */
export function resolve_optics_cinematography({
  tier = "solo_entity",
  solo_subject = null,
  active_ai_character = null,
  active_user_persona = null,
  active_fractal_setting = null,
  main_entity = null,
  visual_staging = "",
} = {}) {
  const is_fractal_target = tier === "story_scene" || solo_subject?.type === "fractal";
  const ai_dynamics = active_ai_character?.dynamics || {};
  const intensity = Number(ai_dynamics.intensity ?? 50);
  const chaos = Number(ai_dynamics.chaos ?? 50);
  const affinity = Number(ai_dynamics.affinity ?? 50);

  const { PRESETS, STAGING_DIRECTIVE, NARRATIVE_CONTEXT } = TASK_LIBRARY.OPTICS.CINEMATOGRAPHY;
  let preset = PRESETS.MEDIUM_ACTION;

  if (is_fractal_target) {
    preset = PRESETS.WIDE_ENVIRONMENTAL;
  } else if (chaos >= 75) {
    preset = PRESETS.DUTCH_LOW_ANGLE;
  } else if (intensity >= 75 || affinity >= 75) {
    preset = PRESETS.INTIMATE_CLOSE_UP;
  } else if (tier === "solo_entity") {
    preset = PRESETS.SOLO_PORTRAIT;
  }

  const visual_staging_directive = STAGING_DIRECTIVE(visual_staging);
  const narrative_context_desc =
    tier === "story_entities"
      ? NARRATIVE_CONTEXT.GROUP(active_ai_character?.name || "AI", active_user_persona?.name || "User")
      : tier === "story_character" && active_fractal_setting && main_entity?.type !== "fractal" && main_entity !== active_fractal_setting
        ? NARRATIVE_CONTEXT.CHARACTER_IN_SCENE(main_entity?.name || "Subject", active_fractal_setting.name || "Setting")
        : "";

  return {
    mode: preset.mode,
    tokens: preset.tokens,
    narrative_context: narrative_context_desc,
    visual_staging: visual_staging_directive,
  };
}

// ============================================================================
// [SECTION 3: UNIVERSAL TASK ENVELOPE COMPILER]
// ============================================================================

/**
 * Universal Task Envelope Compiler (<TASK>).
 * Single unified dispatcher and renderer for all prompt modes across the simulation lifecycle:
 * - "director": Directorial staging, turn evaluation, keyword steering, or terse retry envelope.
 * - "continuum": Memory Forge temporal consolidation, trajectory synthesis, and relationship extraction.
 * - "enhancement" / "sorting": Structured task directive envelopes and schema contracts.
 * - default (story prose): Master multi-beat character/narrator cognition, currents, and prose reflex.
 *
 * @param {Object} [parameters={}]
 * @param {string} [parameters.mode] - "director" | "continuum" | "enhancement" | "sorting" | undefined
 * @param {string} [parameters.schema] - JSON schema contract
 * @param {number|string} [parameters.round] - simulation macro-round (director)
 * @param {string} [parameters.input] - user action / scene beat
 * @param {string} [parameters.last_ai_text] - previous AI turn content (director)
 * @param {boolean} [parameters.terse] - whether to emit terse retry envelope (director)
 * @param {string} [parameters.target_name] - entity focus name (continuum)
 * @param {Array<string|null|undefined|false>} [parameters.directives] - structured task directive blocks
 * @param {any} [parameters.config] - prompt-mode config record (story prose)
 * @param {string|null} [parameters.input_origin] - origin identifier (e.g., "USER", "SYSTEM")
 * @param {any} [parameters.style] - resolved NarrativeStyle definition
 * @param {string} [parameters.somatic_inner] - inner somatic subtext signals
 * @param {any} [parameters.snapshot] - physical dynamics and style snapshot
 * @param {string} [parameters.action_directive] - specific scene or character action directive
 * @param {string} [parameters.stability_lock] - stability lock instruction
 * @param {string} [parameters.speaking_style] - active speaking style register override
 * @returns {string}
 */
export function render_task({
  mode,
  schema = "",
  round = 1,
  input = "",
  last_ai_text = "",
  terse = false,
  target_name = "",
  directives = [],
  config,
  input_origin = null,
  style = null,
  somatic_inner = "",
  snapshot = null,
  action_directive = "",
  stability_lock = "",
  speaking_style = "",
  target_tier = "",
  input_intent = "",
  subject = "",
  think_format = "",
  cinematography = null,
  engine_tokens = null,
  keywords = [],
  is_selfie = false,
} = {}) {
  switch (mode) {
    case "director": {
      const output_format_content = schema ? TASK_LIBRARY.JSON_RETURN(schema, "  ") : "";
      const output_format_xml = output_format_content
        ? render_xml_tag({
            tag: "OUTPUT_FORMAT",
            attrs: { mode: "json" },
            children: [output_format_content],
            child_indent: 2,
          })
        : null;

      if (terse) {
        return render_xml_tag({
          tag: "TASK",
          children: [output_format_xml || TASK_LIBRARY.JSON_RETURN(schema, "  ")],
          indent: 0,
          child_indent: 2,
        });
      }
      const evaluation =
        TASK_LIBRARY.DIRECTOR.EVALUATE(!!input?.trim()) +
        (Number(round) <= 1 ? TASK_LIBRARY.DIRECTOR.ROUND_ONE : "") +
        ` ${TASK_LIBRARY.DIRECTOR.USER_PERSONA_LOCK}`;

      const input_xml = render_task_input({ input, input_origin: "USER" });
      const task_children = [evaluation, render_environmental_hint(input), output_format_xml].filter(Boolean);

      const parts = [
        input_xml ? input_xml.trim() : null,
        last_ai_text ? wrap_tag("AI_CHARACTER_LAST_TURN", indent_all(last_ai_text, 2), 0) : null,
        render_xml_tag({ tag: "TASK", children: task_children, indent: 0, child_indent: 4 }),
      ].filter(Boolean);

      return parts.join("\n");
    }

    case "continuum": {
      const output_format_xml = schema
        ? render_xml_tag({
            tag: "OUTPUT_FORMAT",
            attrs: { mode: "json" },
            children: [TASK_LIBRARY.JSON_RETURN(schema, "  ")],
            child_indent: 2,
          })
        : null;

      const items = [TASK_LIBRARY.CONTINUUM.TARGET_FOCUS(target_name), output_format_xml, TASK_LIBRARY.CONTINUUM.MANDATE].filter(Boolean);

      return render_xml_tag({ tag: "TASK", children: items, indent: 0, child_indent: 4, separator: "\n\n" });
    }

    case "optics": {
      const output_format_xml = schema
        ? render_xml_tag({
            tag: "OUTPUT_FORMAT",
            attrs: { mode: "json" },
            children: [format_optics_json_return(schema)],
            child_indent: 2,
          })
        : null;

      const subject_desc = subject || TASK_LIBRARY.OPTICS.SUBJECT_TIERS[target_tier] || TASK_LIBRARY.OPTICS.SUBJECT_TIERS.story_character;
      const mandate = TASK_LIBRARY.OPTICS.MANDATE(subject_desc);
      const target_tag = target_tier ? `<TARGET>${escape_xml(target_tier)}</TARGET>` : "";
      const intent_tag = input_intent ? `<INPUT_INTENT>${prompt_escape(input_intent)}</INPUT_INTENT>` : "";

      const think_xml = think_format === "optics" ? TASK_LIBRARY.OPTICS.THINK_FORMAT : null;

      // Spatial Framing Assembly
      const first_sentence_directive =
        typeof TASK_LIBRARY.OPTICS.FIRST_SENTENCE_MANDATE === "function"
          ? TASK_LIBRARY.OPTICS.FIRST_SENTENCE_MANDATE(target_tier)
          : TASK_LIBRARY.OPTICS.FIRST_SENTENCE_MANDATE;

      const spatial_framing_children = [first_sentence_directive, TASK_LIBRARY.OPTICS.SPATIAL_GEOMETRY];

      if (cinematography && typeof cinematography === "object") {
        const { mode = "Medium Action", tokens = "", narrative_context = "", visual_staging = "" } = cinematography;
        spatial_framing_children.push(
          `<CINEMATOGRAPHY mode="${escape_xml(mode)}">\n  ${tokens}${narrative_context}${visual_staging}\n</CINEMATOGRAPHY>`,
        );
      }

      if (engine_tokens?.camera) {
        spatial_framing_children.push(`<CAMERA>${escape_xml(engine_tokens.camera)}</CAMERA>`);
      } else if (engine_tokens?.composition) {
        spatial_framing_children.push(`<COMPOSITION>${escape_xml(engine_tokens.composition)}</COMPOSITION>`);
      }

      const spatial_framing_xml = render_xml_tag({
        tag: "SPATIAL_FRAMING",
        children: spatial_framing_children,
        child_indent: 2,
        separator: "\n",
      });

      const keyword_directives_xml =
        Array.isArray(keywords) && keywords.length > 0 ? render_keyword_directives_xml(keywords.join(", "), "OPTICS") : null;

      const selfie_xml = is_selfie ? TASK_LIBRARY.OPTICS.SELFIE_DIRECTIVE : null;

      const items = [
        target_tag,
        mandate,
        think_xml,
        spatial_framing_xml,
        keyword_directives_xml,
        selfie_xml,
        intent_tag,
        output_format_xml,
        ...directives,
      ].filter(Boolean);

      return render_xml_tag({ tag: "TASK", children: items, indent: 0, child_indent: 2, separator: "\n\n" });
    }

    case "enhancement":
    case "sorting": {
      const output_format_xml = schema
        ? render_xml_tag({
            tag: "OUTPUT_FORMAT",
            attrs: { mode: mode === "enhancement" ? "prose" : "json" },
            children: [escape_xml(schema.trim())],
            child_indent: 2,
          })
        : null;
      const items = [output_format_xml, ...directives].filter(Boolean);
      return render_xml_tag({ tag: "TASK", children: items, indent: 2, child_indent: 2, separator: "\n\n" });
    }

    default: {
      const style_dna = extract_style_dna(style);
      const think_format = config?.task?.think_format;

      const think_directive =
        think_format === "character"
          ? TASK_LIBRARY.PROTOCOLS.THINK_FORMAT(style_dna.emotional_grounding)
          : think_format === "narrator"
            ? TASK_LIBRARY.PROTOCOLS.THINK_NARRATOR
            : "";

      const output_format_xml = render_xml_tag({
        tag: "OUTPUT_FORMAT",
        attrs: { mode: "prose" },
        children: [PROSE_FORMAT],
        child_indent: 2,
      });

      const elements = [
        think_directive,
        render_task_input({ input, input_origin }),
        render_task_currents(style_dna, somatic_inner),
        action_directive ? String(action_directive).trim() : "",
        render_prose_reflex(snapshot, input, speaking_style),
        stability_lock ? String(stability_lock).trim() : "",
        output_format_xml,
      ].filter(Boolean);

      return elements.length ? render_xml_tag({ tag: "TASK", children: elements, indent: 0, child_indent: 4, separator: "\n" }) : "";
    }
  }
}

// ============================================================================
// [SECTION 4: SUBTEXT, AVAILABLE KEYWORDS & PROTOCOL RESOLVERS]
// ============================================================================

/**
 * Resolves a list of chosen keywords against a physics protocol registry and style-motif registry.
 * @param {string[]} [keywords=[]]
 * @param {Record<string, any>} [physics_protocols={}]
 * @returns {{ id: string, tells?: string, directive: string }[]}
 */
export function resolve_physics_protocols(keywords = [], physics_protocols = {}) {
  const resolved = [];
  for (const keyword of keywords || []) {
    if (!keyword || typeof keyword !== "string") continue;
    const clean_key = keyword.trim();
    const upper_key = clean_key.toUpperCase();
    const protocol_def = physics_protocols[upper_key] || physics_protocols[clean_key];
    if (protocol_def) {
      if (typeof protocol_def === "object") {
        resolved.push({ id: upper_key, tells: protocol_def.tells, directive: protocol_def.directive });
      } else {
        resolved.push({ id: upper_key, directive: String(protocol_def) });
      }
      continue;
    }
    const motif = STYLE_MOTIF_REGISTRY[clean_key] || STYLE_MOTIF_REGISTRY[clean_key.toLowerCase()];
    if (motif) resolved.push({ id: clean_key, directive: motif.directive });
  }
  return resolved;
}

/**
 * Resolves injected context-directive keywords against a physics protocol registry.
 * @param {string[]} [keywords=[]]
 * @param {Record<string, any>} [physics_protocols={}]
 * @returns {{ id: string, directive: string }[]}
 */
export function resolve_context_directives(keywords = [], physics_protocols = {}) {
  const resolved = [];
  for (const keyword of keywords || []) {
    if (!keyword || typeof keyword !== "string") continue;
    const clean_key = keyword.trim();
    const upper_key = clean_key.toUpperCase();
    const entry = physics_protocols[upper_key];
    if (entry) {
      const directive = typeof entry === "string" ? entry : entry.directive;
      resolved.push({ id: upper_key, directive });
    }
  }
  return resolved;
}

/**
 * Builds <AVAILABLE_KEYWORDS> listing for the Director as a unified, flat bracketed list of tags.
 * @param {string[]} [active_style_keywords=[]]
 * @param {readonly string[]} [available_keywords=[]]
 * @returns {string}
 */
export function render_available_keywords_xml(active_style_keywords = [], available_keywords = []) {
  const motifs = (active_style_keywords || []).filter((k) => typeof k === "string" && k.trim()).map((k) => k.trim().toUpperCase());
  const combined = Array.from(new Set([...available_keywords, ...motifs]));
  return combined.map((k) => `[${k}]`).join(" ");
}

/**
 * Compiles dynamic somatic directives and narrative signals into a single unified <SUBTEXT> XML block.
 *
 * @param {Record<string, number>} [ai_dynamics={}] - Active character dynamics
 * @param {Record<string, number>} [fractal_dynamics={}] - Active fractal/environmental dynamics
 * @param {object} [options={}] - Options containing style, keywords, evaluators, and protocol registries
 * @returns {string} XML block string or "" if no signals or directives are active.
 */
export function render_subtext_xml(ai_dynamics = {}, fractal_dynamics = {}, options = {}) {
  const tags = [];
  const seen = new Set();

  const push = (id, directive) => {
    const tag =
      String(id || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, "_") || "";
    const text = String(directive || "").trim();
    if (!tag || !text || seen.has(tag)) return;
    seen.add(tag);
    tags.push(`      <${tag}>${escape_xml(text)}</${tag}>`);
  };

  const physics_protocols = options?.physics_protocols || {};
  const manual_keywords = options?.keywords || [];
  const evaluate_dynamics_rules = options?.evaluate_dynamics_rules;
  const resolved_keywords =
    ai_dynamics && Object.keys(ai_dynamics).length && typeof evaluate_dynamics_rules === "function"
      ? evaluate_dynamics_rules(ai_dynamics, manual_keywords)
      : manual_keywords;

  const resolved_directives = resolve_physics_protocols(resolved_keywords, physics_protocols);
  for (const entry of resolved_directives) {
    push(entry.id, entry.directive);
  }

  const evaluate_subtext_protocols = options?.evaluate_subtext_protocols;
  const active_protocols =
    typeof evaluate_subtext_protocols === "function"
      ? evaluate_subtext_protocols({
          ai_dynamics,
          fractal_dynamics,
          style: options?.style,
        })
      : [];

  for (const protocol of active_protocols) {
    const text =
      protocol.text ||
      (typeof physics_protocols[protocol.id] === "string" ? physics_protocols[protocol.id] : physics_protocols[protocol.id]?.directive);
    push(protocol.id, text);
  }

  if (tags.length === 0) return "";
  return `    <SUBTEXT>\n${tags.join("\n")}\n    </SUBTEXT>`;
}

/**
 * CHANGELOG
 * - 2026-09-19: Integrated optics cinematography presets, staging directive helper, and group/scene narrative context builders into TASK_LIBRARY.OPTICS.CINEMATOGRAPHY, refactoring resolve_optics_cinematography to consume them.
 * - 2026-09-19: Imported and utilized PROSE_FORMAT from format.js, eliminating hardcoded string literal duplication (Mega Report D3).
 * - 2026-09-19: Parameterized FIRST_SENTENCE_MANDATE by tier in TASK_LIBRARY.OPTICS (F3): story_scene mandates establishing terrain, architecture, and atmospheric perspective first, while character tiers prioritize main entities.
 * - 2026-09-19: Architecture purification: Absorbed `resolve_optics_cinematography` from `entities/sheets.js`, consolidating all dynamic camera staging, scale tokens, and group mandates into Layer 6 (<TASK>).
 * - 2026-09-18: Consolidated Keyword Directives — added `render_keyword_directives_xml` supporting DIRECTOR and OPTICS modes.
 * - 2026-09-18: Added TASK_LIBRARY.OPTICS directives and dedicated case optics in render_task assembling TARGET, INPUT_INTENT, and nested OUTPUT_FORMAT per scrobbles.md blueprint.
 * - 2026-09-18: Standardized Layer 7 <OUTPUT_FORMAT> emission across director, continuum, sorting, enhancement, and story prose inside <TASK>; injected voice registers into <DELIVERY_POSTURE>.
 * - 2026-09-17: Director Action Clarification — Strengthened `TASK_LIBRARY.DIRECTOR.USER_PERSONA_LOCK` to explicitly disallow player character names and enumerate valid target enums.
 * - 2026-09-16: Standardized Director input tag and `TASK_LIBRARY.DIRECTOR.EVALUATE` to canonical `<INPUT />`, achieving 100% universal input tag consistency across all prompt modes.
 * - 2026-09-16: Pruned legacy `GHOSTWRITE` directives from `TASK_LIBRARY.PROSE` and simplified `resolve_character_action_directive` — ghostwriting operates as a first-class symmetrical Shot-2A first-person character turn governed by `CORE_PROTOCOLS.PERSPECTIVE.POV.FIRST` and `<DELIVERY_POSTURE><DRIVE>`.
 * - 2026-09-16: Pruned redundant `DEFAULTS` wrapper from `TASK_LIBRARY.PROTOCOLS` and encapsulated `emotional_grounding` fallback directly within `THINK_FORMAT`.
 * - 2026-09-16: Reconstructed kinetic momentum and role boundaries — consolidated DRIVE_ACTIVE and DRIVE_PASSIVE into a single dynamic DRIVE(has_input) inside TASK_LIBRARY.PROTOCOLS.RECENCY (rendered exclusively via <DELIVERY_POSTURE><DRIVE>); pruned redundant INITIATIVE and ADVANCE from TASK_LIBRARY.PROSE.CHARACTER; refactored resolve_character_action_directive to strictly emit role/epistemic boundaries without duplicate prose momentum.
 * - 2026-09-16: Merged duplicate `JSON_RETURN` directives into a single canonical `TASK_LIBRARY.JSON_RETURN` key, eliminating arbitrary character limit discrepancies ("under 400" vs "under 1200") and pruning redundant domain-specific keys under P4 Zero Backwards Compatibility.
 * - 2026-09-16: Task Simplification & XML Harmonization:
 *   (1) Cut dead duplicate `TASK_LIBRARY.SPOTLIGHT` (repatriated to `entities.js`);
 *   (2) Standardized `render_prose_reflex`, `render_task_currents`, and prose `<TASK>` with `render_xml_tag`;
 *   (3) Simplified `render_keyword_directives_xml` by encapsulating static `TASK_LIBRARY.DIRECTOR.KEYWORD_DIRECTIVES`;
 *   (4) Repatriated action directive resolution from `builder.js` into `resolve_character_action_directive` and `resolve_scene_action_directive`.
 * - 2026-09-16: Task Nomenclature Standardization — Purged legacy "instructions" mode alias and parameter in render_task in favor of canonical `directives = []`; renamed think_instruction to think_directive; enforced strict P4 Zero Backwards Compatibility.
 * - 2026-09-16: Zero Backwards Compatibility (P4) Purge — Removed all legacy delegator export bridges (render_director_task, render_terse_director_task, render_continuum_task, render_enhancement_instructions, render_profile_sorting_instructions, build_recency_anchor) and refactored render_task to explicit switch(mode).
 * - 2026-09-16: Standardized, modularized, and simplified task module architecture:
 *   (1) Merged verb patterns into unified `ACTION_VERBS_PATTERN` and consolidated spatial tokens;
 *   (2) Reworked lines 166-216 into Section 2 Prose Reflex & Input Reaction Engine (`render_prose_reflex`, `build_pacing_directive`, `render_environmental_hint`);
 *   (3) Consolidated ALL 5 task renderers into 1 single universal `render_task` compiler with clean mode dispatching;
 *   (4) Preserved 100% test compatibility.
 * - 2026-09-16: Standardized Director system envelope with `round` in `<SYSTEM round="...">` and standardized input via `render_task_input`; co-located input classification regexes and `render_environmental_hint`; repatriated `render_scene_spotlight_xml` to `entities.js`; unified Continuum directives in `TASK_LIBRARY.CONTINUUM`.
 * - 2026-09-16: Consolidated all loose directive/rules constants into unified, frozen `TASK_LIBRARY` catalog (PROTOCOLS, DIRECTOR, SPOTLIGHT, PROSE, SORTING) mirroring PROTOCOL_LIBRARY in protocols.js. Pruned legacy individual exports under P4 Zero Backwards Compatibility.
 * - 2026-09-16: Emphatically strengthened dialogue prohibition in SCENE_DIRECTIVES (PROLOGUE, EPILOGUE, COLLAPSE) with 'Strictly zero spoken dialogue or quote marks'.
 * - 2026-09-13: Token Optimization Pass — Streamlined TASK_PROTOCOLS (PACING, RECENCY, THINK_NARRATOR), DIRECTOR_TASK_RULES, SPOTLIGHT_RULES, CHARACTER_DIRECTIVES, SCENE_DIRECTIVES (notably CONTINUATION down to 41 words), GHOSTWRITE_DIRECTIVES, and SORTING_DIRECTIVES, cutting ~230 words (~300 tokens) of conversational padding per turn while preserving all test assertions; strictly obeyed zero new test file creation.
 * - 2026-09-13: Comprehensive architectural rebuild & symmetrical harmonization with `prompts.js`:
 *   (1) Reconstructed into 6 cleanly divided sections mirroring the Multi-Shot simulation cycle (Turn Foundations, Cognition, Shot 1 Director, Shot 2A Story Prose, Shot 2B Continuum, Section 6 Auxiliary Tooling);
 *   (2) Enforced Full-Name domain nomenclature across all identifiers (`character_count`, `word_count`, `style_dna`, `candidate_entity`, `summarize_cast_entity`, `ingestion_instruction`, `redistribute_instruction`, `output_rules_instruction`);
 *   (3) Eliminated sibling import of `format.js`, achieving 100% zero-sibling module purity;
 *   (4) Preserved 100% export interface parity.
 * - 2026-09-13: Absorbed `SPOTLIGHT_RULES` and `render_scene_spotlight_xml` from `entities.js`, consolidating Director turn choreography into `task.js`.
 * - 2026-09-12: Standardization pass — render_enhancement_instructions now composes through the shared `render_xml_tag` primitive; renamed render_memory_forge_task -> render_continuum_task to align with the prompts.js mode key.
 * - 2026-09-12: Relocated render_enhancement_instructions and render_profile_sorting_instructions to task.js from format.js. Uses OUTPUT_FORMATS.profile as default schema.
 * - 2026-09-12: Modularization pass — relocated schemas (DIRECTOR_SCHEMA, PROFILE_SCHEMA, MEMORY_FORGE_SCHEMA), contracts (TEMPORAL_CONTRACT), OUTPUT_FORMATS, and instruction renderers to modules/format.js. task.js now focuses exclusively on turn execution, pacing, somatic currents, input formatting, and action directives. Zero sibling imports.
 * - 2026-09-11: Purification pass — added TASK_SCHEMAS/TASK_CONTRACTS and resolve_task_schema/resolve_task_contract; collapsed the private _indent onto @utils indent_all; removed the duplicate MACRO_DIRECTIVES import and the test-only TEMPORAL_PROTOCOLS/PROFILE_PROTOCOLS bundles.
 * - 2026-09-11: Complete module purification: relocated OUTPUT_FORMATS, TEMPORAL_CONTRACT, TEMPORAL_PROTOCOLS, and PROFILE_PROTOCOLS to task.js; imported layout helpers from @utils; task.js now has zero sibling imports.
 * - 2026-09-11: Relocated CHARACTER_DIRECTIVES (NPC_BOUNDARY, INITIATIVE, ADVANCE) to task.js to unify all turn action directives under <TASK>.
 * - 2026-09-11: Added render_director_task, render_memory_forge_task, render_enhancement_instructions, and render_profile_sorting_instructions.
 * - 2026-09-11: Added DIRECTOR_SCHEMA, PROFILE_SCHEMA, MEMORY_FORGE_SCHEMA, DIRECTOR_TASK_RULES, render_terse_director_task, SCENE_DIRECTIVES, GHOSTWRITE_DIRECTIVES, and SORTING_DIRECTIVES.
 * - 2026-09-11: Initial creation of modular task.js extracting turn block formatting, pacing, and think formats.
 */
