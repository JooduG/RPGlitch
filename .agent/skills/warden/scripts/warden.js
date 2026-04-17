/**
 * 🕵️ warden.js
 * The Sovereign Auditor Engine (The Reflex)
 */
import fs from "fs";
import ignore from "ignore";
import path from "path";
import { safeStatSync } from "./safe-fs.js";

// 1. Import Domain Rules (Updated Paths)
import { cssRules } from "../../css/scripts/audit-css.js";
import { rule_rules, workflow_rules } from "../../directives/scripts/audit-templates.js";
import { skill_rules } from "../../directives/scripts/audit-skills.js";
import { scan_nomenclature } from "../../directives/scripts/audit-nomenclature.js";
import { projectRules } from "./warden-project.js";
import { svelteRules } from "../../svelte/scripts/audit-svelte.js";
import { securityRules } from "../../security-and-hardening/scripts/audit-security.js";

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");
const SKILLS_DIR = path.join(ROOT_DIR, ".agent/skills");
const RULES_DIR = path.join(ROOT_DIR, ".agent/rules");
const WORKFLOWS_DIR = path.join(ROOT_DIR, ".agent/workflows");

// Load .gitignore
const ig = ignore();
const gitignorePath = path.join(ROOT_DIR, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  ig.add(fs.readFileSync(gitignorePath, "utf-8"));
}

// 2. ANSI Colors
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";

const SEVERITY_LEVELS = {
  HERESY: { color: RED, label: "HERESY" },
  DEBT: { color: YELLOW, label: "DEBT" },
  ADVICE: { color: CYAN, label: "ADVICE" },
};

/**
 * 🕵️ MODULAR AUDITOR ENGINE (The Reflex)
 */
class Auditor {
  constructor() {
    this.results = [];
    this.stats = { scanned: 0, violations: 0 };
    this.rules = {
      ".svelte": svelteRules,
      ".css": cssRules,
      ".js": [...securityRules, ...projectRules],
      ".md": projectRules,
    };
    this.is_skills_active = true;
    this.is_rules_active = true;
    this.is_workflows_active = true;
    this.is_project_active = true;
    this.is_names_active = true;
  }

  scan(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");

      if (ig.ignores(relPath) || relPath.includes("node_modules")) return;

      const stat = safeStatSync(fullPath);
      if (!stat) return;

      if (stat.isDirectory()) {
        this.scan(fullPath);
      } else {
        this.auditFile(fullPath);
      }
    });
  }

  auditFile(filePath) {
    const ext = path.extname(filePath);
    const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

    if (relPath.includes("audit-") || relPath.endsWith("tokens.css")) return;

    let rules = [];

    // 1. Skill/Template Rules
    if (
      this.is_skills_active &&
      relPath.startsWith(".agent/skills") &&
      relPath.endsWith("SKILL.md")
    ) {
      rules.push(...skill_rules);
    }
    if (this.is_rules_active && relPath.startsWith(".agent/rules") && relPath.endsWith(".md")) {
      rules.push(...rule_rules);
    }
    if (
      this.is_workflows_active &&
      relPath.startsWith(".agent/workflows") &&
      relPath.endsWith(".md")
    ) {
      rules.push(...workflow_rules);
    }

    // 2. Extension-based rule matching
    if (this.rules[ext]) {
      rules.push(...this.rules[ext]);
    }

    if (rules.length === 0) return;

    this.stats.scanned++;
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    rules.forEach((rule) => {
      if (!this.is_project_active && projectRules.includes(rule)) return;

      // 1. Regex Match (Line-by-Line)
      if (rule.regex) {
        lines.forEach((line, i) => {
          if (rule.regex.test(line)) {
            if (rule.validate && !rule.validate(line, filePath)) return;
            this.reportViolation(rule, filePath, i + 1, line.trim());
          }
        });
      }

      // 2. Global Content Match (File-Wide)
      if (rule.validate && !rule.regex) {
        const result = rule.validate(content, filePath);
        const isValid = typeof result === "object" ? result.valid : result;
        const errors = typeof result === "object" ? result.errors : [];

        if (!isValid) {
          this.reportViolation(rule, filePath, 0, "[File Structure]", errors);
        }
      }
    });
  }

  reportViolation(rule, filePath, line, code, errors = []) {
    this.stats.violations++;
    const sev = SEVERITY_LEVELS[rule.severity] || SEVERITY_LEVELS.ADVICE;
    const relPath = path.relative(ROOT_DIR, filePath);

    this.results.push({
      id: rule.id,
      severity: rule.severity,
      file: relPath,
      line,
      message: rule.message,
      errors,
    });

    console.log(`${sev.color}[${sev.label}] ${relPath}${line ? `:${line}` : ""}${RESET}`);
    console.log(`  ${rule.message}`);

    if (code && code !== "[File Structure]") {
      console.log(`  Code: ${code.substring(0, 100).trim()}`);
    }

    if (errors && errors.length > 0) {
      errors.forEach((err) => console.log(`    - ${err}`));
    }
    console.log("");
  }

  summary() {
    console.log("------------------------");
    console.log(`📊 SCAN COMPLETE: ${this.stats.scanned} files verified.`);
    console.log(`🔥 VIOLATIONS: ${this.stats.violations}`);
    console.log("------------------------\n");

    if (this.results.some((r) => r.severity === "HERESY")) {
      console.log(`${RED}❌ REJECTED: Heresy detected in Sovereign logic. Gate closed.${RESET}`);
      process.exit(1);
    } else {
      console.log(`${GREEN}✅ RESONANT: All protocols align. Proceeding.${RESET}`);
    }
  }
}

/**
 * 3. CLI Configuration lookup table
 */
const FILTERS = {
  "--names": {
    names: true,
    skills: false,
    rules: false,
    workflows: false,
    project: false,
    extRules: {},
  },
  "--svelte": {
    names: false,
    skills: false,
    rules: false,
    workflows: false,
    extRules: { ".svelte": svelteRules },
  },
  "--css": {
    names: false,
    skills: false,
    rules: false,
    workflows: false,
    extRules: { ".css": cssRules },
  },
  "--security": {
    names: false,
    skills: false,
    rules: false,
    workflows: false,
    extRules: { ".js": securityRules },
  },
  "--skills": {
    names: false,
    skills: true,
    rules: false,
    workflows: false,
    project: false,
    extRules: {},
  },
  "--rules": {
    names: false,
    skills: false,
    rules: true,
    workflows: false,
    project: false,
    extRules: {},
  },
  "--workflows": {
    names: false,
    skills: false,
    rules: false,
    workflows: true,
    project: false,
    extRules: {},
  },
  "--agent": {
    names: false,
    skills: true,
    rules: true,
    workflows: true,
    project: false,
    extRules: {},
  },
  "--project": {
    names: false,
    skills: false,
    rules: false,
    workflows: false,
    project: true,
    extRules: { ".js": projectRules, ".md": projectRules },
  },
  "--todo": {
    names: false,
    skills: false,
    rules: false,
    workflows: false,
    project: false,
    extRules: {
      ".js": securityRules.filter((r) => r.id === "SECURITY_DEBUG_LOG"),
      ".svelte": svelteRules.filter((r) => r.id === "S_RUNE_DEBUG"),
    },
  },
};

const auditor = new Auditor();
const args = process.argv.slice(2);

console.log("\n================================================================================");
console.log("🛡️  WARDEN: QUALITY GATE ENGINE");
console.log("================================================================================\n");

// Apply Filters if present
const filterArgs = args.filter((arg) => FILTERS[arg]);
if (filterArgs.length > 0) {
  // If filters are provided, start from a clean state
  auditor.rules = {};
  auditor.is_skills_active = false;
  auditor.is_rules_active = false;
  auditor.is_workflows_active = false;
  auditor.is_project_active = false;
  auditor.is_names_active = false;

  filterArgs.forEach((arg) => {
    const f = FILTERS[arg];
    console.log(`🎯 Filter: ${arg.substring(2).toUpperCase()} Rules Active`);

    // Merge Extension Rules
    if (f.extRules) {
      for (const [ext, rules] of Object.entries(f.extRules)) {
        auditor.rules[ext] = [...(auditor.rules[ext] || []), ...rules];
      }
    }

    // OR Boolean Flags
    if (f.skills === true) auditor.is_skills_active = true;
    if (f.rules === true) auditor.is_rules_active = true;
    if (f.workflows === true) auditor.is_workflows_active = true;
    if (f.project === true) auditor.is_project_active = true;
    if (f.names === true) auditor.is_names_active = true;
  });
  console.log(""); // Spacing
}

// Primary Scan Paths
[SRC_DIR, SKILLS_DIR, RULES_DIR, WORKFLOWS_DIR].forEach((dir) => auditor.scan(dir));

// Nomenclature Scan
if (auditor.is_names_active) {
  const name_stats = { scanned: 0, violations: 0 };
  [SRC_DIR, SKILLS_DIR, RULES_DIR, WORKFLOWS_DIR].forEach((dir) => {
    scan_nomenclature(dir, name_stats, (id, sev, rel_path, msg) => {
      auditor.stats.violations++;
      const s = SEVERITY_LEVELS[sev] || SEVERITY_LEVELS.DEBT;
      console.log(`${s.color}[${s.label}] ${rel_path}${RESET}\n  [${id}] ${msg}\n`);
    });
  });
  auditor.stats.scanned += name_stats.scanned;
}

auditor.summary();
