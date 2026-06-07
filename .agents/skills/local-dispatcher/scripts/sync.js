import fs from "fs";
import path from "path";

const ROOT_DIR = process.cwd();

/**
 * 🎨 orchestration: GLOBAL STATE SYNC
 * ---------------------------------
 * Reconciles ignore files based on ignores.master.json.
 */

/**
 * Runs the ignore reconciliation process.
 */
export function syncIgnores() {
  console.log("\n================================================================================");
  console.log("🎨  ORCHESTRATION: GLOBAL STATE SYNC");
  console.log("================================================================================\n");

  const masterIgnoresPath = path.join(ROOT_DIR, "ignores.master.json");
  if (!fs.existsSync(masterIgnoresPath)) {
    console.error("❌ ignores.master.json not found. Aborting sync.");
    return;
  }

  const master = JSON.parse(fs.readFileSync(masterIgnoresPath, "utf8"));
  const common = master.common || [];

  console.log("📡 Reconciling Ignore Layers:");

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
    { file: ".antigravityignore", patterns: [...common, ...(master.antigravityignore || [])] },
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
    let settings = {};
    try {
      settings = JSON.parse(fs.readFileSync(vscodePath, "utf8"));
    } catch {
      console.warn("⚠️  Could not parse .vscode/settings.json, creating new.");
    }

    // Authoritative merge for files.exclude
    if (master.vscode["files.exclude"]) {
      settings["files.exclude"] = master.vscode["files.exclude"];
    }

    // Ensure directory exists
    const vscodeDir = path.dirname(vscodePath);
    if (!fs.existsSync(vscodeDir)) fs.mkdirSync(vscodeDir, { recursive: true });

    fs.writeFileSync(vscodePath, JSON.stringify(settings, null, 2) + "\n");
    console.log("✅ Synced .vscode/settings.json");
  }

  console.log(
    "\n================================================================================\n",
  );
}

// Main entry check
if (process.argv[1] && process.argv[1].endsWith("sync.js")) {
  syncIgnores();
}
