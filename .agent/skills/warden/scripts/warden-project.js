/**
 * 🧹 warden-project.js
 * Project Health & Backlog Synchronizer.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT_DIR = process.cwd();
const TODO_FILE = path.join(ROOT_DIR, "tasks", "todo.md");
const BLACKLIST = ["node_modules", ".git", ".svelte-kit", "dist", "build", ".vercel", ".agent/archive"];

/**
 * 1. Auditor Rules (for warden.js)
 */
export const projectRules = [
  {
    id: "PROJECT_TODO_AI_TAG",
    severity: "DEBT",
    regex: /#TODO-AI/,
    message: "⚠️ Unresolved Agentic Debt (#TODO-AI) found. Ensure it is registered in tasks/todo.md.",
    validate: (line, filePath) => !filePath.includes("warden-project.js") && !filePath.includes("audit-security.js"),
  },
  {
    id: "PROJECT_BACKLOG_SYNC",
    severity: "ADVICE",
    validate: (content, filePath) => {
      // Only check main task files
      const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
      if (!relPath.startsWith("tasks/")) return true;
      
      // Advice if a task file has no open checkboxes
      return content.includes("[ ]");
    },
    message: "💡 Task file appears exhausted or lack open items. Sync with the backlog.",
  },
];

/**
 * 2. Backlog Synchronization (/OOC)
 */
function scanForTodo(dir, items_found = []) {
  if (!fs.existsSync(dir)) return items_found;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    if (BLACKLIST.includes(item)) continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanForTodo(fullPath, items_found);
    } else if (stat.isFile() && /\.(js|ts|svelte|md|txt)$/.test(item)) {
      if (item === "warden-project.js" || item === "janitor.js") continue;

      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (line.includes("#TODO-AI") && !line.includes("line.includes(\"#TODO-AI\")")) {
          const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");
          const taskMatch = line.match(/#TODO-AI:?\s*(.*)$/);
          const taskDesc = taskMatch ? taskMatch[1].trim() : "Unspecified debt";
          items_found.push(`- [ ] **${relPath}:${index + 1}**: ${taskDesc}`);
        }
      });
    }
  }
  return items_found;
}

export function syncBacklog() {
  console.log("🧹 Scanning for #TODO-AI tags...");
  const found = scanForTodo(ROOT_DIR);
  
  if (found.length === 0) {
    console.log("✅ No new AI debt found.");
    return;
  }

  if (!fs.existsSync(TODO_FILE)) {
    console.warn("⚠️ tasks/todo.md not found. Creating it...");
    fs.mkdirSync(path.dirname(TODO_FILE), { recursive: true });
    fs.writeFileSync(TODO_FILE, "# Project Tasks\n\n");
  }

  let content = fs.readFileSync(TODO_FILE, "utf-8");
  const backlogHeader = "## 🧹 Backlog (Automated)";
  const lastSwept = `*Last Swept: ${new Date().toISOString()}*`;
  
  const newBacklogContent = `\n${backlogHeader}\n${lastSwept}\n\n${found.join("\n")}\n`;

  if (content.includes(backlogHeader)) {
    // Replace existing backlog
    const parts = content.split(backlogHeader);
    const before = parts[0];
    // Find where the next header starts or end of file
    const nextHeaderMatch = parts[1].match(/\n#+ /);
    const remaining = nextHeaderMatch ? parts[1].slice(nextHeaderMatch.index) : "";
    content = before.trim() + "\n" + newBacklogContent + (remaining ? "\n## " + remaining : "");
  } else {
    // Append to end
    content = content.trim() + "\n\n" + newBacklogContent;
  }

  fs.writeFileSync(TODO_FILE, content);
  console.log(`✅ Synchronized ${found.length} items to tasks/todo.md`);
}

/**
 * CLI Execution
 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncBacklog();
}
