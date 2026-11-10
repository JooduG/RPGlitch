/**
 * .agents/skills/local-scripts/scripts/lib/io.js
 * 📦 SHARED AUDIT IO — paths, colors, ignore-aware scanning, audit runner.
 *
 * Extracted from workspace.js §1–§2 (single home for all audit I/O).
 * Rule packs in ../rules/* import from here; audit.js orchestrates.
 */

import fs from "fs";
import path from "path";
import ignore from "ignore";
import { fileURLToPath } from "url";

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const CURRENT_DIRECTORY = path.dirname(CURRENT_FILE_PATH);
export const ROOT_DIRECTORY = path.resolve(CURRENT_DIRECTORY, "..", "..", "..", "..", "..");
export const PROJECT_ROOT_DIRECTORY = ROOT_DIRECTORY;
export const SKILLS_DIRECTORY = path.join(PROJECT_ROOT_DIRECTORY, ".agents", "skills");

export let TEMPLATES_DIRECTORY = path.join(CURRENT_DIRECTORY, "..", "..", "templates");
if (!fs.existsSync(TEMPLATES_DIRECTORY)) {
  const alternative_templates_path = path.join(ROOT_DIRECTORY, ".agents", "skills", "directives", "templates");
  if (fs.existsSync(alternative_templates_path)) {
    TEMPLATES_DIRECTORY = alternative_templates_path;
  }
}

export const COLORS = Object.freeze({
  RED: "\x1b[31m",
  YELLOW: "\x1b[33m",
  GREEN: "\x1b[32m",
  CYAN: "\x1b[36m",
  RESET: "\x1b[0m",
});

/**
 * Safely inspects file stats without crashing on inaccessible paths.
 *
 * @param {string} file_path Target file path.
 * @returns {fs.Stats | null}
 */
export function safe_stat_sync(file_path) {
  try {
    return fs.statSync(file_path);
  } catch (error) {
    if (["ENAMETOOLONG", "ENOENT", "EACCES", "ELOOP"].includes(error.code)) {
      console.warn(`Skipping ${file_path} due to ${error.code}`);
      return null;
    }
    throw error;
  }
}

/**
 * Initializes ignore parser from repository .gitignore.
 *
 * @param {string} root_directory Root directory.
 * @returns {import("ignore").Ignore} Ignore instance.
 */
export function create_ignore_filter(root_directory) {
  const ignore_filter = ignore();
  const gitignore_path = path.join(root_directory, ".gitignore");
  if (fs.existsSync(gitignore_path)) {
    ignore_filter.add(fs.readFileSync(gitignore_path, "utf-8"));
  }
  return ignore_filter;
}

/**
 * Recursively scans directories for files matching target extensions, respecting .gitignore.
 *
 * @param {string} directory Directory to scan.
 * @param {Object} options
 * @param {string[]} [options.extensions] Array of extensions to include.
 * @param {import("ignore").Ignore} options.ignore_filter Ignore filter instance.
 * @param {string} options.root_directory Root directory.
 * @returns {string[]} Array of absolute file paths.
 */
export function scan_directory(directory, { extensions = [], ignore_filter, root_directory }) {
  const scan_results = [];
  if (!fs.existsSync(directory)) return scan_results;

  const directory_items = fs.readdirSync(directory);
  for (const item_name of directory_items) {
    const full_item_path = path.join(directory, item_name);
    const relative_path = path.relative(root_directory, full_item_path).replace(/\\/g, "/");

    if (ignore_filter.ignores(relative_path) || relative_path.includes("node_modules")) continue;

    let item_stats;
    try {
      item_stats = fs.statSync(full_item_path);
    } catch {
      continue;
    }

    if (item_stats.isDirectory()) {
      scan_results.push(...scan_directory(full_item_path, { extensions, ignore_filter, root_directory }));
    } else {
      const file_extension = path.extname(full_item_path);
      if (extensions.length === 0 || extensions.includes(file_extension) || extensions.some((ext) => full_item_path.endsWith(ext))) {
        scan_results.push(full_item_path);
      }
    }
  }

  return scan_results;
}

/**
 * Executes an audit suite over target directories using specified rules.
 * One report format, one exit-code convention for every audit.
 *
 * @param {Object} configuration
 * @param {string} configuration.title Banner title.
 * @param {string} [configuration.root_directory] Project root directory.
 * @param {string[]} configuration.scan_directories Target directories.
 * @param {string[]} [configuration.extensions] Target file extensions.
 * @param {Array<any>} configuration.rules Array of audit rules.
 * @param {boolean} [configuration.exit_on_heresy=true]
 * @returns {{ scanned: number, violations: number, has_heresy: boolean }}
 */
export function run_audit({ title, root_directory = ROOT_DIRECTORY, scan_directories = [], extensions = [], rules = [], exit_on_heresy = true }) {
  console.log("\n================================================================================");
  console.log(title);
  console.log("================================================================================\n");

  const ignore_filter = create_ignore_filter(root_directory);
  let scanned_count = 0;
  let violation_count = 0;
  let has_heresy_violation = false;

  for (const target_directory of scan_directories) {
    const target_files = scan_directory(target_directory, { extensions, ignore_filter, root_directory });
    for (const file_path of target_files) {
      scanned_count++;
      const file_content = fs.readFileSync(file_path, "utf-8");
      const content_lines = file_content.split("\n");
      const relative_path = path.relative(root_directory, file_path).replace(/\\/g, "/");

      if (relative_path.includes("audit-") || relative_path.includes(".bak.")) continue;

      for (const rule of rules) {
        if (rule.audit_path) {
          const rule_passed = rule.audit_path(path.basename(file_path), false, relative_path);
          if (!rule_passed) {
            violation_count++;
            const color = rule.severity === "HERESY" ? COLORS.RED : COLORS.YELLOW;
            if (rule.severity === "HERESY") has_heresy_violation = true;
            console.log(`${color}[${rule.severity}] ${relative_path}${COLORS.RESET}`);
            console.log(`  ${rule.message}\n`);
          }
        }

        if (rule.regex) {
          content_lines.forEach((line_content, line_index) => {
            if (rule.regex.test(line_content)) {
              if (rule.validate && !rule.validate(line_content, file_path)) return;
              violation_count++;
              const color = rule.severity === "HERESY" ? COLORS.RED : COLORS.YELLOW;
              if (rule.severity === "HERESY") has_heresy_violation = true;
              console.log(`${color}[${rule.severity}] ${relative_path}:${line_index + 1}${COLORS.RESET}`);
              console.log(`  ${rule.message}`);
              console.log(`  Code: ${line_content.trim().substring(0, 100)}\n`);
            }
          });
        }

        if (rule.validate && !rule.regex && !rule.audit_path) {
          const validation_result = rule.validate(file_content, file_path);
          const is_valid = typeof validation_result === "object" ? validation_result.valid : validation_result;
          const reported_errors = typeof validation_result === "object" ? validation_result.errors : [];

          if (!is_valid) {
            violation_count++;
            const color = rule.severity === "HERESY" ? COLORS.RED : COLORS.YELLOW;
            if (rule.severity === "HERESY") has_heresy_violation = true;

            console.log(`${color}[${rule.severity}] ${relative_path}${COLORS.RESET}`);
            console.log(`  ${rule.message}`);
            reported_errors.forEach((error_message) => console.log(`    - ${error_message}`));
            console.log("");
          }
        }
      }
    }
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`📊 SCAN COMPLETE: ${scanned_count} assets verified.`);
  console.log(`🔥 VIOLATIONS: ${violation_count}`);
  console.log("--------------------------------------------------------------------------------\n");

  if (has_heresy_violation) {
    console.log(`${COLORS.RED}❌ REJECTED: Heresy detected. Gate closed.${COLORS.RESET}`);
    if (exit_on_heresy) process.exit(1);
  } else {
    console.log(`${COLORS.GREEN}✅ RESONANT: All protocols align. Proceeding.${COLORS.RESET}`);
  }

  return { scanned: scanned_count, violations: violation_count, has_heresy: has_heresy_violation };
}

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Extracted from workspace.js §1–§2 as the shared audit I/O home for rules/* + audit.js.
 */
