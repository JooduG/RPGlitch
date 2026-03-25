/**
 * 🧹 Todo Audit Rules (The Paperwork Routine)
 */

export const method_rules = [
  {
    id: "TODO_AI_TAG",
    severity: "DEBT",
    regex: /#TODO-AI/,
    message: "⚠️ Unresolved Agentic Debt (#TODO-AI) found. Ensure it is registered in backlog.md.",
  },
  {
    id: "BACKLOG_EMPTY",
    severity: "ADVICE",
    validate: (content, filePath) => {
      // Only check primary backlog/task files
      if (!filePath.endsWith("backlog.md") && !filePath.endsWith("task.md")) return true;
      return !content.includes("[ ]");
    },
    message: "🚨 Backlog appears exhausted. Synchronize mission board or close session.",
  },
];
