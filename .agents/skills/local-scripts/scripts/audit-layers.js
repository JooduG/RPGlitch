/**
 * .agents/skills/local-scripts/scripts/audit-layers-shim.js
 * 🏛️ LAYER GATE ENTRY SHIM (deprecated) - use `node audit.js layers` directly.
 */
import { audit_layer_boundaries } from "./audit.js";

audit_layer_boundaries(true);
