import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTemplateStructure, validateAgainstStructure, safeStatSync } from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".agents", "skills");
const ROOT_DIR = process.cwd();

/**
 * ==========================================
 * NOMENCLATURE RULES
 * ==========================================
 */

const RE_KEBAB = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const RE_PASCAL = /^[A-Z][a-zA-Z0-9]+$/;
const RE_ALL_CAPS = /^[A-Z][A-Z0-9_]*$/;
const RE_VAR = /\bvar\s+[a-zA-Z_$][a-zA-Z0-9_$]*/;

const STRIP_SUFFIXES = [
  ".template",
  ".svelte",
  ".test",
  ".spec",
  ".manual",
  ".unit",
  ".integration",
  ".d",
];
const TEST_SUFFIXES = [".test", ".spec", ".manual", ".unit", ".integration"];
const SUBJECT_EXTS = [".svelte", ".svelte.js", ".svelte.ts", ".js", ".ts"];

const getBase = (filename) => {
  const withoutExt = filename.slice(0, filename.length - path.extname(filename).length);
  let stem = withoutExt;
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of STRIP_SUFFIXES) {
      if (stem.endsWith(suffix)) {
        stem = stem.slice(0, stem.length - suffix.length);
        changed = true;
        break;
      }
    }
  }
  return stem;
};

const findTestSubject = (filename, dir) => {
  const ext = path.extname(filename);
  const withoutExt = filename.slice(0, filename.length - ext.length);
  let subjectStem = null;
  for (const suffix of TEST_SUFFIXES) {
    if (withoutExt.endsWith(suffix)) {
      subjectStem = withoutExt.slice(0, withoutExt.length - suffix.length);
      break;
    }
  }
  if (!subjectStem) return false;
  return SUBJECT_EXTS.some((se) => fs.existsSync(path.join(dir, subjectStem + se)));
};

export const nomenclatureRules = [
  {
    id: "N-LANG-001",
    severity: "DEBT",
    message: "Svelte component must be PascalCase.",
    auditPath: (name, isDir) => {
      if (isDir || !name.endsWith(".svelte") || name.includes(".template.")) return true;
      const base = getBase(name);
      return RE_PASCAL.test(base);
    },
  },
  {
    id: "N-LANG-002",
    severity: "DEBT",
    message: "File must be kebab-case.",
    auditPath: (name, isDir, relPath) => {
      if (isDir || name.includes("RPGlitch") || name.startsWith("@") || name.startsWith("$"))
        return true;
      if (name.endsWith(".svelte") && !name.includes(".template.")) return true;
      const base = getBase(name);
      if (RE_ALL_CAPS.test(base)) return true;

      const parentDir = path.dirname(path.join(PROJECT_ROOT, relPath));
      if (findTestSubject(name, parentDir)) return true;

      return RE_KEBAB.test(base);
    },
  },
  {
    id: "N-LANG-003",
    severity: "DEBT",
    message: "Folder must be kebab-case or All-Caps abbreviation.",
    auditPath: (name, isDir) => {
      if (!isDir || name.startsWith(".") || name.startsWith("@") || name.startsWith("$"))
        return true;
      return RE_KEBAB.test(name) || RE_ALL_CAPS.test(name);
    },
  },
  {
    id: "N-LANG-VAR",
    severity: "HERESY",
    message: "Forbidden usage of 'var' detected.",
    regex: RE_VAR,
    validate: (line, filePath) => filePath.match(/\.(js|ts|svelte)$/),
  },
];

/**
 * ==========================================
 * SKILLS RULES
 * ==========================================
 */

const SEVERITY = {
  HERESY: "🛑 HERESY",
  CRITICAL: "🔥 CRITICAL",
  HIGH: "⚠️ HIGH",
  LOW: "🗒️ LOW",
};

const auditSkill = (skillName, silent = false) => {
  const skillPath = path.join(SKILLS_DIR, skillName);
  const skillMd = path.join(skillPath, "SKILL.md");

  if (!silent) console.log(`\n🔍 AUDITING: ${skillName}...`);

  const report = {
    score: 120,
    issues: [],
  };

  const logIssue = (sev, msg, deduction = 10) => {
    report.issues.push({ sev, msg, deduction });
  };

  if (!fs.existsSync(skillPath)) {
    if (!silent) console.error(`❌ Skill directory not found: ${skillPath}`);
    return { valid: false, errors: ["Skill directory not found"] };
  }

  if (!fs.existsSync(skillMd)) {
    logIssue(SEVERITY.HERESY, "Missing SKILL.md", 50);
  } else {
    const content = fs.readFileSync(skillMd, "utf-8");
    const contentNoCode = content.replace(/```[\s\S]*?```/g, "");

    // 1. Template-Driven Validation
    const structure = getTemplateStructure("SKILL");
    validateAgainstStructure(content, structure, (sev, msg) => {
      const mappedSev = sev === "HERESY" ? SEVERITY.HERESY : SEVERITY.CRITICAL;
      logIssue(mappedSev, msg, sev === "HERESY" ? 30 : 15);
    });

    // 2. Structural Exclusivity
    const allowedSubfolders = ["scripts", "references", "assets", "templates", "rules", "data"];
    const currentSubfolders = fs.readdirSync(skillPath).filter((f) => {
      const stat = safeStatSync(path.join(skillPath, f));
      return stat && stat.isDirectory();
    });

    currentSubfolders.forEach((dir) => {
      if (!allowedSubfolders.includes(dir) && !dir.startsWith(".")) {
        logIssue(
          SEVERITY.HERESY,
          `Disallowed subfolder: ${dir}/. Use ONLY scripts, assets, references, rules, data, or templates.`,
          50,
        );
      }
    });

    // 3. Placeholder Detection
    const oldPlaceholders = contentNoCode.match(/\[[A-Z][A-Z0-9_/]{2,}\](?!\()/g) || [];
    const newPlaceholders = contentNoCode.match(/\{\{[^}]+\}\}/g) || [];
    const placeholders = [...oldPlaceholders, ...newPlaceholders];

    const invalidPlaceholders = placeholders.filter(
      (p) => !p.includes("file:///") && p.length > 2 && p.length < 100,
    );
    if (invalidPlaceholders.length > 3) {
      logIssue(
        SEVERITY.HIGH,
        `Unfilled placeholders detected: ${invalidPlaceholders.join(", ")}`,
        15,
      );
    }

    // 4. Bloat Check
    const lines = content.split("\n").length;
    if (lines > 600) {
      logIssue(SEVERITY.HIGH, `Context Bloat: ${lines} lines`, 15);
    }
  }

  report.score = Math.max(
    0,
    report.issues.reduce((acc, issue) => acc - issue.deduction, report.score),
  );

  return {
    valid: report.score >= 110,
    errors: report.issues.map((i) => `${i.sev}: ${i.msg} (-${i.deduction})`),
    score: report.score,
  };
};

export const skillRules = [
  {
    id: "SKILL_TEMPLATE_ALIGNMENT",
    severity: "HERESY",
    message: "🚨 SKILL file deviates from Sovereign Template structure.",
    validate: (content, filePath) => {
      if (!filePath.endsWith("SKILL.md")) return true;
      const relPath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
      if (!relPath.startsWith(".agents/skills/")) return true;

      const skillName = path.basename(path.dirname(filePath));
      const results = auditSkill(skillName, true);
      return results;
    },
  },
];

/**
 * ==========================================
 * TEMPLATE RULES
 * ==========================================
 */

const createTemplateRule = (id, type) => ({
  id,
  severity: "HERESY",
  message: `🚨 ${type} file deviates from Sovereign Template structure.`,
  validate: (content, filePath) => {
    if (!filePath.endsWith(".md")) return true;

    const relPath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
    const targetDir = `.agents/${type.toLowerCase()}s/`;
    if (!relPath.startsWith(targetDir)) return true;

    const errors = [];
    const structure = getTemplateStructure(type);

    validateAgainstStructure(content, structure, (sev, msg) => {
      errors.push(`${sev === "HERESY" ? "🛑" : "⚠️"} ${msg}`);
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  },
});

export const ruleRules = [createTemplateRule("RULE_TEMPLATE_ALIGNMENT", "RULE")];
export const workflowRules = [createTemplateRule("WORKFLOW_TEMPLATE_ALIGNMENT", "WORKFLOW")];

/**
 * ==========================================
 * PROJECT RULES
 * ==========================================
 */

export const projectRules = [
  {
    id: "PROJECT_TODO_AI_TAG",
    severity: "DEBT",
    regex: /#TODO-AI/,
    message:
      "⚠️ Unresolved Agentic Debt (#TODO-AI) found. Ensure it is registered in tasks/PRESENT.md.",
    validate: (line, filePath) =>
      !filePath.includes("warden.js") &&
      !filePath.includes("audit-security.js") &&
      !filePath.includes("SKILL.md") &&
      !filePath.includes("rules.js"), // Exclude self
  },
  {
    id: "PROJECT_BACKLOG_SYNC",
    severity: "ADVICE",
    validate: (content, filePath) => {
      const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
      if (!relPath.startsWith("tasks/")) return true;
      return content.includes("[ ]");
    },
    message: "💡 Task file appears exhausted or lack open items. Sync with the backlog.",
  },
];
