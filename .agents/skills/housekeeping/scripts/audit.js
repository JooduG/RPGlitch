/**
 * .agents/skills/housekeeping/scripts/audit.js
 * 🛡️ UNIFIED HYGIENE & DEBT AUDITOR + LAYER GATE (single runner).
 *
 * Merges workspace.js Pipeline 2 + audit-layers.js: one report format
 * (lib/io.js run_audit), one exit code. Rule packs live in rules/.
 *
 * CLI:
 *   node audit.js hygiene   # Phases A (code) + B (lexical) + C (legislative)
 *   node audit.js layers    # Strict layer boundary gate (non-zero exit on violation)
 *   node audit.js all       # hygiene + layers (default)
 */

import { execFileSync } from "node:child_process";
import path from "path";
import { COLORS, ROOT_DIRECTORY, run_audit } from "./lib/io.js";
import { code_hygiene_rules, legislative_debt_rules, lexical_hygiene_rules } from "./rules/hygiene.js";
import { sync_workspace } from "./sync-ignores.js";

export { sync_workspace };

/**
 * Executes the complete Hygiene & Debt Auditor across code, lexical, legislative dimensions.
 *
 * @param {boolean} [exit_on_heresy=true]
 */
export function audit_hygiene(exit_on_heresy = true) {
  const source_directory = path.join(ROOT_DIRECTORY, "src");
  const skills_directory = path.join(ROOT_DIRECTORY, ".agents/skills");
  const workflows_directory = path.join(ROOT_DIRECTORY, ".agents/workflows");

  console.log("\n================================================================================");
  console.log("🛡️  UNIFIED HYGIENE & DEBT AUDITOR");
  console.log("================================================================================");

  // Run Phase A: Code & Structural Hygiene
  const code_result = run_audit({
    title: "🔒 PHASE A: CODE & STRUCTURAL HYGIENE (Security, DOMPurify, Secrets, HTML)",
    root_directory: ROOT_DIRECTORY,
    scan_directories: [source_directory],
    extensions: [".js", ".ts", ".svelte"],
    rules: code_hygiene_rules,
    exit_on_heresy: false,
  });

  // Run Phase B: Lexical Hygiene
  const lexical_result = run_audit({
    title: "🏷️ PHASE B: LEXICAL HYGIENE (Casing, Nomenclature, File Patterns)",
    root_directory: ROOT_DIRECTORY,
    scan_directories: [source_directory, skills_directory, workflows_directory],
    rules: lexical_hygiene_rules,
    exit_on_heresy: false,
  });

  // Run Phase C: Legislative & Backlog Debt
  const legislative_result = run_audit({
    title: "📜 PHASE C: LEGISLATIVE & BACKLOG DEBT (Templates, TODOs, Roadmap)",
    root_directory: ROOT_DIRECTORY,
    scan_directories: [source_directory, skills_directory, workflows_directory],
    extensions: [".md"],
    rules: legislative_debt_rules,
    exit_on_heresy: false,
  });

  const total_scanned = code_result.scanned + lexical_result.scanned + legislative_result.scanned;
  const total_violations = code_result.violations + lexical_result.violations + legislative_result.violations;
  const has_any_heresy = code_result.has_heresy || lexical_result.has_heresy || legislative_result.has_heresy;

  console.log("\n================================================================================");
  console.log(`🏁 HYGIENE AUDIT COMPLETE: ${total_scanned} assets scanned across 3 phases.`);
  console.log(`🔥 TOTAL VIOLATIONS: ${total_violations}`);
  console.log("================================================================================\n");

  if (has_any_heresy) {
    console.log(`${COLORS.RED}❌ REJECTED: Heresy detected in hygiene audit. Gate closed.${COLORS.RESET}`);
    if (exit_on_heresy) process.exit(1);
  } else {
    console.log(`${COLORS.GREEN}✅ RESONANT: All hygiene dimensions align. Proceeding.${COLORS.RESET}`);
  }

  return { scanned: total_scanned, violations: total_violations, has_heresy: has_any_heresy };
}

/**
 * Runs the strict architecture gate via graph-it check-architecture (graphit.architecture.json).
 *
 * @param {boolean} [exit_on_violation=true]
 */
export function audit_layer_boundaries(exit_on_violation = true) {
  console.log("🏛️ [AUDIT] Checking architecture rules via graph-it check-architecture...");
  const graph_it_bin = path.join(ROOT_DIRECTORY, "node_modules", "@magic5644", "graph-it-live", "dist", "graph-it.js");
  try {
    const raw = execFileSync(process.execPath, [graph_it_bin, "check-architecture", "--format", "json"], {
      cwd: ROOT_DIRECTORY,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    const json_start = raw.indexOf("{");
    const report = json_start === -1 ? null : JSON.parse(raw.slice(json_start));
    const files = report?.totals?.files ?? "?";
    const rules = report?.totals?.rules ?? "?";
    console.log(`✅ [PASSED] 0 architecture violations across ${files} files (${rules} rules).`);
    return { violations: [] };
  } catch (error) {
    const stdout = String(error.stdout || "");
    const stderr = String(error.stderr || "");
    const json_start = stdout.indexOf("{");
    if (json_start !== -1) {
      const report = JSON.parse(stdout.slice(json_start));
      const new_errors = report?.totals?.newErrors ?? report?.totals?.errors ?? "unknown";
      console.error(`❌ [FAILED] graph-it check-architecture reported ${new_errors} error violation(s).`);
      for (const rule of report?.rules || []) {
        if (rule.newViolations > 0 || rule.violations > 0) {
          console.error(`  - [${rule.name}] ${rule.reason} (${rule.violations} violation(s))`);
        }
      }
    } else {
      console.error(`❌ [FAILED] graph-it check-architecture failed:\n${stderr || stdout || error.message}`);
    }
    if (exit_on_violation) process.exit(1);
    return { violations: [error] };
  }
}

const is_main_execution = process.argv[1] && path.resolve(process.argv[1]).endsWith("audit.js");

if (is_main_execution) {
  const requested_subcommand = process.argv[2];

  switch (requested_subcommand) {
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

    case "sync":
    case "sync-ignores":
    case "--sync":
      sync_workspace();
      break;

    case "all":
    case "--all":
    case undefined:
    case "": {
      sync_workspace();
      audit_hygiene(true);
      audit_layer_boundaries(true);
      break;
    }

    default:
      console.error(`Unknown audit subcommand: "${requested_subcommand}".\nUsage: node audit.js [sync | hygiene | layers | all]`);
      process.exit(1);
  }
}

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Created - merges workspace.js Pipeline 2 + audit-layers.js behind one runner.
 *   Rules live in rules/hygiene.js + rules/layers.js; sync lives in sync-ignores.js.
 */
