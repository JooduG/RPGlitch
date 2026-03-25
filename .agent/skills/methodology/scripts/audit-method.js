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
    validate: (content) => content.includes("[ ]"),
    message: "🚨 Backlog appears exhausted. Synchronize mission board or close session.",
  },
];
