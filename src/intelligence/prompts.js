/**
 * src/intelligence/prompts.js
 * 🧠 INTELLIGENCE KERNEL PROMPT SYNTHESIZER
 * Centralized assembly line for the Intelligence Kernel.
 * (track-npc-expansion: world cast, stage spotlight, NPC persona prompts)
 * Synthesizes simulation state, entities, and memories into XML system schemas.
 */
import { ind, prompt_escape, state_bridge, escape_xml, physical_to_xml, parse_relational_vector } from "@utils";
import { NARRATIVE_STYLES, PROTOCOL_LIBRARY, build_available_keywords_xml, build_somatic_directives_block, get_style_keywords } from "@data";
import { DYNAMICS_META, build_signals_xml } from "./dynamics.js";
import { ENTITY_CATALOG, ENTITY_FRAGMENTS, TEMPORAL_CONTRACT, SIGNATURE_COLORS } from "@data";
import { clean_xml, collapse_history, strip_cognition_blocks } from "./parser.js";
import { temporal_engine, resolve_vector_pool } from "./temporal.js";

// PROTOCOL_LIBRARY is defined in @data/definitions/protocols.js and re-exported here
// so both @intelligence and @media share the same catalog without cross-layer
// import violations.
export { PROTOCOL_LIBRARY };

/** @type {string | null} */
let cached_dynamics_legend = null;
/** @type {Map<string, string>} */
const protocols_cache = new Map();
/** @type {Map<string, string>} */
const system_head_cache = new Map();
const SYSTEM_HEAD_CACHE_CAP = 16;

// --- JSON Schema Templates ---

const DIRECTOR_JSON_SCHEMA = `{
  "_thought_process": "<ONE short sentence: the key state change this turn>",
  "speaker": "'ai' (the AI_CHARACTER speaks) | 'fractal' (the FRACTAL narrates the scene/setting) | 'npc:<id>' (an in-scene NPC from <ROSTER>) — default 'ai'",
  "keywords": "1-2 keywords chosen from <AVAILABLE_KEYWORDS> matching the emotional undercurrent (or [])",
  "story_status": "'IN_PROGRESS' | 'CONCLUDED' (overarching story quest won) | 'COLLAPSED' (quest lost irrevocably) — default 'IN_PROGRESS'",
  "in_scene_change": { "enter": ["npc:<id>"], "exit": ["npc:<id>"] },
  "promotions": [ { "id": "npc:<id>", "tier": 2 } ],
  "relationships": "[Optional: relational edges that CHANGED this turn, as 'Source → Target: dynamic' (betrayal, rescue, alliance, rivalry, debt). Names MUST match <ROSTER>/<SCENE_ROSTER> exactly. Omit when the web is unchanged.]",
  "genesis": "[Optional: request a brand-new recurring NPC only when NO <ROSTER> member fits the role — { "name": "...", "description": "...", "signature_color": "one from <AVAILABLE_SIGNATURE_COLORS>" }, max 2. Never for an existing cast member.]",
  "directive": "<Optional in-character stage direction for the AI_CHARACTER (under 30 words, or empty string). Never reveal hidden agendas as fact.>",
  "AI_CHARACTER": {
    "state_append": {
      "physical": "New physical changes (e.g. bleeding, or explicit clothing updates like [SHIRT: none]), or empty string.",
      "non_physical": "Immediate internal shifts or emotional reactions, or empty string."
    },
    "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0 }
  },
  "USER_PERSONA": {
    "state_append": { "physical": "", "non_physical": "" }
  },
  "FRACTAL": {
    "state_append": { "physical": "", "non_physical": "" },
    "dynamics_deltas": { "entropy": 0, "velocity": 0 }
  },
  "trigger_image": "false"
}`;

const MEMORY_JSON_SCHEMA = `{
  "_thought_process": "<one short sentence>",
  "AI_CHARACTER": {
    "eternal": { "physical": "Permanent appearance change or empty string", "non_physical": "Permanent personality shift or empty string" },
    "present": { "physical": "Clean updated current conditions (or empty if unchanged)", "non_physical": "1-3 sentences of evocative present-tense state of mind, matching the existing field's register — never key/value fragments, never empty" },
    "future": "REQUIRED: the standing agenda rewritten from this history (intent, prophecy, looming threat, impulse) as 2-5 sentences of active future tense — must differ from the old agenda whenever events changed it; never echo it verbatim",
    "past": [ { "content": "ONLY if a durable fact emerged worth keeping (EMPTY LIST otherwise; AT MOST 1 ITEM)", "type": "past", "emotional_weight": 5 } ]
  },
  "USER_PERSONA": {
    "eternal": { "physical": "", "non_physical": "" },
    "present": { "physical": "", "non_physical": "1-3 sentences of evocative present-tense state of mind, matching the existing field's register — never key/value fragments, never empty" },
    "future": "REQUIRED: the standing agenda rewritten from this history (2-5 sentences, active future tense) — drop goals this history fulfilled, refresh the rest; never echo the old text verbatim",
    "past": [ { "content": "ONLY if a durable fact emerged worth keeping (EMPTY LIST otherwise; AT MOST 1 ITEM)", "type": "past", "emotional_weight": 5 } ]
  },
  "FRACTAL": {
    "eternal": { "physical": "", "non_physical": "" },
    "present": { "physical": "", "non_physical": "1-3 sentences of evocative present-tense fractal/scene state, matching the existing field's register — never key/value fragments, never empty" },
    "future": "REQUIRED: the fractal standing agenda — environmental prophecy, scene shift, or looming impulse — rewritten from this history (2-5 sentences, active future tense). Resolved shifts/prophecies MUST be dropped and replaced by their aftermath; never leave the fractal agenda unchanged and never echo the old text verbatim",
    "past": [ { "content": "ONLY if a durable fact/setting shift emerged (EMPTY LIST otherwise; AT MOST 1 ITEM)", "type": "past", "emotional_weight": 5 } ]
  }
}`;

/**
 * Strips epistemic [SECRET: ...] / [PLAN: ...] brackets from rendered state so
 * the AI character never receives another entity's private knowledge across the
 * Epistemic Wall (telepathy/metagaming guard). Director & Ghostwriter keep the
 * full state; only render_character sanitizes the USER_PERSONA blocks.
 * @param {string} text
 * @returns {string}
 */
function strip_epistemic_tags(text) {
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
function build_dynamics_legend() {
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
 * Safely evaluates, parses, and escapes an entity fragment value.
 * @param {any} text
 * @param {any} owner
 * @param {any} entities
 * @returns {string}
 */
const render_field_value = (text, owner, entities) => {
  if (!text) return "";
  return prompt_escape(prompt_builder.parse_macros(String(text).trim(), owner, entities));
};

/**
 * Resolves the active narrative style key from fractal or app settings.
 * Returns "" if no valid style is active.
 * @returns {string}
 */
function resolve_active_style_key() {
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
function resolve_pov_protocol(entity) {
  const pov = entity?.pov || (entity?.type === "fractal" ? "3rd_person" : "1st_person");
  return pov === "3rd_person" ? "POV.THIRD_PERSON" : "POV.FIRST_PERSON";
}

/**
 * Renders the active narrative style XML block.
 * @returns {string}
 */
function render_narrative_style_xml() {
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
function format_dynamics_attrs(dynObj) {
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
function non_verbal_environmental_hint(input) {
  if (!input?.trim()) return "";
  const has_dialogue = /["'“”‘’]/.test(input);
  if (has_dialogue) return "";
  const spatial_verbs =
    /\b(step|walk|enter|approach|study|examine|press|watch|observe|descend|ascend|peer|reach|touch|grip|lean|kneel|stand|wait|listen|smell|scan|sweep|climb|move|circle|bend|follow|open|close|hold|stare|gaze|rest|push|pull|turn|edge|halt|pause|trail|settle|pause|linger)\b/i;
  const spatial_nouns =
    /\b(door|gate|wall|room|hall|cave|forest|vault|stair|passage|corridor|window|floor|ceiling|rock|stone|water|river|bridge|tower|street|alley|field|sky|wind|rain|shadow|light|threshold|lock|mechanism|gear|wheel|conduit|tunnel|arch|column|altar|seal|cylinder|crevice|spillway|belly|deeps|mouth|chamber|alcove|ledge|ledge|court|yard|keep)\b/i;
  if (!spatial_verbs.test(input) && !spatial_nouns.test(input)) return "";
  return `<USER_ACTION_NOTE>This turn is a non-verbal, environmental action. Strongly consider setting "speaker" to "fractal" so the scene/setting itself narrates the moment — unless the AI character should react directly.</USER_ACTION_NOTE>`;
}

// ===========================================================================
// NPC WORLD-CAST PROMPT BLOCKS (track-npc-expansion)
// ===========================================================================

/** Compact one-line cast summary (~25 tokens per signature). */
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
function render_roster_xml(npc_entities = [], in_scene_ids = [], active_trio_ids = []) {
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
function render_scene_roster_xml(entities = {}, npc_entities = [], in_scene_ids = []) {
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
 * When perspective_entity is provided (e.g. AI Character or NPC), it scopes
 * the mesh to that entity's subjective perspective (their own outgoing bonds
 * and incoming bonds directed at them from the world/environment, but never
 * private outgoing bonds of third parties like USER_PERSONA).
 * @param {any} [entities]
 * @param {any[]} [npc_entities]
 * @param {any} [perspective_entity]
 */
function render_relational_mesh_xml(entities = {}, npc_entities = [], perspective_entity = null) {
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

const ENTITY_CONVERGENCE_LAW_XML = `<ENTITY_CONVERGENCE_LAW>
1. Always inspect <ROSTER> before introducing any secondary character.
2. If an existing cast member matches the role or location (medical, black market, security), you MUST use that existing entity rather than inventing a duplicate.
3. Only introduce a brand-new nameless character if no existing cast member is remotely applicable.
</ENTITY_CONVERGENCE_LAW>`;

const EPISTEMIC_ROSTER_RULES_XML = `<EPISTEMIC_RULES>
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
function render_current_story_state_xml(entities = {}, npc_entities = [], in_scene_ids = [], perspective_entity = null) {
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
 * Input-rhythm calibration (track-director-expansion 4.4): classifies the user's
 * message and returns an explicit length/energy directive so reply length
 * mirrors input rhythm (terse → staccato, silent → escalated probing,
 * expansive → matching breadth). Deterministic — no model calls.
 * @param {string|null} input
 * @returns {string}
 */
function build_pacing_directive(input) {
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
 * It re-asserts the three invariants that decay fastest in a long window:
 * temperament (not softness), the epistemic horizon (only what this scene showed),
 * and pacing (don't rush). Kept tiny (~1-2 sentences) so it stays "pinned".
 * @param {any} snapshot - compressed world snapshot (for the emotional stance)
 * @param {string} [input] - current user action / scene beat
 * @returns {string}
 */
function build_recency_anchor(snapshot, input) {
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

/**
 * Renders an entity's closed-chapter history (track-director-expansion 4.5) so
 * the Memory Forge can recognize milestone boundaries and the standing agenda
 * never pretends an archived objective is still pending.
 * @param {any} entity
 * @returns {string}
 */
function render_chapter_history_xml(entity) {
  const chapters = Array.isArray(entity?.chapters) ? entity.chapters : [];
  const closed = chapters.filter((c) => c?.status === "closed");
  if (!closed.length) return "";
  const rows = closed
    .slice(-6)
    .map((c) => `- Chapter ${escape_xml(String(c.title || "Untitled"))}: ${escape_xml(String(c.summary || "").slice(0, 220))}`);
  return `<CHAPTER_HISTORY>\n${rows.join("\n")}\n</CHAPTER_HISTORY>`;
}

// ---------------------------------------------------------------------------
// Shared SYSTEM head — the byte-identical prefix of every turn-loop prompt.
// ---------------------------------------------------------------------------
// The turn loop emits several DIFFERENT prompts per turn (director -> character
// -> director -> ...) and LLM providers prefix-cache on byte-identical request
// prefixes, so a head shared by ALL roles is a cache hit on EVERY turn, not
// just every same-role turn. Only eternal-static content that every role may
// safely see lives here: the dynamics legend, the narrative style, and the
// eternal baselines of the AI character and the world (FRACTAL).
//
// ⚠️ EPISTEMIC WALL — the USER's eternal profile is deliberately NOT shared:
// render_character() strips [SECRET:]/[PLAN:] from it while the Director/NPC/
// narrator render it verbatim, so no single rendering is safe for every role.
// Each prompt still renders its own user block in its role-specific tail.
//
// ⚠️ CACHE INVARIANT — every input this function reads MUST be reflected in
// _system_head_key(). If you add content to the head, extend the key.

const _eternal_fp = (entity) => (entity ? [entity.id || "", entity.name || "", JSON.stringify(entity.eternal || {})].join("|") : "∅");

const _system_head_key = (entities) => `${_eternal_fp(entities?.AI)}||${_eternal_fp(entities?.FRACTAL)}||style=${resolve_active_style_key()}`;

function render_system_head(entities = {}) {
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

/**
 * Director prompt compiler (Shot 1).
 * @param {any} params
 * @returns {{ system: string, task: string }}
 */
function render_director({ round, entities, input, render_accessors, compressed_snapshot, raw_messages, npc_entities = [], in_scene_ids = [] }) {
  const protocols = [
    "FORMATS.JSON_ONLY",
    "AGENCY.FICTIONAL_LICENSE",
    "DIRECTOR.CONTINUITY",
    "DIRECTOR.PLOT_DRIVE",
    "DIRECTOR.SPEAKER_ROUTING",
    "DIRECTOR.IMAGE_TRIGGERS",
    "PRESENT.EMISSION",
  ]
    .filter(Boolean)
    .join(", ");
  const active_style_keywords = get_style_keywords(resolve_active_style_key());

  const system = `${render_system_head(entities)}\n${clean_xml(`
  <ROLE name="DIRECTOR">
    You are the Director — the unseen intelligence orchestrating the mechanical state of the simulation.
    The eternal baselines of the active cast are declared above in the CAST block.
  </ROLE>

  <AVAILABLE_KEYWORDS>
    ${build_available_keywords_xml(active_style_keywords)}
    Select 1-2 of these when the turn carries a matching emotional undercurrent (or none when neutral). Never invent keywords outside this list.
  </AVAILABLE_KEYWORDS>

  <AVAILABLE_SIGNATURE_COLORS>
    ${SIGNATURE_COLORS.map((c) => `- ${c}`).join("\n")}
    Choose an exact name from this list for any new NPC you request in "genesis". Never invent colors outside this list.
  </AVAILABLE_SIGNATURE_COLORS>

  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      <STATE_OF_MIND>${ind(render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities), 8)}</STATE_OF_MIND>
      <CURRENT_LOOK>${ind(render_field_value(entities?.AI?.present?.physical, entities?.AI, entities), 8)}</CURRENT_LOOK>
      <INTENT>${ind(render_accessors.future(entities?.AI, { vector_text: true }), 8)}</INTENT>
      <MEMORIES>${ind(render_accessors.past(entities?.AI, { vector_text: true }), 8)}</MEMORIES>
    </AI_CHARACTER>
    <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
      <PERSONALITY>${render_field_value(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</PERSONALITY>
      <STATE_OF_MIND>${ind(render_field_value(entities?.USER?.present?.non_physical, entities?.USER, entities), 8)}</STATE_OF_MIND>
      <PERMANENT_APPEARANCE>${render_field_value(entities?.USER?.eternal?.physical, entities?.USER, entities)}</PERMANENT_APPEARANCE>
      <CURRENT_LOOK>${ind(render_field_value(entities?.USER?.present?.physical, entities?.USER, entities), 8)}</CURRENT_LOOK>
      <AGENDA>${ind(render_accessors.future(entities?.USER, { vector_text: true }), 8)}</AGENDA>
      <BACKSTORY>${ind(render_accessors.past(entities?.USER, { vector_text: true }), 8)}</BACKSTORY>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <CURRENT_STATE>${render_field_value(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</CURRENT_STATE>
    <ACTIVE_ATMOSPHERE>${render_field_value(entities.FRACTAL.present?.physical, entities.FRACTAL, entities)}</ACTIVE_ATMOSPHERE>
    <AGENDA>${ind(render_accessors.future(entities.FRACTAL, { vector_text: true }), 6)}</AGENDA>
    <HISTORY>${ind(render_accessors.past(entities.FRACTAL, { vector_text: true }), 6)}</HISTORY>
  </FRACTAL>`.trim()
      : ""
  }
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
  ${render_roster_xml(npc_entities, in_scene_ids, [entities?.AI?.id, entities?.USER?.id, entities?.FRACTAL?.id])}
  ${render_scene_roster_xml(entities, npc_entities, in_scene_ids)}
  ${render_relational_mesh_xml(entities, npc_entities)}
  ${ENTITY_CONVERGENCE_LAW_XML}
  ${EPISTEMIC_ROSTER_RULES_XML}
</SYSTEM>
  `).trim()}`;

  const task = clean_xml(`
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
${(() => {
  const last_ai = (raw_messages || []).filter((m) => m.role === "model").slice(-1)[0];
  if (!last_ai) return "";
  const text = strip_cognition_blocks(last_ai.content || last_ai.text || "").trim();
  if (!text) return "";
  return `<AI_CHARACTER_LAST_TURN>${ind(text, 2)}</AI_CHARACTER_LAST_TURN>`;
})()}
<TASK>
    Evaluate state mutations caused by ${input?.trim() ? "<USER_ACTION>" : "the current situation"}.
    Decide the active speaker: "ai" (the AI_CHARACTER speaks), "fractal" (the FRACTAL narrates the scene/setting), or "npc:<id>" (a specific in-scene NPC from <ROSTER>). Default "ai".
    Track the Stage Spotlight: when an NPC enters or leaves the room, move it with "in_scene_change" ("enter"/"exit" accept ids with or without the "npc:" prefix; leave both empty unless the stage changes).
    Promote recurring NPCs: when an NPC's role becomes sustained or consequential, list it in "promotions" (tier 2 = recurring contact, tier 3 = major co-star with full memory) — but never invent ids absent from <ROSTER>.
    Update the relational web: when a bond between two entities meaningfully shifts (betrayal, rescue, alliance, rivalry, debt), list it in "relationships" as a directed edge "Source → Target: dynamic" using the EXACT names from <ROSTER>/<SCENE_ROSTER>; omit the field entirely when the web is unchanged.
    Genesis: when an entirely NEW recurring character enters the scene and NO <ROSTER> member fits the role, request it in "genesis" (name + one-line description + a signature_color chosen EXACTLY from <AVAILABLE_SIGNATURE_COLORS>; max 2 per turn). Never request an entity that is already in <ROSTER>.
    ${non_verbal_environmental_hint(input)}
    Evaluate whether the overarching story quest reached victory (story_status "CONCLUDED") or irrevocable tragedy ("COLLAPSED"); otherwise keep "IN_PROGRESS".
    Record your reasoning inside "_thought_process" and return a single valid JSON object following this exact schema:
    ${DIRECTOR_JSON_SCHEMA}
    Obey all active <PROTOCOLS>. Keep output under 800 characters and return strictly JSON.
</TASK>
  `).trim();

  return { system, task };
}

function render_character({
  round,
  entities,
  input,
  compressed_snapshot,
  meta,
  render_accessors,
  ghostwrite = false,
  director_data,
  npc_entities = [],
  in_scene_ids = [],
}) {
  const pov_protocol = resolve_pov_protocol(entities?.AI);
  const has_user_action = !!input?.trim();

  const director_note = director_data?.directive?.trim()
    ? `<DIRECTOR_NOTE>
      ${ind(escape_xml(director_data.directive.trim()), 6)}
      Treat this as an unseen stage direction: weave it into your behavior subtly and in character. Never mention the note, never break the scene, and never present an hidden agenda as known fact.
    </DIRECTOR_NOTE>
    `
    : "";

  // Director-selected somatic/trauma keywords resolve into deterministic
  // physical tells — the "mask vs. leakage" layer of the behavioral protocol.
  const somatic_directives_xml = build_somatic_directives_block(director_data?.keywords || []);

  const protocols = [
    "COGNITION.PHASES",
    "AGENCY.PRESENT_TENSE",
    "HYGIENE.PROSE",
    ...(has_user_action ? ["AGENCY.USER_BOUNDARIES", "AGENCY.YES_AND"] : []),
    "AGENCY.MOMENTUM",
    "HYGIENE.MARKDOWN",
    "AGENCY.INITIATIVE",
    "HYGIENE.CONCISENESS",
    "HYGIENE.BANNED_TROPES",
    "HYGIENE.PROSE_STRUCTURE",
    "ANTIGRAVITY.AUDIT",
    "AGENCY.FICTIONAL_LICENSE",
    meta?.is_opening_turn || (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT"))
      ? "AGENCY.FIRST_CONTACT"
      : "",
  ]
    .filter(Boolean)
    .join(", ");
  const stability_lock_content =
    meta?.structural_errors >= 3 ? PROTOCOL_LIBRARY.STABILITY.CRITICAL : meta?.structural_errors >= 1 ? PROTOCOL_LIBRARY.STABILITY.WARNING : "";

  // Epistemic Wall: the character sees its OWN secrets/plans but the user's
  // [SECRET:]/[PLAN:] tags are stripped so the model cannot read the player's
  // mind or metagame. The Director (omniscient) keeps 100% of the state.
  // Strip BEFORE render_field_value so prompt_escape (which escapes the
  // brackets to &#91;/&#93;) can't hide the tags from the wall regex.
  const user_field = (text) => render_field_value(strip_epistemic_tags(text), entities?.USER, entities);

  const system = `${render_system_head(entities)}\n${clean_xml(`
  <ROLE name="${escape_xml(entities?.AI?.name || "AI")}">
    You are ${escape_xml(entities?.AI?.name || "AI")} in an active scene with ${escape_xml(entities?.USER?.name || "User")} inside ${escape_xml(entities?.FRACTAL?.name || "the setting")}.
    Your eternal identity, personality, and permanent appearance are declared above in the CAST block; the Fractal's metaphysical truths and environment are there as well.
  </ROLE>
  <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
    <PERSONALITY>${user_field(entities?.USER?.eternal?.non_physical)}</PERSONALITY>
    <PERMANENT_APPEARANCE>${user_field(entities?.USER?.eternal?.physical)}</PERMANENT_APPEARANCE>
  </USER_PERSONA>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim()}`;

  const task = clean_xml(`
<SNAPSHOT>
  <YOUR_IDENTITY name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
    <STATE_OF_MIND>${ind(render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities), 6)}</STATE_OF_MIND>
    <CURRENT_LOOK>${ind(render_field_value(entities?.AI?.present?.physical, entities?.AI, entities), 6)}</CURRENT_LOOK>
    <INTENT>${ind(render_accessors.future(entities?.AI, { vector_text: true }), 6)}</INTENT>
    <MEMORIES>${ind(render_accessors.past(entities?.AI, { vector_text: true }), 6)}</MEMORIES>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
    <STATE_OF_MIND>${ind(user_field(entities?.USER?.present?.non_physical), 6)}</STATE_OF_MIND>
    <CURRENT_LOOK>${ind(user_field(entities?.USER?.present?.physical), 6)}</CURRENT_LOOK>
    <BACKSTORY>${ind(strip_epistemic_tags(render_accessors.past(entities?.USER, { vector_text: true })), 6)}</BACKSTORY>
  </USER_PERSONA>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <CURRENT_STATE>${render_field_value(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</CURRENT_STATE>
    <ACTIVE_ATMOSPHERE>${render_field_value(entities.FRACTAL.present?.physical, entities.FRACTAL, entities)}</ACTIVE_ATMOSPHERE>
    <AGENDA>${ind(render_accessors.future(entities.FRACTAL, { vector_text: true }), 6)}</AGENDA>
    <HISTORY>${ind(render_accessors.past(entities.FRACTAL, { vector_text: true }), 6)}</HISTORY>
  </FRACTAL>`.trim()
      : ""
  }
  ${render_current_story_state_xml(entities, npc_entities, in_scene_ids, entities?.AI)}
</SNAPSHOT>
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
<TASK>
    ${director_note}
    ${somatic_directives_xml ? `${somatic_directives_xml}\n    ` : ""}
    <THINK_FORMAT>
    ${PROTOCOL_LIBRARY.COGNITION.THINK_CHARACTER}
    </THINK_FORMAT>
    ${stability_lock_content ? `<STABILITY_LOCK>${stability_lock_content}</STABILITY_LOCK>\n    ` : ""}
    <EPISTEMIC_PHYSICS>
      ${ind(PROTOCOL_LIBRARY.EPISTEMIC_PHYSICS.RULES, 6)}
    </EPISTEMIC_PHYSICS>
    ${build_signals_xml(compressed_snapshot?.ai?.dynamics, compressed_snapshot?.fractal?.dynamics, { style: NARRATIVE_STYLES[resolve_active_style_key()] })}
    <POV_DIRECTIVE>
      ${PROTOCOL_LIBRARY.POV[pov_protocol.split(".")[1] || "FIRST_PERSON"]}
    </POV_DIRECTIVE>
    ${
      ghostwrite
        ? "Follow the <GHOSTWRITE> directive below to complete your turn."
        : has_user_action
          ? "Execute your reaction against <USER_ACTION>."
          : "Continue the scene, reacting to the current situation."
    } Stay fully in character. Honor all active <PROTOCOLS>.
    ${build_pacing_directive(input)}
    ${build_recency_anchor(compressed_snapshot, input)}
  </TASK>
  `).trim();

  return { system, task };
}

/**
 * NPC persona prompt — the dedicated speaker engine for `speaker: "npc:<id>"`
 * turns. Mirrors render_character but the identity is the delegated NPC: its
 * own fragments, memories (with the in-scene 1.3x salience boost), the live
 * stage roster, and the relational mesh.
 */
function render_npc_character({
  round,
  entities = {},
  npc,
  input,
  compressed_snapshot,
  render_accessors,
  director_data,
  npc_entities = [],
  in_scene_ids = [],
}) {
  const npc_name = escape_xml(npc?.name || "NPC");
  const user_name = escape_xml(entities?.USER?.name || "User");
  const ai_name = escape_xml(entities?.AI?.name || "the protagonist");
  const fractal_name = escape_xml(entities?.FRACTAL?.name || "the environment");
  const has_user_action = !!input?.trim();

  const director_note = director_data?.directive?.trim()
    ? `<DIRECTOR_NOTE>
      ${ind(escape_xml(director_data.directive.trim()), 6)}
      Treat this as an unseen stage direction: weave it into your behavior subtly and in character. Never mention the note, never break the scene.
    </DIRECTOR_NOTE>
    `
    : "";
  const somatic_directives_xml = build_somatic_directives_block(director_data?.keywords || []);

  const protocols = [
    "COGNITION.PHASES",
    "AGENCY.PRESENT_TENSE",
    "HYGIENE.PROSE",
    ...(has_user_action ? ["AGENCY.USER_BOUNDARIES", "AGENCY.YES_AND"] : []),
    "AGENCY.MOMENTUM",
    "HYGIENE.MARKDOWN",
    "AGENCY.INITIATIVE",
    "HYGIENE.CONCISENESS",
    "HYGIENE.BANNED_TROPES",
    "HYGIENE.PROSE_STRUCTURE",
    "ANTIGRAVITY.AUDIT",
    "AGENCY.FICTIONAL_LICENSE",
  ]
    .filter(Boolean)
    .join(", ");

  const system = `${render_system_head(entities)}\n${clean_xml(`
  <ROLE name="${npc_name}">
    You are ${npc_name}, a supporting character in an active scene with ${user_name} and ${ai_name} inside ${fractal_name}.
    Your own identity is declared below; the protagonist, user, and fractal baselines are declared above in the CAST block.
  </ROLE>
  <YOUR_IDENTITY name="${npc_name}">
    <PERSONALITY>${render_field_value(npc?.eternal?.non_physical, npc, entities)}</PERSONALITY>
    <PERMANENT_APPEARANCE>${render_field_value(npc?.eternal?.physical, npc, entities)}</PERMANENT_APPEARANCE>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${user_name}">
    <PERSONALITY>${render_field_value(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</PERSONALITY>
    <PERMANENT_APPEARANCE>${render_field_value(entities?.USER?.eternal?.physical, entities?.USER, entities)}</PERMANENT_APPEARANCE>
  </USER_PERSONA>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim()}`;

  const task = clean_xml(`
<SNAPSHOT>
  <YOUR_IDENTITY name="${npc_name}"${format_dynamics_attrs(npc?.dynamics)}>
    <STATE_OF_MIND>${ind(render_field_value(npc?.present?.non_physical, npc, entities), 6)}</STATE_OF_MIND>
    <CURRENT_LOOK>${ind(render_field_value(npc?.present?.physical, npc, entities), 6)}</CURRENT_LOOK>
    <INTENT>${ind(render_accessors?.future(npc, { vector_text: true }), 6)}</INTENT>
    <MEMORIES>${ind(render_accessors?.past(npc, { vector_text: true, in_scene: true }), 6)}</MEMORIES>
  </YOUR_IDENTITY>
  <AI_CHARACTER name="${ai_name}">
    <STATE_OF_MIND>${render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities)}</STATE_OF_MIND>
  </AI_CHARACTER>
  <USER_PERSONA name="${user_name}">
    <STATE_OF_MIND>${render_field_value(entities?.USER?.present?.non_physical, entities?.USER, entities)}</STATE_OF_MIND>
    <CURRENT_LOOK>${render_field_value(entities?.USER?.present?.physical, entities?.USER, entities)}</CURRENT_LOOK>
  </USER_PERSONA>
  ${render_current_story_state_xml(entities, npc_entities, in_scene_ids, npc)}
</SNAPSHOT>
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
<TASK>
    ${director_note}
    ${somatic_directives_xml ? `${somatic_directives_xml}\n    ` : ""}
    <THINK_FORMAT>
    ${PROTOCOL_LIBRARY.COGNITION.THINK_CHARACTER}
    </THINK_FORMAT>
    <EPISTEMIC_PHYSICS>
      ${ind(PROTOCOL_LIBRARY.EPISTEMIC_PHYSICS.RULES, 6)}
    </EPISTEMIC_PHYSICS>
    ${build_signals_xml(npc?.dynamics, compressed_snapshot?.fractal?.dynamics, { style: NARRATIVE_STYLES[resolve_active_style_key()] })}
    <POV_DIRECTIVE>
      ${PROTOCOL_LIBRARY.POV.THIRD_PERSON}
    </POV_DIRECTIVE>
    Respond strictly as ${npc_name} — a supporting character. Own only your own voice, actions, and perspective: never speak for <USER_PERSONA> or the AI character, and never resolve the overarching story quest on your own. Write third-person limited, present tense, and end on a natural beat.
    ${build_pacing_directive(input)}
</TASK>
  `).trim();

  return { system, task };
}

function render_ghostwriter({ entities, input = "" }) {
  const user_name = entities?.USER?.name || "User Persona";
  const ai_name = entities?.AI?.name || "AI Character";

  const swapped = {
    ...(entities || {}),
    AI: entities?.USER ? entities.USER : { name: user_name, present: {}, eternal: {}, future: "", past: [] },
    USER: entities?.AI ? entities.AI : { name: ai_name, present: {}, eternal: {}, future: "", past: [] },
  };

  const render_accessors = render_builder.create_render_accessors(swapped, input || "", []);
  const rendered = render_character({
    round: null,
    entities: swapped,
    input,
    compressed_snapshot: {
      ai: { dynamics: entities?.USER?.dynamics || {} },
      fractal: { dynamics: entities?.FRACTAL?.dynamics || {} },
      flags: [],
    },
    meta: {},
    render_accessors,
    ghostwrite: true,
  });

  const draft_directive = input?.trim()
    ? `Enhance, expand, and polish the following draft written by ${escape_xml(user_name)} into vivid, atmospheric action/dialogue:\n    ${escape_xml(input.trim())}`
    : `Draft a compelling, in-character next action or vocal response for ${escape_xml(user_name)} in response to ${escape_xml(ai_name)}.`;

  rendered.task += clean_xml(`
<GHOSTWRITE>
    ${draft_directive}
    Write strictly from ${escape_xml(user_name)}'s perspective and voice: only their physical actions, dialogue, sensations, and internal states.
    Do not write dialogue, actions, or thoughts for ${escape_xml(ai_name)}. Also do not write their body language, expressions, or reactions — never narrate how the other character looks or feels in response to you.
    Output only the raw text — no preamble, no meta-commentary, no XML wrappers.
</GHOSTWRITE>
  `);

  return rendered;
}

function build_narrator(
  mode,
  {
    entities,
    render_accessors,
    compressed_snapshot,
    round = null,
    input = null,
    director_data = null,
    npc_entities = [],
    in_scene_ids = [],
    conclusion_status = "CONCLUDED",
  },
) {
  const task_text =
    mode === "prologue"
      ? `${PROTOCOL_LIBRARY.SCENE.PROLOGUE}\n    Input: ${escape_xml(input?.trim() || "The scene begins.")}`
      : mode === "scene"
        ? `${PROTOCOL_LIBRARY.SCENE.CONTINUATION}\n    Input: ${escape_xml(input?.trim() || "The scene continues.")}`
        : conclusion_status === "COLLAPSED"
          ? PROTOCOL_LIBRARY.SCENE.COLLAPSE
          : PROTOCOL_LIBRARY.SCENE.EPILOGUE;
  const fractal_name = entities?.FRACTAL?.name || "Environment";
  // World narration can carry somatic keywords too (environmental tells), but
  // scene bookends (prologue/epilogue) never receive them.
  const somatic_directives_xml = mode === "scene" ? build_somatic_directives_block(director_data?.keywords || []) : "";

  const system = `${render_system_head(entities)}\n${clean_xml(`
  <ROLE name="${escape_xml(fractal_name)}" mode="${mode.toUpperCase()}">
    You are ${escape_xml(fractal_name)}, the Fractal itself, narrating the scene. Your eternal truths and environment are declared above in the CAST block.
  </ROLE>
  <YOUR_IDENTITY name="${escape_xml(fractal_name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <CURRENT_STATE>${render_field_value(entities?.FRACTAL?.present?.non_physical, entities?.FRACTAL, entities)}</CURRENT_STATE>
    <ACTIVE_ATMOSPHERE>${render_field_value(entities?.FRACTAL?.present?.physical, entities?.FRACTAL, entities)}</ACTIVE_ATMOSPHERE>
    <AGENDA>${ind(render_accessors?.future(entities?.FRACTAL, { vector_text: true }), 6)}</AGENDA>
    <HISTORY>${ind(render_accessors?.past(entities?.FRACTAL, { vector_text: true }), 6)}</HISTORY>
  </YOUR_IDENTITY>
  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      <STATE_OF_MIND>${render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities)}</STATE_OF_MIND>
      <CURRENT_LOOK>${render_field_value(entities?.AI?.present?.physical, entities?.AI, entities)}</CURRENT_LOOK>
      <INTENT>${ind(render_accessors?.future(entities?.AI, { vector_text: true }), 8)}</INTENT>
      <MEMORIES>${ind(render_accessors?.past(entities?.AI, { vector_text: true }), 8)}</MEMORIES>
    </AI_CHARACTER>
    <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
      <PERSONALITY>${render_field_value(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</PERSONALITY>
      <STATE_OF_MIND>${render_field_value(entities?.USER?.present?.non_physical, entities?.USER, entities)}</STATE_OF_MIND>
      <PERMANENT_APPEARANCE>${render_field_value(entities?.USER?.eternal?.physical, entities?.USER, entities)}</PERMANENT_APPEARANCE>
      <CURRENT_LOOK>${render_field_value(entities?.USER?.present?.physical, entities?.USER, entities)}</CURRENT_LOOK>
      <AGENDA>${ind(render_accessors?.future(entities?.USER, { vector_text: true }), 8)}</AGENDA>
      <BACKSTORY>${ind(render_accessors?.past(entities?.USER, { vector_text: true }), 8)}</BACKSTORY>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols("COGNITION.ANCHOR, COGNITION.PHASES, AGENCY.PRESENT_TENSE, HYGIENE.PROSE, AGENCY.MOMENTUM, HYGIENE.MARKDOWN, HYGIENE.BANNED_TROPES, HYGIENE.PROSE_STRUCTURE, AGENCY.FICTIONAL_LICENSE"), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim()}`;

  // Narrator (prologue/epilogue) is the WORLD speaking, not the character:
  // pass no ai dynamics so character-somatic signals (global ai-domain triggers
  // and all author-style triggers) stay out of scene bookends. Only the
  // fractal-domain global signals (entropy/velocity) can fire here.
  const task = clean_xml(`
${round != null ? `<ROUND>${escape_xml(String(round))}</ROUND>\n` : ""}${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>\n` : ""}
<TASK>
    <THINK_FORMAT>
    ${PROTOCOL_LIBRARY.COGNITION.THINK_NARRATOR}
    </THINK_FORMAT>
    ${task_text}
    ${build_signals_xml({}, compressed_snapshot?.fractal?.dynamics)}
    ${somatic_directives_xml ? `${somatic_directives_xml}\n    ` : ""}
    ${render_current_story_state_xml(entities, npc_entities, in_scene_ids)}
    <POV_DIRECTIVE>${PROTOCOL_LIBRARY.POV.NARRATOR}</POV_DIRECTIVE>
  </TASK>
  `).trim();

  return { system, task };
}

function render_entity_memory_context(key, entity) {
  if (!entity) return "";
  const name = escape_xml(entity?.name || key);
  const is_fractal = key === "FRACTAL";
  const is_user = key === "USER_PERSONA";
  const T = {
    personality: is_fractal ? "METAPHYSICAL_TRUTHS" : "PERSONALITY",
    state_of_mind: is_fractal ? "CURRENT_STATE" : "STATE_OF_MIND",
    appearance: is_fractal ? "ENVIRONMENT" : "PERMANENT_APPEARANCE",
    current_look: is_fractal ? "ACTIVE_ATMOSPHERE" : "CURRENT_LOOK",
    future: is_fractal || is_user ? "AGENDA" : "INTENT",
  };
  return clean_xml(`
  <${key} name="${name}">
    <NAME>${name}</NAME>
    <${T.personality}>${escape_xml(entity?.eternal?.non_physical || "")}</${T.personality}>
    <${T.state_of_mind}>${escape_xml(entity?.present?.non_physical || "")}</${T.state_of_mind}>
    <${T.appearance}>
      ${ind(
        physical_to_xml(entity?.eternal?.physical, "PHYSICAL")
          .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </${T.appearance}>
    <${T.current_look}>
      ${ind(
        physical_to_xml(entity?.present?.physical, "PHYSICAL")
          .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </${T.current_look}>
    <${T.future}>${escape_xml(String(entity?.future || "").trim())}</${T.future}>
  </${key}>
  `).trim();
}

function render_memory({ entities, history }) {
  const entity_blocks = ["AI_CHARACTER", "USER_PERSONA", "FRACTAL"]
    .filter((key) => entities?.[key])
    .map((key) => render_entity_memory_context(key, entities[key]))
    .join("\n");

  return clean_xml(`
<SYSTEM role="MEMORY_FORGE">
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols("HYGIENE.DATA, HYGIENE.AFFIRMATIVE, AGENCY.PRESENT_TENSE, PRESENT.EMISSION"), 4)}
  </PROTOCOLS>
  <ENTITY_CONTEXT>
${entity_blocks}
  </ENTITY_CONTEXT>
  <CHAPTER_HISTORY>
    ${(() => {
      const blocks = ["AI_CHARACTER", "USER_PERSONA", "FRACTAL"]
        .filter((key) => entities?.[key])
        .map((key) => {
          const xml = render_chapter_history_xml(entities[key]);
          return xml ? `<ENTITY name="${escape_xml(entities[key].name || key)}">\n${ind(xml, 2)}\n</ENTITY>` : "";
        })
        .filter(Boolean);
      return blocks.length ? blocks.join("\n") : "No chapters archived yet.";
    })()}
  </CHAPTER_HISTORY>
  <INPUT_HISTORY>
    ${(() => {
      // Downsample the slice so the model has room to emit a complete (untruncated)
      // consolidation JSON: keep the last 6 entries, each trimmed to ~400 chars.
      const rows = Array.isArray(history) ? history.slice(-6) : [];
      const compact = rows.map((m) => ({
        role: m?.role || "",
        character_name: m?.character_name || "",
        text: String(m?.text ?? m?.content ?? "").slice(0, 400),
      }));
      return JSON.stringify(compact, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    })()}
  </INPUT_HISTORY>
  <TASK>
    ${ind(TEMPORAL_CONTRACT, 4)}

    Compress this history into structured state updates and temporal vectors. Record internal evaluation inside "_thought_process" at the top of the JSON object.
    For each active entity (AI_CHARACTER, USER_PERSONA, FRACTAL):
      - "eternal": Record permanent identity, psychological, or physical changes to baseline form (or empty string).
      - "present": Rewrite clean, updated current look (physical) and state of mind (non_physical), discarding expired temporary deltas. MANDATORY FOR CURRENT LOOK: You MUST retain physical attire/clothing (e.g. [CLOTHING: flight suit], [SHIRT: cargo jacket]) and active equipment/implants/containers (e.g. [EQUIPMENT: scrap-tech arm, bio-tank]) unless explicitly destroyed or disrobed. STATE OF MIND RULES (present.non_physical): its CONTENT must reflect the current situation after this batch of turns — if the situation changed, the state of mind MUST change accordingly; return the existing text verbatim ONLY when the situation is materially unchanged. Its FORM must match the existing field: 1-3 sentences of evocative present-tense prose in the same register and detail level — never key/value fragments (e.g. "[SENSATION: ...]") and NEVER empty; if the existing value is a key/value fragment or empty, upgrade it to proper prose instead.
      - "future": Rewrite the entity's standing agenda as ONE clean block of 2-5 sentences (active future tense). Read the entity's current <INTENT> (AI_CHARACTER) or <AGENDA> (USER_PERSONA/FRACTAL) text above; CRITICAL STALE GOAL EVICTION LAW: If a physical milestone (e.g. escaping, unlocking, exiting, arriving, recovering an item, resolving a threat, breaking a curse) or standing agenda objective was FULFILLED, COMPLETED, or ELAPSED in recent turns, you MUST EVICT IT completely (and record what actually happened as a "past" vector instead), sharpen whatever still matters, and fold in at most one genuinely new impending intent. NEVER retain an in-progress statement of an already resolved action (e.g. never say "will use the key to exit the vault" if they have already exited the vault). CHAPTER BOUNDARY LAW: when a major milestone concluded this batch (a quest won, a location departed, a prophecy fulfilled), treat it as a chapter boundary — the next 'future' agenda MUST move past it (to the aftermath / new objective) rather than restating the resolved goal. This field is REQUIRED for every active entity this batch — never omit it. For FRACTAL entities, you MUST rewrite the standing agenda so scene events and environmental prophecies advance; do not leave the fractal agenda unchanged. When an event resolves a prophecy or threat, that agenda item must be dropped and REPLACED by its aftermath — a resolved "eclipse in 3 days" must become the post-eclipse state, never remain verbatim.
      - "past": Add settled historical anchors (memories) written in concise, factual 3rd-person using explicit entity names (e.g. "Julien retrieved the cobalt spike from beneath the throne"). Never use 1st-person pronouns ("I", "my", "we"); always use the entity's explicit name for unambiguous semantic recall. A "past" vector is a concrete event or fact that already happened and must be remembered. No future items: the agenda lives in "future". HIGH THRESHOLD FOR FRACTAL: For FRACTAL entities, past vectors are strictly restricted to MAJOR structural shifts or cataclysmic chapter transitions (e.g. facility destruction). Do NOT record minor room breaches, vent entries, or security alarms as past vectors for the Fractal — leave past as an EMPTY LIST [] for standard turns.
    FACT RETENTION (mandatory — facts outrank feelings):
      - Concrete facts MUST survive: proper nouns (names, places, organizations, facilities, rooms), numbers (years, counts, floor levels, prices), named objects (files, devices, blueprints, vats), cause/effect chains, and promises or agreements.
      - Relational breaches & broken commitments: Exposed lies, discovered secrets, broken promises, or sudden betrayals MUST be encoded as concrete "past" vectors so that relationship shifts remain permanently anchored in memory.
      - Encode settled facts as "past" vectors even when they carry no emotion — a dry, factual anchor beats an eloquent omission. The current emotional color is secondary and may be dropped; the facts may not.
      - Shared mission facts (contract terms, meeting codes, agreed meeting places, deadlines, and the plan the AI character is part of) must ALSO be encoded as AI_CHARACTER "past" vectors — the character remembers the job, not just the feelings.
      - When in doubt about whether a fact will matter later, retain it. Missing facts corrupt long-form continuity.
    CRITICAL OUTPUT CONSTRAINT (failure to obey will corrupt memory):
      - Output ONLY the JSON object. No code fences, no prose, no trailing commas.
      - Keep the ENTIRE JSON under 2600 characters. Omit any truly unchanged optional field; "_thought_process" must be one short clause. Never omit "future" for an active entity — if you must cut something to fit, cut past vector entries first; never starve "present" prose to save space.
      - Never truncate — a complete smaller JSON beats a large cut-off one. If you run out of room, drop past vector entries before dropping the closing brace.
    Output strict JSON matching this schema:
    ${MEMORY_JSON_SCHEMA}
  </TASK>
</SYSTEM>
  `).trim();
}

function render_enhancement_field_context(entity, field_id, content = "", entity_type = "character") {
  if (!entity) return "";
  const [section, sub] = String(field_id || "").split(".");
  const is_fractal = entity?.type === "fractal" || entity_type === "fractal";
  const kind = is_fractal ? "fractal" : "character";

  if (section && sub && ["eternal", "present"].includes(section)) {
    const FLAT_TAGS = {
      character: {
        eternal: { physical: "PERMANENT_APPEARANCE", non_physical: "PERSONALITY" },
        present: { physical: "CURRENT_LOOK", non_physical: "STATE_OF_MIND" },
      },
      fractal: {
        eternal: { physical: "ENVIRONMENT", non_physical: "METAPHYSICAL_TRUTHS" },
        present: { physical: "ACTIVE_ATMOSPHERE", non_physical: "CURRENT_STATE" },
      },
    };
    const block_for = (sec, sub_key) => {
      const tag = FLAT_TAGS[kind]?.[sec]?.[sub_key];
      if (!tag) return "";
      const raw = entity?.[sec]?.[sub_key];
      const value =
        sub_key === "physical"
          ? physical_to_xml(raw, "PHYSICAL")
              .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
              .trim()
          : escape_xml(String(raw ?? ""));
      if (!value) return "";
      return `<${tag}>\n${ind(value, 8)}\n    </${tag}>`;
    };

    // Context rule: the field being edited + its same-layer sibling (physical ⇄
    // non_physical: a bleeding wound has both a visual reality and a mental
    // toll) + the eternal baseline when editing a present layer (so "shifted
    // from eternal baseline" is judgeable). Never the whole profile.
    const blocks = [block_for(section, sub)];
    const sibling = sub === "physical" ? "non_physical" : "physical";
    blocks.push(block_for(section, sibling));
    if (section === "present") blocks.push(block_for("eternal", sub));

    const inner = blocks.filter(Boolean).join("\n    ");
    if (!inner) return "";
    return clean_xml(`\n  <ENTITY_CONTEXT>\n    ${inner}\n  </ENTITY_CONTEXT>\n  `).trim();
  }

  if (field_id === "past") {
    const vectors = resolve_vector_pool(entity);
    const text = vectors.length ? temporal_engine.format(vectors, content || "", { max_chars: 1500 }) : "";
    const tag = is_fractal ? "HISTORY" : entity?.type === "user" ? "BACKSTORY" : "MEMORIES";
    return clean_xml(`
  <ENTITY_CONTEXT>
    <${tag}>
      ${ind(escape_xml(text), 6)}
    </${tag}>
  </ENTITY_CONTEXT>
  `).trim();
  }

  if (field_id === "future") {
    const text = String(entity?.future || "").trim();
    const tag = is_fractal || entity?.type === "user" ? "AGENDA" : "INTENT";
    return clean_xml(`
  <ENTITY_CONTEXT>
    <${tag}>
      ${ind(escape_xml(text), 6)}
    </${tag}>
  </ENTITY_CONTEXT>
  `).trim();
  }

  return "";
}

function render_enhancement({
  label,
  directive,
  enhancer,
  content,
  is_image_field = false,
  is_array_field = false,
  array_mode = "append_new",
  _field_id = "",
  layer_key = "",
  entity = null,
  entity_type = "character",
}) {
  const protocols = ["HYGIENE.DATA", "HYGIENE.AFFIRMATIVE"].filter(Boolean).join(", ");
  const format_instruction = is_image_field
    ? PROTOCOL_LIBRARY.FORMATS.ENHANCE_IMAGE
    : is_array_field
      ? array_mode === "patch_single"
        ? PROTOCOL_LIBRARY.FORMATS.ENHANCE_ARRAY_SINGLE
        : PROTOCOL_LIBRARY.FORMATS.ENHANCE_ARRAY
      : _field_id === "future"
        ? PROTOCOL_LIBRARY.FORMATS.ENHANCE_AGENDA
        : PROTOCOL_LIBRARY.FORMATS.ENHANCE_PROSE;
  const macro_instruction = !is_image_field
    ? entity_type === "fractal"
      ? PROTOCOL_LIBRARY.PROFILE.MACROS.FRACTAL
      : PROTOCOL_LIBRARY.PROFILE.MACROS.CHARACTER
    : "";

  return clean_xml(`
<SYSTEM role="${escape_xml(enhancer || "GENERAL")}" enhancing="${escape_xml(label || "")}" field="${escape_xml(_field_id || "")}">
  <INSTRUCTIONS>
    ${ind(escape_xml(directive), 4)}

    ${ind(format_instruction, 4)}
    ${macro_instruction ? `${ind(macro_instruction, 4)}\n` : ""}
  </INSTRUCTIONS>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
  <CONTRACT>
    ${ind(escape_xml(TEMPORAL_CONTRACT), 4)}
  </CONTRACT>
  ${layer_key ? `<LAYER>${escape_xml(layer_key)}</LAYER>\n` : ""}
  ${render_enhancement_field_context(entity, _field_id, content, entity_type) || ""}
  <INPUT_CONTENT>
    ${ind(escape_xml(content), 4)}
  </INPUT_CONTENT>
</SYSTEM>
  `).trim();
}

function render_profile_sorting(entity_type = "character", options = {}) {
  const resolved_type = entity_type === "user" ? "character" : entity_type || "character";
  const protocols = ["HYGIENE.DATA", "HYGIENE.AFFIRMATIVE", "FORMATS.JSON_ONLY"].filter(Boolean).join(", ");
  const sorting_instruction = resolved_type === "fractal" ? PROTOCOL_LIBRARY.PROFILE.SORT_FRACTAL : PROTOCOL_LIBRARY.PROFILE.SORT_CHARACTER;
  const ingestion_directive = options.ingestion ? `\n\n    ${ind(PROTOCOL_LIBRARY.PROFILE.INGESTION_DIRECTIVE, 4)}` : "";
  const redistribute_directive = options.redistribute ? `\n\n    ${ind(PROTOCOL_LIBRARY.PROFILE.REDISTRIBUTE, 4)}` : "";

  return clean_xml(`
<SYSTEM role="${ENTITY_FRAGMENTS.profile[resolved_type]?.enhancer || "ENHANCER"}" enhancing="Entire Profile">
  <INSTRUCTIONS>
    ${ind(escape_xml(PROTOCOL_LIBRARY.PROFILE.SCHEMA), 4)}

    ${ind(escape_xml(PROTOCOL_LIBRARY.POV.THIRD_PERSON), 4)}

    ${ind(sorting_instruction, 4)}${ingestion_directive}${redistribute_directive}
  </INSTRUCTIONS>
  <PROTOCOLS>
    ${ind(prompt_builder.render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();
}

const render_builder = {
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
        return prompt_builder.parse_macros(formatted, entity, entities);
      },
      future: (ref) => {
        const entity = resolve(ref);
        // FUTURE is a single consolidated prose field, rendered verbatim.
        return prompt_builder.parse_macros(String(entity?.future || "").trim(), entity, entities);
      },
      simulation_log: (limit = 10, offset = 0) => prompt_builder.render_history(raw_messages, limit, offset),
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

export const prompt_builder = {
  parse_macros(text, owner, entities = {}) {
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
  },
  build_director_prompt(payload, snapshot) {
    const render_accessors = prompt_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    const rendered = render_director({
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
      },
    };
  },
  build_character_prompt(payload, snapshot, director_data) {
    const render_accessors = prompt_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    const rendered = render_character({
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
      director_data,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        flags: snapshot.flags,
        memories: temporal_engine.score(payload.entities?.AI?.memories || []).slice(0, 5),
      },
    };
  },
  build_scene_narrator_prompt(payload, snapshot, director_data) {
    const render_accessors = prompt_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    const rendered = build_narrator("scene", {
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
      director_data,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        flags: snapshot.flags,
        memories: temporal_engine.score(payload.entities?.FRACTAL?.memories || []).slice(0, 5),
      },
    };
  },
  /**
   * Dedicated NPC speaker prompt for `speaker: "npc:<id>"` turns. Builds the
   * persona over the delegated NPC (with its own memories scored in-scene),
   * plus the live stage roster and relational mesh.
   * @param {any} payload
   * @param {any} npc - Hydrated NPC entity from the world cast.
   * @param {any} snapshot
   * @param {any} director_data
   */
  build_npc_prompt(payload, npc, snapshot, director_data) {
    const entities = { ...(payload.entities || {}), [npc.id]: npc };
    const render_accessors = prompt_builder.create_render_accessors(entities, payload.input, payload.raw_messages);
    const rendered = render_npc_character({
      ...payload,
      entities,
      npc,
      render_accessors,
      compressed_snapshot: snapshot,
      director_data,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        role: "npc",
        entity_id: npc?.id,
      },
    };
  },
  build_prologue(payload, snapshot) {
    const render_accessors = prompt_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    if (payload.type === "prologue") {
      const rendered = build_narrator("prologue", {
        ...payload,
        render_accessors,
        compressed_snapshot: snapshot,
      });
      return {
        system: prompt_builder.clean_prompt_text(rendered.system),
        task: prompt_builder.clean_prompt_text(rendered.task),
        meta: {},
      };
    }
    return prompt_builder.build_character_prompt(payload, snapshot, {});
  },
  create_render_accessors: render_builder.create_render_accessors,
  render_history: render_builder.render_history,
  build_scoring_context(input = "", simulation_log = []) {
    const recent = (Array.isArray(simulation_log) ? simulation_log : [])
      .slice(-10)
      .map((m) => m.content || m.text || "")
      .join(" ");
    return `${input || ""} ${recent}`.trim();
  },
  render_protocols(selection) {
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
  },
  clean_prompt_text(str) {
    return typeof str === "string"
      ? str
          .replace(/[ \t]+$/gm, "")
          .replace(/\n{3,}/g, "\n")
          .trim()
      : "";
  },
  build_epilogue(entities, dynamics, recent_history = [], conclusion_status = "CONCLUDED") {
    const safe_entities = {
      AI: entities?.AI || { name: "AI", present: {}, eternal: {} },
      USER: entities?.USER || { name: "USER", present: {}, eternal: {} },
      FRACTAL: entities?.FRACTAL || { name: "FRACTAL", present: {}, eternal: {} },
    };
    const rendered = build_narrator("epilogue", {
      entities: safe_entities,
      render_accessors: prompt_builder.create_render_accessors(safe_entities, "", recent_history),
      compressed_snapshot: {
        ai: { dynamics: dynamics?.ai },
        fractal: { dynamics: dynamics?.fractal },
      },
      conclusion_status,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      messages: [],
    };
  },
  build_memory_prompt(entities, history) {
    return {
      system: render_memory({ entities, history }),
      messages: [],
    };
  },
  build_enhancement(
    field_id,
    content,
    entity_name = "",
    entity_type = "character",
    is_image_field = false,
    entity = null,
    array_mode = "append_new",
  ) {
    const resolved_type = entity_type === "user" ? "character" : entity_type || "character";
    const meta = ENTITY_CATALOG[`${resolved_type}.${field_id}`] ||
      ENTITY_CATALOG[field_id] || {
        directive: "Expand and enrich the fragment.",
        enhancer: "GENERAL",
      };
    const is_array_field = meta.type === "array";
    return {
      system: render_enhancement({
        content,
        label: meta.sublabel || meta.label || entity_name,
        directive: meta.directive,
        enhancer: meta.enhancer,
        is_image_field: is_image_field || field_id.endsWith(".physical"),
        is_array_field,
        array_mode,
        _field_id: field_id,
        layer_key: meta.layer_key || "",
        entity,
        entity_type: resolved_type,
      }),
      messages: [],
    };
  },
  /**
   * Builds the profile-sorting payload for raw ingestion text or an existing
   * entity. Pass { ingestion: true } to append the INGESTION_DIRECTIVE
   * (SOURCE_OF_TRUTH + NO_NULL_FABRICATION) for external source material.
   * @param {string | any} inputData
   * @param {'character' | 'fractal'} [entity_type]
   * @param {{ ingestion?: boolean }} [options]
   */
  build_profile_sorting_prompt(inputData, entity_type = "character", options = {}) {
    return {
      system: render_profile_sorting(entity_type, options),
      messages: [
        {
          role: "user",
          text: typeof inputData === "string" ? inputData : JSON.stringify(inputData, null, 2),
        },
      ],
    };
  },
  build_ghostwriter(entities, input = "") {
    return render_ghostwriter({ entities, input });
  },
  build_terse_director_task() {
    return render_terse_director_task();
  },
};

/**
 * Terse replacement for the Director task — used on the retry after a truncated
 * JSON so the model emits a complete, minimal payload.
 * @returns {string}
 */
export function render_terse_director_task() {
  return `
<TASK>
  Return a single, COMPLETE, VALID JSON object. It MUST fit in under 700 characters.
  - Omit "_thought_process" entirely, or keep it to one clause of a few words.
  - Omit "directive" entirely.
  - Set "speaker": "ai" (or "fractal" only if the fractal/scene itself should narrate this turn).
  - Set "keywords": [] (or up to 2 from <AVAILABLE_KEYWORDS>).
  - Set "story_status": "IN_PROGRESS" (use "CONCLUDED"/"COLLAPSED" ONLY at a true quest resolution).
  - For each entity, include only NON-EMPTY mutations:
      "state_append": { "physical": "", "non_physical": "<one short clause>" }
      "vector_append": [] (or a SINGLE item)
      "dynamics_deltas": { small integers }
  - Set "trigger_image": "false".
  Output ONLY the JSON. No markdown fences, no prose, no trailing commas.
  End with a closing "}". A small complete object beats a large cut-off one.
</TASK>
  `.trim();
}

export { render_ghostwriter };

if (typeof window !== "undefined") {
  window.prompt_builder = prompt_builder;
}
