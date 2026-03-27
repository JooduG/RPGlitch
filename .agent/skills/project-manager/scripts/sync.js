import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT_DIR = process.cwd();

/**
 * ⚒️ AGENT-FORGE: GLOBAL STATE SYNC
 * ---------------------------------
 * Reconciles the mission board, task tracks, and ignore files.
 */

console.log("\n================================================================================");
console.log("⚒️  THE AGENT-FORGE: GLOBAL STATE SYNC");
console.log("================================================================================\n");

// 1. Sync eslint.config.js, .gitignore, .geminiignore, linter ignores, and vscode settings
function syncIgnores() {
  const masterIgnoresPath = path.join(ROOT_DIR, "ignores.master.json");
  if (!fs.existsSync(masterIgnoresPath)) return;

  const master = JSON.parse(fs.readFileSync(masterIgnoresPath, "utf8"));
  const common = master.common || [];

  console.log("📡 Reconciling Ignore Layers:");
  common.forEach((iq) => console.log(`   [SYNC] -> ${iq}`));

  // --- 1a. ESLint (eslint.config.js) ---
  const eslintPath = path.join(ROOT_DIR, "eslint.config.js");
  if (fs.existsSync(eslintPath)) {
    let content = fs.readFileSync(eslintPath, "utf8");
    const start = "// @agent:ignore-start";
    const end = "// @agent:ignore-end";
    const si = content.indexOf(start);
    const ei = content.indexOf(end);

    if (si !== -1 && ei !== -1) {
      const newContent =
        content.slice(0, si + start.length) +
        "\n    ignores: " +
        JSON.stringify(common, null, 2).replace(/\n/g, "\n    ") +
        ",\n    " +
        content.slice(ei);
      fs.writeFileSync(eslintPath, newContent);
      console.log("✅ Synced eslint.config.js");
    }
  }

  // --- 1b. Line-based Ignore Files ---
  const lineBased = [
    { file: ".gitignore", patterns: [...common, ...(master.gitignore || [])] },
    { file: ".geminiignore", patterns: [...common, ...(master.geminiignore || [])] },
    { file: ".htmlhintignore", patterns: [...common, ...(master.linters?.htmlhint || [])] },
    { file: ".markdownlintignore", patterns: [...common, ...(master.linters?.markdownlint || [])] },
    { file: ".prettierignore", patterns: [...common, ...(master.linters?.prettier || [])] },
    { file: ".stylelintignore", patterns: [...common, ...(master.linters?.stylelint || [])] },
  ];

  lineBased.forEach((lb) => {
    const filePath = path.join(ROOT_DIR, lb.file);
    fs.writeFileSync(filePath, lb.patterns.join("\n") + "\n");
    console.log(`✅ Synced ${lb.file}`);
  });

  // --- 1c. VSCode Settings ---
  const vscodePath = path.join(ROOT_DIR, ".vscode", "settings.json");
  if (fs.existsSync(vscodePath) && master.vscode) {
    const settings = JSON.parse(fs.readFileSync(vscodePath, "utf8"));

    // Authoritative merge for files.exclude and other requested keys
    if (master.vscode["files.exclude"]) {
      settings["files.exclude"] = master.vscode["files.exclude"];
    }

    // Optional: Sync specific other keys if they exist in master.vscode
    const keysToSync = ["editor.codeActionsOnSave", "markdown.validate.referenceLinks.enabled"];
    keysToSync.forEach((key) => {
      if (master.vscode[key] !== undefined) {
        settings[key] = master.vscode[key];
      }
    });

    fs.writeFileSync(vscodePath, JSON.stringify(settings, null, 2) + "\n");
    console.log("✅ Synced .vscode/settings.json (authoritative exclude)");
  }
}

// 2. Trigger Janitor (Warden)
function runJanitor() {
  console.log("\n🧹 Triggering Antigravity Janitor...");
  try {
    execSync("npm run audit:skills", { stdio: "inherit" });
    console.log("✅ Backlog synchronized.");
  } catch (err) {
    console.error("⚠️  Janitor failed during sync.");
  }
}

// 3. Reconcile Mission Board (tracks.md -> global.md)
function reconcileState() {
  const tracksPath = path.join(ROOT_DIR, ".agent", "project-management", "track-log.md");
  const globalPath = path.join(ROOT_DIR, ".agent", "project-management", "mission-board.md");

  if (!fs.existsSync(tracksPath) || !fs.existsSync(globalPath)) return;

  const tracksContent = fs.readFileSync(tracksPath, "utf8");
  const globalContent = fs.readFileSync(globalPath, "utf8");

  const doneTracks = [...tracksContent.matchAll(/^- \*\*(.*?)\*\* \(Done\):/gm)].map((m) => m[1]);
  const globalDone = [...globalContent.matchAll(/\[(?:DONE|x)\] \[.*?\] \[(.*?)\]/g)].map(
    (m) => m[1],
  );
  const activeDone = [...globalContent.matchAll(/- \[x\] \*\*(.*?)\*\*/g)].map((m) => m[1]);

  const allGlobalDone = new Set([...globalDone, ...activeDone]);

  let missing = [];
  doneTracks.forEach((track) => {
    if (!allGlobalDone.has(track)) {
      missing.push(track);
    }
  });

  if (missing.length > 0) {
    console.log("\n⚠️  State Mismatch: Missing from Global Mission Board:");
    missing.forEach((m) => console.log(`   - ${m}`));
  } else {
    console.log("\n✅ Mission Board and Task Tracks are resonant.");
  }
}

// 4. Rule Validation
function validateRules() {
  const rulesDir = path.join(ROOT_DIR, ".agent", "rules");
  const globalPath = path.join(ROOT_DIR, ".agent", "project-management", "mission-board.md");

  if (!fs.existsSync(rulesDir) || !fs.existsSync(globalPath)) return;

  const ruleFiles = fs.readdirSync(rulesDir).filter((f) => f.endsWith(".md"));
  const globalContent = fs.readFileSync(globalPath, "utf8");

  let missing = [];
  ruleFiles.forEach((file) => {
    if (!globalContent.includes(file)) {
      missing.push(file);
    }
  });

  if (missing.length > 0) {
    console.log("\n⚠️  Rule Mismatch: Unreferenced rules:");
    missing.forEach((m) => console.log(`   - ${m}`));
  } else {
    console.log("✅ All System Rules are anchored in Global State.");
  }
}

syncIgnores();
runJanitor();
reconcileState();
validateRules();

console.log("\n================================================================================\n");
