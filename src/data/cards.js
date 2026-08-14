/**
 * src/data/cards.js
 * 🃏 CHARACTER CARD CODEC — AI RP Card V2/V3 interoperability
 *
 * Imports & exports the standard Character Card format used by Tavern, Chub,
 * and Janitor (spec "chara_card_v2" / "chara_card_v3") alongside native
 * RPGlitch entity JSON. Card JSON is always converted to/from the flat profile
 * shape the LLM sorter emits, so the ImportModal mapping stays single-source.
 *
 *   data.name              <-> entity.name
 *   data.description       <-> entity.eternal.physical   (appearance)
 *   data.personality       <-> entity.eternal.non_physical
 *   data.first_mes         <-> entity.present.non_physical
 *   data.scenario          <-> entity.future
 *   data.tags              <-> entity.tags
 */

import { normalize, serialize_entity_for_export } from "./normalizer.js";

/**
 * Detects the format of a parsed import payload.
 * @param {any} json
 * @returns {'v2' | 'rpglitch' | 'unknown'}
 */
export function detect_card_format(json) {
  if (!json || typeof json !== "object" || Array.isArray(json)) return "unknown";
  if (json.spec === "chara_card_v2" || json.spec === "chara_card_v3") return "v2";
  if (json.data && typeof json.data === "object" && !Array.isArray(json.data)) {
    const data = json.data;
    if (data.name !== undefined || data.first_mes !== undefined || data.personality !== undefined || data.scenario !== undefined) {
      return "v2";
    }
  }
  if (json.eternal || json.present || json.dynamics) return "rpglitch";
  return "unknown";
}

/**
 * Converts a standard Character Card V2/V3 payload into the flat profile shape
 * the LLM sorter emits (finalize_import applies it to an entity directly).
 * Missing keys are simply omitted — the import layer synthesizes defaults.
 * @param {any} json
 * @returns {Object}
 */
export function parse_character_card(json) {
  const data = json?.data && typeof json.data === "object" ? json.data : {};
  const flat = {};
  const str = (v) => (typeof v === "string" ? v.trim() : "");

  const name = str(data.name);
  if (name) flat.name = name;

  // Standard cards fold appearance + personality into `description`; the
  // dedicated `personality` line maps to the non-physical pole.
  const description = str(data.description);
  if (description) flat.appearance = description;
  const personality = str(data.personality);
  if (personality) flat.personality = personality;

  const first_mes = str(data.first_mes);
  if (first_mes) flat.current_look = first_mes;
  const scenario = str(data.scenario);
  if (scenario) flat.future = scenario;

  const creator_notes = str(data.creator_notes);
  if (creator_notes) flat.description = creator_notes;

  if (Array.isArray(data.tags)) {
    flat.tags = data.tags.map((t) => String(t).trim()).filter(Boolean);
  }
  return flat;
}

/**
 * Serializes an RPGlitch entity into a standard Character Card V2 payload.
 * `description` composes both eternal poles (physical + non-physical) so the
 * card survives in Tavern/Chub/Janitor; `personality` keeps the philosophy.
 * @param {any} entity
 * @returns {Object}
 */
export function serialize_character_card(entity) {
  const e = entity || {};
  const physical = String(e.eternal?.physical || "").trim();
  const non_physical = String(e.eternal?.non_physical || "").trim();
  const description = [physical, non_physical].filter(Boolean).join("\n\n");

  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: String(e.name || "Unnamed").trim(),
      description,
      personality: non_physical,
      scenario: String(e.future || "").trim(),
      first_mes: String(e.present?.non_physical || "").trim(),
      mes_example: "",
      creator_notes: String(e.description || "").trim(),
      character_version: "1.0",
      alternate_greetings: [],
      tags: Array.isArray(e.tags) ? e.tags.map(String) : [],
      extensions: {},
    },
  };
}

/**
 * Serializes an RPGlitch entity into the native standalone JSON export.
 * @param {any} entity
 * @returns {Object}
 */
export const serialize_rpglitch_entity = (entity) => serialize_entity_for_export(normalize(entity));
