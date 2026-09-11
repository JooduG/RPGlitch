/**
 * src/intelligence/prompts/interaction-prompt.js
 * 🧬 SHARED ENTITY SHEETS — the canonical, mode-driven <STORY_ENTITIES> compiler.
 *
 * One sheet vocabulary for every prompt (Director, Story Prose, narrator):
 *   AI_CHARACTER / USER_PERSONA / FRACTAL / NPC, each carrying
 *   <PSYCHOLOGY> (or <ATMOSPHERE> for the FRACTAL), an optional merged
 *   <APPEARANCE>/<TOPOGRAPHY>, and MEMORIES / BACKSTORY / HISTORY.
 *
 * Which sheets appear and which blocks they carry is driven by each mode's
 * `sheets` config in prompt-modes.json:
 *   - dispositions:   entity keys whose sheet renders per-entity <DISPOSITIONS>
 *                     (an "NPC" entry also renders in-scene NPC sheets so their
 *                     edges have a home)
 *   - dynamic_axes:   entity keys whose sheet renders <DYNAMIC_AXES>
 *   - user_agenda:    expose the USER's future vector as <AGENDA>
 *   - proximate_npcs: render the in-scene <PROXIMATE_NPCS> roster
 *
 * Role lines are NOT part of the sheets — every caller injects one right after
 * <SYSTEM>.
 */

import { escape_xml, prompt_escape, physical_to_xml, parse_relational_vector, strip_leading_key_echo, render_field_value } from "@utils";
import { render_dynamics_axes_xml } from "./physics-prompt.js";
import { strip_epistemic_secrets, strip_epistemic_tags } from "./shared.js";

// ── 1. Layout Helpers ─────────────────────────────────────────────────────────

/**
 * Indents every line of a multi-line string (unlike @utils `ind`, which leaves
 * the first line unindented).
 * @param {string|null|undefined} text
 * @param {number} spaces
 * @returns {string}
 */
export function indent_all(text, spaces) {
  if (!text) return "";
  const prefix = " ".repeat(spaces);
  return String(text)
    .trim()
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

/**
 * Inlines single-line content inside a tag, or renders multi-line content as an
 * indented block with the closing tag at `indent - 2`.
 * @param {string|null|undefined} content
 * @param {number} indent
 * @returns {string}
 */
export function inline_or_block(content, indent) {
  const text = String(content || "").trim();
  if (!text) return "";
  if (text.includes("\n")) {
    return `\n${indent_all(text, indent)}\n${" ".repeat(indent - 2)}`;
  }
  return text;
}

/**
 * Expands a physical/non-physical state value (bracket pseudo-JSON, uppercase
 * KEY: value prose, or free prose) into inner XML child rows via physical_to_xml.
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
function render_appearance(eternal_text, present_text, owner, entities, tag = "APPEARANCE") {
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

// ── 2. Identity & Disposition Helpers ─────────────────────────────────────────

/**
 * Name → entity id lookup used to render DISPOSITION target attributes as entity
 * ids (e.g. premade ids like "RUST", "JULIEN", "TARTARUS").
 * @param {any} entities
 * @param {any[]} [npc_entities]
 * @returns {Map<string, string>}
 */
function _name_to_id_map(entities, npc_entities) {
  const map = new Map();
  const add = (e) => {
    if (e?.name) map.set(String(e.name).toLowerCase().trim(), e?.id || e.name);
  };
  for (const e of [entities?.AI, entities?.USER, entities?.FRACTAL]) add(e);
  for (const n of npc_entities || []) add(n);
  return map;
}

/** Active (present-in-story) names: AI + USER + FRACTAL + in-scene NPCs. */
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

/**
 * Renders an entity's outgoing relationships as
 * <DISPOSITION target="ID">dynamic</DISPOSITION>, only for targets present in
 * the story, keyed by entity id.
 * @returns {string}
 */
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

/** Renders the in-scene NPC roster as <PROXIMATE_NPCS> with <NPC id name /> rows. */
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

// ── 3. Entity Sheets ──────────────────────────────────────────────────────────

/** AI_CHARACTER / NPC character sheet. */
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

/**
 * USER_PERSONA sheet. <DISPOSITIONS> and <DYNAMIC_AXES> render only when the
 * mode opts in — the player's directed attitudes are otherwise private (see
 * L3_SPATIAL / L5_AGENCY); omniscient modes (narrator/director) may include them.
 */
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

/** FRACTAL sheet — unified shape for narrator and character modes. */
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

// ── 4. Mode-Driven <STORY_ENTITIES> Compiler ──────────────────────────────────

/**
 * Compiles the shared <STORY_ENTITIES> block from the active prompt-mode's
 * `sheets` config. Renders AI / USER / FRACTAL sheets, an active NPC sheet when
 * the speaker is an NPC, and in-scene NPC sheets whenever the mode's
 * dispositions (or dynamic axes) cover "NPC".
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

/**
 * CHANGELOG
 * - 2026-09-10: Extracted from story-prompt.js as the single mode-driven
 *   <STORY_ENTITIES> compiler shared by Shot 2 and the Director. Sheets and their
 *   blocks are selected by the active mode's `sheets` config in prompt-modes.json:
 *   `dispositions` / `dynamics_axes` name the entities that carry <DISPOSITIONS> /
 *   <DYNAMIC_AXES> (an "NPC" entry also pulls in-scene NPC sheets), `user_agenda`
 *   exposes the USER's <AGENDA>, and `proximate_npcs` toggles the in-scene roster.
 *   Role lines are intentionally NOT emitted here — callers inject one under <SYSTEM>.
 */
