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
  
  // Mapping for legacy "task" to "skill" template
  let searchType = type.toLowerCase();
  if (searchType === "task" && !availableTemplates.some(t => t.toLowerCase() === "task.md")) {
    searchType = "skill";
  }

  const templateFile = availableTemplates.find(
    (f) => f.toLowerCase() === `${searchType}.md`,
  );

  if (!templateFile) {
    console.error(
      `❌ Template [${type}] not found in assets/. Available: ${availableTemplates.map(t => t.replace('.md', '').toLowerCase()).join(", ")}`,
    );
    process.exit(1);
  }

  const srcFile = path.join(TEMPLATE_DIR, templateFile);

  console.log(`🔨 Forging [${searchType.toUpperCase()}] Skill: ${slug}...`);

  // 2. Scaffold Core Structure
  const dirs = ["scripts", "references", "assets"];
  dirs.forEach((d) => fs.mkdirSync(path.join(targetDir, d), { recursive: true }));

  // 3. Inject Template
  let content = fs.readFileSync(srcFile, "utf-8");
  
  // Dynamic replacements with optional space support
  const replacements = {
    "Skill-Slug": slug,
    "Rule-Slug": slug,
    "Workflow-Slug": slug,
    "Skill Title": titleCase(slug),
    "Description": description,
    "Persona": "The Sovereign Architect", // Default
    "Role": searchType.toUpperCase(),
    "Function": "orchestrate",
    "Goal": "technical purity"
  };

  Object.entries(replacements).forEach(([key, value]) => {
    // Matches { { Key } } or {{Key}} or [Key]
    const regex = new RegExp(`(\\{\\{\\s*${key}\\s*\\}\\}|\\[${key}\\])`, "gi");
    content = content.replace(regex, value);
  });

  fs.writeFileSync(path.join(targetDir, "SKILL.md"), content);

  console.log(`\n✅ FORGE SUCCESS: [${searchType.toUpperCase()}] '${slug}' instantiated.`);
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
  console.log("Types: skill, rule, workflow");
}
