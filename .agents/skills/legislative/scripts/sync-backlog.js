import fs from "fs";
import path from "path";
import ignore from "ignore";

const ROOT_DIR = process.cwd();

const ig = ignore();
const gitignorePath = path.join(ROOT_DIR, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  ig.add(fs.readFileSync(gitignorePath, "utf-8"));
}

/**
 *
 */
export function scanForTodo(dir, items_found = []) {
  if (!fs.existsSync(dir)) return items_found;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");

    if (ig.ignores(relPath)) continue;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanForTodo(fullPath, items_found);
    } else if (stat.isFile() && /\.(js|ts|svelte|md|txt)$/.test(item)) {
      if (item.startsWith("audit-") || item === "SKILL.md" || item === "rules.js") continue;

      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (line.includes("#TODO-AI") && !line.includes('line.includes("#TODO-AI")')) {
          const taskMatch = line.match(/#TODO-AI:?\s*(.*)$/);
          const taskDesc = taskMatch ? taskMatch[1].trim() : "Unspecified debt";
          items_found.push(`- [ ] **${relPath}:${index + 1}**: ${taskDesc}`);
        }
      });
    }
  }
  return items_found;
}

/**
 *
 */
export function syncBacklog() {
  const TODO_FILE = path.join(ROOT_DIR, "tasks", "PRESENT.md");
  console.log("🧹 Scanning for #TODO-AI tags...");
  const found = scanForTodo(ROOT_DIR);

  if (found.length === 0) {
    console.log("✅ No new AI debt found.");
    return;
  }

  if (!fs.existsSync(TODO_FILE)) {
    console.warn("⚠️ tasks/PRESENT.md not found. Creating it...");
    fs.mkdirSync(path.dirname(TODO_FILE), { recursive: true });
    fs.writeFileSync(TODO_FILE, "# Project Tasks\n\n");
  }

  let content = fs.readFileSync(TODO_FILE, "utf-8");
  const backlogHeader = "## 🧹 Backlog (Automated)";
  const markerStart = "<!-- BACKLOG_START -->";
  const markerEnd = "<!-- BACKLOG_END -->";
  const lastSwept = `Last Swept: ${new Date().toISOString().replace(/T/, " ").substring(0, 16)}`;

  const newBacklogContent = `${markerStart}\n${lastSwept}\n\n${found.join("\n")}\n${markerEnd}`;

  const sectionRegex = new RegExp(
    `${backlogHeader.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${markerEnd}`,
    "g",
  );

  if (content.includes(backlogHeader)) {
    if (content.match(sectionRegex)) {
      content = content.replace(sectionRegex, () => `${backlogHeader}\n${newBacklogContent}`);
    } else {
      content = content.replace(backlogHeader, () => `${backlogHeader}\n${newBacklogContent}`);
    }
  } else {
    content = content.trim() + `\n\n${backlogHeader}\n${newBacklogContent}\n`;
  }

  fs.writeFileSync(TODO_FILE, content);
  console.log(`✅ Synchronized ${found.length} items to tasks/PRESENT.md`);
}

console.log("\n================================================================================");
console.log("🧹 SYNC: PROJECT BACKLOG");
console.log("================================================================================\n");

syncBacklog();
