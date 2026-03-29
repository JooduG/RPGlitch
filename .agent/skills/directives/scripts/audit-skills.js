import fs from "fs";
import path from "path";
// import { fileURLToPath } from "url";
// import yaml from "js-yaml";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const PROJECT_ROOT = process.cwd();
const SKILL_ROOT = path.join(PROJECT_ROOT, ".agent", "skills");

const SEVERITY = {
  HERESY: "🛑 HERESY",
  CRITICAL: "🔥 CRITICAL",
  HIGH: "⚠️ HIGH",
  LOW: "🗒️ LOW",
};

/**
 * 🕵️ Skill Audit Rules (Modular Auditor Compatible)
 */
export const skill_rules = [
  {
    id: "S-SKILL-001",
    severity: "DEBT",
    regex: /\[(?!file:\/\/|Ref-)(?![^\]]*?\]\()(?![^\]]*?\]:).*?\]/,
    message: "WARNING: Unfilled [placeholder] detected in SKILL.md.",
  },
  {
    id: "S-SKILL-002",
    severity: "DEBT",
    validate: (content) =>
      content.includes("Persona") && (content.includes("Structure") || content.includes("Anatomy")),
    message: "WARNING: Missing mandatory Structure or Persona markers.",
  },
  {
    id: "S-SKILL-003",
    severity: "DEBT",
    validate: (content) => content.includes("Procedure") && content.includes("Anti-Patterns"),
    message: "WARNING: Missing Procedure or Anti-Patterns sections.",
  },
  {
    id: "S-SKILL-004",
    severity: "HERESY",
    validate: (content, filePath) => {
      const skillPath = path.dirname(filePath);
      const allowedSubfolders = ["scripts", "references", "assets"];
      const currentSubfolders = fs
        .readdirSync(skillPath)
        .filter((f) => fs.statSync(path.join(skillPath, f)).isDirectory());

      return currentSubfolders.every(
        (dir) => allowedSubfolders.includes(dir) || dir.startsWith("."),
      );
    },
    message:
      "HERESY: Disallowed Subfolder Detected. Only scripts, assets, and references are permitted.",
  },
  {
    id: "S-SKILL-005",
    severity: "HIGH",
    validate: (content, filePath) => {
      const assetsPath = path.join(path.dirname(filePath), "assets");
      if (!fs.existsSync(assetsPath)) return true;
      const assetFiles = fs.readdirSync(assetsPath);
      return !assetFiles.some((file) => {
        const fullPath = path.join(assetsPath, file);
        if (fs.statSync(fullPath).isDirectory()) return false;
        return (
          file.endsWith(".md") &&
          !file.endsWith(".template.md") &&
          fs.readFileSync(fullPath, "utf-8").toLowerCase().includes("template")
        );
      });
    },
    message: "HIGH: Improperly named asset. Reusable templates must use the .template.md suffix.",
  },
];

/**
 * 🕵️ Audit Logic (Sovereign Standalone)
 */
async function audit_skill(skillName) {
  const skillPath = path.join(SKILL_ROOT, skillName);
  const skillFile = path.join(skillPath, "SKILL.md");

  console.log(`\n🔍 AUDITING: ${skillName}...`);
  const report = {
    score: 120,
    issues: [],
  };

  if (!fs.existsSync(skillPath)) {
    return console.error(`❌ Skill directory not found: ${skillPath}`);
  }

  if (!fs.existsSync(skillFile)) {
    report.issues.push({ sev: SEVERITY.HERESY, msg: "Missing SKILL.md", deduction: 50 });
  } else {
    const rawContent = fs.readFileSync(skillFile, "utf-8");

    // 1. Standards: YAML Validation
    try {
      const frontmatterMatch = rawContent.match(/^---([\s\S]*?)---/);
      if (!frontmatterMatch) {
        report.issues.push({
          sev: SEVERITY.CRITICAL,
          msg: "Missing YAML frontmatter",
          deduction: 20,
        });
      } else {
        // Simple key-value parser for now to avoid dependency issues
        const fm = frontmatterMatch[1];
        if (!fm.includes("name:"))
          report.issues.push({
            sev: SEVERITY.HIGH,
            msg: "Missing name in frontmatter",
            deduction: 10,
          });
        if (!fm.includes("description:"))
          report.issues.push({
            sev: SEVERITY.HIGH,
            msg: "Missing description in frontmatter",
            deduction: 10,
          });
      }
    } catch (e) {
      report.issues.push({ sev: SEVERITY.CRITICAL, msg: "YAML Parse Error", deduction: 20 });
    }

    // 2. Context Bloat Check
    const lineCount = rawContent.split("\n").length;
    if (lineCount > 500) {
      report.issues.push({
        sev: SEVERITY.HIGH,
        msg: `Context Bloat: ${lineCount} lines (Target < 500)`,
        deduction: 15,
      });
    }

    // 4. Case Sensitivity (Nomenclature)
    if (skillName !== skillName.toLowerCase() || skillName.includes("_")) {
      report.issues.push({
        sev: SEVERITY.CRITICAL,
        msg: "Non-kebab-case folder name",
        deduction: 15,
      });
    }

    // 5. Structural Exclusivity Check (Strict TRIAD)
    // Subfolders are optional — but if one exists it MUST be named scripts, assets, or references.
    const allowedSubfolders = ["scripts", "references", "assets"];
    const currentSubfolders = fs
      .readdirSync(skillPath)
      .filter((f) => fs.statSync(path.join(skillPath, f)).isDirectory());

    currentSubfolders.forEach((dir) => {
      if (!allowedSubfolders.includes(dir) && !dir.startsWith(".")) {
        report.issues.push({
          sev: SEVERITY.HERESY,
          msg: `Disallowed Subfolder Detected: ${dir}/. Only scripts, assets, and references are permitted.`,
          deduction: 50,
        });
      }
    });

    // 7. Template Naming Check (.template.md)
    const assetsPath = path.join(skillPath, "assets");
    if (fs.existsSync(assetsPath)) {
      const assetFiles = fs.readdirSync(assetsPath);
      assetFiles.forEach((file) => {
        if (
          file.endsWith(".md") &&
          !file.endsWith(".template.md") &&
          fs.readFileSync(path.join(assetsPath, file), "utf-8").toLowerCase().includes("template")
        ) {
          // Note: This is a soft heuristic, but strictly required if intended as a template.
          report.issues.push({
            sev: SEVERITY.HIGH,
            msg: `Improperly named asset: ${file}. Reusable templates must use the .template.md suffix.`,
            deduction: 15,
          });
        }
      });
    }

    // 8. Placeholder & Mandatory Section Detection
    const content = fs.readFileSync(skillFile, "utf-8");
    const bracketMatches = content.match(/\[.*?\](?!\()/g) || []; // Ignore [text](link)
    const placeholderCount = bracketMatches.filter(
      (m) => !m.includes("file:///") && !m.includes("Ref-") && m.length > 2 && m.length < 50,
    ).length;

    if (placeholderCount > 5) {
      report.issues.push({
        sev: SEVERITY.CRITICAL,
        msg: `Excessive Placeholder Brackets Found: [${placeholderCount}]`,
        deduction: 15,
      });
    }

    const mandatorySections = ["Persona", "Structure", "Procedure", "Anti-Patterns"];
    mandatorySections.forEach((section) => {
      if (!content.includes(section) && !(section === "Structure" && content.includes("Anatomy"))) {
        report.issues.push({
          sev: SEVERITY.CRITICAL,
          msg: `Missing Mandatory Section Marker: ${section}`,
          deduction: 10,
        });
      }
    });
  }

  // Final Scoring
  report.score = Math.max(
    0,
    report.issues.reduce((acc, issue) => acc - issue.deduction, report.score),
  );

  // Display Results
  report.issues.forEach((i) => console.log(`${i.sev}: ${i.msg} (-${i.deduction})`));

  const grade =
    report.score >= 108 ? "A (Sovereign)" : report.score >= 90 ? "B (Executive)" : "C (Draft)";
  console.log(`\n🏆 FINAL SCORE: ${report.score}/120 | GRADE: ${grade}`);

  if (report.score < 108) {
    console.log("\n🛠️ REMEDIATION: Consult `forging-handbook.md` to harden this skill.");
  }
}

/**
 * 🚀 Main Dispatcher
 */
if (process.argv[1] && process.argv[1].endsWith("audit-skills.js")) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "audit") {
    audit_skill(args[1] || "directives");
  } else {
    console.log("Usage: node audit-skills.js audit <skill-name>");
  }
}
