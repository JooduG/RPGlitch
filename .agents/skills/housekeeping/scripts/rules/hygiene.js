/**
 * .agents/skills/housekeeping/scripts/rules/hygiene.js
 * 🧹 HYGIENE RULE PACK - code/structural, lexical, legislative + backlog-debt rules.
 *
 * Moved verbatim from workspace.js §4 (single rule home for audit.js).
 */

import fs from "fs";
import path from "path";
import { ROOT_DIRECTORY, SKILLS_DIRECTORY, safe_stat_sync } from "../lib/io.js";

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

// Filenames the kebab-case rule must never flag: dotfiles are tool config
// (audited separately), and these exact spellings are mandated by tooling.
const KEBAB_FILENAME_ALLOWLIST = new Set(["fixtures.test-util.js"]);

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
      if (entry_name.startsWith(".") || KEBAB_FILENAME_ALLOWLIST.has(entry_name)) return true;
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

    if (!/^---\r?\n[\s\S]+?\r?\n---/.test(file_content)) {
      record_issue("🛑 HERESY", "Mandatory YAML frontmatter block is missing.", 30);
    }

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

export const legislative_debt_rules = [
  {
    id: "SKILL_TEMPLATE_ALIGNMENT",
    severity: "HERESY",
    message: "🚨 SKILL file deviates from Sovereign Template structure.",
    validate: (file_content, file_path) => {
      if (!file_path.endsWith("SKILL.md")) return true;
      const relative_path = path.relative(ROOT_DIRECTORY, file_path).replace(/\\/g, "/");
      if (!relative_path.startsWith(".agents/skills/")) return true;
      const skill_name = path.basename(path.dirname(file_path));
      return audit_skill_directory(skill_name);
    },
  },
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
 * 2026-11-21: Removed dead TEMPLATES_DIRECTORY / get_template_structure scaffolding while preserving YAML frontmatter, subfolder, placeholder, and line-cap checks.
 * 2026-11-10: Moved verbatim from workspace.js §4 into the hygiene rule pack for audit.js.
 */
