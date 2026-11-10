/**
 * .agents/skills/local-scripts/scripts/rules/hygiene.js
 * 🧹 HYGIENE RULE PACK — code/structural, lexical, legislative + backlog-debt rules.
 *
 * Moved verbatim from workspace.js §4 (single rule home for audit.js).
 * Only change: path constants + safe_stat_sync import from ../lib/io.js.
 */

import fs from "fs";
import path from "path";
import { ROOT_DIRECTORY, PROJECT_ROOT_DIRECTORY, SKILLS_DIRECTORY, TEMPLATES_DIRECTORY, safe_stat_sync } from "../lib/io.js";

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
    .replace(/[🌀-🛿😀-🙏☀-⛿✀-➿]/gu, "")
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
    message: "⚠️ Unresolved Agentic Debt (#TODO-AI) found. Ensure it is registered in ROADMAP.md.",
    validate: (line_content, file_path) =>
      !file_path.includes("warden.js") && !file_path.includes("workspace.js") && !file_path.includes("SKILL.md") && !file_path.includes("rules.js"),
  },
  {
    id: "PROJECT_BACKLOG_SYNC",
    severity: "ADVICE",
    validate: (file_content, file_path) => {
      const relative_path = path.relative(ROOT_DIRECTORY, file_path).replace(/\\/g, "/");
      if (relative_path === "ROADMAP.md") {
        return file_content.includes("[ ]") || file_content.includes("[x]");
      }
      return true;
    },
    message: "💡 Roadmap appears exhausted or lacks open items. Sync with active engineering goals.",
  },
];

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Moved verbatim from workspace.js §4 into the hygiene rule pack for audit.js.
 */
