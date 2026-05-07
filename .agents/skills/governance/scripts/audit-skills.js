/**
 * 🕵️ audit-skills.js
 * The Sovereign Inspector: Audits skills for structural purity and template alignment.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTemplateStructure, validateAgainstStructure } from "./template-utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".agents", "skills");

export const skill_rules = [
  {
    id: "SKILL_TEMPLATE_ALIGNMENT",
    severity: "HERESY",
    message: "🚨 SKILL file deviates from Sovereign Template structure.",
    validate: (content, filePath) => {
      // Only audit .md files in the skills directory
      if (!filePath.endsWith("SKILL.md")) return true;
      const relPath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
      if (!relPath.startsWith(".agents/skills/")) return true;

      const skillName = path.basename(path.dirname(filePath));
      const results = auditSkill(skillName, true); // SILENT when called by engine
      return results;
    },
  },
];

const SEVERITY = {
  HERESY: "🛑 HERESY",
  CRITICAL: "🔥 CRITICAL",
  HIGH: "⚠️ HIGH",
  LOW: "🗒️ LOW",
};

/**
 * 🕵️ Audit single skill
 */
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
    const currentSubfolders = fs
      .readdirSync(skillPath)
      .filter((f) => fs.statSync(path.join(skillPath, f)).isDirectory());

    currentSubfolders.forEach((dir) => {
      if (!allowedSubfolders.includes(dir) && !dir.startsWith(".")) {
        logIssue(
          SEVERITY.HERESY,
          `Disallowed subfolder: ${dir}/. Use ONLY scripts, assets, references, rules, data, or templates.`,
          50,
        );
      }
    });

    // 3. Placeholder Detection (Handle both [PLACEHOLDER] and {{placeholder}})
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

  if (!silent) {
    report.issues.forEach((i) => console.log(`  ${i.sev}: ${i.msg} (-${i.deduction})`));
    const grade =
      report.score >= 110 ? "A (Sovereign)" : report.score >= 90 ? "B (Executive)" : "C (Draft)";
    console.log(`\n🏆 FINAL SCORE: ${report.score}/120 | GRADE: ${grade}`);
  }

  return {
    valid: report.score >= 110,
    errors: report.issues.map((i) => `${i.sev}: ${i.msg} (-${i.deduction})`),
    score: report.score,
  };
};

// Main execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args[0] === "audit") {
    auditSkill(args[1] || "directives");
  } else {
    // Audit all skills
    const skills = fs
      .readdirSync(SKILLS_DIR)
      .filter((f) => fs.statSync(path.join(SKILLS_DIR, f)).isDirectory());
    let allClean = true;
    skills.forEach((s) => {
      const result = auditSkill(s);
      if (!result.valid) allClean = false;
    });
    if (!allClean) process.exit(1);
  }
}
