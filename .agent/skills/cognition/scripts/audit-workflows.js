/**
 * 🌊 Workflow Audit Rules (The Procedure Check)
 */

export const workflow_rules = [
  {
    id: "WORKFLOW_FRONTMATTER",
    severity: "HERESY",
    validate: (content, filePath) => {
      if (!filePath.endsWith(".md")) return true;
      const frontmatter = content.split("---")[1];
      if (!frontmatter) return false;
      return frontmatter.includes("description:");
    },
    message: "🚨 Workflow missing mandatory YAML frontmatter (description).",
  },
  {
    id: "WORKFLOW_GOAL",
    severity: "DEBT",
    validate: (content) => content.includes("> **Goal:**"),
    message: "⚠️ Workflow missing defined Goal statement.",
  },
  {
    id: "WORKFLOW_STEPS",
    severity: "ADVICE",
    validate: (content) => content.includes("## ") && content.includes("Phase"),
    message: "💡 Workflow should use structured Phases/Steps.",
  },
];
