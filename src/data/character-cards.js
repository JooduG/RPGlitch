/**
 * src/data/character-cards.js
 * 🃏 CHARACTER CARD CODEC — AI RP Card V2/V3 interoperability
 *
 * The single place that translates between RPGlitch entities and the standard
 * Character Card formats used by Tavern, Chub, and Janitor ("chara_card_v2" /
 * "chara_card_v3"), plus native RPGlitch entity JSON and PNG-embedded cards.
 *
 * CARD FORMATS
 *   1. Standard Character Card JSON   (.json) — `spec` + `data.*` fields.
 *   2. Character Card PNG             (.png)  — an image whose `chara` tEXt
 *                                              chunk holds a base64 JSON card.
 *   3. Native RPGlitch entity JSON    (.json) — full Twin-Cylinder schema.
 *
 * Every decoding path funnels into the same flat profile shape the LLM sorter
 * emits, so the import layer always maps one shape onto an entity:
 *
 *   data.name              <-> entity.name
 *   data.description       <-> entity.eternal.physical   (appearance)
 *   data.personality       <-> entity.eternal.non_physical
 *   data.first_mes         <-> entity.present.non_physical
 *   data.scenario          <-> entity.future
 *   data.tags              <-> entity.tags
 *
 * (Applying that flat profile onto a fresh entity is the intelligence layer's
 * job — see apply_profile_to_entity in @intelligence/profile-pipeline.js. This codec
 * owns only the card <-> flat translation.)
 */

import { normalize, serialize_entity_for_export } from "./normalizer.js";

// =============================================================
// 1. FORMAT DETECTION
// =============================================================

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

// =============================================================
// 2. DECODE — card payloads → flat profile shape
// =============================================================

/**
 * Converts a standard Character Card V2/V3 payload into the flat profile shape
 * the LLM sorter emits (apply_profile_to_entity applies it to an entity).
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
 * Extracts the JSON card embedded in a Character Card PNG (the `chara` keyword
 * inside a `tEXt` chunk). Returns the raw JSON text, or null when the PNG
 * carries no card data.
 * @param {ArrayBuffer | Uint8Array} buffer
 * @returns {string | null}
 */
export function extract_card_from_png(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let offset = 8; // skip PNG signature
  while (offset < bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, false);
    const type_str = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    if (type_str === "tEXt") {
      const chunk_data = bytes.slice(offset + 8, offset + 8 + length);
      const null_idx = chunk_data.indexOf(0);
      if (null_idx !== -1) {
        const keyword = String.fromCharCode(...chunk_data.slice(0, null_idx));
        if (keyword === "chara") {
          const base64_data = String.fromCharCode(...chunk_data.slice(null_idx + 1));
          return atob(base64_data);
        }
      }
    }
    offset += 12 + length;
  }
  return null;
}

// =============================================================
// 3. ENCODE — entities → card payloads
// =============================================================

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
