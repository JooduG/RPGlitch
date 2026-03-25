import fs from "fs";
import path from "path";

// 1. Import Domain Rules
import { svelteRules } from "../../svelte/scripts/audit-svelte.js";
import { cssRules } from "../../css/scripts/audit-css.js";
import { securityRules } from "./audit-security.js";
import { skill_rules } from "../../agent-forge/scripts/audit-skills.js";
import { method_rules } from "../../methodology/scripts/audit-method.js";

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");
const SKILLS_DIR = path.join(ROOT_DIR, ".agent/skills");

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
      ".js": [...securityRules, ...method_rules],
      ".md": method_rules,
    };
    this.is_skills_active = true;
    this.is_method_active = true;
  }

  scan(
    dir,
    ignorePaths = [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".svelte-kit",
      "templates",
      "assets",
      "references",
      "archive",
    ],
  ) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      if (ignorePaths.includes(item) || item.startsWith(".")) return;

      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this.scan(fullPath, ignorePaths);
      } else {
        this.auditFile(fullPath);
      }
    });
  }

  auditFile(filePath) {
    const ext = path.extname(filePath);
    const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

    // Path-based rule matching
    if (relPath.includes("audit-") || relPath.endsWith("tokens.css")) return;

    let rules = [];
    if (
      this.is_skills_active &&
      relPath.startsWith(".agent/skills") &&
      relPath.endsWith("SKILL.md")
    ) {
      rules.push(...skill_rules);
    }

    // Extension-based rule matching (Respecting CLI filters)
    if (this.rules[ext]) {
      rules.push(...this.rules[ext]);
    }

    if (rules.length === 0) return;

    this.stats.scanned++;
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    rules.forEach((rule) => {
      // Filter out Methodology rules if not requested
      if (!this.is_method_active && method_rules.includes(rule)) return;

      // 1. Regex Match (Line-by-Line)
      if (rule.regex) {
        lines.forEach((line, i) => {
          if (rule.regex.test(line)) {
            // Optional custom validation function
            if (rule.validate && !rule.validate(line, filePath)) return;

            this.reportViolation(rule, filePath, i + 1, line.trim());
          }
        });
      }

      // 2. Global Content Match (File-Wide)
      if (rule.validate && !rule.regex) {
        if (!rule.validate(content, filePath)) {
          this.reportViolation(rule, filePath, 0, "[File Structure]");
        }
      }
    });
  }

  reportViolation(rule, filePath, line, code) {
    this.stats.violations++;
    const sev = SEVERITY_LEVELS[rule.severity] || SEVERITY_LEVELS.ADVICE;
    const relPath = path.relative(ROOT_DIR, filePath);

    this.results.push({
      id: rule.id,
      severity: rule.severity,
      file: relPath,
      line,
      message: rule.message,
    });

    console.log(`${sev.color}[${sev.label}] ${relPath}${line ? `:${line}` : ""}${RESET}`);
    console.log(`  ${rule.message}`);
    if (code && code !== "[File Structure]") {
      console.log(`  Code: ${code.substring(0, 100).trim()}`);
    }
    console.log("");
  }

  summary() {
    console.log("------------------------------------------");
    console.log(`📊 SCAN COMPLETE: ${this.stats.scanned} files verified.`);
    console.log(`🔥 VIOLATIONS: ${this.stats.violations}`);
    console.log("------------------------------------------\n");

    const criticals = this.results.filter((r) => r.severity === "HERESY");
    if (criticals.length > 0) {
      console.log(`${RED}❌ REJECTED: Heresy detected in Sovereign logic. Build blocked.${RESET}`);
      process.exit(1);
    } else {
      console.log(`${GREEN}✅ RESONANT: All protocols align. Proceeding.${RESET}`);
    }
  }
}

// 3. Execution
const auditor = new Auditor();
const args = process.argv.slice(2);

console.log("\n================================================================================");
console.log("🦾 THE REFLEX: MODULAR AUDITOR ENGINE");
console.log("================================================================================\n");

// Handle CLI Filters
if (args.includes("--svelte")) {
  console.log("🎯 Filter: Svelte Rules Only\n");
  auditor.rules = { ".svelte": svelteRules };
  auditor.is_skills_active = false;
  auditor.is_method_active = false;
} else if (args.includes("--css")) {
  console.log("🎯 Filter: CSS Rules Only\n");
  auditor.rules = { ".css": cssRules };
  auditor.is_skills_active = false;
  auditor.is_method_active = false;
} else if (args.includes("--security")) {
  console.log("🎯 Filter: Security Rules Only\n");
  auditor.rules = { ".js": securityRules };
  auditor.is_skills_active = false;
  auditor.is_method_active = false;
} else if (args.includes("--skills")) {
  console.log("🎯 Filter: Skill Rules Only\n");
  auditor.rules = {};
  auditor.is_skills_active = true;
  auditor.is_method_active = false;
} else if (args.includes("--method")) {
  console.log("🎯 Filter: Methodology Rules Only\n");
  auditor.rules = { ".js": method_rules, ".md": method_rules };
  auditor.is_skills_active = false;
  auditor.is_method_active = true;
} else if (args.includes("--todo")) {
  console.log("🎯 Filter: TODO Rules Only\n");
  auditor.rules = {
    ".js": securityRules.filter((r) => r.id === "W-SEC-001"),
    ".svelte": svelteRules.filter((r) => r.id === "S-RUNE-001"),
  }; // Simplified for now, or use dedicated todoRules
  auditor.is_skills_active = false;
  auditor.is_method_active = false;
}

auditor.scan(SRC_DIR);
auditor.scan(SKILLS_DIR);
auditor.summary();
