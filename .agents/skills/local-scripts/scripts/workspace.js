/**
 * .agents/skills/local-scripts/scripts/workspace.js
 * 🌐 WORKSPACE ENTRY SHIM (deprecated) — use audit.js + sync-ignores.js directly.
 *
 * Preserved so existing muscle memory (`node workspace.js [sync|hygiene|all]`)
 * and external references keep working. All logic lives in audit.js,
 * sync-ignores.js, lib/io.js, and rules/*.
 */

export { audit_hygiene, audit_layer_boundaries, sync_workspace } from "./audit.js";
export { code_hygiene_rules, lexical_hygiene_rules, legislative_debt_rules } from "./rules/hygiene.js";
export { run_audit, scan_directory, create_ignore_filter, safe_stat_sync, COLORS } from "./lib/io.js";
import { audit_hygiene, sync_workspace } from "./audit.js";
import { audit_layer_boundaries } from "./audit.js";

const requested_subcommand = process.argv[2];

switch (requested_subcommand) {
  case "sync":
  case "sync-ignores":
  case "--sync":
    sync_workspace();
    break;

  case "hygiene":
  case "debt":
  case "audit-hygiene":
  case "--hygiene":
    audit_hygiene(true);
    break;

  case "layers":
  case "audit-layers":
  case "--layers":
    audit_layer_boundaries(true);
    break;

  case "all":
  case "--all":
  case undefined:
  case "": {
    sync_workspace();
    audit_hygiene(true);
    break;
  }

  default:
    console.error(`Unknown workspace subcommand: "${requested_subcommand}".\nUsage: node workspace.js [sync | hygiene | all]`);
    process.exit(1);
}

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Slimmed to a compatibility shim — logic moved to audit.js / sync-ignores.js /
 *   lib/io.js / rules/*. Purged under P4 Pre-Beta Purity (2026-09-05) stays purged.
 */
