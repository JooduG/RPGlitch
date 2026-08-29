/**
 * ============================================================================
 * RPGlitch — Card Conversion Codec
 * ============================================================================
 *
 * OVERVIEW:
 * Translates between native RPGlitch entities and third-party AI Roleplay
 * character card formats (Tavern / Chub / Janitor "chara_card_v2" & "chara_card_v3"),
 * as well as embedded PNG character cards (`chara` tEXt chunk encoding).
 *
 * SUPPORTED FORMATS:
 * 1. Standard Character Card JSON (.json) — Spec definition + `data.*` payload.
 * 2. Character Card PNG           (.png)  — PNG holding base64 JSON in `chara` chunk.
 * 3. Native RPGlitch Entity JSON  (.json) — Full normalized entity schema.
 *
 * MAPPING CONCORDANCE:
 * - data.name              <-> entity.name
 * - data.description       <-> entity.eternal.physical
 * - data.personality       <-> entity.eternal.non_physical
 * - data.first_mes         <-> entity.present.non_physical
 * - data.scenario          <-> entity.future
 * - data.tags              <-> entity.tags
 * - data.creator_notes     <-> entity.description
 *
 * RULES:
 * - Pure codec logic only. State persistence and entity lifecycle live in stores/pipelines.
 * - Adheres strictly to GEMINI.md naming standards (anti-abbreviation mandate).
 * ============================================================================
 */

import { normalize, serialize_entity_for_export } from "./normalizer.js";

// ============================================================================
// 1. FORMAT DETECTION
// ============================================================================

/**
 * Detects the format of a parsed import payload.
 *
 * @param {unknown} payload_json - Parsed JSON object to evaluate.
 * @returns {"v2" | "rpglitch" | "unknown"} Recognized format descriptor.
 */
export function detect_card_format(payload_json) {
  if (!payload_json || typeof payload_json !== "object" || Array.isArray(payload_json)) {
    return "unknown";
  }

  const candidate = /** @type {Record<string, any>} */ (payload_json);

  if (candidate.spec === "chara_card_v2" || candidate.spec === "chara_card_v3") {
    return "v2";
  }

  if (candidate.data && typeof candidate.data === "object" && !Array.isArray(candidate.data)) {
    const card_data = candidate.data;
    if (
      card_data.name !== undefined ||
      card_data.first_mes !== undefined ||
      card_data.personality !== undefined ||
      card_data.scenario !== undefined
    ) {
      return "v2";
    }
  }

  if (candidate.eternal || candidate.present || candidate.dynamics) {
    return "rpglitch";
  }

  return "unknown";
}

// ============================================================================
// 2. DECODE — Card Payloads -> Flat Profile Shape
// ============================================================================

/**
 * Converts a standard Character Card V2/V3 payload into a flat profile shape.
 * Missing keys are omitted to allow the entity factory to generate defaults.
 *
 * @param {unknown} payload_json - Raw decoded card JSON object.
 * @returns {Record<string, any>} Flat profile object ready for entity application.
 */
export function parse_character_card(payload_json) {
  const candidate =
    payload_json && typeof payload_json === "object" && !Array.isArray(payload_json) ? /** @type {Record<string, any>} */ (payload_json) : null;

  const card_data = candidate?.data && typeof candidate.data === "object" && !Array.isArray(candidate.data) ? candidate.data : {};

  /** @type {Record<string, any>} */
  const flat_profile = {};

  /**
   * Helper to safely trim and sanitize string fields.
   * @param {unknown} value
   * @returns {string}
   */
  const sanitize_text = (value) => (typeof value === "string" ? value.trim() : "");

  const character_name = sanitize_text(card_data.name);
  if (character_name) {
    flat_profile.name = character_name;
  }

  const description = sanitize_text(card_data.description);
  if (description) {
    flat_profile.appearance = description;
  }

  const personality = sanitize_text(card_data.personality);
  if (personality) {
    flat_profile.personality = personality;
  }

  const first_message = sanitize_text(card_data.first_mes);
  if (first_message) {
    flat_profile.current_look = first_message;
  }

  const scenario = sanitize_text(card_data.scenario);
  if (scenario) {
    flat_profile.future = scenario;
  }

  const creator_notes = sanitize_text(card_data.creator_notes);
  if (creator_notes) {
    flat_profile.description = creator_notes;
  }

  if (Array.isArray(card_data.tags)) {
    flat_profile.tags = card_data.tags.map((tag_item) => String(tag_item).trim()).filter((tag_item) => tag_item.length > 0);
  }

  return flat_profile;
}

/**
 * Extracts the JSON card payload embedded inside a Character Card PNG image.
 * Looks for the `chara` keyword within standard `tEXt` chunks.
 *
 * @param {ArrayBuffer | Uint8Array} binary_buffer - Raw binary data of the PNG file.
 * @returns {string | null} Decoded JSON string if present, or null.
 */
export function extract_card_from_png(binary_buffer) {
  if (!binary_buffer) {
    return null;
  }

  const byte_array = binary_buffer instanceof Uint8Array ? binary_buffer : new Uint8Array(binary_buffer);

  if (byte_array.length < 8) {
    return null;
  }

  let byte_offset = 8; // Skip standard 8-byte PNG header signature

  while (byte_offset + 12 <= byte_array.length) {
    const data_view = new DataView(byte_array.buffer, byte_array.byteOffset, byte_array.byteLength);

    const chunk_length = data_view.getUint32(byte_offset, false);
    const chunk_type = String.fromCharCode(
      byte_array[byte_offset + 4],
      byte_array[byte_offset + 5],
      byte_array[byte_offset + 6],
      byte_array[byte_offset + 7],
    );

    if (chunk_type === "tEXt") {
      const chunk_data_start = byte_offset + 8;
      const chunk_data_end = chunk_data_start + chunk_length;

      if (chunk_data_end <= byte_array.length) {
        const chunk_data = byte_array.slice(chunk_data_start, chunk_data_end);
        const null_separator_index = chunk_data.indexOf(0);

        if (null_separator_index !== -1) {
          const keyword = String.fromCharCode(...chunk_data.slice(0, null_separator_index));

          if (keyword === "chara") {
            const base64_payload = String.fromCharCode(...chunk_data.slice(null_separator_index + 1));
            try {
              return atob(base64_payload);
            } catch {
              return null;
            }
          }
        }
      }
    }

    byte_offset += 12 + chunk_length;
  }

  return null;
}

// ============================================================================
// 3. ENCODE — Entities -> Card Payloads
// ============================================================================

/**
 * Serializes an RPGlitch entity into a standard Character Card V2 payload.
 *
 * @param {Record<string, any> | null | undefined} entity - RPGlitch entity object.
 * @returns {Record<string, any>} Serialized Character Card V2 JSON object.
 */
export function serialize_character_card(entity) {
  const target_entity = entity || {};
  const physical_description = String(target_entity.eternal?.physical || "").trim();
  const non_physical_personality = String(target_entity.eternal?.non_physical || "").trim();

  const combined_description = [physical_description, non_physical_personality].filter((part) => part.length > 0).join("\n\n");

  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: String(target_entity.name || "Unnamed").trim(),
      description: combined_description,
      personality: non_physical_personality,
      scenario: String(target_entity.future || "").trim(),
      first_mes: String(target_entity.present?.non_physical || "").trim(),
      mes_example: "",
      creator_notes: String(target_entity.description || "").trim(),
      character_version: "1.0",
      alternate_greetings: [],
      tags: Array.isArray(target_entity.tags) ? target_entity.tags.map(String) : [],
      extensions: {},
    },
  };
}

/**
 * Serializes an RPGlitch entity into native standalone normalized JSON format.
 *
 * @param {Record<string, any> | null | undefined} entity - RPGlitch entity object.
 * @returns {Record<string, any>} Export-ready sanitized entity object.
 */
export function serialize_rpglitch_entity(entity) {
  return serialize_entity_for_export(normalize(entity));
}

// ============================================================================
// CHANGELOG
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Harmonized module structure, added formal Universal Header,
 *   organized dividers, full anti-abbreviation compliance, robust PNG chunk
 *   bounds handling and atob try/catch guard.
 */
