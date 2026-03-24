import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const SKILL_ROOT = path.join(".agent", "skills");
const ALLOWED_FOLDERS = [
  "knowledge",
  "scripts",
  "templates",
  "docs",
  "tests",
  "examples",
  "references",
  "reference",
  "assets",
  "workflows",
];

const TEMPLATES = {
  workflow: `---
name: [skill-slug]
description: [TODO: Complete explanation. Trigger on: ... ]
---

# [Skill Title] (Workflow)

## 1. Workflow Decision Tree
[TODO: Map the sequential logic. If A -> Step 1, If B -> Step 2]

## 2. Step 1: [Name]
[Actionable instructions]

## 3. Step 2: [Name]
[Actionable instructions]
`,
  task: `---
name: [skill-slug]
description: [TODO: Complete explanation. Trigger on: ... ]
---

# [Skill Title] (Task-Based)

## 1. Quick Start
[Immediate usage examples]

## 2. [Category 1]
[Specific tools or operations]

## 3. [Category 2]
[Specific tools or operations]
`,
  reference: `---
name: [skill-slug]
description: [TODO: Complete explanation. Trigger on: ... ]
---

# [Skill Title] (Reference)

## 1. Guidelines
[Core standards and constraints]

## 2. Specifications
[Detailed technical data]

## 3. Usage
[How to apply the standards]
`,
  capabilities: `---
name: [skill-slug]
description: [TODO: Complete explanation. Trigger on: ... ]
---

# [Skill Title] (Capabilities)

## 1. Core Capabilities
1. **[Feature 1]**: [Benefit]
2. **[Feature 2]**: [Benefit]

## 2. Implementation
[How the features interact]
`,
};

const toKebabCase = (str) =>
  str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.toLowerCase())
    .join("-");

const titleCase = (str) => str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

function validateSkillMeta(name, description) {
  const issues = [];
  if (!name || !/^[a-z0-9-]+$/.test(name)) issues.push("Name must be kebab-case.");
  if (name.length > 64) issues.push("Name too long (max 64).");
  if (!description || description.length > 1024) {
    issues.push("Description length error (max 1024).");
  }
  if (/[<>]/.test(description)) issues.push("Description cannot contain < or >.");
  return issues;
}

function createSkill(name, type = "task", description = "New agentic skill.") {
  const slug = toKebabCase(name);
  const targetDir = path.join(SKILL_ROOT, slug);

  const metaIssues = validateSkillMeta(slug, description);
  if (metaIssues.length > 0) return console.error(`❌ INVALID META: ${metaIssues.join(", ")}`);

  if (fs.existsSync(targetDir)) return console.error(`❌ FAIL: Skill '${slug}' already exists.`);

  const template = TEMPLATES[type] || TEMPLATES.task;
  const content = template
    .replace(/\[skill-slug\]/g, slug)
    .replace(/\[Skill Title\]/g, titleCase(slug))
    .replace(/\[Description\]/g, description);

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(targetDir, "knowledge"), { recursive: true });

  fs.writeFileSync(path.join(targetDir, "SKILL.md"), content);

  console.log(`✅ PASS: [${type.toUpperCase()}] Skill '${slug}' instantiated at ${targetDir}`);
}

/**
 * DEPRECATED: Use structural-audit.js for definitive checks.
 */
function auditSkill(name) {
  const result = spawnSync(
    "node",
    [path.join(".agent/skills/agent-manager/scripts/structural-audit.js"), name],
    { encoding: "utf8" },
  );
  if (result.status === 0) return { valid: true, issues: [] };

  const issues = result.stdout
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.trim().substring(2));

  return { valid: false, issues };
}

function auditAll() {
  console.log("🔍 Auditing Intelligence Structure...");
  const skills = fs
    .readdirSync(SKILL_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);

  let validCount = 0;
  skills.forEach((name) => {
    const { valid, issues } = auditSkill(name);
    const color = valid ? "\x1b[32m" : "\x1b[31m";
    console.log(
      `${name.padEnd(30)} | ${color}${valid ? "PASS" : "FAIL"}\x1b[0m | ${issues.join(", ")}`,
    );
    if (valid) validCount++;
  });

  console.log(`\nAudit Complete: ${validCount}/${skills.length} compliant.`);
  if (validCount < skills.length) process.exit(1);
}

const [, , command, ...args] = process.argv;
if (command === "create") createSkill(args[0], args[1], args[2]);
else if (command === "audit") auditAll();
else console.log("Usage: node scaffold-skill.js [create|audit] [name] [type] [description]");
