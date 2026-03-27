/**
 * ⚖️ Rule Audit Rules (The Sovereignty Check)
 */

export const rule_rules = [
  {
    id: "RULE_FRONTMATTER",
    severity: "HERESY",
    validate: (content, filePath) => {
      if (!filePath.endsWith(".md")) return true;
      const frontmatter = content.split("---")[1];
      if (!frontmatter) return false;
      return frontmatter.includes("trigger:") && frontmatter.includes("description:");
    },
    message: "🚨 Rule missing mandatory YAML frontmatter (trigger, description).",
  },
  {
    id: "RULE_HEADLINE",
    severity: "DEBT",
    // eslint-disable-next-line no-misleading-character-class
    regex: /^# [^⚖️🕹️🧪⚡🛡️🎨]/,
    message: "⚠️ Rule missing mandatory emoji icon in H1 (⚖️, 🕹️, 🧪, ⚡, 🛡️).",
  },
  {
    id: "RULE_PERSONA",
    severity: "ADVICE",
    validate: (content) => content.includes("> **Persona**:"),
    message: "💡 Rule missing defined Persona block.",
  },
];
