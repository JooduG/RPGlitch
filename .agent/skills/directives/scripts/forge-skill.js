/**
 * 🛠️ forge-skill.js
 * The Sovereign Artisan: Creates new skills, rules, and workflows from blueprints.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".agent", "skills");
const RULES_DIR = path.join(PROJECT_ROOT, ".agent", "rules");
const WORKFLOWS_DIR = path.join(PROJECT_ROOT, ".agent", "workflows");
const ASSETS_DIR = path.join(__dirname, "..", "assets");

// Helper: Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Helper: Read and replace
const processTemplate = (templatePath, replacements) => {
  let content = fs.readFileSync(templatePath, "utf-8");
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(key, value);
  }
  return content;
};

/**
 * Creates a NEW Sovereign Asset
 * Usage: node forge-skill.js [type] [name] [description]
 */
const forge = () => {
  const [type, name, description] = process.argv.slice(2);

  if (!type || !name || !description) {
    console.error("❌ Usage: node forge-skill.js [skill|rule|workflow] [name] [description]");
    process.exit(1);
  }

  const replacements = {
    "Skill-Slug": slug,
    "Rule-Slug": slug,
    "Workflow-Slug": slug,
    "Skill Title": titleCase(slug),
    Description: description,
    Persona: "The Sovereign Architect", // Default
    Role: searchType.toUpperCase(),
    Function: "orchestrate",
    Goal: "technical purity",
  };

  Object.entries(replacements).forEach(([key, value]) => {
    // Matches { { Key } } or {{Key}} or [Key]
    const regex = new RegExp(`(\\{\\{\\s*${key}\\s*\\}\\}|\\[${key}\\])`, "gi");
    content = content.replace(regex, value);
  });

  fs.writeFileSync(path.join(targetDir, "SKILL.md"), content);

  console.log(`\n✅ FORGE SUCCESS: [${searchType.toUpperCase()}] '${slug}' instantiated.`);
  console.log(`📍 Path: ${targetDir}`);
  console.log(`🚀 Next: node .agent/skills/directives/scripts/audit-skills.js audit ${slug}`);
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
