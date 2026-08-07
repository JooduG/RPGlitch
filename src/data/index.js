// PROTOCOL_LIBRARY must be re-exported FIRST: the @data barrel participates in a
// cyclic import graph (@data -> normalizer -> @platform -> @intelligence -> kernel
// -> @media -> optics -> @data), and under vitest's transformed-module semantics an
// export is only readable once its re-export statement in this file has executed.
// Being last, it was `undefined` when fragments.js/optics.js read it during the cycle.
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
} from "./normalizer.js";
export { premade } from "./definitions/premades.js";
export { NARRATIVE_STYLES } from "./definitions/narrative-styles.js";
export { VISUAL_STYLES } from "./definitions/visual-styles.js";
