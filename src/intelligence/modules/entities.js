/**
 * src/intelligence/modules/entities.js
 * ============================================================================
 * 👥 ENTITIES MODULE — Sheet Compilation, Epistemic Wall & Memory XML Formats
 * ============================================================================
 *
 * Compiles all entity XML formats across the intelligence layer:
 * 1. Epistemic Wall Filters (strip_epistemic_tags, strip_epistemic_secrets)
 * 2. Appearance & Topography Merging (render_appearance)
 * 3. Identity & Dispositions (Dispositions, Proximate NPCs)
 * 4. Entity Sheet Compilers (Speaker, User Persona, Fractal)
 * 5. Master <STORY_ENTITIES> Compiler (render_entity_sheets)
 * 6. Stage Spotlight Choreography (render_scene_spotlight_xml, SPOTLIGHT_RULES)
 * 7. Memory & Chapter XML Contexts (render_entity_memory_context, render_chapter_history_xml, format_recent_history)
 * 8. Profile Field Context XML (render_enhancement_field_context)
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation.
 * - Strict Epistemic Wall: user [SECRET: ...] and [PLAN: ...] are never exposed across boundaries.
 * ============================================================================
 */

import {
  escape_xml,
  prompt_escape,
  physical_to_xml,
  parse_relational_vector,
  strip_leading_key_echo,
  render_field_value,
  ind,
  clean_xml,
  indent_all,
  inline_or_block,
} from "@utils";
import { PROFILE_FIELDS } from "@data";
import { render_dynamics_axes_xml } from "../physics.js";

// ── 1. Epistemic Wall Filters ─────────────────────────────────────────────────

/**
 * Strips epistemic [SECRET: ...] / [PLAN: ...] brackets from rendered state so
 * the AI character never receives another entity's private knowledge across the
 * Epistemic Wall.
 * @param {string} text
 * @returns {string}
 */
export function strip_epistemic_tags(text) {
  if (!text) return "";
  return String(text)
    .replace(/\[(?:SECRET|PLAN)\s*:\s*[^\]]*\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Strips epistemic secrets and plans across entity boundaries.
 * If is_owner is true, preserves the secrets; if false, strips them completely.
 * @param {string|null|undefined} state_text
 * @param {boolean} [is_owner=false]
 * @returns {string}
 */
export function strip_epistemic_secrets(state_text, is_owner = false) {
  if (!state_text) return "";
  if (is_owner) return String(state_text);
  return strip_epistemic_tags(state_text);
}

// ── 2. Appearance & Physical State Helpers ────────────────────────────────────

/**
 * Expands a physical/non-physical state value into inner XML child rows.
 * @param {string|null|undefined} raw
 * @param {any} owner
 * @param {any} entities
 * @returns {string[]}
 */
function _physical_rows(raw, owner, entities) {
  const xml = physical_to_xml(render_field_value(raw, owner, entities), "BODY");
  if (!xml) return [];
  const structured = xml.match(/^ {2}<BODY>\n([\s\S]*?)\n {2}<\/BODY>$/);
  if (structured)
    return structured[1]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  const prose = xml.match(/^ {2}<BODY>([\s\S]*?)<\/BODY>$/);
  return prose && prose[1].trim() ? [prose[1].trim()] : [];
}

/**
 * Merges eternal (permanent) + present (current) physical state into ONE
 * <APPEARANCE> (or <TOPOGRAPHY>) tag: permanent fields first, then current.
 * @param {string|null|undefined} eternal_text
 * @param {string|null|undefined} present_text
 * @param {any} owner
 * @param {any} entities
 * @param {string} [tag="APPEARANCE"]
 * @returns {string}
 */
export function render_appearance(eternal_text, present_text, owner, entities, tag = "APPEARANCE") {
  const merged = [];
  const index_by_tag = new Map();
  const tag_of = (row) => {
    const match = String(row).match(/^<([A-Za-z0-9_]+)/);
    return match ? match[1].toUpperCase() : String(row);
  };
  for (const row of [..._physical_rows(eternal_text, owner, entities), ..._physical_rows(present_text, owner, entities)]) {
    const key = tag_of(row);
    if (index_by_tag.has(key)) merged[index_by_tag.get(key)] = row;
    else {
      index_by_tag.set(key, merged.length);
      merged.push(row);
    }
  }
  if (!merged.length) return "";
  const inner = merged.map((row) => `        ${row}`).join("\n");
  return `      <${tag}>\n${inner}\n      </${tag}>`;
}

// ── 3. Identity & Disposition Helpers ─────────────────────────────────────────

function _name_to_id_map(entities, npc_entities) {
  const map = new Map();
  const add = (e) => {
    if (e?.name) map.set(String(e.name).toLowerCase().trim(), e?.id || e.name);
  };
  for (const e of [entities?.AI, entities?.USER, entities?.FRACTAL]) add(e);
  for (const n of npc_entities || []) add(n);
  return map;
}

function _active_names(entities, npc_entities, in_scene_ids) {
  const names = new Set();
  for (const e of [entities?.AI, entities?.USER, entities?.FRACTAL]) {
    if (e?.name) names.add(String(e.name).toLowerCase().trim());
  }
  for (const n of npc_entities || []) {
    if ((in_scene_ids || []).includes(String(n?.id)) && n?.name) {
      names.add(String(n.name).toLowerCase().trim());
    }
  }
  return names;
}

function _render_dispositions(entity, entities, npc_entities, active_names, name_to_id, indent = 8) {
  if (!entity?.name) return "";
  const src = String(entity.name).toLowerCase().trim();
  const pad = " ".repeat(indent);
  const rows = [];
  for (const r of Array.isArray(entity?.relationships) ? entity.relationships : []) {
    const parsed = parse_relational_vector(r);
    if (!parsed) continue;
    if (String(parsed.source_name).toLowerCase().trim() !== src) continue;
    if (!active_names.has(String(parsed.target_name).toLowerCase().trim())) continue;
    const target_id = name_to_id.get(String(parsed.target_name).toLowerCase().trim()) || parsed.target_name;
    rows.push(`${pad}  <DISPOSITION target="${escape_xml(target_id)}">${prompt_escape(parsed.dynamic || "Relationship")}</DISPOSITION>`);
  }
  if (!rows.length) return "";
  return `${pad}<DISPOSITIONS>\n${rows.join("\n")}\n${pad}</DISPOSITIONS>`;
}

function _render_proximate_npcs(npc_entities = [], in_scene_ids = []) {
  const rows = [];
  for (const n of npc_entities || []) {
    if (!n || !n.name) continue;
    if (!(in_scene_ids || []).includes(String(n.id))) continue;
    rows.push(`      <NPC id="${escape_xml(String(n.id))}" name="${escape_xml(String(n.name))}" />`);
  }
  if (!rows.length) return "";
  return `    <PROXIMATE_NPCS>\n${rows.join("\n")}\n    </PROXIMATE_NPCS>`;
}

// ── 4. Entity Sheet Compilers ─────────────────────────────────────────────────

function _render_speaker_sheet({
  entity,
  entities,
  npc_entities = [],
  accessors,
  tag = "AI_CHARACTER",
  is_owner = true,
  dynamics = null,
  axis_scope = null,
  show_dispositions = true,
  active_names = new Set(),
  name_to_id = new Map(),
}) {
  if (!entity) return "";
  const id_attr = entity?.id ? ` id="${escape_xml(String(entity.id))}"` : "";
  const rows = [];
  rows.push(`    <${tag}${id_attr} name="${escape_xml(entity?.name || tag)}">`);
  rows.push(`      <PSYCHOLOGY>`);
  const agenda = accessors?.future(entity, { vector_text: true });
  if (String(agenda || "").trim()) rows.push(`        <AGENDA>${inline_or_block(agenda, 10)}</AGENDA>`);
  const personality = render_field_value(entity?.eternal?.non_physical, entity, entities);
  if (String(personality || "").trim()) rows.push(`        <PERSONALITY>${inline_or_block(personality, 10)}</PERSONALITY>`);
  const state = strip_leading_key_echo(render_field_value(strip_epistemic_secrets(entity?.present?.non_physical, is_owner), entity, entities), [
    "STATE_OF_MIND",
    "STATE",
  ]);
  if (String(state || "").trim()) rows.push(`        <STATE>${inline_or_block(state, 10)}</STATE>`);
  if (show_dispositions) {
    const dispositions = _render_dispositions(entity, entities, npc_entities, active_names, name_to_id, 8);
    if (dispositions) rows.push(dispositions);
  }
  const axes = render_dynamics_axes_xml(dynamics, axis_scope);
  if (axes) rows.push(indent_all(axes, 8));
  rows.push(`      </PSYCHOLOGY>`);
  const appearance = render_appearance(entity?.eternal?.physical, entity?.present?.physical, entity, entities);
  if (appearance) rows.push(appearance);
  const memories = accessors?.past(entity, { vector_text: true });
  if (String(memories || "").trim()) rows.push(`      <MEMORIES>${inline_or_block(memories, 8)}</MEMORIES>`);
  rows.push(`    </${tag}>`);
  return rows.join("\n");
}

function _render_user_persona_sheet({
  entities,
  accessors,
  include_agenda = false,
  show_dispositions = false,
  npc_entities = [],
  active_names = new Set(),
  name_to_id = new Map(),
}) {
  const user = entities?.USER;
  if (!user) return "";
  const id_attr = user?.id ? ` id="${escape_xml(String(user.id))}"` : "";
  const rows = [];
  rows.push(`    <USER_PERSONA${id_attr} name="${escape_xml(user?.name || "User")}">`);
  rows.push(`      <PSYCHOLOGY>`);
  if (include_agenda) {
    const agenda = accessors?.future(user, { vector_text: true });
    if (String(agenda || "").trim()) rows.push(`        <AGENDA>${inline_or_block(agenda, 10)}</AGENDA>`);
  }
  const personality = render_field_value(strip_epistemic_tags(user?.eternal?.non_physical), user, entities);
  if (String(personality || "").trim()) rows.push(`        <PERSONALITY>${inline_or_block(personality, 10)}</PERSONALITY>`);
  const state = strip_leading_key_echo(render_field_value(strip_epistemic_secrets(user?.present?.non_physical, false), user, entities), [
    "STATE_OF_MIND",
    "STATE",
  ]);
  if (String(state || "").trim()) rows.push(`        <STATE>${inline_or_block(state, 10)}</STATE>`);
  if (show_dispositions) {
    const dispositions = _render_dispositions(user, entities, npc_entities, active_names, name_to_id, 8);
    if (dispositions) rows.push(dispositions);
  }
  rows.push(`      </PSYCHOLOGY>`);
  const appearance = render_appearance(strip_epistemic_tags(user?.eternal?.physical), strip_epistemic_tags(user?.present?.physical), user, entities);
  if (appearance) rows.push(appearance);
  const backstory = strip_epistemic_secrets(accessors?.past(user, { vector_text: true }), false);
  if (String(backstory || "").trim()) rows.push(`      <BACKSTORY>${inline_or_block(backstory, 8)}</BACKSTORY>`);
  rows.push(`    </USER_PERSONA>`);
  return rows.join("\n");
}

function _render_fractal_sheet({
  entities,
  accessors,
  dynamics = null,
  axis_scope = null,
  show_dispositions = true,
  npc_entities = [],
  name_to_id = new Map(),
  active_names = new Set(),
}) {
  const fractal = entities?.FRACTAL;
  if (!fractal) return "";
  const id_attr = fractal?.id ? ` id="${escape_xml(String(fractal.id))}"` : "";
  const rows = [];
  rows.push(`    <FRACTAL${id_attr} name="${escape_xml(fractal?.name || "the setting")}">`);
  rows.push(`      <ATMOSPHERE>`);
  const trajectory = accessors?.future(fractal, { vector_text: true });
  if (String(trajectory || "").trim()) rows.push(`        <TRAJECTORY>${inline_or_block(trajectory, 10)}</TRAJECTORY>`);
  const permanent = render_field_value(fractal?.eternal?.non_physical, fractal, entities);
  if (String(permanent || "").trim()) rows.push(`        <PERMANENT_TRUTHS>${inline_or_block(permanent, 10)}</PERMANENT_TRUTHS>`);
  const state = strip_leading_key_echo(render_field_value(fractal?.present?.non_physical, fractal, entities), ["CURRENT_STATE", "STATE"]);
  if (String(state || "").trim()) rows.push(`        <STATE>${inline_or_block(state, 10)}</STATE>`);
  if (show_dispositions) {
    const dispositions = _render_dispositions(fractal, entities, npc_entities, active_names, name_to_id, 8);
    if (dispositions) rows.push(dispositions);
  }
  const axes = render_dynamics_axes_xml(dynamics, axis_scope);
  if (axes) rows.push(indent_all(axes, 8));
  rows.push(`      </ATMOSPHERE>`);
  const topography = render_appearance(fractal?.eternal?.physical, fractal?.present?.physical, fractal, entities, "TOPOGRAPHY");
  if (topography) rows.push(topography);
  const history = accessors?.past(fractal, { vector_text: true });
  if (String(history || "").trim()) rows.push(`      <HISTORY>${inline_or_block(history, 8)}</HISTORY>`);
  rows.push(`    </FRACTAL>`);
  return rows.join("\n");
}

// ── 5. Mode-Driven <STORY_ENTITIES> Master Compiler ───────────────────────────

/**
 * Compiles the shared <STORY_ENTITIES> block from the active prompt-mode's `sheets` config.
 *
 * @param {Object} [params]
 * @param {any} [params.entities]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @param {any} [params.active_speaker]
 * @param {any} [params.accessors]
 * @param {any} [params.config] - Resolved prompt-mode record (must carry `.sheets`).
 * @param {boolean} [params.is_npc=false]
 * @param {any} [params.speaker_dynamics]
 * @param {any} [params.fractal_dynamics]
 * @returns {string}
 */
export function render_entity_sheets({
  entities = {},
  npc_entities = [],
  in_scene_ids = [],
  active_speaker = null,
  accessors = null,
  config = null,
  is_npc = false,
  speaker_dynamics = null,
  fractal_dynamics = null,
}) {
  const sheets = config?.sheets || {};
  const dispositions_for = new Set(sheets.dispositions || []);
  const axes_for = new Set(sheets.dynamic_axes || []);

  const active_names = _active_names(entities, npc_entities, in_scene_ids);
  const name_to_id = _name_to_id_map(entities, npc_entities);
  const parts = [];

  if (entities?.AI) {
    parts.push(
      _render_speaker_sheet({
        entity: entities.AI,
        entities,
        npc_entities,
        accessors,
        tag: "AI_CHARACTER",
        is_owner: !is_npc,
        dynamics: axes_for.has("AI") ? speaker_dynamics : null,
        axis_scope: "somatic",
        show_dispositions: dispositions_for.has("AI"),
        active_names,
        name_to_id,
      }),
    );
  }

  if (entities?.USER) {
    parts.push(
      _render_user_persona_sheet({
        entities,
        accessors,
        include_agenda: !!sheets.user_agenda,
        show_dispositions: dispositions_for.has("USER"),
        npc_entities,
        active_names,
        name_to_id,
      }),
    );
  }

  if (entities?.FRACTAL) {
    parts.push(
      _render_fractal_sheet({
        entities,
        accessors,
        dynamics: axes_for.has("FRACTAL") ? fractal_dynamics : null,
        axis_scope: "fractal",
        show_dispositions: dispositions_for.has("FRACTAL"),
        npc_entities,
        name_to_id,
        active_names,
      }),
    );
  }

  const npc_ids = new Set();
  if (is_npc && active_speaker) npc_ids.add(String(active_speaker.id ?? active_speaker.name));
  if (dispositions_for.has("NPC") || axes_for.has("NPC")) {
    for (const n of npc_entities || []) {
      if ((in_scene_ids || []).includes(String(n?.id))) npc_ids.add(String(n.id));
    }
  }
  const active_speaker_id = active_speaker ? String(active_speaker.id ?? active_speaker.name) : null;
  for (const n of npc_entities || []) {
    if (!npc_ids.has(String(n?.id))) continue;
    parts.push(
      _render_speaker_sheet({
        entity: n,
        entities,
        npc_entities,
        accessors,
        tag: "NPC",
        is_owner: true,
        dynamics: axes_for.has("NPC") ? speaker_dynamics || n?.dynamics : null,
        axis_scope: "somatic",
        show_dispositions: dispositions_for.has("NPC"),
        active_names,
        name_to_id,
      }),
    );
  }
  if (is_npc && active_speaker && active_speaker_id && !npc_ids.has(active_speaker_id)) {
    parts.push(
      _render_speaker_sheet({
        entity: active_speaker,
        entities,
        npc_entities,
        accessors,
        tag: "NPC",
        is_owner: true,
        dynamics: axes_for.has("NPC") ? speaker_dynamics : null,
        axis_scope: "somatic",
        show_dispositions: dispositions_for.has("NPC"),
        active_names,
        name_to_id,
      }),
    );
  }

  if (sheets.proximate_npcs !== false) {
    const proximate_npcs = _render_proximate_npcs(npc_entities, in_scene_ids);
    if (proximate_npcs) parts.push(proximate_npcs);
  }

  return `  <STORY_ENTITIES>\n${parts.join("\n\n")}\n  </STORY_ENTITIES>`;
}

// ── 7. Stage Spotlight & Cast Convergence Rules ───────────────────────────────

export const SPOTLIGHT_RULES = Object.freeze({
  ROUTING_HEADER: "SPEAKER ROUTING RULES:",
  ROUTING_RULES: `- "AI_CHARACTER": (Default) AI companion reacts to the protagonist.
- "FRACTAL": User action is non-verbal and environmental (exploring atmosphere, architecture, weather, objects without dialogue) or to break up long streaks of AI speech.
- "npc:<id>": An active in-scene secondary character takes the floor.
- "GENESIS": A new character is introduced into the world. Only mint if no existing candidate applies.`,
  CONVERGENCE_HEADER: "CONVERGENCE & CAST LAW:",
  CONVERGENCE_LAW:
    "Always inspect candidate secondary characters below before minting a duplicate. If an existing cast member matches the required role or location (medical, security, merchant), you MUST use that existing entity rather than inventing a duplicate.",
  PARTICIPANTS_HEADER: "ACTIVE IN-SCENE PARTICIPANTS:",
  CANDIDATES_HEADER: "CANDIDATE SECONDARY CHARACTERS:",
});

const _cast_summary = (npc) => {
  const desc = String(npc?.description || npc?.eternal?.non_physical || npc?.present?.non_physical || "")
    .replace(/\s+/g, " ")
    .trim();
  return desc.length > 130 ? `${desc.slice(0, 130).trim()}…` : desc;
};

/**
 * Renders the Stage Spotlight XML block for Director turn orchestration.
 * @param {Object} [params]
 * @param {any} [params.entities]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @returns {string}
 */
export function render_scene_spotlight_xml({ entities = {}, npc_entities = [], in_scene_ids = [] } = {}) {
  const active_trio_ids = new Set([entities?.AI?.id, entities?.USER?.id, entities?.FRACTAL?.id].filter(Boolean).map(String));
  const in_scene_set = new Set((in_scene_ids || []).filter(Boolean).map(String));

  const active_participants = [];
  if (entities?.AI?.name) active_participants.push(`- ${escape_xml(entities.AI.name)}: Primary Companion (In-Scene)`);
  if (entities?.USER?.name) active_participants.push(`- ${escape_xml(entities.USER.name)}: Protagonist (In-Scene)`);

  const candidate_secondaries = [];

  for (const n of npc_entities || []) {
    if (!n || active_trio_ids.has(String(n.id))) continue;
    const is_in_scene = in_scene_set.has(String(n.id));
    const summary = _cast_summary(n);
    const summary_suffix = summary ? `: ${escape_xml(summary)}` : "";
    if (is_in_scene) {
      active_participants.push(`- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}) [In-Scene]${summary_suffix}`);
    } else {
      candidate_secondaries.push(`- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}) [Off-Screen (Stasis)]${summary_suffix}`);
    }
  }

  const { CANDIDATES_HEADER, ROUTING_HEADER, ROUTING_RULES, CONVERGENCE_HEADER, CONVERGENCE_LAW, PARTICIPANTS_HEADER } = SPOTLIGHT_RULES;
  const candidate_section = candidate_secondaries.length > 0 ? `\n\n${CANDIDATES_HEADER}\n${candidate_secondaries.join("\n")}` : "";

  return `<SCENE_SPOTLIGHT>
${ROUTING_HEADER}
${ROUTING_RULES}

${CONVERGENCE_HEADER}
${CONVERGENCE_LAW}

${PARTICIPANTS_HEADER}
${active_participants.join("\n")}${candidate_section}
</SCENE_SPOTLIGHT>`;
}

// ── 8. Memory & Chapter XML Contexts ──────────────────────────────────────────

/**
 * Renders in-scene participant blocks and wraps them in <SCENE_CAST>.
 * @param {Record<string, any>} [other_entities={}]
 * @param {string} [target_key=""]
 * @returns {string}
 */
export function render_scene_cast_xml(other_entities = {}, target_key = "") {
  const other_blocks = Object.entries(other_entities)
    .filter(([k, e]) => e && k !== target_key)
    .map(([k, e]) => {
      const summary = e.present?.non_physical || e.eternal?.non_physical || "Active in scene";
      return `  <IN_SCENE_PARTICIPANT name="${escape_xml(e.name || k)}" role="${escape_xml(k)}">\n    <SUMMARY>${escape_xml(summary)}</SUMMARY>\n  </IN_SCENE_PARTICIPANT>`;
    });

  return other_blocks.length ? `  <SCENE_CAST>\n${other_blocks.join("\n")}\n  </SCENE_CAST>\n` : "";
}

/**
 * Renders an entity's internal memory context block.
 * @param {string} key
 * @param {any} entity
 * @returns {string}
 */
export function render_entity_memory_context(key, entity) {
  if (!entity) return "";
  const name = escape_xml(entity?.name || key);
  const is_fractal = key === "FRACTAL";
  const kind = is_fractal ? "fractal" : "character";

  const get_tag = (sec, sub) => PROFILE_FIELDS[sec]?.[sub]?.[kind]?.label?.toUpperCase()?.replace(/\s+/g, "_") || "";

  const tag_personality = get_tag("eternal", "non_physical");
  const tag_state_of_mind = get_tag("present", "non_physical");
  const tag_appearance = get_tag("eternal", "physical");
  const tag_current_look = get_tag("present", "physical");
  const tag_future = "AGENDA";

  return clean_xml(`
  <${key} name="${name}">
    <NAME>${name}</NAME>
    <${tag_personality}>${escape_xml(entity?.eternal?.non_physical || "")}</${tag_personality}>
    <${tag_state_of_mind}>${escape_xml(entity?.present?.non_physical || "")}</${tag_state_of_mind}>
    <${tag_appearance}>
      ${ind(
        physical_to_xml(entity?.eternal?.physical, "PHYSICAL")
          .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </${tag_appearance}>
    <${tag_current_look}>
      ${ind(
        physical_to_xml(entity?.present?.physical, "PHYSICAL")
          .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </${tag_current_look}>
    <${tag_future}>${escape_xml(String(entity?.future || "").trim())}</${tag_future}>
  </${key}>
  `).trim();
}

// ── 9. Profile Field Context XML ──────────────────────────────────────────────

/**
 * Compiles specific sub-fragment context for field enhancement.
 * @param {any} entity
 * @param {string} field_id
 * @param {string} [content]
 * @param {string} [entity_type]
 * @param {Function} [format_past_fn] - Optional past vector formatter
 * @returns {string}
 */
export function render_enhancement_field_context(entity, field_id, content = "", entity_type = "character", format_past_fn = null) {
  if (!entity) return "";
  const [section, sub] = String(field_id || "").split(".");
  const is_fractal = entity?.type === "fractal" || entity_type === "fractal";
  const kind = is_fractal ? "fractal" : "character";

  if (section && sub && ["eternal", "present"].includes(section)) {
    const block_for = (sec, sub_key) => {
      const field_def = PROFILE_FIELDS[sec]?.[sub_key]?.[kind];
      const tag = field_def?.label ? field_def.label.toUpperCase().replace(/\s+/g, "_") : "";
      if (!tag) return "";
      const raw = entity?.[sec]?.[sub_key];
      const value =
        sub_key === "physical"
          ? physical_to_xml(raw, "PHYSICAL")
              .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
              .trim()
          : escape_xml(String(raw ?? "").trim());
      if (!value) return "";
      return `<${tag}>\n${ind(value, 8)}\n    </${tag}>`;
    };

    const blocks = [block_for(section, sub)];
    const sibling = sub === "physical" ? "non_physical" : "physical";
    blocks.push(block_for(section, sibling));
    if (section === "present") blocks.push(block_for("eternal", sub));

    const inner = blocks.filter(Boolean).join("\n    ");
    if (!inner) return "";
    return clean_xml(`\n  <ENTITY_CONTEXT>\n    ${inner}\n  </ENTITY_CONTEXT>\n  `).trim();
  }

  if (field_id === "past" || field_id === "future") {
    const is_past = field_id === "past";
    const tag = is_past ? PROFILE_FIELDS.past.label.toUpperCase() : "AGENDA";
    let text;
    if (is_past) {
      if (typeof format_past_fn === "function") {
        text = format_past_fn(entity, content);
      } else {
        const pool = Array.isArray(entity?.past) ? entity.past : [];
        text = pool
          .map((v) => v.content || "")
          .filter(Boolean)
          .join("\n");
      }
    } else {
      text = String(entity?.future || "").trim();
    }
    if (!text) return "";
    return clean_xml(`\n  <ENTITY_CONTEXT>\n    <${tag}>\n      ${ind(escape_xml(text), 6)}\n    </${tag}>\n  </ENTITY_CONTEXT>\n  `).trim();
  }

  return "";
}

/**
 * CHANGELOG
 * - 2026-09-11: Delegated format_recent_history and render_chapter_history_xml to history.js, and added render_scene_cast_xml.
 * - 2026-09-11: Renamed module to entities.js. Absorbed format_recent_history, render_chapter_history_xml, render_entity_memory_context, and render_enhancement_field_context.
 * - 2026-09-11: Added SPOTLIGHT_RULES and render_scene_spotlight_xml for Stage Spotlight orchestration.
 * - 2026-09-11: Initial creation of modular story-entities.js extracting sheet compilation and epistemic boundaries.
 */
