/**
 * 🧹 Project Audit Rules (The Paperwork Routine)
 */

export const projectRules = [
  {
    id: "TODO_AI_TAG",
    severity: "DEBT",
    regex: /#TODO-AI/,
    message: "⚠️ Unresolved Agentic Debt (#TODO-AI) found. Ensure it is registered in mission-board.md or next.md.",
  },
  {
    id: "BACKLOG_EMPTY",
    severity: "ADVICE",
    validate: (content, filePath) => {
      // Only check primary state files
      if (!filePath.endsWith("mission-board.md") && !filePath.endsWith("next.md") && !filePath.endsWith("task.md")) return true;
      return !content.includes("[ ]");
    },
    message: "🚨 Backlog appears exhausted. Synchronize path in mission-board.md or next.md.",
  },
];
