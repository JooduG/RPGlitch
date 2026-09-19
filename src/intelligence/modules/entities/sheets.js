/**
 * src/intelligence/modules/entities/sheets.js
 * ============================================================================
 * 📋 SHEETS MODULE — Entity Sheet Specifications & Universal XML Compilers
 * ============================================================================
 *
 * Provides physical appearance synthesis, entity sheet specifications (SHEET_SPECS),
 * single-entity sheet compiler (render_sheet), master available entities compiler
 * (render_entity_sheets), and auxiliary snapshot contexts (memory & enhancement).
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string and structured XML compilation.
 * - Single source of truth for entity sheet XML layouts across all simulation modes.
 * - Strict Full-Name domain nomenclature.
 * ============================================================================
 */

import {
  escape_xml,
  physical_to_xml,
  strip_leading_key_echo,
  render_field_value,
  indent_continuation,
  indent_all,
  inline_or_block,
  render_xml_tag,
  parse_macros,
  prompt_escape,
} from "@utils";
import { PROFILE_FIELD_CATALOG } from "@data";
import { strip_epistemic_secrets, strip_visual_excluded } from "./epistemic.js";
import { resolve_available_entities, render_dispositions, render_nearby_entities_xml } from "./presence.js";

// ============================================================================
// [SECTION 1: PHYSICAL STATE SYNTHESIS]
// ============================================================================

/**
 * Resolves the canonical XML tag for an entity profile path from @data's PROFILE_FIELD_CATALOG.
 *
 * @param {"character"|"fractal"} entity_kind
 * @param {string} path - Dot path (e.g., "eternal.non_physical", "future").
 * @param {string} [fallback=""]
 * @returns {string}
 */
export function resolve_profile_field_tag(entity_kind, path, fallback = "") {
  return PROFILE_FIELD_CATALOG[`${entity_kind}.${path}`]?.tag || fallback;
}

/**
 * Resolves a nested dot-notation field value from an entity object.
 *
 * @param {any} entity
 * @param {string} path - Dot-separated field path (e.g. "eternal.physical", "future").
 * @returns {any}
 */
export function resolve_entity_field_value(entity, path) {
  if (!entity || !path) return undefined;
  return path.split(".").reduce((target, key) => (target != null ? target[key] : undefined), entity);
}

/**
 * Extracts and unboxes inner XML body rows from a physical/topographical definition.
 *
 * @param {string|Record<string, any>|null|undefined} raw_value
 * @param {any} [owner_entity]
 * @param {any} [entities]
 * @returns {string}
 */
export function extract_physical_body(raw_value, owner_entity, entities) {
  const resolved_value = owner_entity ? render_field_value(raw_value, owner_entity, entities) : raw_value;
  const xml_output = physical_to_xml(resolved_value, "BODY");
  if (!xml_output) return "";

  const structured_match = xml_output.match(/^ {2}<BODY>\n([\s\S]*?)\n {2}<\/BODY>$/);
  if (structured_match) return structured_match[1];

  const prose_match = xml_output.match(/^ {2}<BODY>([\s\S]*?)<\/BODY>$/);
  return prose_match && prose_match[1].trim() ? prose_match[1].trim() : "";
}

/**
 * Expands physical state into individual trimmed XML child rows.
 *
 * @param {string|null|undefined} raw_value
 * @param {any} owner_entity
 * @param {any} entities
 * @returns {string[]}
 */
export function extract_physical_rows(raw_value, owner_entity, entities) {
  const body_content = extract_physical_body(raw_value, owner_entity, entities);
  return body_content
    ? body_content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
}

/**
 * Synthesizes eternal (permanent biometric/topographic baseline) and present (active outfit/atmosphere)
 * into a single unified physical block (<APPEARANCE> or <TOPOGRAPHY>).
 * Present attributes cleanly overwrite corresponding eternal attributes by XML tag name.
 *
 * @param {string|null|undefined} eternal_text
 * @param {string|null|undefined} present_text
 * @param {any} owner_entity
 * @param {any} entities
 * @param {string} [tag="APPEARANCE"]
 * @returns {string}
 */
export function render_appearance(eternal_text, present_text, owner_entity, entities, tag = "APPEARANCE") {
  const merged_entries = [];
  const index_by_tag = new Map();

  const extract_tag_name = (row_content) => {
    const match = String(row_content).match(/^<([A-Za-z0-9_]+)/);
    return match ? match[1].toUpperCase() : String(row_content);
  };

  const all_rows = [...extract_physical_rows(eternal_text, owner_entity, entities), ...extract_physical_rows(present_text, owner_entity, entities)];

  for (const row_content of all_rows) {
    const key = extract_tag_name(row_content);
    if (index_by_tag.has(key)) {
      merged_entries[index_by_tag.get(key)] = row_content;
    } else {
      index_by_tag.set(key, merged_entries.length);
      merged_entries.push(row_content);
    }
  }

  if (!merged_entries.length) return "";
  const inner_content = merged_entries.map((row_content) => `        ${row_content}`).join("\n");
  return `      <${tag}>\n${inner_content}\n      </${tag}>`;
}

// ============================================================================
// [SECTION 2: DECLARATIVE SHEET BLUEPRINTS & UNIVERSAL COMPILER]
// ============================================================================

const CHARACTER_SHEET_BASE = Object.freeze({
  psychology_tag: "PSYCHOLOGY",
  agenda_key: PROFILE_FIELD_CATALOG["character.future"].tag,
  personality_tag: PROFILE_FIELD_CATALOG["character.eternal.non_physical"].tag,
  state_tag: "STATE",
  state_strip_keys: Object.freeze(["STATE_OF_MIND", "STATE"]),
  appearance_tag: "APPEARANCE",
  memory_tag: PROFILE_FIELD_CATALOG["character.past"].tag,
  axes_scope: "somatic",
  epistemic: Object.freeze({ state: "owner" }),
});

/**
 * Frozen catalog of entity sheet blueprints driven by PROFILE_FIELD_CATALOG.
 * Defines structural tags, epistemic policies, and dynamic axes scopes for each entity kind.
 *
 * @type {Readonly<Record<string, any>>}
 */
export const SHEET_SPECS = Object.freeze({
  AI_CHARACTER: Object.freeze({
    ...CHARACTER_SHEET_BASE,
    tag: "AI_CHARACTER",
    default_name: "AI_CHARACTER",
  }),
  NPC: Object.freeze({
    ...CHARACTER_SHEET_BASE,
    tag: "NPC",
    default_name: "NPC",
  }),
  USER_PERSONA: Object.freeze({
    ...CHARACTER_SHEET_BASE,
    tag: "USER_PERSONA",
    default_name: "User",
    memory_tag: "BACKSTORY",
    axes_scope: null,
    epistemic: Object.freeze({
      personality: "always",
      state: "always",
      appearance: "always",
      memory: "always",
    }),
  }),
  FRACTAL: Object.freeze({
    tag: "FRACTAL",
    default_name: "the setting",
    psychology_tag: "ATMOSPHERE",
    agenda_key: PROFILE_FIELD_CATALOG["fractal.future"].tag,
    personality_tag: PROFILE_FIELD_CATALOG["fractal.eternal.non_physical"].tag,
    state_tag: "STATE",
    state_strip_keys: Object.freeze(["CURRENT_STATE", "STATE"]),
    appearance_tag: "TOPOGRAPHY",
    memory_tag: PROFILE_FIELD_CATALOG["fractal.past"].tag,
    axes_scope: "fractal",
    epistemic: Object.freeze({}),
  }),
});

/**
 * Compiles a single entity sheet XML block from its specification blueprint.
 * Supports both "combined" physical synthesis (<APPEARANCE> / <TOPOGRAPHY>)
 * and "separate" physical unboxing (<PHYSICAL_APPEARANCE> / <CURRENT_LOOK>).
 *
 * @param {Object} specification - An entry from SHEET_SPECS.
 * @param {Object} context
 * @param {any} context.entity
 * @param {any} [context.entities]
 * @param {any} [context.accessors]
 * @param {Function} [context.render_axes]
 * @param {any} [context.dynamics]
 * @param {boolean} [context.is_owner=false]
 * @param {boolean} [context.show_dispositions=false]
 * @param {boolean} [context.include_agenda=true]
 * @param {boolean} [context.include_memories=true]
 * @param {Set<string>} [context.active_names]
 * @param {Map<string, string>} [context.name_to_id]
 * @param {"combined"|"separate"} [context.physical_mode="combined"]
 * @returns {string}
 */
export function render_sheet(specification, context) {
  const {
    entity,
    entities,
    accessors,
    render_axes,
    dynamics,
    is_owner = false,
    show_dispositions = false,
    include_agenda = true,
    include_memories = true,
    active_names,
    name_to_id,
    physical_mode = "combined",
  } = context;

  if (!entity) return "";

  const epistemic = specification.epistemic || {};
  const sanitize_by_epistemic_policy = (value, policy) => {
    if (!policy || policy === "none") return value;
    return strip_epistemic_secrets(value, policy === "owner" ? is_owner : false);
  };

  const id_attribute = entity.id ? ` id="${escape_xml(String(entity.id))}"` : "";
  const rows = [];
  rows.push(`    <${specification.tag}${id_attribute} name="${escape_xml(entity.name || specification.default_name)}">`);
  rows.push(`      <${specification.psychology_tag}>`);

  const render_sheet_field = (tag, content, indent = 8) => {
    const text = String(content || "").trim();
    return text ? `        <${tag}>${inline_or_block(text, indent)}</${tag}>` : null;
  };

  if (include_agenda) {
    const agenda_raw = accessors ? accessors.future(entity, { vector_text: true }) : entity?.future;
    const row = render_sheet_field(specification.agenda_key, agenda_raw, 8);
    if (row) rows.push(row);
  }

  const personality_raw = sanitize_by_epistemic_policy(entity.eternal?.non_physical, epistemic.personality);
  const personality_content = render_field_value(personality_raw, entity, entities);
  const personality_row = render_sheet_field(specification.personality_tag, personality_content, 10);
  if (personality_row) rows.push(personality_row);

  const state_raw = sanitize_by_epistemic_policy(entity.present?.non_physical, epistemic.state);
  const state_rendered = render_field_value(state_raw, entity, entities);
  const state_content = strip_leading_key_echo(state_rendered, specification.state_strip_keys);
  const state_row = render_sheet_field(specification.state_tag, state_content, 10);
  if (state_row) rows.push(state_row);

  if (show_dispositions && active_names && name_to_id) {
    const dispositions_xml = render_dispositions(entity, active_names, name_to_id, 6);
    if (dispositions_xml) rows.push(dispositions_xml);
  }

  const axes_xml = render_axes && specification.axes_scope ? render_axes(dynamics, specification.axes_scope) : "";
  if (axes_xml) rows.push(indent_all(axes_xml, 6));

  rows.push(`      </${specification.psychology_tag}>`);

  if (physical_mode === "separate") {
    const entity_kind = specification.tag === "FRACTAL" || entity?.type === "fractal" ? "fractal" : "character";
    const physical_parts = [
      {
        tag: resolve_profile_field_tag(entity_kind, "eternal.physical", "PHYSICAL_APPEARANCE"),
        raw: sanitize_by_epistemic_policy(entity.eternal?.physical, epistemic.appearance),
      },
      {
        tag: resolve_profile_field_tag(entity_kind, "present.physical", "CURRENT_LOOK"),
        raw: sanitize_by_epistemic_policy(entity.present?.physical, epistemic.appearance),
      },
    ];

    for (const { tag, raw } of physical_parts) {
      const body = extract_physical_body(raw, entity, entities);
      if (body) {
        rows.push(`      <${tag}>\n${indent_all(body, 8)}\n      </${tag}>`);
      }
    }
  } else {
    const appearance_xml = render_appearance(
      sanitize_by_epistemic_policy(entity.eternal?.physical, epistemic.appearance),
      sanitize_by_epistemic_policy(entity.present?.physical, epistemic.appearance),
      entity,
      entities,
      specification.appearance_tag,
    );
    if (appearance_xml) rows.push(appearance_xml);
  }

  if (include_memories) {
    const memory_raw = accessors
      ? accessors.past(entity, { vector_text: true })
      : Array.isArray(entity?.past)
        ? entity.past
            .map((vector) => vector.content || "")
            .filter(Boolean)
            .join("\n")
        : entity?.past || "";
    const memory_content = sanitize_by_epistemic_policy(memory_raw, epistemic.memory);
    const memory_row = render_sheet_field(specification.memory_tag, memory_content, 8);
    if (memory_row) {
      rows.push(`  ${memory_row}`);
    }
  }

  rows.push(`    </${specification.tag}>`);
  return rows.join("\n");
}

// ============================================================================
// [SECTION 3: MASTER STORY ENTITIES ASSEMBLY]
// ============================================================================

/**
 * Compiles the master <ENTITIES> XML block configured by the active prompt manifest.
 * Symmetrically reads dispositions, dynamic_axes, user_agenda, and nearby_entities from config.entities.
 *
 * @param {Object} [parameters]
 * @param {Record<string, any>} [parameters.entities={}]
 * @param {any[]} [parameters.npc_entities=[]]
 * @param {string[]} [parameters.in_scene_ids=[]]
 * @param {any} [parameters.active_speaker=null]
 * @param {any} [parameters.accessors=null]
 * @param {any} [parameters.config=null] - Resolved prompt manifest record containing `.entities`.
 * @param {Function} [parameters.render_axes=null]
 * @param {boolean} [parameters.is_npc=false]
 * @param {any} [parameters.speaker_dynamics=null]
 * @param {any} [parameters.fractal_dynamics=null]
 * @returns {string}
 */
export function render_entity_sheets({
  entities = {},
  npc_entities = [],
  in_scene_ids = [],
  active_speaker = null,
  accessors = null,
  config = null,
  render_axes = null,
  is_npc = false,
  speaker_dynamics = null,
  fractal_dynamics = null,
}) {
  const entities_configuration = config?.entities || {};
  const dispositions_for = new Set(entities_configuration.dispositions || []);
  const axes_for = new Set(entities_configuration.dynamic_axes || []);

  const { active_names, name_to_id } = resolve_available_entities({
    entities,
    npc_entities,
    in_scene_ids,
  });
  const parts = [];

  const core_trio = [
    {
      key: "AI",
      specification: SHEET_SPECS.AI_CHARACTER,
      dynamics: axes_for.has("AI") ? speaker_dynamics : null,
      is_owner: !is_npc,
      include_agenda: true,
    },
    {
      key: "USER",
      specification: SHEET_SPECS.USER_PERSONA,
      dynamics: null,
      is_owner: false,
      include_agenda: Boolean(entities_configuration.user_agenda),
    },
    {
      key: "FRACTAL",
      specification: SHEET_SPECS.FRACTAL,
      dynamics: axes_for.has("FRACTAL") ? fractal_dynamics : null,
      is_owner: true,
      include_agenda: true,
    },
  ];

  for (const { key, specification, dynamics, is_owner, include_agenda } of core_trio) {
    const entity = entities?.[key];
    if (!entity) continue;
    parts.push(
      render_sheet(specification, {
        entity,
        entities,
        npc_entities,
        accessors,
        render_axes,
        dynamics,
        is_owner,
        show_dispositions: dispositions_for.has(key),
        include_agenda,
        active_names,
        name_to_id,
      }),
    );
  }

  const npc_ids_to_render = new Set();
  if (is_npc && active_speaker) {
    npc_ids_to_render.add(String(active_speaker.id ?? active_speaker.name));
  }
  if (dispositions_for.has("NPC") || axes_for.has("NPC")) {
    const in_scene_set = new Set((in_scene_ids || []).map(String));
    for (const npc_entity of npc_entities || []) {
      if (npc_entity?.id && in_scene_set.has(String(npc_entity.id))) {
        npc_ids_to_render.add(String(npc_entity.id));
      }
    }
  }

  const rendered_npc_ids = new Set();
  const active_speaker_id = is_npc && active_speaker ? String(active_speaker.id ?? active_speaker.name) : null;

  const candidate_npcs = [...(npc_entities || [])];
  if (is_npc && active_speaker && active_speaker_id && !candidate_npcs.some((candidate) => String(candidate?.id) === active_speaker_id)) {
    candidate_npcs.push(active_speaker);
  }

  for (const npc_entity of candidate_npcs) {
    const npc_id = String(npc_entity?.id);
    if (!npc_ids_to_render.has(npc_id) || rendered_npc_ids.has(npc_id)) continue;
    rendered_npc_ids.add(npc_id);

    const is_active_speaker = is_npc && active_speaker_id === npc_id;
    const is_bystander_npc = is_npc && !is_active_speaker;
    const resolved_npc_dynamics = is_active_speaker ? npc_entity?.dynamics || speaker_dynamics : npc_entity?.dynamics || null;

    parts.push(
      render_sheet(SHEET_SPECS.NPC, {
        entity: npc_entity,
        entities,
        npc_entities,
        accessors: is_bystander_npc ? null : accessors,
        render_axes,
        dynamics: axes_for.has("NPC") ? resolved_npc_dynamics : null,
        is_owner: !is_bystander_npc,
        show_dispositions: dispositions_for.has("NPC"),
        include_agenda: !is_bystander_npc,
        include_memories: !is_bystander_npc,
        active_names,
        name_to_id,
      }),
    );
  }

  if (entities_configuration.nearby_entities) {
    const nearby_candidates = (npc_entities || []).filter((npc) => (in_scene_ids || []).includes(npc?.id) && !rendered_npc_ids.has(String(npc?.id)));
    const nearby_xml = render_nearby_entities_xml(nearby_candidates, { indent: 4 });
    if (nearby_xml) parts.push(nearby_xml);
  }

  return render_xml_tag({
    tag: "ENTITIES",
    children: parts,
    indent: 2,
    child_indent: 2,
    separator: "\n\n",
  });
}

// ============================================================================
// [SECTION 4: AUXILIARY INTELLIGENCE SNAPSHOTS]
// ============================================================================

/**
 * Compiles a structured memory snapshot of an entity's complete state fragments for memory consolidation.
 * Symmetrically activated when `config.entities.target_context` is enabled.
 * Delegates directly to the universal render_sheet compiler with physical_mode: "separate".
 *
 * @param {string} entity_key
 * @param {any} entity
 * @returns {string}
 */
export function render_entity_memory_context(entity_key, entity) {
  if (!entity) return "";
  const specification = SHEET_SPECS[entity_key] || SHEET_SPECS.AI_CHARACTER;
  return render_sheet(specification, {
    entity,
    physical_mode: "separate",
    is_owner: true,
    include_agenda: true,
  });
}

/**
 * Compiles contextual sibling and temporal baseline blocks for profile field enhancement tasks.
 * Symmetrically activated when `config.entities.field_context` is enabled.
 *
 * @param {any} entity
 * @param {string} field_identifier - Dot-notation field key (e.g. "present.physical", "future").
 * @param {string} [content=""] - Current content being enhanced.
 * @param {string} [entity_type="character"]
 * @param {Function} [format_past_function=null] - Optional past vector formatter.
 * @returns {string}
 */
export function render_enhancement_field_context(entity, field_identifier, content = "", entity_type = "character", format_past_function = null) {
  if (!entity) return "";
  const [section_name, subsection_name] = String(field_identifier || "").split(".");
  const is_fractal = entity?.type === "fractal" || entity_type === "fractal";
  const entity_kind = is_fractal ? "fractal" : "character";

  if (section_name && subsection_name && ["eternal", "present"].includes(section_name)) {
    const sibling_subsection = subsection_name === "physical" ? "non_physical" : "physical";
    const target_paths = [
      `${section_name}.${subsection_name}`,
      `${section_name}.${sibling_subsection}`,
      ...(section_name === "present" ? [`eternal.${subsection_name}`] : []),
    ];

    const inner_content = target_paths
      .map((path) => {
        const tag = resolve_profile_field_tag(entity_kind, path);
        if (!tag) return "";
        const raw_value = resolve_entity_field_value(entity, path);
        const value = path.endsWith(".physical") ? extract_physical_body(raw_value) : escape_xml(String(raw_value ?? "").trim());
        if (!value) return "";
        return `<${tag}>\n${indent_continuation(value, 8)}\n    </${tag}>`;
      })
      .filter(Boolean)
      .join("\n    ");

    if (!inner_content) return "";
    return render_xml_tag({
      tag: "ENTITY_CONTEXT",
      children: [inner_content],
      indent: 2,
      child_indent: 4,
    });
  }

  if (field_identifier === "past" || field_identifier === "future") {
    const is_past = field_identifier === "past";
    const tag = resolve_profile_field_tag(entity_kind, field_identifier, is_past ? "MEMORIES" : "AGENDA");
    const text = is_past
      ? typeof format_past_function === "function"
        ? format_past_function(entity, content)
        : (Array.isArray(entity?.past) ? entity.past : [])
            .map((vector) => vector.content || "")
            .filter(Boolean)
            .join("\n")
      : String(entity?.future || "").trim();

    if (!text) return "";
    return render_xml_tag({
      tag: "ENTITY_CONTEXT",
      children: [render_xml_tag({ tag, children: [escape_xml(text)], child_indent: 6 })],
      indent: 2,
      child_indent: 4,
    });
  }

  return "";
}

/**
 * Compiles co-located <SUBJECT_RULES> for Sensory Cortex image synthesis.
 * Keeps entity unboxing & wardrobe rules adjacent to physical character data.
 *
 * @param {boolean} [has_alternation=false]
 * @returns {string} XML formatted <SUBJECT_RULES> block
 */
export function render_optics_subject_rules(has_alternation = false) {
  const rules = [
    "<DYNAMIC_OVERRIDES>Follow a strict bottom-up hierarchy where the most recent (bottom-most) physical condition update ALWAYS overrides preceding static tags like <SHIRT> or <JACKET>. If a conflicting state appears later (e.g. 'no clothes' then later 'shirt: white'), the most recent/latest state wins.</DYNAMIC_OVERRIDES>",
    "<GARMENT_ANATOMY>When rendering specialized or revealing garments (e.g., jockstraps, thongs, harnesses), explicitly specify their physical mechanics and bare skin exposure in natural prose. For a jockstrap, describe: 'wearing an athletic jockstrap featuring a supportive front pouch, open sides and back with bare exposed butt cheeks, and dual wide elastic straps circling under the glutes/thighs'. For thongs, describe: 'a narrow string back leaving the rear completely bare'. Never allow jockstraps to collapse into generic briefs or full-coverage shorts.</GARMENT_ANATOMY>",
    has_alternation
      ? "<ALTERNATION_OPTIONS>Resolve {Option A|Option B} alternations by selecting exactly ONE contextually fitting option. Emit only the chosen text—never echo braces or pipes, blend choices, or output multiple options simultaneously.</ALTERNATION_OPTIONS>"
      : null,
    '<IDENTIFIERS>Always explicitly state gender and physical identifiers (e.g., "a handsome young male high-elf man").</IDENTIFIERS>',
    '<CREATURE_DISAMBIGUATION>Never use bare animal/creature proper names (e.g., "Beast"). Translate to explicit physical traits (e.g., "a massive grey-green male orc warrior").</CREATURE_DISAMBIGUATION>',
    "<SIGNATURE_COLORS>Every character's distinctive color and physical identifiers (hair color, eye color, skin markings, glowing tattoo accents) are non-negotiable visual anchors. You MUST preserve all declared color and identity tokens verbatim in the output prompt prose.</SIGNATURE_COLORS>",
  ].filter(Boolean);

  return render_xml_tag({
    tag: "SUBJECT_RULES",
    children: rules,
    child_indent: 2,
    separator: "\n",
  });
}

// ============================================================================
// [SECTION 5: SENSORY OPTICS ENTITY COMPILERS]
// ============================================================================

/**
 * Compiles active characters and cinematography blocks for Sensory Cortex image synthesis.
 * @param {Object} [parameters={}]
 * @returns {string} XML formatted ENTITIES envelope content
 */
export function render_optics_entities_xml({
  tier = "solo_entity",
  solo_subject = null,
  active_ai_character = null,
  active_user_persona = null,
  active_fractal_setting = null,
  main_entity = null,
  macro_entities = {},
  roll = (text) => text,
  has_alternation = false,
} = {}) {
  const render_entity_block = (tag_name, entity_instance) => {
    if (!entity_instance) return "";
    const blocks = [];
    if (entity_instance.eternal?.physical) {
      blocks.push(
        physical_to_xml(
          roll(strip_visual_excluded(parse_macros(String(entity_instance.eternal.physical).trim(), entity_instance, macro_entities))),
          "PHYSICAL_APPEARANCE",
        ),
      );
    }
    if (entity_instance.present?.physical) {
      blocks.push(
        physical_to_xml(
          roll(strip_visual_excluded(parse_macros(String(entity_instance.present.physical).trim(), entity_instance, macro_entities))),
          "CURRENT_IMPRESSION",
        ),
      );
    }
    if (!blocks.length) return "";
    return `<${tag_name} name="${escape_xml(entity_instance.name || tag_name)}">\n${blocks.join("\n")}\n</${tag_name}>`;
  };

  const ai_character_block = render_entity_block("AI_CHARACTER", active_ai_character);
  const user_persona_block = render_entity_block("USER_PERSONA", active_user_persona);

  const is_story_tier = tier === "story_entities" || tier === "story_character" || tier === "story_scene";
  const fractal_setting_block =
    is_story_tier && active_fractal_setting
      ? render_entity_block("FRACTAL", active_fractal_setting)
      : is_story_tier && main_entity
        ? `<BACKGROUND_DIRECTIVE>You MUST synthesize an evocative, atmospheric background environment that naturally fits the personality, visual theme, and signature colors of ${prompt_escape(main_entity.name || "the subject")}.</BACKGROUND_DIRECTIVE>`
        : "";

  const context_block = (() => {
    switch (tier) {
      case "solo_entity":
        return `<ACTIVE_CHARACTERS>\n${render_entity_block("SOLO_ENTITY", solo_subject)}\n</ACTIVE_CHARACTERS>\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Isolated single-subject portrait. No secondary characters, no story scene context. The backdrop must be drawn solely from the subject's own identity and signature colors.</RESTRICTION>`;
      case "story_scene":
        return `${fractal_setting_block}\n<ENVIRONMENTAL_SCALING>**AFFIRMATIVE ENVIRONMENTAL SCALE.** Focus completely on vast landscape architecture, atmospheric density, weather effects, and physical spatial structures.</ENVIRONMENTAL_SCALING>`;
      case "story_entities":
        return `<ACTIVE_CHARACTERS>\n${ai_character_block}\n${user_persona_block}\n</ACTIVE_CHARACTERS>\n${fractal_setting_block}`;
      case "story_character":
      default:
        return `<ACTIVE_CHARACTERS>\n${render_entity_block(main_entity === active_user_persona || main_entity?.type === "user" ? "USER_PERSONA" : main_entity?.type === "fractal" ? "FRACTAL" : "AI_CHARACTER", main_entity)}\n</ACTIVE_CHARACTERS>\n${fractal_setting_block}`;
    }
  })();

  const subject_rules_block = render_optics_subject_rules(has_alternation);

  return render_xml_tag({
    tag: "ENTITIES",
    children: [context_block.trim(), subject_rules_block.trim()].filter(Boolean),
    indent: 2,
    child_indent: 2,
    separator: "\n\n",
  });
}

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-19: Layer boundary purification: Replaced `@media` import of `strip_visual_excluded` with sibling import from `./epistemic.js`, restoring unidirectional downward layer flow.
 * - 2026-09-19: Added <SIGNATURE_COLORS> directive in render_optics_subject_rules mandating verbatim preservation of hair, eyes, and distinctive accent colors in generated prompt prose (F1).
 * - 2026-09-19: Architectural boundary purification: Relocated `resolve_optics_cinematography` to Layer 6 `src/intelligence/modules/task.js`; `sheets.js` now exclusively governs Layer 4 (<ENTITIES>) physical appearance synthesis, entity specs, and subject rules.
 * - 2026-09-18: Absorbed render_optics_entities_xml from deconstructed optics.js unifying visual entity sheets and cinematography into canonical <ENTITIES> envelope.
 * - 2026-09-18: Standardized master entity sheet envelope tag from <AVAILABLE_ENTITIES> to canonical <ENTITIES> per scrobbles.md blueprint.
 * - 2026-09-18: Extracted sheet specifications, physical synthesis, and universal sheet compilation into dedicated sheets.js submodule.
 * ============================================================================
 */
