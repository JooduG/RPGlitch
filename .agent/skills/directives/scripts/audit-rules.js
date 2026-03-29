/**
 * ⚖️ audit-rules.js
 * The Sovereign Auditor: Ensures all rules are template-compliant and strictly bounded.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTemplateStructure, validateAgainstStructure } from "./template-utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");
const RULES_DIR = path.join(PROJECT_ROOT, ".agent", "rules");

export const rule_rules = [
  {
    id: "RULE_TEMPLATE_ALIGNMENT",
    severity: "HERESY",
    message: "🚨 RULE file deviates from Sovereign Template structure.",
    validate: (content, filePath) => {
      // Only audit .md files in the rules directory
      // Normalize paths for cross-platform matching
      const projectRoot = PROJECT_ROOT.toLowerCase().replace(/\\/g, "/");
      const normalizedPath = filePath.toLowerCase().replace(/\\/g, "/");
      const relPath = path.relative(projectRoot, normalizedPath).replace(/\\/g, "/");
      
      if (!relPath.startsWith(".agent/rules/")) return true;
      
      const errors = [];
      const structure = getTemplateStructure("RULE");
      
      validateAgainstStructure(content, structure, (sev, msg) => {
        errors.push(`${sev === "HERESY" ? "🛑" : "⚠️"} ${msg}`);
      });
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  }
];

// Standalone execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rules = fs.readdirSync(RULES_DIR).filter(f => f.endsWith(".md") && !f.includes("template"));
  rules.forEach(file => {
    const content = fs.readFileSync(path.join(RULES_DIR, file), "utf-8");
    rule_rules[0].validate(content, path.join(RULES_DIR, file));
  });
}
