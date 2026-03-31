/**
 * 🕵️ audit-workflows.js
 * The Sovereign Auditor: Ensures all workflows are template-compliant and actionable.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTemplateStructure, validateAgainstStructure } from "./template-utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");
const WORKFLOWS_DIR = path.join(PROJECT_ROOT, ".agent", "workflows");

export const workflow_rules = [
  {
    id: "WORKFLOW_TEMPLATE_ALIGNMENT",
    severity: "HERESY",
    message: "🚨 WORKFLOW file deviates from Sovereign Template structure.",
    validate: (content, filePath) => {
      // Only audit .md files in the workflows directory
      if (!filePath.endsWith(".md")) return true;
      const relPath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
      if (!relPath.startsWith(".agent/workflows/")) return true;

      const errors = [];
      const structure = getTemplateStructure("WORKFLOW");

      validateAgainstStructure(content, structure, (sev, msg) => {
        errors.push(`${sev === "HERESY" ? "🛑" : "⚠️"} ${msg}`);
      });

      return {
        valid: errors.length === 0,
        errors,
      };
    },
  },
];

// Standalone execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const workflows = fs
    .readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith(".md") && !f.includes("template"));
  workflows.forEach((file) => {
    const content = fs.readFileSync(path.join(WORKFLOWS_DIR, file), "utf-8");
    workflow_rules[0].validate(content, path.join(WORKFLOWS_DIR, file));
  });
}
