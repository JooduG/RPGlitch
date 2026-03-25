import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = process.cwd();

const SKILL_ROOT = path.join(PROJECT_ROOT, ".agent", "skills");
const TEMPLATE_DIR = path.join(__dirname, "../assets");

/**
 * 🛠️ Utility: Case Transitions
 */
const toKebabCase = (str) =>
  str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.toLowerCase())
    .join("-");

const titleCase = (str) => str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

/**
 * 🔍 Validation Logic
 */
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

/**
 * 📂 Recursive Copy with Placeholder Injection
 */
function copyRecursive(src, dest, slug, description) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((file) => {
      copyRecursive(path.join(src, file), path.join(dest, file), slug, description);
    });
  } else {
    let content = fs.readFileSync(src, "utf-8");
    if (path.basename(src) === "SKILL.md") {
      content = content
        .replace(/\[skill-slug\]/g, slug)
        .replace(/\[Skill Title\]/g, titleCase(slug))
        .replace(/\[Description\]/g, description);
    }
    fs.writeFileSync(dest, content);
  }
}

/**
 * ⚒️ Creation Logic
 */
function createSkill(name, type = "task", description = "New agentic skill.") {
  const slug = toKebabCase(name);
  const targetDir = path.join(SKILL_ROOT, slug);

  const metaIssues = validateSkillMeta(slug, description);
  if (metaIssues.length > 0) return console.error(`❌ INVALID META: ${metaIssues.join(", ")}`);

  if (fs.existsSync(targetDir)) return console.error(`❌ FAIL: Skill '${slug}' already exists.`);

  // 1. Validate Type (Case insensitive)
  const availableTemplates = fs.readdirSync(TEMPLATE_DIR).filter((f) => f.endsWith(".md"));
  const templateFile = availableTemplates.find(
    (f) => f.toLowerCase() === `${type.toLowerCase()}.md`,
  );

  if (!templateFile) {
    console.error(
      `❌ Template [${type}] not found in assets/. Available: ${availableTemplates.join(", ")}`,
    );
    process.exit(1);
  }

  const srcFile = path.join(TEMPLATE_DIR, templateFile);

  console.log(`🔨 Forging [${type.toUpperCase()}] Skill: ${slug}...`);

  // 2. Scaffold Core Structure
  const dirs = ["scripts", "references", "assets"];
  dirs.forEach((d) => fs.mkdirSync(path.join(targetDir, d), { recursive: true }));

  // 3. Inject Template
  let content = fs.readFileSync(srcFile, "utf-8");
  content = content
    .replace(/\[[Ss]kill-[Ss]lug\]/g, slug)
    .replace(/\[Skill Title\]/g, titleCase(slug))
    .replace(/\[Description\]/g, description);

  fs.writeFileSync(path.join(targetDir, "SKILL.md"), content);

  console.log(`\n✅ FORGE SUCCESS: Skill '${slug}' instantiated.`);
  console.log(`📍 Path: ${targetDir}`);
  console.log(`🚀 Next: node .agent/skills/agent-forge/scripts/audit-agent.js audit ${slug}`);
}

/**
 * 🚀 Main Dispatcher
 */
const args = process.argv.slice(2);
const command = args[0];

if (command === "create") {
  if (!args[1]) {
    console.log("Usage: node forge-skill.js create <name> [type] [description]");
    process.exit(1);
  }
  createSkill(args[1], args[2], args[3]);
} else {
  console.log("Usage: node forge-skill.js create <name> [type] [description]");
  console.log("Types: task, method, reference, capabilities");
}
