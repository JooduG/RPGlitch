/**
 * src/intelligence/modules/sensory.js
 * SENSORY MODULE — Optics Catalog, Cinematography, Optics Entities, Staging
 * Owns the sensory cortex: the frozen SENSORY_LIBRARY directive catalog,
 * declarative cinematography framing, optics actor plans and entities blocks,
 * and the optics prompt plus deterministic fallback compilers.
 * task.js keeps turn assembly and delegates OPTICS atoms and slots here;
 * entities.js keeps presence and exports wrap_entities for the optics block;
 * builder.js keeps style-snapshot ownership and delegates staging here.
 * Call-time-only cycles with task.js and builder.js mirror the existing
 * prompts/builder cycle; every cycle edge fires at render time, never at load.
 */
import {
  escape_xml,
  prompt_escape,
  render_xml_tag,
  resolve_catalog_atom,
  resolve_alternations,
  alternation_field_label,
  detox_prose,
  has_alternations,
  strip_visual_excluded,
} from "@utils";
import { VISUAL_STYLES, resolve_portrait_visual_style_key } from "@data";
import { aesthetic_resolver, normalize_image_tier, resolve_visual_engine_tokens } from "@media";
import { get_prompt } from "../prompts.js";
import { resolve_system_role_line, compose_system, pack_prompt, resolve_prompt_meta } from "./system.js";
import { render_core_protocols } from "./protocols.js";
import { render_task, render_think_format, compile_directive_tags } from "./task.js";
import { format_sensory_history } from "./history.js";
import { get_output_format } from "./output.js";
import { wrap_entities, render_cast_xml, CAST_MODES } from "./entities.js";
import { define_sheet, render_sheet } from "./sheets.js";
import { resolve_builder_style_snapshot } from "../builder.js";
// ============================================================================
// [SECTION 1: SENSORY DIRECTIVE CATALOG]
// ============================================================================

export const SENSORY_LIBRARY = Object.freeze({
  MANDATE: "Convert narrative intent into a structured image prompt payload depicting {subject_description}.",

  SUBJECT_RULES: Object.freeze({
    DYNAMIC_OVERRIDES:
      "DYNAMIC OVERRIDES: Follow a strict bottom-up hierarchy where the most recent (bottom-most) physical condition update ALWAYS overrides preceding static tags like «SHIRT» or «JACKET». If a conflicting state appears later (e.g. 'no clothes' then later 'shirt: white'), the most recent/latest state wins.",
    GARMENT_ANATOMY:
      "GARMENT ANATOMY: When rendering specialized or revealing garments (e.g., jockstraps, thongs, harnesses), explicitly specify their physical mechanics and bare skin exposure in natural prose. For a jockstrap, describe: 'wearing an athletic jockstrap featuring a supportive front pouch, open sides and back with bare exposed butt cheeks, and dual wide elastic straps circling under the glutes/thighs'. For thongs, describe: 'a narrow string back leaving the rear completely bare'. Never allow jockstraps to collapse into generic briefs or full-coverage shorts.",
    IDENTIFIERS: 'IDENTIFIERS: Always explicitly state gender and physical identifiers (e.g., "a handsome young male high-elf man").',
    CREATURE_DISAMBIGUATION:
      'CREATURE DISAMBIGUATION: Never use bare animal/creature proper names (e.g., "Beast"). Translate to explicit physical traits (e.g., "a massive grey-green male orc warrior").',
    SIGNATURE_COLORS:
      "SIGNATURE COLORS: Every character's distinctive visual anchors — declared hair color AND length, eye color, skin markings, and signature accent colors — are non-negotiable. Copy them EXACTLY as written in the ENTITIES sheet; never recolor, lengthen, shorten, or substitute them, and never derive a subject's hair or eye color from the environment (silver fog, twilight, moonlight), the lighting, or accessories (e.g., silver jewelry). If the sheet declares a specific hair color or length, the output prompt MUST state that exact value.",
  }),

  SOLO_FRAME:
    "**SOLO FRAME PROTOCOL.** Isolated single-subject portrait. No secondary characters, no story scene context. The backdrop must be drawn solely from the subject's own identity and signature colors.",
  ENVIRONMENTAL_SCALE:
    "**AFFIRMATIVE ENVIRONMENTAL SCALE.** Focus completely on vast landscape architecture, atmospheric density, weather effects, and physical spatial structures.",
  BACKGROUND:
    "You MUST synthesize an evocative, atmospheric background environment that naturally fits the personality, visual theme, and signature colors of {subject_name}.",
  THINK_FORMAT: `In "_thought_process", calibrate:
1. Focal subject & identity traits (strip proper names)
2. Spatial layers (foreground, focal subject, background)
3. Light sources, color palette, and textures from active style
4. Wardrobe mechanics & exposure checks`,

  FIRST_SENTENCE_MANDATE: Object.freeze({
    SCENE:
      "<FIRST_SENTENCE_MANDATE>Always establish vast environmental geometry, architectural structures, terrain scale, and atmospheric lighting in the VERY FIRST sentence before any secondary elements.</FIRST_SENTENCE_MANDATE>",
    ENTITY:
      "<FIRST_SENTENCE_MANDATE>Always place main entities and active physical interactions in the VERY FIRST sentence.</FIRST_SENTENCE_MANDATE>",
  }),
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
    STAGING_DIRECTIVE: "\n  Staging Directive: {visual_staging}",
    NARRATIVE_CONTEXT: Object.freeze({
      GROUP: "\n  Group Mandate: Feature both {ai_name} and {user_name} engaged together in their active positions within the fractal environment.",
      CHARACTER_IN_SCENE: "\n  Character In Scene: Depict {character_name} situated directly within {setting_name}.",
    }),
  }),
});

export function get_sensory_atom(key, values = {}) {
  const key_text = String(key == null ? "" : key);
  const prefix = "OPTICS.";
  const stripped_key = key_text.slice(0, prefix.length) === prefix ? key_text.slice(prefix.length) : key_text;
  const resolved = resolve_catalog_atom(SENSORY_LIBRARY, stripped_key, values);
  return typeof resolved === "string" ? resolved : resolved == null ? "" : resolved.body;
}

export function resolve_optics_subject(target_tier = "", subject = "") {
  return subject || SENSORY_LIBRARY.SUBJECT_TIERS[target_tier] || SENSORY_LIBRARY.SUBJECT_TIERS.story_character;
}

// ============================================================================
// [SECTION 2: DECLARATIVE CINEMATOGRAPHY FRAMING]
// ============================================================================

/**
 * Declarative optics framing rules: ordered descriptor rows walked first-match-wins.
 * Each row declares a single constraint; tuning framing is a data edit here —
 * never a branch edit in `resolve_optics_cinematography`.
 * @type {ReadonlyArray<Readonly<{ preset: string, is_fractal_target?: boolean, chaos_gte?: number, intensity_gte?: number, affinity_gte?: number, tier?: string }>>}
 */
export const CINEMATOGRAPHY_RULES = Object.freeze([
  Object.freeze({ is_fractal_target: true, preset: "WIDE_ENVIRONMENTAL" }),
  Object.freeze({ chaos_gte: 75, preset: "DUTCH_LOW_ANGLE" }),
  Object.freeze({ intensity_gte: 75, preset: "INTIMATE_CLOSE_UP" }),
  Object.freeze({ affinity_gte: 75, preset: "INTIMATE_CLOSE_UP" }),
  Object.freeze({ tier: "solo_entity", preset: "SOLO_PORTRAIT" }),
]);

/**
 * Tests one cinematography descriptor row: a row matches when every constraint it
 * declares holds against the normalized framing context.
 * @param {{ preset: string }} rule
 * @param {{ is_fractal_target: boolean, chaos: number, intensity: number, affinity: number, tier: string }} framing
 * @returns {boolean}
 */
function matches_cinematography_rule(rule, framing) {
  if (rule.is_fractal_target === true && !framing.is_fractal_target) return false;
  if (rule.chaos_gte != null && !(framing.chaos >= rule.chaos_gte)) return false;
  if (rule.intensity_gte != null && !(framing.intensity >= rule.intensity_gte)) return false;
  if (rule.affinity_gte != null && !(framing.affinity >= rule.affinity_gte)) return false;
  if (rule.tier != null && framing.tier !== rule.tier) return false;
  return true;
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

  const { PRESETS } = SENSORY_LIBRARY.CINEMATOGRAPHY;
  const framing = { is_fractal_target, chaos, intensity, affinity, tier };
  const hit = CINEMATOGRAPHY_RULES.find((rule) => matches_cinematography_rule(rule, framing));
  const preset = hit ? PRESETS[hit.preset] : PRESETS.MEDIUM_ACTION;

  const visual_staging_directive = visual_staging
    ? get_sensory_atom("OPTICS.CINEMATOGRAPHY.STAGING_DIRECTIVE", { visual_staging: prompt_escape(visual_staging) })
    : "";
  const narrative_context_desc =
    tier === "story_entities"
      ? get_sensory_atom("OPTICS.CINEMATOGRAPHY.NARRATIVE_CONTEXT.GROUP", {
          ai_name: prompt_escape(active_ai_character?.name || "AI"),
          user_name: prompt_escape(active_user_persona?.name || "User"),
        })
      : tier === "story_character" && active_fractal_setting && main_entity?.type !== "fractal" && main_entity !== active_fractal_setting
        ? get_sensory_atom("OPTICS.CINEMATOGRAPHY.NARRATIVE_CONTEXT.CHARACTER_IN_SCENE", {
            character_name: prompt_escape(main_entity?.name || "Subject"),
            setting_name: prompt_escape(active_fractal_setting.name || "Setting"),
          })
        : "";

  return {
    mode: preset.mode,
    tokens: preset.tokens,
    narrative_context: narrative_context_desc,
    visual_staging: visual_staging_directive,
  };
}

// ============================================================================
// [SECTION 3: OPTICS SLOT RESOLVERS FOR THE TASK ENVELOPE]
// ============================================================================

export function resolve_optics_think_slot() {
  return render_think_format(SENSORY_LIBRARY.THINK_FORMAT);
}

export function resolve_optics_target_slot(values) {
  return values.target_tier ? render_xml_tag({ tag: "TARGET", children: [escape_xml(values.target_tier)], inline: true }) : "";
}

export function resolve_optics_spatial_framing_slot(values) {
  const selection = typeof values.config?.spatial_framing === "function" ? values.config.spatial_framing(values) : [];
  const children = compile_directive_tags(selection, values);
  const cinematography = values.cinematography;
  if (cinematography && typeof cinematography === "object") {
    const { mode = "Medium Action", tokens = "", narrative_context = "", visual_staging = "" } = cinematography;
    children.push(
      render_xml_tag({
        tag: "CINEMATOGRAPHY",
        attrs: { mode },
        children: [tokens, narrative_context, visual_staging],
        child_indent: 2,
        separator: "\n",
      }),
    );
  }
  const engine_tokens = values.engine_tokens;
  if (engine_tokens?.camera) {
    children.push(render_xml_tag({ tag: "CAMERA", children: [escape_xml(engine_tokens.camera)], inline: true }));
  } else if (engine_tokens?.composition) {
    children.push(render_xml_tag({ tag: "COMPOSITION", children: [escape_xml(engine_tokens.composition)], inline: true }));
  }
  return render_xml_tag({ tag: "SPATIAL_FRAMING", children, child_indent: 2, separator: "\n" });
}

// ============================================================================
// [SECTION 4: OPTICS ACTORS AND ENTITIES BLOCK]
// ============================================================================

function plan_optics_actor(tag_name, entity_instance) {
  if (!entity_instance) return null;
  const spec_kind = tag_name === "FRACTAL" || entity_instance.type === "fractal" ? "fractal" : "character";
  return {
    spec: define_sheet(spec_kind, { tag: tag_name, default_name: tag_name, ...(spec_kind === "character" ? { owner_state: true } : {}) }),
    entity: entity_instance,
  };
}
/**
 * Compiles the pure-data segment plan for optics tiers: ordered
 * `{ cast, actors }` segments where `cast` wraps its actors in `<CAST mode="active">`.
 */
function resolve_optics_segments({
  tier = "solo_entity",
  solo_subject = null,
  active_ai_character = null,
  active_user_persona = null,
  active_fractal_setting = null,
  main_entity = null,
} = {}) {
  const is_story_tier = tier === "story_entities" || tier === "story_character" || tier === "story_scene";
  const fractal_actor = is_story_tier && active_fractal_setting ? plan_optics_actor("FRACTAL", active_fractal_setting) : null;

  switch (tier) {
    case "solo_entity":
      return [{ cast: true, actors: [plan_optics_actor("SOLO_ENTITY", solo_subject)] }];
    case "story_scene":
      return [{ cast: false, actors: [fractal_actor] }];
    case "story_entities":
      return [
        {
          cast: true,
          actors: [plan_optics_actor("AI_CHARACTER", active_ai_character), plan_optics_actor("USER_PERSONA", active_user_persona)],
        },
        { cast: false, actors: [fractal_actor] },
      ];
    case "story_character":
    default: {
      const main_tag =
        main_entity === active_user_persona || main_entity?.type === "user"
          ? "USER_PERSONA"
          : main_entity?.type === "fractal"
            ? "FRACTAL"
            : "AI_CHARACTER";
      return [
        { cast: true, actors: [plan_optics_actor(main_tag, main_entity)] },
        { cast: false, actors: [fractal_actor] },
      ];
    }
  }
}

/**
 * Maps one optics actor to its sheet block with the exact visual call shape.
 */
function render_optics_actor(actor, { macro_entities = {}, roll = (text) => text } = {}) {
  if (!actor) return "";
  return render_sheet(actor.spec, {
    entity: actor.entity,
    entities: macro_entities,
    mode: "physical",
    include_agenda: false,
    include_memories: false,
    is_owner: true,
    transform_physical: (value) => roll(strip_visual_excluded(value)),
  });
}

export function render_optics_entities_xml({
  tier = "solo_entity",
  solo_subject = null,
  active_ai_character = null,
  active_user_persona = null,
  active_fractal_setting = null,
  main_entity = null,
  macro_entities = {},
  roll = (text) => text,
} = {}) {
  const context_block = resolve_optics_segments({
    tier,
    solo_subject,
    active_ai_character,
    active_user_persona,
    active_fractal_setting,
    main_entity,
  })
    .map((segment) => {
      const blocks = segment.actors.map((actor) => render_optics_actor(actor, { macro_entities, roll }));
      return segment.cast ? render_cast_xml({ mode: CAST_MODES.ACTIVE, children: blocks }) : blocks.join("\n");
    })
    .join("\n");

  return wrap_entities([context_block.trim()].filter(Boolean));
}

// ============================================================================
// [SECTION 5: OPTICS PROMPT STAGING AND DETERMINISTIC FALLBACK]
// ============================================================================

/**
 * Compiles the Optics <SYSTEM mode="optics"> envelope for every image-generation task
 * (solo entity portraits and multi-character scenes):
 * <SYSTEM mode="optics">               (open fragment; transport closes it)
 *   <CORE_PROTOCOLS>
 *   <ENTITIES>                         (contains <CAST mode="active">)
 *   <HISTORY>                          (optional)
 * </SYSTEM>
 * <TASK>
 *   <THINK_FORMAT>
 *   <INPUT channel="intent">
 *   <TARGET>
 *   <SPATIAL_FRAMING>
 *   <DIRECTIVES>                      (contains <KEYWORD_DIRECTIVES>)
 *   <OUTPUT_FORMAT mode="json">
 * </TASK>
 *
 * System children are emitted through the shared `PROMPT_LAYERS` table (bounded by the mode's
 * declared `layers.system`); the `<TASK>` is returned as the package's own field, so Optics no
 * longer hand-assembles an envelope or nests a task inside `<SYSTEM>`.
 *
 * @param {Object} [options={}] - Single options object; no positional shuffling.
 * @param {string} [options.tier] - Canonical image tier ("solo_entity" | "story_character" | "story_entities" | "story_scene").
 * @param {string} [options.target_type] - Alias for `tier`.
 * @param {string} [options.raw_intent] - Raw subject/prompt intent (rolled through alternation dice).
 * @param {string} [options.prompt_context] - Alias for `raw_intent`.
 * @param {string} [options.input] - Alias for `raw_intent`.
 * @param {any} [options.ai] - Active AI-character entity.
 * @param {any} [options.user] - Active user-persona entity.
 * @param {any} [options.fractal] - Active fractal/setting entity.
 * @param {any} [options.entity] - Focus entity (tier-derived when ai/user/fractal are omitted).
 * @param {any[]} [options.history] - Sensory conversation history entries.
 * @param {string} [options.mode="visualize"] - "visualize" | "enhance".
 * @param {string} [options.variant] - Variant selector (e.g. "selfie").
 * @param {string} [options.visual_staging] - Staging directive.
 * @param {(picks: any[]) => void} [options.onAlternationPick] - Alternation dice-pick callback.
 * @returns {{ system: string, task: string }}
 */
export function render_optics_prompt(options = {}) {
  const target_type = options.tier || options.target_type || "solo_entity";
  const raw_intent = options.raw_intent || options.prompt_context || options.input || "";

  const { ai, user, fractal, entity, history, mode = "visualize", variant, onAlternationPick } = options;

  const dice_picks = [];
  const roll = (text) => {
    const resolved = resolve_alternations(text, {
      onPick: (pick) => {
        const item = { ...pick, label: alternation_field_label(text, pick.raw) };
        dice_picks.push(item);
        if (typeof onAlternationPick === "function") onAlternationPick([item]);
      },
    });
    return resolved.text;
  };

  const tier = normalize_image_tier(target_type);
  const is_selfie = variant === "selfie" || target_type === "selfie";

  const active_ai_character = ai || (entity && entity.type !== "user" && entity.type !== "fractal" ? entity : null);
  const active_user_persona = user || (entity?.type === "user" ? entity : null);
  const active_fractal_setting = fractal || (entity?.type === "fractal" ? entity : null);
  const main_entity = entity || active_ai_character || active_user_persona;
  const solo_subject = entity || active_ai_character || active_user_persona || active_fractal_setting;
  const macro_entities = { AI: active_ai_character, USER: active_user_persona, FRACTAL: active_fractal_setting };

  const combined_input_text = `${raw_intent || ""} ${main_entity?.present?.physical || ""} ${main_entity?.eternal?.physical || ""}`;
  const resolved_style_snapshot = options.style_snapshot ?? resolve_builder_style_snapshot({ fractal: active_fractal_setting });
  const style_key =
    tier === "solo_entity" || mode === "enhance" ? resolve_portrait_visual_style_key(solo_subject) : resolved_style_snapshot.visual_key;
  const style_definition = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
  const engine_tokens = resolve_visual_engine_tokens(style_key);

  const keywords_raw = style_definition.keywords || style_definition.tags || [];
  const keyword_list = Array.isArray(keywords_raw)
    ? keywords_raw
    : typeof keywords_raw === "string"
      ? keywords_raw.split(",").map((s) => s.trim())
      : [];
  const valid_keywords = keyword_list.filter(Boolean);

  const config = get_prompt("optics");

  // Layer 3: Core Protocols (<CORE_PROTOCOLS>)
  const protocols_xml = render_core_protocols({
    visual_style: style_definition,
    engine_tokens,
    protocols: config.protocols,
    has_alternation: has_alternations(combined_input_text),
  });

  // Cinematography Resolution (Layer 6 Spatial Framing)
  const cinematography = resolve_optics_cinematography({
    tier,
    solo_subject,
    active_ai_character,
    active_user_persona,
    active_fractal_setting,
    main_entity,
    visual_staging: options.visual_staging || "",
  });

  // Layer 4: Entities Context (<ENTITIES>)
  const entities_xml = render_optics_entities_xml({
    tier,
    solo_subject,
    active_ai_character,
    active_user_persona,
    active_fractal_setting,
    main_entity,
    macro_entities,
    roll,
  });

  // Layer 5: Sensory History (<CONVERSATION_HISTORY>)
  const history_xml = format_sensory_history(history);

  // Layer 7: Output Schema Format (<OUTPUT_FORMAT>)
  const resolved_negative_prompt = engine_tokens.negative_prompt || "";
  const schema = get_output_format(config.format, { variant: is_selfie ? "selfie" : variant, negative_prompt: resolved_negative_prompt });

  const rolled_intent = detox_prose(roll(raw_intent || ""));

  // Layer 6: Universal Task (<TASK>)
  const task_xml = render_task({
    config,
    task_state: config.task_state,
    target_tier: tier,
    input_intent: rolled_intent,
    think_format: config.think_format || "optics",
    cinematography,
    engine_tokens,
    keywords: valid_keywords,
    is_selfie,
    main_entity_name: main_entity?.name || "",
    has_fractal_setting: Boolean(active_fractal_setting),
    schema,
    layers: config.layers.task,
  });

  const full_system = compose_system(config, {
    role_line: resolve_system_role_line({ role: config.role_line }),
    core_protocols: protocols_xml,
    entities_block: entities_xml,
    history_block: history_xml ? history_xml.trim() : null,
  });

  return pack_prompt(
    { system: full_system, task: task_xml },
    resolve_prompt_meta({
      ai: active_ai_character?.dynamics,
      fractal: active_fractal_setting?.dynamics,
    }),
  );
}

/**
 * Deterministic fallback image prompt for when the optics LLM pass yields nothing.
 * Owned beside `render_optics_prompt` so the fallback template strings stay inside the
 * prompt pipeline rather than in the media orchestration layer.
 *
 * @param {Object} [options={}]
 * @param {string} [options.tier] - Canonical image tier ("solo_entity" | "story_character" | "story_entities" | "story_scene").
 * @param {string} [options.subject] - Resolved subject key ("ai" | "user" | "fractal").
 * @param {any} [options.ai]
 * @param {any} [options.user]
 * @param {any} [options.fractal]
 * @param {string} [options.intent] - Raw visual intent (used verbatim only when short).
 * @returns {string}
 */
export function render_optics_fallback({ tier = "solo_entity", subject = "ai", ai, user, fractal, intent = "" } = {}) {
  const normalized_tier = normalize_image_tier(tier);
  const fallback_entity =
    normalized_tier === "solo_entity"
      ? subject === "user"
        ? user
        : subject === "fractal"
          ? fractal
          : ai
      : normalized_tier === "story_scene" || normalized_tier === "story_entities"
        ? fractal
        : subject === "user"
          ? user
          : ai;
  const fallback_description = aesthetic_resolver.flatten(fallback_entity);
  const fallback_name = fallback_entity?.name || normalized_tier;
  const short_intent = intent && intent.length < 200 ? intent : "";

  if (normalized_tier === "story_character" && fractal) {
    const fractal_description = aesthetic_resolver.flatten(fractal);
    return `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_description || "detailed character"}, situated within ${fractal.name || "the setting"}, ${fractal_description || "atmospheric environment, dramatic lighting"}</image_prompt>`;
  }
  return `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_description || "detailed character portrait, dramatic lighting"}</image_prompt>`;
}

/**
 * CHANGELOG
 * - 2026-10-07: Modules Ground Refactor Phase 3 — new sensory domain module (absorbs optics catalog, framing rules, cinematography, optics entities, prompt staging and fallback; plan specs harden via define_sheet) — prompt bytes byte-identical.
 */
