/**
 * 🕵️ audit-templates.js
 * The Sovereign Auditor: Ensures all rules and workflows are template-compliant and actionable.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTemplateStructure, validateAgainstStructure } from "./template-utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");
const RULES_DIR = path.join(PROJECT_ROOT, ".agent", "rules");
const WORKFLOWS_DIR = path.join(PROJECT_ROOT, ".agent", "workflows");

/**
 * Creates a template-driven validation rule for a specific directory and template type.
 */
const createTemplateRule = (id, type) => ({
  id,
  severity: "HERESY",
  message: `🚨 ${type} file deviates from Sovereign Template structure.`,
  validate: (content, filePath) => {
    // Only audit .md files in the specific directory
    if (!filePath.endsWith(".md")) return true;
    
    const projectRoot = PROJECT_ROOT.toLowerCase().replace(/\\/g, "/");
    const normalizedPath = filePath.toLowerCase().replace(/\\/g, "/");
    const relPath = path.relative(projectRoot, normalizedPath).replace(/\\/g, "/");

    const targetDir = `.agent/${type.toLowerCase()}s/`;
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

export const rule_rules = [createTemplateRule("RULE_TEMPLATE_ALIGNMENT", "RULE")];
export const workflow_rules = [createTemplateRule("WORKFLOW_TEMPLATE_ALIGNMENT", "WORKFLOW")];

/**
 * Standalone execution
 */
const runAudit = (dir, rules, type) => {
  if (!fs.existsSync(dir)) return;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.includes("template"));
  
  console.log(`\n🔍 AUDITING ${type}S: ${dir}...`);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const result = rules[0].validate(content, filePath);
    if (!result.valid) {
      console.log(`❌ ${file}:`);
      result.errors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log(`✅ ${file} is compliant.`);
    }
  });
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAudit(RULES_DIR, rule_rules, "RULE");
  runAudit(WORKFLOWS_DIR, workflow_rules, "WORKFLOW");
}
