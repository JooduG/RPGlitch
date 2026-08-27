/**
 * src/intelligence/prompts/shared.js
 * 🧩 SHARED PROMPT COMPOSITION & PREFIX CACHING
 *
 * Shared byte-identical system head prefix, dynamics legend, epistemic wall filters,
 * roster/mesh XML compilers, pacing heuristics, and recency anchors.
 */

import { ind, prompt_escape, state_bridge, escape_xml, parse_relational_vector } from "@utils";
import { NARRATIVE_STYLES, PROTOCOL_LIBRARY } from "@data";
import { DYNAMICS_META } from "../dynamics.js";
import { clean_xml, collapse_history } from "../parser.js";
import { temporal_engine, resolve_vector_pool } from "../temporal-pipeline.js";

/** @type {string | null} */
let cached_dynamics_legend = null;
/** @type {Map<string, string>} */
export const protocols_cache = new Map();
/** @type {Map<string, string>} */
export const system_head_cache = new Map();
export const SYSTEM_HEAD_CACHE_CAP = 16;

export function render_protocols(selection) {
  if (!selection) return "";
  if (protocols_cache.has(selection)) {
    return protocols_cache.get(selection);
  }
  const rendered = selection
    .split(",")
    .map((k) => {
      const key = k.trim().toUpperCase();
      const parts = key.split(".");
      let rule = PROTOCOL_LIBRARY;
      for (const part of parts) {
        rule = rule?.[part];
        if (!rule) break;
      }
      if (!rule || typeof rule !== "string") return "";
      const tag = parts[parts.length - 1];
      if (rule.includes("\n")) {
        return `<${tag}>\n${rule}\n</${tag}>`;
      }
      return `<${tag}>${rule}</${tag}>`;
    })
    .filter(Boolean)
    .join("\n");
  protocols_cache.set(selection, rendered);
  return rendered;
}

export const render_builder = {
  create_render_accessors(entities = {}, input = "", raw_messages = []) {
    const resolve = (ref) => (typeof ref === "string" ? entities[ref] || entities.AI || {} : ref || {});
    const scoring_context = `${input || ""} ${(Array.isArray(raw_messages) ? raw_messages : [])
      .slice(-10)
      .map((m) => m.content || m.text || "")
      .join(" ")}`.trim();

    const vector_pool = (entity) => (Array.isArray(entity?.memories) && entity.memories.length ? entity.memories : resolve_vector_pool(entity));

    return {
      _context: scoring_context,
      past: (ref, options = {}) => {
        const entity = resolve(ref);
        const formatted = temporal_engine.format(vector_pool(entity), scoring_context, {
          offset: 0,
          max_chars: 1500,
          ...options,
        });
        return parse_macros(formatted, entity, entities);
      },
      future: (ref) => {
        const entity = resolve(ref);
        return parse_macros(String(entity?.future || "").trim(), entity, entities);
      },
      simulation_log: (limit = 10, offset = 0) => render_builder.render_history(raw_messages, limit, offset),
    };
  },
  render_history(simulation_log, count = 10, offset = 0) {
    if (!simulation_log || typeof simulation_log === "string") return simulation_log || "";
    const collapsed = collapse_history(simulation_log, { separator: "\n", stripBoldQuotes: true });
    const start = Math.max(0, collapsed.length - (count + offset));
    const end = Math.max(0, collapsed.length - offset);
    return collapsed
      .slice(start, end)
      .map((c) => `    <entry role="${c.role}"${c.name ? ` name="${escape_xml(c.name)}"` : ""}>${prompt_escape(c.content)}</entry>`)
      .join("\n");
  },
};

/**
 * Strips epistemic [SECRET: ...] / [PLAN: ...] brackets from rendered state so
 * the AI character never receives another entity's private knowledge across the
 * Epistemic Wall (telepathy/metagaming guard). Director & Ghostwriter keep the
 * full state; only render_character sanitizes the USER_PERSONA blocks.
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
 * Builds a dynamic rule guide explaining all simulation sliders to the LLM.
 * @returns {string}
 */
export function build_dynamics_legend() {
  if (cached_dynamics_legend !== null) return cached_dynamics_legend;
  if (!DYNAMICS_META) return "";

  const definitions = Object.entries(DYNAMICS_META)
    .map(([key, meta]) => `    - ${key} (${meta.label}): ${meta.desc}`)
    .join("\n");

  cached_dynamics_legend = `
<DYNAMICS_LEGEND>
  Scale: 0 (minimum) to 100 (maximum)
  Axes:
${definitions}
  Laws:
  ${PROTOCOL_LIBRARY.DYNAMICS.LAWS}
</DYNAMICS_LEGEND>`.trim();

  return cached_dynamics_legend;
}

/**
 * Safely parses macros in dynamic text with entity references.
 * @param {string} text
 * @param {any} owner
 * @param {any} entities
 * @returns {string}
 */
export function parse_macros(text, owner, entities = {}) {
  if (!text || !entities) return text || "";
  const ai_name = entities.AI?.name || "AI";
  const user_name = entities.USER?.name || "User";
  const fractal_name = entities.FRACTAL?.name || "Fractal";

  return text.replace(/\{\{(.*?)\}\}/g, (match, macro) => {
    const token = macro.toLowerCase().trim();
    if (owner === entities.AI) {
      const map = { me: ai_name, char: ai_name, you: user_name, user: user_name, fractal: fractal_name };
      return map[token] ?? match;
    }
    if (owner === entities.USER) {
      const map = { me: user_name, user: user_name, you: ai_name, char: ai_name, fractal: fractal_name };
      return map[token] ?? match;
    }
    if (owner === entities.FRACTAL) {
      const map = { fractal: fractal_name, me: fractal_name, you: `${ai_name} and ${user_name}`, char: ai_name, user: user_name };
      return map[token] ?? match;
    }
    return match;
  });
}

/**
 * Safely evaluates, parses, and escapes an entity fragment value.
 * @param {any} text
 * @param {any} owner
 * @param {any} entities
 * @returns {string}
 */
export const render_field_value = (text, owner, entities) => {
  if (!text) return "";
  return prompt_escape(parse_macros(String(text).trim(), owner, entities));
};

/**
 * Resolves the active narrative style key from fractal or app settings.
 * Returns "" if no valid style is active.
 * @returns {string}
 */
export function resolve_active_style_key() {
  const style_key =
    state_bridge.runtime?.active_fractal?.narrative_style && state_bridge.runtime?.active_fractal.narrative_style !== "default"
      ? state_bridge.runtime?.active_fractal.narrative_style
      : state_bridge.app?.settings?.narrative_style;
  if (!style_key || style_key === "default" || !NARRATIVE_STYLES[style_key]) return "";
  return style_key;
}

/**
 * Resolves the active POV protocol key for an entity profile.
 * @param {any} entity
 * @returns {"POV.FIRST_PERSON" | "POV.THIRD_PERSON"}
 */
export function resolve_pov_protocol(entity) {
  const pov = entity?.pov || (entity?.type === "fractal" ? "3rd_person" : "1st_person");
  return pov === "3rd_person" ? "POV.THIRD_PERSON" : "POV.FIRST_PERSON";
}

/**
 * Renders the active narrative style XML block.
 * @returns {string}
 */
export function render_narrative_style_xml() {
  const style_key = resolve_active_style_key();
  if (!style_key) return "";

  const style_def = NARRATIVE_STYLES[style_key];
  if (!style_def) return "";

  const narrator_attr = `narrator="${escape_xml(style_key)}"`;

  let desc_xml = "";
  if (style_def.description) {
    desc_xml = `\n    <DESCRIPTION>${escape_xml(style_def.description)}</DESCRIPTION>`;
  }

  let themes_xml = "";
  if (style_def.tags && style_def.tags.length > 0) {
    themes_xml = `\n    <DEFINING_CHARACTERISTICS>${escape_xml(style_def.tags.join(", "))}</DEFINING_CHARACTERISTICS>`;
  }

  const base_engine = style_def.narrative_engine ? `\n    ${ind(style_def.narrative_engine, 4).trim()}` : "";

  return `\n  <NARRATIVE_STYLE ${narrator_attr}>${desc_xml}${themes_xml}${base_engine}\n  </NARRATIVE_STYLE>`;
}

/**
 * Compiles dynamic system parameter keys into inline attributes.
 * @param {Record<string, number>} [dynObj]
 * @returns {string}
 */
export function format_dynamics_attrs(dynObj) {
  if (!dynObj) return "";
  const attrs = Object.entries(dynObj)
    .map(([k, v]) => `${escape_xml(k)}="${Math.round(v)}"`)
    .join(" ");
  return attrs ? ` ${attrs}` : "";
}

/**
 * Detects a non-verbal, environmental user turn — no quoted dialogue, with
 * spatial/locational focus — and returns a hint nudging the Director to route
 * the beat to the fractal narrator. Returns "" for dialogue-heavy or
 * character-facing turns.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function non_verbal_environmental_hint(input) {
  if (!input?.trim()) return "";
  const has_dialogue = /["'“”‘’]/.test(input);
  if (has_dialogue) return "";
  const spatial_verbs =
    /\b(step|walk|enter|approach|study|examine|press|watch|observe|descend|ascend|peer|reach|touch|grip|lean|kneel|stand|wait|listen|smell|scan|sweep|climb|move|circle|bend|follow|open|close|hold|stare|gaze|rest|push|pull|turn|edge|halt|pause|trail|settle|pause|linger)\b/i;
  const spatial_nouns =
    /\b(door|gate|wall|room|hall|cave|forest|vault|stair|passage|corridor|window|floor|ceiling|rock|stone|water|river|bridge|tower|street|alley|field|sky|wind|rain|shadow|light|threshold|lock|mechanism|gear|wheel|conduit|tunnel|arch|column|altar|seal|cylinder|crevice|spillway|belly|deeps|mouth|chamber|alcove|ledge|court|yard|keep)\b/i;
  if (!spatial_verbs.test(input) && !spatial_nouns.test(input)) return "";
  return `<USER_ACTION_NOTE>This turn is a non-verbal, environmental action. Strongly consider setting "speaker" to "fractal" so the scene/setting itself narrates the moment — unless the AI character should react directly.</USER_ACTION_NOTE>`;
}

// Compact one-line cast summary (~25 tokens per signature).
const _cast_summary = (npc) => {
  const desc = String(npc?.description || npc?.eternal?.non_physical || npc?.present?.non_physical || "")
    .replace(/\s+/g, " ")
    .trim();
  return desc.length > 130 ? `${desc.slice(0, 130).trim()}…` : desc;
};

const _tier_label = (tier) => (tier === 3 ? "Major" : tier === 2 ? "Recurring" : "Background");

/**
 * Renders the compact roster index — every non-trio entity as a 1-line
 * signature, tagged with its tier and stage presence.
 * @param {any[]} [npc_entities]
 * @param {string[]} [in_scene_ids]
 * @param {any[]} [active_trio_ids]
 */
export function render_roster_xml(npc_entities = [], in_scene_ids = [], active_trio_ids = []) {
  const trio = new Set((active_trio_ids || []).filter(Boolean).map(String));
  const cast = (npc_entities || []).filter((n) => n && !trio.has(String(n.id)));
  if (!cast.length) return "";
  const rows = cast.map((n) => {
    const tier = Number(n.role_tier) || 1;
    const presence = (in_scene_ids || []).includes(String(n.id)) ? "In-Scene" : "Off-Screen (Stasis)";
    return `- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}): ${escape_xml(_cast_summary(n))} [${_tier_label(tier)}] [${presence}]`;
  });
  return `<ROSTER>\n${rows.join("\n")}\n</ROSTER>`;
}

/**
 * Renders the stage roster — the active trio plus every in-scene NPC with its
 * tier and openness (the credulity axis for the Naivety Prior).
 */
export function render_scene_roster_xml(entities = {}, npc_entities = [], in_scene_ids = []) {
  const rows = [];
  if (entities?.AI?.name) rows.push(`- ${escape_xml(entities.AI.name)}: Primary Companion (In-Scene)`);
  if (entities?.USER?.name) rows.push(`- ${escape_xml(entities.USER.name)}: Protagonist (In-Scene)`);
  for (const n of npc_entities || []) {
    if (!(in_scene_ids || []).includes(String(n.id))) continue;
    const tier = Number(n.role_tier) || 1;
    rows.push(
      `- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}) [Tier ${tier} / ${_tier_label(tier)}] (Openness: ${Number(n.dynamics?.openness) || 50})`,
    );
  }
  return rows.length ? `<SCENE_ROSTER>\n${rows.join("\n")}\n</SCENE_ROSTER>` : "";
}

/**
 * Renders the flat relational mesh — directed "[Source] → [Target]: [Dynamic]"
 * vectors gathered from the entities.
 * @param {any} [entities]
 * @param {any[]} [npc_entities]
 * @param {any} [perspective_entity]
 */
export function render_relational_mesh_xml(entities = {}, npc_entities = [], perspective_entity = null) {
  const rels = [];
  const perspective_name = perspective_entity?.name ? String(perspective_entity.name).toLowerCase().trim() : null;
  const fractal_name = entities?.FRACTAL?.name ? String(entities.FRACTAL.name).toLowerCase().trim() : null;

  const push = (e) => {
    if (!e?.name) return;
    for (const r of Array.isArray(e?.relationships) ? e.relationships : []) {
      const parsed = parse_relational_vector(r);
      if (!parsed) continue;

      if (perspective_name) {
        // Epistemic Law: An entity only knows their OWN outgoing feelings/relations
        // and public environment/fractal dynamics. They CANNOT read what other entities privately feel about them.
        const src = parsed.source_name.toLowerCase();
        const is_from_me = src === perspective_name;
        const is_fractal = fractal_name && src === fractal_name;
        if (is_from_me || is_fractal) {
          rels.push(`- ${escape_xml(parsed.raw)}`);
        }
      } else {
        rels.push(`- ${escape_xml(parsed.raw)}`);
      }
    }
  };

  push(entities?.AI);
  push(entities?.USER);
  push(entities?.FRACTAL);
  for (const n of npc_entities || []) push(n);
  return rels.length ? `<RELATIONAL_MESH>\n${rels.join("\n")}\n</RELATIONAL_MESH>` : "";
}

export const ENTITY_CONVERGENCE_LAW_XML = `<ENTITY_CONVERGENCE_LAW>
1. Always inspect <ROSTER> before introducing any secondary character.
2. If an existing cast member matches the role or location (medical, black market, security), you MUST use that existing entity rather than inventing a duplicate.
3. Only introduce a brand-new nameless character if no existing cast member is remotely applicable.
</ENTITY_CONVERGENCE_LAW>`;

export const EPISTEMIC_ROSTER_RULES_XML = `<EPISTEMIC_RULES>
1. Entities only perceive spoken dialogue, visible actions, and physical items in the room.
2. Private player thoughts, unseen inventory, and off-screen events are NULL DATA.
3. Knowledge travels strictly along physical conduits (sight, hearing, writing) — zero telepathy.
</EPISTEMIC_RULES>`;

/**
 * The <CURRENT_STORY_STATE> block shared by storyteller prompts: who is in the
 * room, the relational web, and the epistemic rules that govern it.
 * @param {any} [entities]
 * @param {any[]} [npc_entities]
 * @param {string[]} [in_scene_ids]
 * @param {any} [perspective_entity]
 */
export function render_current_story_state_xml(entities = {}, npc_entities = [], in_scene_ids = [], perspective_entity = null) {
  const body = [
    render_scene_roster_xml(entities, npc_entities, in_scene_ids),
    render_relational_mesh_xml(entities, npc_entities, perspective_entity),
    EPISTEMIC_ROSTER_RULES_XML,
  ]
    .filter(Boolean)
    .join("\n");
  return body ? `<CURRENT_STORY_STATE>\n${body}\n</CURRENT_STORY_STATE>` : "";
}

/**
 * Input-rhythm calibration: classifies the user's message and returns an
 * explicit length/energy directive so reply length mirrors input rhythm.
 * @param {string|null} input
 * @returns {string}
 */
export function build_pacing_directive(input) {
  const text = String(input || "").trim();
  if (!text) {
    return "INPUT RHYTHM: no prompt — advance the situation with one brief, deliberate beat.";
  }
  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (chars >= 300 || words >= 60) {
    return "INPUT RHYTHM: expansive. You may expand to match the message's breadth, but still close on one decisive hook.";
  }
  const has_action =
    /\b(?:draw|grab|gripp?|take|push|pull|run|walk|strike|slam|open|step|slip|raise|turn|leap|dash|kneel|reach|press|set|lower|climb|swing|draws|grabs|steps|raises|turns|opens|says|whispers|shouts|nods|shakes|stands|sits|takes|pulls|pushes)\b/i.test(
      text,
    );
  const is_question = /\?\s*$/.test(text);
  const is_silence = !has_action && !is_question && words <= 12;
  if (chars <= 40 || words <= 8) {
    if (is_silence) {
      return "INPUT RHYTHM: passive silence. Do not stall — escalate with a direct probe (a pointed question, a challenge, or an unexpected development) in one or two taut sentences.";
    }
    return "INPUT RHYTHM: terse. Match it — a brief, weighted reply of one to three sharp beats (short sentences, a single decisive action or line). Do not pad.";
  }
  return "INPUT RHYTHM: moderate. A reply of a few sentences — long enough for substance, short enough to keep the scene moving.";
}

/**
 * Recency Anchor — a short behavioral lock re-injected at the BOTTOM of the
 * prompt, the region the attention window most strongly weights at generation time.
 * @param {any} snapshot - compressed world snapshot
 * @param {string} [input] - current user action / scene beat
 * @returns {string}
 */
export function build_recency_anchor(snapshot, input) {
  const stance = snapshot?.ai?.dynamics
    ? Object.entries(snapshot.ai.dynamics)
        .filter(([, v]) => typeof v === "number")
        .filter(([k]) => k === "affinity" || k === "intensity")
        .map(([k, v]) => `${k}=${Math.round(v)}`)
        .join(", ")
    : "";
  const scene_hook = String(input || "").trim() ? "Act on what this exact beat shows you." : "Push the situation forward on your own terms.";
  const body = `Hold your temperament; do not soften into pleasantness. Know only what this scene has shown you. Do not rush the tension.${stance ? ` (${escape_xml(stance)})` : ""} ${scene_hook}`;
  return `<RECENCY_ANCHOR>\n    ${body}\n  </RECENCY_ANCHOR>`;
}

const _eternal_fp = (entity) => (entity ? [entity.id || "", entity.name || "", JSON.stringify(entity.eternal || {})].join("|") : "∅");

const _system_head_key = (entities) => `${_eternal_fp(entities?.AI)}||${_eternal_fp(entities?.FRACTAL)}||style=${resolve_active_style_key()}`;

/**
 * Shared SYSTEM head — the byte-identical prefix of every turn-loop prompt.
 * @param {any} entities
 * @returns {string}
 */
export function render_system_head(entities = {}) {
  const key = _system_head_key(entities);
  const hit = system_head_cache.get(key);
  if (hit !== undefined) return hit;

  const head = clean_xml(`
<SYSTEM>
  ${ind(build_dynamics_legend(), 2)}
  ${render_narrative_style_xml()}
  <CAST>
    ${
      entities?.AI
        ? `    <AI_CHARACTER name="${escape_xml(entities.AI.name || "AI")}">
      <PERSONALITY>${render_field_value(entities.AI.eternal?.non_physical, entities.AI, entities)}</PERSONALITY>
      <PERMANENT_APPEARANCE>${render_field_value(entities.AI.eternal?.physical, entities.AI, entities)}</PERMANENT_APPEARANCE>
    </AI_CHARACTER>`
        : ""
    }
    ${
      entities?.FRACTAL
        ? `    <FRACTAL name="${escape_xml(entities.FRACTAL.name || "the setting")}">
      <METAPHYSICAL_TRUTHS>${render_field_value(entities.FRACTAL.eternal?.non_physical, entities.FRACTAL, entities)}</METAPHYSICAL_TRUTHS>
      <ENVIRONMENT>${render_field_value(entities.FRACTAL.eternal?.physical, entities.FRACTAL, entities)}</ENVIRONMENT>
    </FRACTAL>`
        : ""
    }
  </CAST>
  `).trim();

  system_head_cache.set(key, head);
  if (system_head_cache.size > SYSTEM_HEAD_CACHE_CAP) {
    const oldest = system_head_cache.keys().next().value;
    system_head_cache.delete(oldest);
  }
  return head;
}
