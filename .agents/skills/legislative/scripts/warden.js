/**
 * 🕵️ warden.js
 * The Sovereign Auditor Engine (The Reflex)
 * Consolidated & Modular Quality Gate
 */
import fs from "fs";
import ignore from "ignore";
import path from "path";
import { safeStatSync } from "./utils.js";

// 1. Import Domain Rules
import { cssRules, themeRules } from "../../css/scripts/design-auditor.js";
import { securityRules } from "../../security/scripts/audit-security.js";
import { svelteRules } from "../../svelte/scripts/audit-svelte.js";
import { nomenclatureRules, skillRules, ruleRules, workflowRules, projectRules } from "./rules.js";

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");
const SKILLS_DIR = path.join(ROOT_DIR, ".agents/skills");
const WORKFLOWS_DIR = path.join(ROOT_DIR, ".agents/workflows");
const TASKS_DIR = path.join(ROOT_DIR, "tasks");

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
 * 🕵️ CONSOLIDATED AUDITOR ENGINE (The Reflex)
 */
export class Auditor {
  constructor() {
    this.results = [];
    this.stats = { scanned: 0, violations: 0 };

    // Standard Rule Buckets
    this.pathRules = [];
    this.extRules = {
      ".svelte": svelteRules,
      ".css": cssRules,
      ".js": [...securityRules, ...projectRules],
      ".ts": [...securityRules],
      ".md": projectRules,
    };

    // Global toggle states (for CLI filtering)
    this.flags = {
      names: true,
      skills: true,
      rules: false,
      workflows: true,
      project: true,
    };
  }

  /**
   * Primary entry point for directory scanning
   */
  scan(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");

      if (ig.ignores(relPath) || relPath.includes("node_modules")) return;

      const stat = safeStatSync(fullPath);
      if (!stat) return;

      const isDir = stat.isDirectory();
      this.stats.scanned++;

      // 1. Audit the Path/Nomenclature
      if (this.flags.names) {
        nomenclatureRules.forEach((rule) => {
          if (rule.auditPath && !rule.auditPath(item, isDir, relPath)) {
            this.reportViolation(rule, fullPath, 0, "[Nomenclature]");
          }
        });
      }

      // 2. Recurse or Audit File Content
      if (isDir) {
        this.scan(fullPath);
      } else {
        this.auditFileContent(fullPath);
      }
    });
  }

  /**
   * Audits file contents using extension-based and specialized rules
   */
  auditFileContent(filePath) {
    const ext = path.extname(filePath);
    const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

    // Skip self and generated assets
    if (relPath.includes("audit-") || relPath.endsWith("design.css") || relPath.includes(".bak."))
      return;

    const rules = [];

    // 1. Specialized Template Rules
    if (this.flags.skills && relPath.startsWith(".agents/skills") && relPath.endsWith("SKILL.md")) {
      rules.push(...skillRules);
    }
    if (this.flags.rules && relPath.startsWith(".agents/rules") && relPath.endsWith(".md")) {
      rules.push(...ruleRules);
    }
    if (
      this.flags.workflows &&
      relPath.startsWith(".agents/workflows") &&
      relPath.endsWith(".md")
    ) {
      rules.push(...workflowRules);
    }

    // 2. Content-based Nomenclature (e.g. no 'var')
    if (this.flags.names) {
      rules.push(...nomenclatureRules.filter((r) => r.regex));
    }

    // 3. Extension-based rule matching
    if (this.extRules[ext]) {
      rules.push(...this.extRules[ext]);
    }

    if (rules.length === 0) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    rules.forEach((rule) => {
      if (!this.flags.project && projectRules.includes(rule)) return;

      // Type A: Regex Match (Line-by-Line)
      if (rule.regex) {
        lines.forEach((line, i) => {
          if (rule.regex.test(line)) {
            if (rule.validate && !rule.validate(line, filePath)) return;
            this.reportViolation(rule, filePath, i + 1, line.trim());
          }
        });
      }

      // Type B: Global Content Match (File-Wide)
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

  /**
   * Reports a violation to the console and internal results list
   */
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

    if (code && code !== "[File Structure]" && code !== "[Nomenclature]") {
      console.log(`  Code: ${code.substring(0, 100).trim()}`);
    }

    if (errors && errors.length > 0) {
      errors.forEach((err) => console.log(`    - ${err}`));
    }
    console.log("");
  }

  /**
   * Prints the audit summary and enforces the gate
   */
  summary() {
    console.log("--------------------------------------------------------------------------------");
    console.log(`📊 SCAN COMPLETE: ${this.stats.scanned} items verified.`);
    console.log(`🔥 VIOLATIONS: ${this.stats.violations}`);
    console.log(
      "--------------------------------------------------------------------------------\n",
    );

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
  "--names": { names: true, skills: false, workflows: false, project: false, extRules: {} },
  "--svelte": { extRules: { ".svelte": svelteRules } },
  "--css": { extRules: { ".css": cssRules, ".svelte": cssRules } },
  "--theme": { extRules: { ".css": themeRules, ".svelte": themeRules } },
  "--security": { extRules: { ".js": securityRules, ".ts": securityRules } },
  "--skills": { names: false, skills: true, workflows: false, project: false, extRules: {} },
  "--rules": { names: false, skills: false, rules: true, workflows: false, project: false },
  "--workflows": { names: false, skills: false, workflows: true, project: false },
  "--agent": { names: true, skills: true, rules: true, workflows: true, project: false },
  "--project": { project: true, extRules: { ".js": projectRules, ".md": projectRules } },
  "--todo": {
    extRules: {
      ".js": securityRules.filter((r) => r.id === "SECURITY_DEBUG_LOG"),
      ".svelte": svelteRules.filter((r) => r.id === "S_RUNE_DEBUG"),
    },
  },
};

/**
 * 2. Backlog Synchronization (/OOC)
 */
function scanForTodo(dir, items_found = []) {
  if (!fs.existsSync(dir)) return items_found;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");

    if (ig.ignores(relPath)) continue;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanForTodo(fullPath, items_found);
    } else if (stat.isFile() && /\.(js|ts|svelte|md|txt)$/.test(item)) {
      if (item === "warden.js" || item === "audit-security.js" || item === "SKILL.md" || item === "rules.js")
        continue;

      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (line.includes("#TODO-AI") && !line.includes('line.includes("#TODO-AI")')) {
          const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");
          const taskMatch = line.match(/#TODO-AI:?\s*(.*)$/);
          const taskDesc = taskMatch ? taskMatch[1].trim() : "Unspecified debt";
          items_found.push(`- [ ] **${relPath}:${index + 1}**: ${taskDesc}`);
        }
      });
    }
  }
  return items_found;
}

export function syncBacklog() {
  const TODO_FILE = path.join(ROOT_DIR, "tasks", "PRESENT.md");
  console.log("🧹 Scanning for #TODO-AI tags...");
  const found = scanForTodo(ROOT_DIR);

  if (found.length === 0) {
    console.log("✅ No new AI debt found.");
    return;
  }

  if (!fs.existsSync(TODO_FILE)) {
    console.warn("⚠️ tasks/PRESENT.md not found. Creating it...");
    fs.mkdirSync(path.dirname(TODO_FILE), { recursive: true });
    fs.writeFileSync(TODO_FILE, "# Project Tasks\n\n");
  }

  let content = fs.readFileSync(TODO_FILE, "utf-8");
  const backlogHeader = "## 🧹 Backlog (Automated)";
  const markerStart = "<!-- BACKLOG_START -->";
  const markerEnd = "<!-- BACKLOG_END -->";
  const lastSwept = `*Last Swept: ${new Date().toISOString().replace(/T/, " ").replace(/\..+/, "")}*`;

  const newBacklogContent = `${markerStart}\n${lastSwept}\n\n${found.join("\n")}\n${markerEnd}`;

  const sectionRegex = new RegExp(
    `${backlogHeader.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${markerEnd}`,
    "g",
  );

  if (content.includes(backlogHeader)) {
    // Replace existing backlog section(s)
    if (content.match(sectionRegex)) {
      content = content.replace(sectionRegex, () => `${backlogHeader}\n${newBacklogContent}`);
    } else {
      // Legacy transition: Insert markers after existing header
      content = content.replace(backlogHeader, () => `${backlogHeader}\n${newBacklogContent}`);
    }
  } else {
    // Append to end
    content = content.trim() + `\n\n${backlogHeader}\n${newBacklogContent}\n`;
  }

  fs.writeFileSync(TODO_FILE, content);
  console.log(`✅ Synchronized ${found.length} items to tasks/PRESENT.md`);
}

/**
 * Runs the audit CLI.
 */
export function runWarden() {
  const args = process.argv.slice(2);

  if (args.includes("--backlog") || args.includes("backlog")) {
    syncBacklog();
    return;
  }

  const auditor = new Auditor();

  console.log("\n================================================================================");
  console.log("🛡️  WARDEN: CONSOLIDATED QUALITY GATE");
  console.log("================================================================================\n");

  // Apply Filters if present
  const filterArgs = args.filter((arg) => FILTERS[arg]);
  if (filterArgs.length > 0) {
    // Reset defaults if any filter is used
    auditor.extRules = {};
    auditor.flags = { names: false, skills: false, rules: false, workflows: false, project: false };

    filterArgs.forEach((arg) => {
      const f = FILTERS[arg];
      console.log(`🎯 Filter: ${arg.substring(2).toUpperCase()} Active`);

      if (f.extRules) {
        for (const [ext, rules] of Object.entries(f.extRules)) {
          auditor.extRules[ext] = [...(auditor.extRules[ext] || []), ...rules];
        }
      }

      Object.keys(auditor.flags).forEach((key) => {
        if (f[key] !== undefined) auditor.flags[key] = f[key];
      });
    });
    console.log("");
  }

  // Primary Scan Paths
  [SRC_DIR, SKILLS_DIR, WORKFLOWS_DIR, TASKS_DIR].forEach((dir) => auditor.scan(dir));

  auditor.summary();
}

// Main entry check
if (process.argv[1] && process.argv[1].endsWith("warden.js")) {
  runWarden();
}
