// PROTOCOL_LIBRARY must be re-exported FIRST: the @data barrel participates in a
// cyclic import graph (@data -> normalizer -> @platform -> @intelligence -> kernel
// -> @media -> optics -> @data), and under vitest's transformed-module semantics an
// export is only readable once its re-export statement in this file has executed.
// Being last, it was `undefined` when fragments.js/image-prompts.js read it during the cycle.
export { PROTOCOL_LIBRARY } from "./definitions/protocols.js";
export { seed_premades, stories, entities } from "./repository.js";
export { db, init, set_versionchange_quiesce } from "./db.js";
export {
  ENTITY_TEMPLATES,
  get_random_signature_key,
  normalize,
  coerce_temporal_array,
  coerce_temporal_vectors,
  create_new,
  format_premade,
  serialize_entity_for_export,
} from "./normalizer.js";
export { detox_prose, resolve_voice_register } from "./definitions/detox-rules.js";
export { detect_card_format, parse_character_card, serialize_character_card, serialize_rpglitch_entity } from "./cards.js";
export { premade } from "./definitions/premades.js";
export { NARRATIVE_STYLES, get_style_keywords } from "./definitions/narrative-styles.js";
export {
  GLOBAL_TRIGGERS,
  SOMATIC_REGISTRY,
  STYLE_MOTIF_REGISTRY,
  resolve_somatic_directives,
  render_somatic_directives_xml,
  build_somatic_directives_block,
  build_available_keywords_xml,
} from "./definitions/triggers.js";
export { VISUAL_STYLES } from "./definitions/visual-styles.js";
export { ENTITY_FRAGMENTS, ENTITY_CATALOG, PROFILE_SECTIONS_BY_TYPE, build_profile_sections } from "./definitions/fragments.js";
