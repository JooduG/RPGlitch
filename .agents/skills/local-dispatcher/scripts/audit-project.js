import fs from "fs";
import path from "path";
import ignore from "ignore";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".agents", "skills");
const ROOT_DIR = process.cwd();

let TEMPLATES_DIR = path.join(__dirname, "..", "templates");

// Fallback search if relative path fails (CI/CD hardening)
if (!fs.existsSync(TEMPLATES_DIR)) {
  const root = process.cwd();
  const altPath = path.join(root, ".agents", "skills", "directives", "templates");
  if (fs.existsSync(altPath)) {
    TEMPLATES_DIR = altPath;
  }
}

/**
 * 🌊 Safe Filesystem Utilities
 */
export function safeStatSync(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (e) {
    if (["ENAMETOOLONG", "ENOENT", "EACCES", "ELOOP"].includes(e.code)) {
      console.warn(`Skipping ${filePath} due to ${e.code}`);
      return null;
    }
    throw e;
  }
}

/**
 * 🌊 Template Utilities (The Sovereign Blueprint)
 * Shared logic for template-driven auditing.
 */

/**
 * Normalizes a header label by removing emojis and metadata suffixes.
 */
const cleanHeaderLabel = (text) => {
  return text
    .replace(/[(\s#]_?(Mandatory|Optional)_?([)\s#\n]|$)/gi, "") // Clean metadata suffixes
    .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "") // Remove emojis
    .trim();
};

/**
 * Determines if a template header matches an actual header.
 */
const isHeaderMatch = (templateHeader, actualLevel, actualText, _projectName) => {
  if (templateHeader.level !== actualLevel) return false;

  const actualClean = cleanHeaderLabel(actualText);
  const templateClean = templateHeader.cleanLabel;

  if (templateHeader.isPlaceholder) {
    // 1. Multi-Placeholder Regex Matching
    // Escapes special characters but keeps {{...}} as .* wildcard
    const parts = templateClean.split(/\{\{[^}]+\}\}/);
    const escapedParts = parts.map((p) => p.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));

    // If the template is an H1 with a slug placeholder, ensure we match broadly but correctly
    const regexStr = "^" + escapedParts.join(".*") + "$";
    const regex = new RegExp(regexStr, "i");

    // Check if the actual text (with formatting) matches the regex
    // We use the full text here because cleanHeaderLabel might strip too much for H1 links
    const fullActualText = actualText.trim();
    if (regex.test(fullActualText) || regex.test(actualClean)) {
      return true;
    }
  }

  // 2. Literal Matching (Case-insensitive, allows for slight variation)
  const tLower = templateClean.toLowerCase();
  const aLower = actualClean.toLowerCase();
  return aLower === tLower || aLower.startsWith(tLower) || tLower.startsWith(aLower);
};

/**
 * Removes markdown code blocks from text to prevent false positives during header auditing.
 */
const stripCodeBlocks = (text) => {
  return text.replace(/```[\s\S]*?```/g, "");
};

/**
 * Reads a .template.md file and extracts mandatory fields and headers.
 * @param {string} type - "SKILL", "RULE", or "WORKFLOW"
 * @returns {object} - { fields: object[], headers: object[] }
 */
export const getTemplateStructure = (type) => {
  // If the directory doesn't exist, just return an empty structure so validations pass
  if (!fs.existsSync(TEMPLATES_DIR)) {
    return { fields: [], headers: [] };
  }

  const filePath = path.join(TEMPLATES_DIR, `${type}.template.md`);
  if (!fs.existsSync(filePath)) {
    return { fields: [], headers: [] };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const contentNoCode = stripCodeBlocks(content);

  // 1. Extract Frontmatter Structure
  const fields = [];
  const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/m);
  if (fmMatch) {
    const lines = fmMatch[1].split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^(\w+):/);
      if (match) {
        fields.push({
          name: match[1],
          isOptional: /[(\s#]_?Optional_?([)\s#\n]|$)/i.test(line),
        });
      }
    }
  }

  // 2. Extract Header Structure (H1, H2, H3)
  const headers = [];
  const hMatches = contentNoCode.matchAll(/^(#|##|###)\s+(.+)$/gm);
  for (const match of hMatches) {
    const level = match[1].length;
    const text = match[2].trim();
    headers.push({
      level,
      text: `${match[1]} ${text}`,
      cleanLabel: cleanHeaderLabel(text),
      isOptional: /[(\s#]_?Optional_?([)\s#\n]|$)/i.test(text),
      isPlaceholder: /\{\{/.test(text),
    });
  }

  return { fields, headers };
};

/**
 * Validates content against a template structure.
 * @param {string} content - The markdown content to audit.
 * @param {object} structure - { fields, headers } from getTemplateStructure.
 * @param {Function} report - callback(severity, message)
 */
export const validateAgainstStructure = (content, structure, report) => {
  // if no structure was found, automatically skip validation
  if (structure.fields.length === 0 && structure.headers.length === 0) return;

  const contentNoCode = stripCodeBlocks(content);

  // 1. Extract Actual Frontmatter
  const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!fmMatch) {
    report("HERESY", "🚨 Mandatory YAML frontmatter block is missing.");
    return;
  }

  const fmLines = fmMatch[1].split(/\r?\n/);
  const actualFields = {};
  for (const line of fmLines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      actualFields[match[1]] = match[2]
        .trim()
        .replace(/^["']|["']$/g, "")
        .split(" #")[0]
        .trim();
    }
  }

  // 2. Field Audit
  const templateFieldNames = new Set(structure.fields.map((f) => f.name));

  // Check for missing mandatory fields
  for (const field of structure.fields) {
    if (!field.isOptional && !actualFields[field.name]) {
      report("DEBT", `⚠️ Missing mandatory frontmatter field: "${field.name}".`);
    }
  }

  // Check for illegal fields (only for Rules and Skills, bypass for now if needed)
  for (const name in actualFields) {
    if (!templateFieldNames.has(name)) {
      report(
        "HERESY",
        `🚨 Illegal frontmatter field detected: "${name}". Not in Sovereign Template.`,
      );
    }
  }

  // 3. Header Audit
  const hMatches = contentNoCode.matchAll(/^(#|##|###)\s+(.+)$/gm);
  const actualHeaders = Array.from(hMatches).map((m) => ({
    level: m[1].length,
    text: m[2].trim(),
  }));

  const projectName = actualFields["name"] || "";

  // Check for missing mandatory sections
  for (const tHeader of structure.headers) {
    const hasMatch = actualHeaders.some((aHeader) =>
      isHeaderMatch(tHeader, aHeader.level, aHeader.text, projectName),
    );

    if (!hasMatch && !tHeader.isOptional) {
      report(
        "ADVICE",
        `💡 Missing mandatory section: "${"#".repeat(tHeader.level)} ${tHeader.cleanLabel}".`,
      );
    }
  }

  // Check for illegal sections (Strict Sovereignty for H1 and H2)
  for (const aHeader of actualHeaders) {
    if (aHeader.level > 2) continue; // H3 is free space (as long as mandatory H3s are present)

    const isRecognized = structure.headers.some((tHeader) =>
      isHeaderMatch(tHeader, aHeader.level, aHeader.text, projectName),
    );

    if (!isRecognized) {
      report(
        "HERESY",
        `🚨 Illegal section detected: "${"#".repeat(aHeader.level)} ${aHeader.text}". Not in Sovereign Template.`,
      );
    }
  }
};

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
    const allowedSubfolders = ["scripts", "assets", "templates", "data"];
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

// Load gitignore for standard ignores
const ig = ignore();
const gitignorePath = path.join(ROOT_DIR, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  ig.add(fs.readFileSync(gitignorePath, "utf-8"));
}

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";

let scanned = 0;
let violations = 0;
let hasHeresy = false;

/**
 *
 */
function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");

    if (ig.ignores(relPath) || relPath.includes("node_modules")) continue;

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      scan(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (ext === ".md") {
        scanned++;
        auditFile(fullPath);
      }
    }
  }
}

/**
 *
 */
function auditFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

  if (relPath.includes("audit-") || relPath.includes(".bak.")) return;

  const rules = [];

  if (relPath.startsWith(".agents/skills") && relPath.endsWith("SKILL.md")) {
    rules.push(...skillRules);
  }
  if (relPath.startsWith(".agents/rules") && relPath.endsWith(".md")) {
    rules.push(...ruleRules);
  }
  if (relPath.startsWith(".agents/workflows") && relPath.endsWith(".md")) {
    rules.push(...workflowRules);
  }
  rules.push(...projectRules);

  rules.forEach((rule) => {
    if (rule.regex) {
      lines.forEach((line, i) => {
        if (rule.regex.test(line)) {
          if (rule.validate && !rule.validate(line, filePath)) return;

          violations++;
          const color = rule.severity === "HERESY" ? RED : YELLOW;
          if (rule.severity === "HERESY") hasHeresy = true;

          console.log(`${color}[${rule.severity}] ${relPath}:${i + 1}${RESET}`);
          console.log(`  ${rule.message}`);
          console.log(`  Code: ${line.trim().substring(0, 100)}\n`);
        }
      });
    }

    if (rule.validate && !rule.regex) {
      const result = rule.validate(content, filePath);
      const isValid = typeof result === "object" ? result.valid : result;
      const errors = typeof result === "object" ? result.errors : [];

      if (!isValid) {
        violations++;
        const color = rule.severity === "HERESY" ? RED : YELLOW;
        if (rule.severity === "HERESY") hasHeresy = true;

        console.log(`${color}[${rule.severity}] ${relPath}${RESET}`);
        console.log(`  ${rule.message}`);
        errors.forEach((err) => console.log(`    - ${err}`));
        console.log("");
      }
    }
  });
}

console.log("\n================================================================================");
console.log("📜 AUDIT: TEMPLATES & LEGISLATION");
console.log("================================================================================\n");

const SRC_DIR = path.join(ROOT_DIR, "src");

const WORKFLOWS_DIR = path.join(ROOT_DIR, ".agents/workflows");
const TASKS_DIR = path.join(ROOT_DIR, "tasks");

[SRC_DIR, SKILLS_DIR, WORKFLOWS_DIR, TASKS_DIR].forEach((dir) => scan(dir));

console.log("--------------------------------------------------------------------------------");
console.log(`📊 SCAN COMPLETE: ${scanned} legislative markdown assets verified.`);
console.log(`🔥 VIOLATIONS: ${violations}`);
console.log("--------------------------------------------------------------------------------\n");

if (hasHeresy) {
  console.log(`${RED}❌ REJECTED: Heresy detected in legislative templates. Gate closed.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}✅ RESONANT: All protocols align. Proceeding.${RESET}`);
}
