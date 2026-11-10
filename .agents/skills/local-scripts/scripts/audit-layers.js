/**
 * .agents/skills/local-scripts/scripts/audit-layers-shim.js
 * 🏛️ LAYER GATE ENTRY SHIM (deprecated) — use `node audit.js layers` directly.
 */
export { LAYER_HIERARCHY, ALIAS_LAYER_MAP, get_file_layer, walk_dir, audit_layers } from "./rules/layers.js";
import { audit_layer_boundaries } from "./audit.js";

audit_layer_boundaries(true);
