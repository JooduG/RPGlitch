// PROTOCOL_LIBRARY must be re-exported FIRST: the @data barrel participates in a
// cyclic import graph (@data -> normalizer -> @platform -> @intelligence -> kernel
// -> @media -> optics -> @data), and under vitest's transformed-module semantics an
// export is only readable once its re-export statement in this file has executed.
// Being last, it was `undefined` when fragments.js/image-prompts.js read it during the cycle.
export { PROTOCOL_LIBRARY } from "./definitions/protocols.js";
export { seed_premades, stories, entities, prune } from "./repository.js";
export { db, init, set_versionchange_quiesce } from "./db.js";
export {
  ENTITY_TEMPLATES,
  get_random_signature_key,
  normalize,
  coerce_temporal_array,
  coerce_temporal_vectors,
  create_new,
  format_premade,
  detox_prose,
  serialize_entity_for_export,
} from "./normalizer.js";
export { detect_card_format, parse_character_card, serialize_character_card, serialize_rpglitch_entity } from "./cards.js";
export { premade } from "./definitions/premades.js";
export { NARRATIVE_STYLES, GLOBAL_TRIGGERS } from "./definitions/narrative-styles.js";
export { VISUAL_STYLES } from "./definitions/visual-styles.js";
export {
  ENTITY_FRAGMENTS,
  ENTITY_CATALOG,
  PROFILE_SECTIONS_BY_TYPE,
  NAME_PREFIXES,
  build_profile_sections,
  format_key_as_label,
} from "./definitions/fragments.js";
