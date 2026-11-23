/**
 * @file src/utils/macros.js
 * Entity-aware `@TOKEN` macro resolution for simulation prompts and display segments.
 */

const MACRO_TOKEN_REGEX = /(?<!\w)@([a-zA-Z0-9_-]+)\b/gi;

const FALLBACK_LABELS = Object.freeze({ user: "the traveler", you: "the traveler", fractal: "the realm", char: "the companion" });

export function create_relational_context({ me = null, you = null, speaker = null, listener = null, owner = null, target = null, witnesses = [] } = {}) {
  return Object.freeze({
    me,
    you,
    speaker,
    listener,
    owner,
    target,
    witnesses: Object.freeze(Array.isArray(witnesses) ? [...witnesses] : []),
    is_relational_context: true,
  });
}

function entity_ids_match(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  return Boolean(a.id && b.id && String(a.id) === String(b.id));
}

function resolve_owner_perspective(owner, entities = {}) {
  if (!owner) return null;
  if (owner.type === "user" || entity_ids_match(owner, entities?.USER)) return "user";
  if (entity_ids_match(owner, entities?.AI)) return "ai";
  if (owner.type === "fractal" || entity_ids_match(owner, entities?.FRACTAL)) return "fractal";
  if (owner.id) return `entity:${owner.id}`;
  return null;
}

function build_macro_state(owner_or_context, entities = {}, context = {}) {
  const rel_ctx =
    owner_or_context?.is_relational_context ? owner_or_context
    : context?.is_relational_context ? context
    : create_relational_context({ owner: owner_or_context, speaker: context?.speaker, listener: context?.listener, target: context?.target });

  const owner = rel_ctx.owner || (!owner_or_context?.is_relational_context ? owner_or_context : null) || rel_ctx.me;
  const ai_entity = entities.AI || null;
  const user_entity = entities.USER || null;
  const fractal_entity = entities.FRACTAL || null;
  const perspective = resolve_owner_perspective(owner, entities);

  const speaker_entity =
    rel_ctx.speaker ||
    rel_ctx.me ||
    context.speaker ||
    (perspective === "user" ? user_entity
    : perspective === "ai" ? ai_entity
    : perspective === "fractal" ? fractal_entity
    : owner || ai_entity);

  const listener_entity = rel_ctx.listener || rel_ctx.you || context.listener || (perspective === "user" ? ai_entity : user_entity);

  return { rel_ctx, owner, ai_entity, user_entity, fractal_entity, perspective, speaker_entity, listener_entity };
}

/**
 * Formats an entity's canonical uppercase `@ID` handle for display segments and graph nodes.
 * @param {any} entity
 * @param {string} [fallback_token=""]
 * @returns {string}
 */
export function format_entity_handle(entity, fallback_token = "") {
  const raw = entity?.id || fallback_token || entity?.name || "";
  const cleaned = String(raw)
    .trim()
    .replace(/^@+/, "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "_");
  return `@${cleaned}`;
}

/**
 * Resolves a concrete `@ENTITY` token or slug against ambient role slots and `entities.ALL`.
 * Shared across `macros.js`, `BracketList.svelte`, and `RelationalGraph.svelte`.
 * @param {string} raw_token
 * @param {{ AI?: any, USER?: any, FRACTAL?: any, ALL?: any[] }} [entities={}]
 * @param {any} [owner=null]
 * @returns {any | null}
 */
export function match_entity_in_roster(raw_token, entities = {}, owner = null) {
  const token_lc = String(raw_token || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
  if (!token_lc) return null;

  if (token_lc === "user" && entities?.USER) return entities.USER;
  if ((token_lc === "char" || token_lc === "ai") && entities?.AI) return entities.AI;
  if (token_lc === "fractal" && entities?.FRACTAL) return entities.FRACTAL;

  const spaced_token = token_lc.replace(/_/g, " ");
  const extra = Array.isArray(entities?.ALL) ? entities.ALL : [];
  const candidates = [entities?.AI, entities?.USER, entities?.FRACTAL, owner, ...extra].filter(Boolean);

  const exact = candidates.find((cand) => {
    const cand_id = String(cand.id || "")
      .trim()
      .toLowerCase();
    const cand_name = String(cand.name || "")
      .trim()
      .toLowerCase();
    return cand_id === token_lc || cand_id === spaced_token || cand_name === token_lc || cand_name === spaced_token;
  });
  if (exact) return exact;

  return (
    candidates.find((cand) => {
      const cand_name = String(cand.name || "")
        .trim()
        .toLowerCase();
      return cand_name.split(/\s+/).includes(spaced_token) || spaced_token.split(/\s+/).includes(cand_name);
    }) || null
  );
}

function resolve_role_token(token, state) {
  const { rel_ctx, owner, ai_entity, user_entity, fractal_entity, perspective, speaker_entity, listener_entity } = state;

  if (token === "USER") return { matched: true, entity: user_entity, fallback_text: FALLBACK_LABELS.user };
  if (token === "CHAR") return { matched: true, entity: ai_entity, fallback_text: FALLBACK_LABELS.char };
  if (token === "FRACTAL") return { matched: true, entity: fractal_entity, fallback_text: FALLBACK_LABELS.fractal };
  if (token === "TARGET") return { matched: true, entity: rel_ctx.target || null, fallback_text: null };

  if (token === "SPEAKER" || token === "ME" || token === "OWNER") {
    const chosen = token === "ME" && rel_ctx.me ? rel_ctx.me : speaker_entity;
    if (chosen?.name || chosen?.id) return { matched: true, entity: chosen, fallback_text: null };
    if (perspective === "ai") return { matched: true, entity: ai_entity, fallback_text: FALLBACK_LABELS.char };
    if (perspective === "user") return { matched: true, entity: user_entity, fallback_text: FALLBACK_LABELS.user };
    if (perspective === "fractal") return { matched: true, entity: fractal_entity, fallback_text: FALLBACK_LABELS.fractal };
    if (owner?.name || owner?.id) return { matched: true, entity: owner, fallback_text: null };
    if (owner) return { matched: true, entity: null, fallback_text: owner.type === "fractal" ? "this fractal" : "this character" };
    return { matched: true, entity: null, fallback_text: null };
  }

  if (token === "LISTENER" || token === "YOU") {
    const chosen = token === "YOU" && rel_ctx.you ? rel_ctx.you : listener_entity;
    if (chosen?.name || chosen?.id) return { matched: true, entity: chosen, fallback_text: null };
    if (perspective === "ai") return { matched: true, entity: user_entity, fallback_text: FALLBACK_LABELS.user };
    if (perspective === "user") return { matched: true, entity: ai_entity, fallback_text: FALLBACK_LABELS.char };
    if (perspective === "fractal") {
      const ai_name = ai_entity?.name?.trim() || FALLBACK_LABELS.char;
      const user_name = user_entity?.name?.trim() || FALLBACK_LABELS.user;
      return { matched: true, entity: null, fallback_text: `${ai_name} and ${user_name}` };
    }
    if (perspective?.startsWith("entity:")) {
      if (user_entity?.name || user_entity?.id) return { matched: true, entity: user_entity, fallback_text: FALLBACK_LABELS.user };
      if (ai_entity?.name || ai_entity?.id) return { matched: true, entity: ai_entity, fallback_text: FALLBACK_LABELS.char };
    }
    return { matched: true, entity: user_entity, fallback_text: FALLBACK_LABELS.you };
  }

  return { matched: false, entity: null, fallback_text: null };
}

export function parse_macros(text, owner_or_context, entities = {}, context = {}) {
  if (!text || !entities) return text || "";
  const state = build_macro_state(owner_or_context, entities, context);

  return text.replace(MACRO_TOKEN_REGEX, (match, raw_token) => {
    const { matched, entity, fallback_text } = resolve_role_token(raw_token.toUpperCase(), state);
    if (!matched) return match;
    if (entity?.name) return entity.name;
    return fallback_text ?? match;
  });
}

export function resolve_display_macro_segments(text, owner, entities = {}, context = {}) {
  if (!text) return [];
  const state = build_macro_state(owner, entities, context);
  const segments = [];
  const source = String(text);
  let last = 0;

  MACRO_TOKEN_REGEX.lastIndex = 0;
  let match;
  while ((match = MACRO_TOKEN_REGEX.exec(source)) !== null) {
    if (match.index > last) {
      segments.push({ text: source.slice(last, match.index), macro: null, entity: null });
    }

    const raw_token = match[1];
    const role_result = resolve_role_token(raw_token.toUpperCase(), state);
    const resolved_entity = role_result.matched ? role_result.entity : match_entity_in_roster(raw_token, entities, state.owner);

    let label;
    let entity = null;
    if (resolved_entity?.name?.trim() || resolved_entity?.id) {
      entity = resolved_entity;
      label = format_entity_handle(resolved_entity, raw_token);
    } else if (role_result.matched && role_result.fallback_text) {
      label = role_result.fallback_text;
    } else {
      label = `@${raw_token}`;
    }

    segments.push({ text: label, macro: raw_token, entity });
    last = match.index + match[0].length;
  }

  if (last < source.length) {
    segments.push({ text: source.slice(last), macro: null, entity: null });
  }
  return segments;
}

export function render_display_macros(text, owner, entities = {}) {
  if (!text) return "";
  return resolve_display_macro_segments(text, owner, entities)
    .map((segment) => segment.text)
    .join("");
}
