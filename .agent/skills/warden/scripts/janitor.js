import fs from "fs";
import path from "path";

process.stdout.write("🧹 Running Antigravity Janitor...\n");

const BLACKLIST = ["node_modules", ".git", ".svelte-kit", "dist", "build", ".vercel"];
const SRC_DIR = path.join(process.cwd(), "src");
const STATE_DIR = path.join(process.cwd(), ".agent", "state");

let todoItems = [];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    if (BLACKLIST.includes(item)) continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (stat.isFile() && /\.(js|ts|svelte|md|txt)$/.test(item)) {
      if (item === "janitor.js") return; // Skip self

      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (
          line.includes("#" + "TODO-AI") &&
          !line.includes("line.includes" + '("#" + "TODO-AI")')
        ) {
          const relPath = path.relative(process.cwd(), fullPath);
          todoItems.push(
            `- [ ] **${relPath}:${index + 1}**: ${line.trim().replace(new RegExp("^.*#" + "TODO-AI:?\\s*"), "")}`,
          );
        }
      });
    }
  }
}

try {
  if (fs.existsSync(SRC_DIR)) {
    scanDir(SRC_DIR);
  }
  const SKILLS_DIR = path.join(process.cwd(), ".agent", "skills");
  if (fs.existsSync(SKILLS_DIR)) {
    scanDir(SKILLS_DIR);
  }

  const content = `\n# 📋 Active AI Backlog\n\n*Last Swept: ${new Date().toISOString()}*\n\n${todoItems.length > 0 ? todoItems.join("\n") : "No AI tasks found."}\n`;

  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(path.join(STATE_DIR, "backlog.md"), content);
  process.stdout.write(
    `✅ Backlog updated (${todoItems.length} items) in .agent/state/backlog.md\n`,
  );
} catch (e) {
  console.error("❌ Janitor Error:", e);
  process.exit(1);
}
