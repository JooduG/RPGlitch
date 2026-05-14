/**
 * 🛠️ forge-skill.js
 * The Sovereign Artisan: Creates new skills, rules, and workflows from blueprints.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".agents", "skills");
const RULES_DIR = path.join(PROJECT_ROOT, ".agents", "rules");
const WORKFLOWS_DIR = path.join(PROJECT_ROOT, ".agents", "workflows");
const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

// Helper: Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Helper: Slugify name (lowercase-hyphen-separated)
const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

// Helper: Title Case
const titleCase = (text) =>
  text
    .split("-")
    .map((w) => w[0].toUpperCase() + w.substring(1))
    .join(" ");

/**
 * Creates a NEW Sovereign Asset using templates
 */
const createAsset = async (name, type = "skill", description = "") => {
  const slug = slugify(name);
  const title = titleCase(slug);
  const searchType = type.toLowerCase();
  let targetDir;
  let templateName;
  let fileName;

  switch (searchType) {
    case "rule":
      targetDir = path.join(RULES_DIR, slug);
      templateName = "RULE.template.md";
      fileName = "RULE.md";
      break;
    case "workflow":
      targetDir = WORKFLOWS_DIR;
      templateName = "WORKFLOW.template.md";
      fileName = `${slug}.md`;
      break;
    case "skill":
    default:
      targetDir = path.join(SKILLS_DIR, slug);
      templateName = "SKILL.template.md";
      fileName = "SKILL.md";
      break;
  }

  const templatePath = path.join(TEMPLATES_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, "utf-8");

  // Robust Placeholder Replacement
  const finalContent = template
    .replace(/\{\{(skill-name|Workflow-Slug|Rule-Slug)\}\}/gi, slug)
    .replace(/\{\{(Skill-Title|Title|Rule-Title)\}\}/gi, title)
    .replace(
      /\{\{(description|Description)\}\}/g,
      description || `A Sovereign ${searchType} asset.`,
    )
    .replace(/\{\{Persona\}\}/g, `The ${title} Orchestrator`)
    .replace(/\{\{script\}\}/g, slug)
    .replace(/\{\{Reference\}\}/g, title);

  ensureDir(targetDir);
  fs.writeFileSync(path.join(targetDir, fileName), finalContent);

  console.log(
    `\n✅ FORGE SUCCESS: [${searchType.toUpperCase()}] '${slug}' instantiated from template.`,
  );
  console.log(`📍 Path: ${path.join(targetDir, fileName)}`);
};

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
  createAsset(args[1], args[2], args[3]);
} else {
  console.log("Usage: node forge-skill.js create <name> [type] [description]");
  console.log("Types: skill, rule, workflow");
}
