/**
 * 🕵️ audit-templates.js
 * The Sovereign Auditor: Ensures all rules and workflows are template-compliant and actionable.
 */
import path from "path";
import { fileURLToPath } from "url";
import { getTemplateStructure, validateAgainstStructure } from "./template-utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");

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

    const relPath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");

    const targetDir = `.agents/${type.toLowerCase()}s/`;
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

export const ruleRules = [createTemplateRule("RULE_TEMPLATE_ALIGNMENT", "RULE")];
export const workflowRules = [createTemplateRule("WORKFLOW_TEMPLATE_ALIGNMENT", "WORKFLOW")];
