import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let TEMPLATES_DIR = path.join(__dirname, "..", "templates");

// Fallback search if relative path fails (CI/CD hardening)
if (!fs.existsSync(TEMPLATES_DIR)) {
  const root = process.cwd();
  const altPath = path.join(root, ".agent", "skills", "directives", "templates");
  if (fs.existsSync(altPath)) {
    TEMPLATES_DIR = altPath;
  }
}

/**
 * 🌊 Template Utilities (The Sovereign Blueprint)
 * Shared logic for template-driven auditing.
 */

/**
 * Normalizes a header label by removing emojis and metadata suffixes.
 */
const cleanHeaderLabel = (text) => {
  return text
    .replace(/[(\s#]_?(Mandatory|Optional)_?([)\s#\n]|$)/gi, "") // Clean metadata suffixes
    .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "") // Remove emojis
    .trim();
};

/**
 * Determines if a template header matches an actual header.
 */
const isHeaderMatch = (templateHeader, actualLevel, actualText, projectName) => {
  if (templateHeader.level !== actualLevel) return false;

  const actualClean = cleanHeaderLabel(actualText);
  const templateClean = templateHeader.cleanLabel;

  if (templateHeader.isPlaceholder) {
    // 1. Slug Matching (Workflow, Rule, Skill)
    const isSlugPlaceholder = /\{\{(Workflow|Rule|Skill)-Slug\}\}/i.test(templateClean);
    if (templateHeader.level === 1 && isSlugPlaceholder) {
      if (projectName && actualClean.toLowerCase().includes(projectName.toLowerCase())) {
        return true;
      }
    }

    // 2. Generic Placeholder Regex Matching
    // Escapes special characters but keeps {{...}} as .* wildcard
    const parts = templateClean.split(/\{\{[^}]+\}\}/);
    const escapedParts = parts.map((p) => p.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
    const regexStr = "^" + escapedParts.join(".*") + "$";
    const regex = new RegExp(regexStr, "i");
    return regex.test(actualClean);
  }

  // 3. Literal Matching (Case-insensitive, allows for slight variation)
  const tLower = templateClean.toLowerCase();
  const aLower = actualClean.toLowerCase();
  return aLower === tLower || aLower.startsWith(tLower) || tLower.startsWith(aLower);
};

/**
 * Removes markdown code blocks from text to prevent false positives during header auditing.
 */
const stripCodeBlocks = (text) => {
  return text.replace(/```[\s\S]*?```/g, "");
};

/**
 * Reads a .template.md file and extracts mandatory fields and headers.
 * @param {string} type - "SKILL", "RULE", or "WORKFLOW"
 * @returns {object} - { fields: object[], headers: object[] }
 */
export const getTemplateStructure = (type) => {
  // If the directory doesn't exist, just return an empty structure so validations pass
  if (!fs.existsSync(TEMPLATES_DIR)) {
    return { fields: [], headers: [] };
  }

  const filePath = path.join(TEMPLATES_DIR, `${type}.template.md`);
  if (!fs.existsSync(filePath)) {
    return { fields: [], headers: [] };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const contentNoCode = stripCodeBlocks(content);

  // 1. Extract Frontmatter Structure
  const fields = [];
  const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/m);
  if (fmMatch) {
    const lines = fmMatch[1].split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^(\w+):/);
      if (match) {
        fields.push({
          name: match[1],
          isOptional: /[(\s#]_?Optional_?([)\s#\n]|$)/i.test(line),
        });
      }
    }
  }

  // 2. Extract Header Structure (H1, H2, H3)
  const headers = [];
  const hMatches = contentNoCode.matchAll(/^(#|##|###)\s+(.+)$/gm);
  for (const match of hMatches) {
    const level = match[1].length;
    const text = match[2].trim();
    headers.push({
      level,
      text: `${match[1]} ${text}`,
      cleanLabel: cleanHeaderLabel(text),
      isOptional: /[(\s#]_?Optional_?([)\s#\n]|$)/i.test(text),
      isPlaceholder: /\{\{/.test(text),
    });
  }

  return { fields, headers };
};

/**
 * Validates content against a template structure.
 * @param {string} content - The markdown content to audit.
 * @param {object} structure - { fields, headers } from getTemplateStructure.
 * @param {function} report - callback(severity, message)
 */
export const validateAgainstStructure = (content, structure, report) => {
  // if no structure was found, automatically skip validation
  if (structure.fields.length === 0 && structure.headers.length === 0) return;

  const contentNoCode = stripCodeBlocks(content);

  // 1. Extract Actual Frontmatter
  const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!fmMatch) {
    report("HERESY", "🚨 Mandatory YAML frontmatter block is missing.");
    return;
  }

  const fmLines = fmMatch[1].split(/\r?\n/);
  const actualFields = {};
  for (const line of fmLines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      actualFields[match[1]] = match[2]
        .trim()
        .replace(/^["']|["']$/g, "")
        .split(" #")[0]
        .trim();
    }
  }

  // 2. Field Audit
  const templateFieldNames = new Set(structure.fields.map((f) => f.name));

  // Check for missing mandatory fields
  for (const field of structure.fields) {
    if (!field.isOptional && !actualFields[field.name]) {
      report("DEBT", `⚠️ Missing mandatory frontmatter field: "${field.name}".`);
    }
  }

  // Check for illegal fields (only for Rules and Skills, bypass for now if needed)
  for (const name in actualFields) {
    if (!templateFieldNames.has(name)) {
      report(
        "HERESY",
        `🚨 Illegal frontmatter field detected: "${name}". Not in Sovereign Template.`,
      );
    }
  }

  // 3. Header Audit
  const hMatches = contentNoCode.matchAll(/^(#|##|###)\s+(.+)$/gm);
  const actualHeaders = Array.from(hMatches).map((m) => ({
    level: m[1].length,
    text: m[2].trim(),
  }));

  const projectName = actualFields["name"] || "";

  // Check for missing mandatory sections
  for (const tHeader of structure.headers) {
    const hasMatch = actualHeaders.some((aHeader) =>
      isHeaderMatch(tHeader, aHeader.level, aHeader.text, projectName),
    );

    if (!hasMatch && !tHeader.isOptional) {
      report(
        "ADVICE",
        `💡 Missing mandatory section: "${"#".repeat(tHeader.level)} ${tHeader.cleanLabel}".`,
      );
    }
  }

  // Check for illegal sections (Strict Sovereignty for H1 and H2)
  for (const aHeader of actualHeaders) {
    if (aHeader.level > 2) continue; // H3 is free space (as long as mandatory H3s are present)

    const isRecognized = structure.headers.some((tHeader) =>
      isHeaderMatch(tHeader, aHeader.level, aHeader.text, projectName),
    );

    if (!isRecognized) {
      report(
        "HERESY",
        `🚨 Illegal section detected: "${"#".repeat(aHeader.level)} ${aHeader.text}". Not in Sovereign Template.`,
      );
    }
  }
};
