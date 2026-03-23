import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SKILL_ROOT = path.join(ROOT, ".agent", "skills");

/**
 * 🔍 STRUCTURAL AUDITOR (The Architect)
 * Enforces rigid standards across the agent's internal intelligence.
 */

const auditRules = [
  {
    name: "Frontmatter Integrity",
    check: (content) => {
      const hasName = /name:\s+\S+/.test(content);
      const hasVersion = /version:\s+\d+\.\d+\.\d+/.test(content);
      const hasDesc = /description:\s+\S+/.test(content);
      return hasName && hasVersion && hasDesc;
    },
    message: "Missing 'name', 'version' (X.Y.Z), or 'description' in frontmatter.",
  },
  {
    name: "Anti-Patterns Table",
    check: (content) => {
      const hasHeading = /##.*Anti-Patterns/i.test(content);
      const hasTable = /\|\s*Pattern\s*\|\s*Mitigation\s*\|/i.test(content);
      return hasHeading && hasTable;
    },
    message:
      "Missing '## Anti-Patterns' heading or table with headers '| Pattern | Mitigation |'.",
  },
  {
    name: "Path Headers",
    check: (content) => {
      const lines = content.split("\n");
      let pass = true;
      let insideBlock = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("```")) {
          if (!insideBlock) {
            insideBlock = true;
            const isExempt = line.includes("bash") || line.includes("mermaid");
            if (!isExempt) {
              const prevLine = lines[i - 1] || "";
              const prevPrevLine = lines[i - 2] || "";
              if (!prevLine.includes("File:") && !prevPrevLine.includes("File:")) {
                pass = false;
                break;
              }
            }
          } else {
            insideBlock = false;
          }
        }
      }
      return pass;
    },
    message: "Code blocks (except bash/mermaid) MUST be preceded by 'File: <path>'.",
  },
];

function auditSkill(slug) {
  const skillPath = path.join(SKILL_ROOT, slug, "SKILL.md");
  if (!fs.existsSync(skillPath)) return { valid: false, issues: ["Missing SKILL.md"] };

  const content = fs.readFileSync(skillPath, "utf8");
  const issues = [];

  auditRules.forEach((rule) => {
    if (!rule.check(content)) {
      issues.push(rule.message);
    }
  });

  return { valid: issues.length === 0, issues };
}

function run() {
  const targetSkill = process.argv[2];
  
  if (targetSkill) {
    const { valid, issues } = auditSkill(targetSkill);
    if (!valid) {
      issues.forEach((issue) => console.log(`- ${issue}`));
      process.exit(1);
    }
    process.exit(0);
  }

  console.log("\n🏛️  ARCHITECT: Structural Audit of Agent Skills\n");

  if (!fs.existsSync(SKILL_ROOT)) {
    console.error("❌ ERROR: Skill root not found.");
    process.exit(1);
  }

  const skills = fs
    .readdirSync(SKILL_ROOT, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  let failCount = 0;

  skills.forEach((skill) => {
    const { valid, issues } = auditSkill(skill);
    const status = valid ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
    console.log(`${skill.padEnd(20)} | ${status}`);

    if (!valid) {
      failCount++;
      issues.forEach((issue) => console.log(`  - ${issue}`));
    }
  });

  console.log(`\nAudit Complete: ${skills.length - failCount}/${skills.length} skills compliant.`);
  if (failCount > 0) process.exit(1);
}

run();
