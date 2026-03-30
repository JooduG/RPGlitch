/**
 * 🛠️ forge-skill.js
 * The Sovereign Artisan: Creates new skills, rules, and workflows from blueprints.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".agent", "skills");
const RULES_DIR = path.join(PROJECT_ROOT, ".agent", "rules");
const WORKFLOWS_DIR = path.join(PROJECT_ROOT, ".agent", "workflows");

// Helper: Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Helper: Slugify name
const slugify = (name) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

// Helper: Title Case
const titleCase = (text) => text.split("-").map(w => w[0].toUpperCase() + w.substring(1)).join(" ");

/**
 * Creates a NEW Sovereign Asset
 */
const createSkill = async (name, type = "skill", description = "A Sovereign Asset") => {
  const slug = slugify(name);
  const searchType = type.toLowerCase();
  let targetDir;

  switch (searchType) {
    case "rule": targetDir = path.join(RULES_DIR, slug); break;
    case "workflow": targetDir = WORKFLOWS_DIR; break;
    default: targetDir = path.join(SKILLS_DIR, slug);
  }

  ensureDir(targetDir);

  const content = `
# ${titleCase(slug)}

${description}

## Status
- **Type**: ${searchType.toUpperCase()}
- **Slug**: ${slug}
- **Role**: Sovereign Agent Layer
`.trim();

  const fileName = searchType === "workflow" ? `${slug}.md` : "SKILL.md";
  fs.writeFileSync(path.join(targetDir, fileName), content);

  console.log(`\n✅ FORGE SUCCESS: [${searchType.toUpperCase()}] '${slug}' instantiated.`);
  console.log(`📍 Path: ${targetDir}`);
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
  createSkill(args[1], args[2], args[3]);
} else {
  console.log("Usage: node forge-skill.js create <name> [type] [description]");
  console.log("Types: skill, rule, workflow");
}
