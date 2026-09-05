/**
 * .agents/skills/local-scripts/scripts/workspace.js
 * 🌐 UNIFIED WORKSPACE HYGIENE & GOVERNANCE ENGINE
 *
 * The sovereign operational engine for repository health, deconstructed into two
 * primary conceptual pipelines:
 *
 *   1. WORKSPACE SYNCHRONIZER (`sync`):
 *      Reconciles `ignores.master.json` into all 10 configuration layers:
 *      ESLint, Git, Gemini, Antigravity, linters, VS Code settings, JSConfig, Vitest.
 *
 *   2. HYGIENE & DEBT AUDITOR (`hygiene`):
 *      Deep semantic audit across three key dimensions:
 *        A. Code & Structural Hygiene:
 *           - DOMPurify SANITIZE_NAMED_PROPS compliance (clobbering prevention)
 *           - Svelte {@html ...} escapes outside Typewriter.svelte
 *           - Debug statements (console.log, debugger, alert)
 *           - Potential secret and credential leaks
 *        B. Lexical Hygiene:
 *           - Svelte PascalCase components (N-LANG-001)
 *           - kebab-case source files and test-subject association (N-LANG-002)
 *           - kebab-case and ALL_CAPS directory conventions (N-LANG-003)
 *           - Ban on legacy 'var' declaration (N-LANG-VAR)
 *           - Anti-abbreviation scanner for prohibited clipped stems (N-LANG-ABBREVIATION)
 *        C. Legislative & Backlog Debt:
 *           - Unresolved agentic debt tags (#TODO-AI)
 *           - Sovereign template structure validation (SKILL, RULE, WORKFLOW)
 *           - Temporal Mission Board backlog synchronization (tasks/PRESENT.md)
 *
 *   3. ALL-IN-ONE HYGIENE PASS (`all` / default):
 *      Executes both the Workspace Synchronizer and the Hygiene & Debt Auditor sequentially.
 *
 * CLI Usage:
 *   node workspace.js sync      # Reconciles ignore files across repository layers
 *   node workspace.js hygiene   # Executes deep code, lexical, and legislative audit
 *   node workspace.js all       # Runs full sync followed by complete hygiene audit (default)
 */

import fs from "fs";
import path from "path";
import ignore from "ignore";
import { fileURLToPath } from "url";

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const CURRENT_DIRECTORY = path.dirname(CURRENT_FILE_PATH);
const ROOT_DIRECTORY = process.cwd();
const PROJECT_ROOT_DIRECTORY = path.join(CURRENT_DIRECTORY, "..", "..", "..", "..");
const SKILLS_DIRECTORY = path.join(PROJECT_ROOT_DIRECTORY, ".agents", "skills");

let TEMPLATES_DIRECTORY = path.join(CURRENT_DIRECTORY, "..", "templates");
if (!fs.existsSync(TEMPLATES_DIRECTORY)) {
  const alternative_templates_path = path.join(ROOT_DIRECTORY, ".agents", "skills", "directives", "templates");
  if (fs.existsSync(alternative_templates_path)) {
    TEMPLATES_DIRECTORY = alternative_templates_path;
  }
}

// =================================================================================================
// 1. ANSI COLOR CODES & REPORTING UTILITIES
// =================================================================================================

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

// =================================================================================================
// 2. IGNORE-AWARE SCANNER & EXECUTION RUNNER
// =================================================================================================

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

// =================================================================================================
// 3. PIPELINE 1: WORKSPACE SYNCHRONIZER
// =================================================================================================

/**
 * Reconciles ignore files across all repository layers based on ignores.master.json.
 */
export function sync_workspace() {
  console.log("\n================================================================================");
  console.log("🎨  PIPELINE 1: WORKSPACE SYNCHRONIZER");
  console.log("================================================================================\n");

  const master_ignores_path = path.join(ROOT_DIRECTORY, "ignores.master.json");
  if (!fs.existsSync(master_ignores_path)) {
    console.error("❌ ignores.master.json not found. Aborting sync.");
    return;
  }

  const master_configuration = JSON.parse(fs.readFileSync(master_ignores_path, "utf8"));
  const common_patterns = master_configuration.common || [];

  console.log("📡 Reconciling Ignore Layers:");

  // 1a. ESLint Configuration
  const eslint_configuration_path = path.join(ROOT_DIRECTORY, "eslint.config.js");
  if (fs.existsSync(eslint_configuration_path)) {
    const eslint_content = fs.readFileSync(eslint_configuration_path, "utf8");
    const start_marker = "// @agent:ignore-start";
    const end_marker = "// @agent:ignore-end";
    const start_index = eslint_content.indexOf(start_marker);
    const end_index = eslint_content.indexOf(end_marker);

    if (start_index !== -1 && end_index !== -1) {
      const updated_eslint_content =
        eslint_content.slice(0, start_index + start_marker.length) +
        "\n    ignores: " +
        JSON.stringify(common_patterns, null, 2).replace(/\n/g, "\n    ") +
        ",\n    " +
        eslint_content.slice(end_index);
      fs.writeFileSync(eslint_configuration_path, updated_eslint_content);
      console.log("✅ Synced eslint.config.js");
    }
  }

  // 1b. Line-Based Ignore Files
  const line_based_files = [
    { file: ".gitignore", patterns: [...common_patterns, ...(master_configuration.gitignore || [])] },
    { file: ".geminiignore", patterns: [...common_patterns, ...(master_configuration.geminiignore || [])] },
    { file: ".antigravityignore", patterns: [...common_patterns, ...(master_configuration.antigravityignore || [])] },
    { file: ".htmlhintignore", patterns: [...common_patterns, ...(master_configuration.linters?.htmlhint || [])] },
    { file: ".markdownlintignore", patterns: [...common_patterns, ...(master_configuration.linters?.markdownlint || [])] },
    { file: ".prettierignore", patterns: [...common_patterns, ...(master_configuration.linters?.prettier || [])] },
    { file: ".stylelintignore", patterns: [...common_patterns, ...(master_configuration.linters?.stylelint || [])] },
  ];

  line_based_files.forEach((line_based_entry) => {
    const file_path = path.join(ROOT_DIRECTORY, line_based_entry.file);
    fs.writeFileSync(file_path, line_based_entry.patterns.join("\n") + "\n");
    console.log(`✅ Synced ${line_based_entry.file}`);
  });

  // 1c. VSCode Settings
  const vscode_settings_path = path.join(ROOT_DIRECTORY, ".vscode", "settings.json");
  if (fs.existsSync(vscode_settings_path) && master_configuration.vscode) {
    let settings_object = {};
    try {
      settings_object = JSON.parse(fs.readFileSync(vscode_settings_path, "utf8"));
    } catch {
      console.warn("⚠️ Could not parse .vscode/settings.json, initializing clean object.");
    }

    if (master_configuration.vscode["files.exclude"]) {
      settings_object["files.exclude"] = master_configuration.vscode["files.exclude"];
    }

    const vscode_directory = path.dirname(vscode_settings_path);
    if (!fs.existsSync(vscode_directory)) fs.mkdirSync(vscode_directory, { recursive: true });

    fs.writeFileSync(vscode_settings_path, JSON.stringify(settings_object, null, 2) + "\n");
    console.log("✅ Synced .vscode/settings.json");
  }

  // 1d. JSConfig Configuration
  const jsconfig_path = path.join(ROOT_DIRECTORY, "jsconfig.json");
  if (fs.existsSync(jsconfig_path) && master_configuration.jsconfig?.exclude) {
    try {
      const jsconfig_object = JSON.parse(fs.readFileSync(jsconfig_path, "utf8"));
      jsconfig_object.exclude = master_configuration.jsconfig.exclude;
      fs.writeFileSync(jsconfig_path, JSON.stringify(jsconfig_object, null, 2) + "\n");
      console.log("✅ Synced jsconfig.json");
    } catch (parse_error) {
      console.warn(`⚠️ Could not sync jsconfig.json: ${parse_error.message}`);
    }
  }

  // 1e. Vitest Configuration
  const vitest_configuration_path = path.join(ROOT_DIRECTORY, "vitest.config.js");
  if (fs.existsSync(vitest_configuration_path) && master_configuration.vitest?.exclude) {
    const vitest_content = fs.readFileSync(vitest_configuration_path, "utf8");
    const start_marker = "// @agent:ignore-start";
    const end_marker = "// @agent:ignore-end";
    const start_index = vitest_content.indexOf(start_marker);
    const end_index = vitest_content.indexOf(end_marker);

    if (start_index !== -1 && end_index !== -1) {
      const updated_vitest_content =
        vitest_content.slice(0, start_index + start_marker.length) +
        "\n    exclude: " +
        JSON.stringify(master_configuration.vitest.exclude, null, 2).replace(/\n/g, "\n    ") +
        ",\n    " +
        vitest_content.slice(end_index);
      fs.writeFileSync(vitest_configuration_path, updated_vitest_content);
      console.log("✅ Synced vitest.config.js");
    }
  }

  console.log("\n================================================================================\n");
}

// =================================================================================================
// 4. PIPELINE 2: HYGIENE & DEBT AUDITOR RULES
// =================================================================================================

// --- Group A: Code & Structural Hygiene Rules ---
export const code_hygiene_rules = [
  {
    id: "SECURITY_SVELTE_HTML",
    severity: "HERESY",
    regex: /\{@html\s+/,
    message: "🚨 Svelte {@html ...} Compliance Violation! Use `use:safe_html` action to prevent DOM Clobbering in static components.",
    validate: (line_content, file_path) => path.basename(file_path) !== "Typewriter.svelte",
  },
  {
    id: "SECURITY_DEBUG_LOG",
    severity: "DEBT",
    regex: /console\.log\(|alert\(|debugger;/,
    message: "⚠️ Debug statement detected. Please purge before commit.",
    validate: (line_content, file_path) => {
      const normalized = file_path.replace(/\\/g, "/");
      return !normalized.endsWith(".test.js") && !normalized.includes("/scripts/");
    },
  },
  {
    id: "SECURITY_SECRET_LEAK",
    severity: "HERESY",
    regex: /\b(api_?key|auth_?token|secret_?key|password)\b\s*[:=]\s*["'][^"']{8,}/i,
    message: "🚨 Potential Secret Leak! Verify that variables are environment-bound and NOT hardcoded.",
    validate: (line_content) => !line_content.includes("process.env"),
  },
  {
    id: "SECURITY_DOMPURIFY_CONFIG",
    severity: "HERESY",
    regex: /DOMPurify\.sanitize\s*\(/,
    message: "🚨 DOMPurify Compliance Violation! You MUST include SANITIZE_NAMED_PROPS: true to prevent DOM Clobbering (Rule 06).",
    validate: (() => {
      const file_cache = new Map();
      return (line_content, file_path) => {
        const file_body = fs.readFileSync(file_path, "utf-8");
        const lines_array = file_body.split("\n");
        const last_index = file_cache.get(file_path) ?? -1;
        const line_index = lines_array.indexOf(line_content, last_index + 1);
        file_cache.set(file_path, line_index);
        if (line_index === -1) return true;
        const surrounding_context = lines_array.slice(line_index, line_index + 10).join("\n");
        return !surrounding_context.includes("SANITIZE_NAMED_PROPS: true");
      };
    })(),
  },
];

// --- Group B: Lexical Hygiene Rules ---
const REGEX_KEBAB = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const REGEX_PASCAL = /^[A-Z][a-zA-Z0-9]+$/;
const REGEX_ALL_CAPS = /^[A-Z][A-Z0-9_]*$/;
const REGEX_VAR = /\bvar\s+[a-zA-Z_$][a-zA-Z0-9_$]*/;

const STRIP_SUFFIXES = [".template", ".svelte", ".test", ".spec", ".manual", ".unit", ".integration", ".d"];
const TEST_SUFFIXES = [".test", ".spec", ".manual", ".unit", ".integration"];
const SUBJECT_EXTENSIONS = [".svelte", ".svelte.js", ".svelte.ts", ".js", ".ts"];

function extract_base_stem(file_name) {
  const without_extension = file_name.slice(0, file_name.length - path.extname(file_name).length);
  let base_stem = without_extension;
  let has_changed = true;
  while (has_changed) {
    has_changed = false;
    for (const suffix of STRIP_SUFFIXES) {
      if (base_stem.endsWith(suffix)) {
        base_stem = base_stem.slice(0, base_stem.length - suffix.length);
        has_changed = true;
        break;
      }
    }
  }
  return base_stem;
}

function has_test_subject(file_name, parent_directory) {
  const extension = path.extname(file_name);
  const without_extension = file_name.slice(0, file_name.length - extension.length);
  let subject_stem = null;
  for (const suffix of TEST_SUFFIXES) {
    if (without_extension.endsWith(suffix)) {
      subject_stem = without_extension.slice(0, without_extension.length - suffix.length);
      break;
    }
  }
  if (!subject_stem) return false;
  return SUBJECT_EXTENSIONS.some((ext) => fs.existsSync(path.join(parent_directory, subject_stem + ext)));
}

export const lexical_hygiene_rules = [
  {
    id: "N-LANG-001",
    severity: "DEBT",
    message: "Svelte component must be PascalCase.",
    audit_path: (entry_name, is_directory) => {
      if (is_directory || !entry_name.endsWith(".svelte") || entry_name.includes(".template.")) return true;
      const base_stem = extract_base_stem(entry_name);
      return REGEX_PASCAL.test(base_stem);
    },
  },
  {
    id: "N-LANG-002",
    severity: "DEBT",
    message: "File must be kebab-case.",
    audit_path: (entry_name, is_directory, relative_path) => {
      if (is_directory || entry_name.includes("RPGlitch") || entry_name.startsWith("@") || entry_name.startsWith("$")) return true;
      if ((entry_name.endsWith(".svelte") || entry_name.endsWith(".svelte.js")) && !entry_name.includes(".template.")) return true;
      const base_stem = extract_base_stem(entry_name);
      if (REGEX_ALL_CAPS.test(base_stem)) return true;

      const parent_directory = path.dirname(path.join(ROOT_DIRECTORY, relative_path));
      if (has_test_subject(entry_name, parent_directory)) return true;

      return REGEX_KEBAB.test(base_stem);
    },
  },
  {
    id: "N-LANG-003",
    severity: "DEBT",
    message: "Folder must be kebab-case or All-Caps abbreviation.",
    audit_path: (entry_name, is_directory) => {
      if (!is_directory || entry_name.startsWith(".") || entry_name.startsWith("@") || entry_name.startsWith("$")) return true;
      return REGEX_KEBAB.test(entry_name) || REGEX_ALL_CAPS.test(entry_name);
    },
  },
  {
    id: "N-LANG-VAR",
    severity: "HERESY",
    message: "Forbidden usage of 'var' detected.",
    regex: REGEX_VAR,
    validate: (line_content, file_path) => Boolean(file_path.match(/\.(js|ts|svelte)$/)),
  },
];

// --- Group C: Legislative & Backlog Debt Rules ---
const clean_header_label = (raw_header_text) => {
  return raw_header_text
    .replace(/[(\s#]_?(Mandatory|Optional)_?([)\s#\n]|$)/gi, "")
    .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .trim();
};

const is_header_match = (template_header, actual_level, actual_text) => {
  if (template_header.level !== actual_level) return false;

  const actual_clean = clean_header_label(actual_text);
  const template_clean = template_header.cleanLabel;

  if (template_header.isPlaceholder) {
    const parts = template_clean.split(/\{\{[^}]+\}\}/);
    const escaped_parts = parts.map((part) => part.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
    const regex = new RegExp("^" + escaped_parts.join(".*") + "$", "i");
    const full_actual_text = actual_text.trim();
    if (regex.test(full_actual_text) || regex.test(actual_clean)) {
      return true;
    }
  }

  const template_lower = template_clean.toLowerCase();
  const actual_lower = actual_clean.toLowerCase();
  return actual_lower === template_lower || actual_lower.startsWith(template_lower) || template_lower.startsWith(actual_lower);
};

const strip_code_blocks = (raw_content) => raw_content.replace(/```[\s\S]*?```/g, "");

export const get_template_structure = (template_type) => {
  if (!fs.existsSync(TEMPLATES_DIRECTORY)) return { fields: [], headers: [] };
  const template_file_path = path.join(TEMPLATES_DIRECTORY, `${template_type}.template.md`);
  if (!fs.existsSync(template_file_path)) return { fields: [], headers: [] };

  const raw_template_content = fs.readFileSync(template_file_path, "utf-8");
  const content_without_code = strip_code_blocks(raw_template_content);

  const frontmatter_fields = [];
  const frontmatter_match = raw_template_content.match(/^---\r?\n([\s\S]+?)\r?\n---/m);
  if (frontmatter_match) {
    const frontmatter_lines = frontmatter_match[1].split(/\r?\n/);
    for (const single_line of frontmatter_lines) {
      const match = single_line.match(/^(\w+):/);
      if (match) {
        frontmatter_fields.push({
          name: match[1],
          isOptional: /[(\s#]_?Optional_?([)\s#\n]|$)/i.test(single_line),
        });
      }
    }
  }

  const section_headers = [];
  const header_matches = content_without_code.matchAll(/^(#|##|###)\s+(.+)$/gm);
  for (const match of header_matches) {
    const heading_level = match[1].length;
    const heading_text = match[2].trim();
    section_headers.push({
      level: heading_level,
      text: `${match[1]} ${heading_text}`,
      cleanLabel: clean_header_label(heading_text),
      isOptional: /[(\s#]_?Optional_?([)\s#\n]|$)/i.test(heading_text),
      isPlaceholder: /\{\{/.test(heading_text),
    });
  }

  return { fields: frontmatter_fields, headers: section_headers };
};

export const validate_against_structure = (document_content, template_structure, report_callback) => {
  if (template_structure.fields.length === 0 && template_structure.headers.length === 0) return;
  const content_without_code = strip_code_blocks(document_content);

  const frontmatter_match = document_content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!frontmatter_match) {
    report_callback("HERESY", "🚨 Mandatory YAML frontmatter block is missing.");
    return;
  }

  const frontmatter_lines = frontmatter_match[1].split(/\r?\n/);
  const actual_fields = {};
  for (const single_line of frontmatter_lines) {
    const match = single_line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      actual_fields[match[1]] = match[2]
        .trim()
        .replace(/^["']|["']$/g, "")
        .split(" #")[0]
        .trim();
    }
  }

  const template_field_names = new Set(template_structure.fields.map((field) => field.name));
  for (const field of template_structure.fields) {
    if (!field.isOptional && !actual_fields[field.name]) {
      report_callback("DEBT", `⚠️ Missing mandatory frontmatter field: "${field.name}".`);
    }
  }

  for (const field_name in actual_fields) {
    if (!template_field_names.has(field_name)) {
      report_callback("HERESY", `🚨 Illegal frontmatter field detected: "${field_name}". Not in Sovereign Template.`);
    }
  }

  const header_matches = content_without_code.matchAll(/^(#|##|###)\s+(.+)$/gm);
  const actual_headers = Array.from(header_matches).map((match) => ({
    level: match[1].length,
    text: match[2].trim(),
  }));

  for (const template_header of template_structure.headers) {
    const has_matching_header = actual_headers.some((actual_header) => is_header_match(template_header, actual_header.level, actual_header.text));
    if (!has_matching_header && !template_header.isOptional) {
      report_callback("ADVICE", `💡 Missing mandatory section: "${"#".repeat(template_header.level)} ${template_header.cleanLabel}".`);
    }
  }

  for (const actual_header of actual_headers) {
    if (actual_header.level > 2) continue;
    const is_recognized = template_structure.headers.some((template_header) =>
      is_header_match(template_header, actual_header.level, actual_header.text),
    );
    if (!is_recognized) {
      report_callback(
        "HERESY",
        `🚨 Illegal section detected: "${"#".repeat(actual_header.level)} ${actual_header.text}". Not in Sovereign Template.`,
      );
    }
  }
};

const audit_skill_directory = (skill_name) => {
  const skill_directory_path = path.join(SKILLS_DIRECTORY, skill_name);
  const skill_markdown_path = path.join(skill_directory_path, "SKILL.md");

  const audit_report = { score: 120, issues: [] };
  const record_issue = (severity, message, deduction = 10) => audit_report.issues.push({ severity, message, deduction });

  if (!fs.existsSync(skill_directory_path)) {
    return { valid: false, errors: ["Skill directory not found"] };
  }

  if (!fs.existsSync(skill_markdown_path)) {
    record_issue("🛑 HERESY", "Missing SKILL.md", 50);
  } else {
    const file_content = fs.readFileSync(skill_markdown_path, "utf-8");
    const content_without_code = file_content.replace(/```[\s\S]*?```/g, "");

    const template_structure = get_template_structure("SKILL");
    validate_against_structure(file_content, template_structure, (severity, message) => {
      record_issue(severity === "HERESY" ? "🛑 HERESY" : "🔥 CRITICAL", message, severity === "HERESY" ? 30 : 15);
    });

    const allowed_subfolders = ["scripts", "assets", "templates", "data", "references", "rules"];
    const current_subfolders = fs.readdirSync(skill_directory_path).filter((entry) => {
      const stats = safe_stat_sync(path.join(skill_directory_path, entry));
      return stats && stats.isDirectory();
    });

    current_subfolders.forEach((directory_name) => {
      if (!allowed_subfolders.includes(directory_name) && !directory_name.startsWith(".")) {
        record_issue("🛑 HERESY", `Disallowed subfolder: ${directory_name}/. Use ONLY scripts, assets, references, rules, data, or templates.`, 50);
      }
    });

    const old_placeholders = content_without_code.match(/\[[A-Z][A-Z0-9_/]{2,}\](?!\()/g) || [];
    const new_placeholders = content_without_code.match(/\{\{[^}]+\}\}/g) || [];
    const all_placeholders = [...old_placeholders, ...new_placeholders];
    const invalid_placeholders = all_placeholders.filter(
      (placeholder) => !placeholder.includes("file:///") && placeholder.length > 2 && placeholder.length < 100,
    );

    if (invalid_placeholders.length > 3) {
      record_issue("⚠️ HIGH", `Unfilled placeholders detected: ${invalid_placeholders.join(", ")}`, 15);
    }

    const line_count = file_content.split("\n").length;
    if (line_count > 600) {
      record_issue("⚠️ HIGH", `Context Bloat: ${line_count} lines`, 15);
    }
  }

  audit_report.score = Math.max(
    0,
    audit_report.issues.reduce((accumulator, issue) => accumulator - issue.deduction, audit_report.score),
  );

  return {
    valid: audit_report.score >= 110,
    errors: audit_report.issues.map((issue) => `${issue.severity}: ${issue.message} (-${issue.deduction})`),
    score: audit_report.score,
  };
};

const create_template_rule = (rule_id, template_type) => ({
  id: rule_id,
  severity: "HERESY",
  message: `🚨 ${template_type} file deviates from Sovereign Template structure.`,
  validate: (file_content, file_path) => {
    if (!file_path.endsWith(".md")) return true;
    const relative_path = path.relative(PROJECT_ROOT_DIRECTORY, file_path).replace(/\\/g, "/");
    const target_directory_prefix = `.agents/${template_type.toLowerCase()}s/`;
    if (!relative_path.startsWith(target_directory_prefix)) return true;

    const validation_errors = [];
    const template_structure = get_template_structure(template_type);
    validate_against_structure(file_content, template_structure, (severity, message) => {
      validation_errors.push(`${severity === "HERESY" ? "🛑" : "⚠️"} ${message}`);
    });

    return { valid: validation_errors.length === 0, errors: validation_errors };
  },
});

export const legislative_debt_rules = [
  {
    id: "SKILL_TEMPLATE_ALIGNMENT",
    severity: "HERESY",
    message: "🚨 SKILL file deviates from Sovereign Template structure.",
    validate: (file_content, file_path) => {
      if (!file_path.endsWith("SKILL.md")) return true;
      const relative_path = path.relative(PROJECT_ROOT_DIRECTORY, file_path).replace(/\\/g, "/");
      if (!relative_path.startsWith(".agents/skills/")) return true;
      const skill_name = path.basename(path.dirname(file_path));
      return audit_skill_directory(skill_name);
    },
  },
  create_template_rule("RULE_TEMPLATE_ALIGNMENT", "RULE"),
  create_template_rule("WORKFLOW_TEMPLATE_ALIGNMENT", "WORKFLOW"),
  {
    id: "PROJECT_TODO_AI_TAG",
    severity: "DEBT",
    regex: /#TODO-AI/,
    message: "⚠️ Unresolved Agentic Debt (#TODO-AI) found. Ensure it is registered in tasks/PRESENT.md.",
    validate: (line_content, file_path) =>
      !file_path.includes("warden.js") && !file_path.includes("workspace.js") && !file_path.includes("SKILL.md") && !file_path.includes("rules.js"),
  },
  {
    id: "PROJECT_BACKLOG_SYNC",
    severity: "ADVICE",
    validate: (file_content, file_path) => {
      const relative_path = path.relative(ROOT_DIRECTORY, file_path).replace(/\\/g, "/");
      if (!relative_path.startsWith("tasks/")) return true;
      if (relative_path === "tasks/PRESENT.md") {
        const match = file_content.match(/active_track:\s*([^\s\n]+)/);
        if (match && match[1] && match[1] !== "null" && match[1] !== "none") {
          const track_file_path = path.join(ROOT_DIRECTORY, "tasks", "future", `${match[1]}.md`);
          if (fs.existsSync(track_file_path)) {
            const track_content = fs.readFileSync(track_file_path, "utf-8");
            return track_content.includes("[ ]") || track_content.includes("[~]");
          }
        }
        return true;
      }
      return file_content.includes("[ ]") || file_content.includes("[~]");
    },
    message: "💡 Task file appears exhausted or lacks open items. Sync with the backlog.",
  },
];

/**
 * Executes the complete Hygiene & Debt Auditor across code, lexical, and legislative dimensions.
 *
 * @param {boolean} [exit_on_heresy=true]
 */
export function audit_hygiene(exit_on_heresy = true) {
  const source_directory = path.join(ROOT_DIRECTORY, "src");
  const skills_directory = path.join(ROOT_DIRECTORY, ".agents/skills");
  const workflows_directory = path.join(ROOT_DIRECTORY, ".agents/workflows");
  const tasks_directory = path.join(ROOT_DIRECTORY, "tasks");

  console.log("\n================================================================================");
  console.log("🛡️  PIPELINE 2: UNIFIED HYGIENE & DEBT AUDITOR");
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
    title: "📜 PHASE C: LEGISLATIVE & BACKLOG DEBT (Templates, TODOs, Active Track)",
    root_directory: ROOT_DIRECTORY,
    scan_directories: [source_directory, skills_directory, workflows_directory, tasks_directory],
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

// =================================================================================================
// 5. CLI DISPATCHER
// =================================================================================================

const is_main_execution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (is_main_execution) {
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
}

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-05: Deconstructed into two sovereign pipelines: Workspace Synchronizer (sync) and Hygiene & Debt Auditor (hygiene).
 * 2026-09-05: Purged legacy subcommands (security, nomenclature, project) under P4 Pre-Beta Purity.
 * 2026-09-05: Enforced strict zero-abbreviation domain nomenclature and Universal File Architecture.
 */
