/**
 * .agents/skills/local-scripts/scripts/audit-layers-shim.js
 * 🏛️ LAYER GATE ENTRY SHIM (deprecated) - use `node audit.js layers` directly.
 */
export { ALIAS_LAYER_MAP, audit_layers, get_file_layer, LAYER_HIERARCHY, walk_dir } from "./rules/layers.js";
import { audit_layer_boundaries } from "./audit.js";

audit_layer_boundaries(true);
