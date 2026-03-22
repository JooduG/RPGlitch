import fs from "fs";
import path from "path";

/**
 * sync.js
 * Restores the synchronization capability from ignores.master.json
 */

const MASTER_FILE = "ignores.master.json";
const MASTER_PATH = path.resolve(process.cwd(), MASTER_FILE);

if (!fs.existsSync(MASTER_PATH)) {
  console.error(`Error: ${MASTER_FILE} not found at ${MASTER_PATH}`);
  process.exit(1);
}

const master = JSON.parse(fs.readFileSync(MASTER_PATH, "utf-8"));

const common = master.common || [];

/**
 * Generates an ignore file.
 * @param {string} filename
 * @param {string[]} specific
 */
function generateIgnore(filename, specific) {
  const lines = [...common, ...specific];
  const content = lines.join("\n");
  fs.writeFileSync(path.resolve(process.cwd(), filename), content + "\n");
  console.log(`✅ Synced ${filename}`);
}

// 1. .gitignore
generateIgnore(".gitignore", master.gitignore || []);

// 2. .geminiignore
generateIgnore(".geminiignore", master.geminiignore || []);

// 3. .prettierignore
generateIgnore(".prettierignore", master.linters?.prettier || []);

// 4. .stylelintignore
generateIgnore(".stylelintignore", master.linters?.stylelint || []);

// 5. .htmlhintignore
generateIgnore(".htmlhintignore", master.linters?.htmlhint || []);

// 6. .markdownlintignore
generateIgnore(".markdownlintignore", master.linters?.markdownlint || []);

// 7. eslint.config.js (Injection)
const eslintConfigPath = path.resolve(process.cwd(), "eslint.config.js");
if (fs.existsSync(eslintConfigPath)) {
  try {
    let content = fs.readFileSync(eslintConfigPath, "utf-8");
    const startMarker = "// @agent:ignore-start";
    const endMarker = "// @agent:ignore-end";

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
      const eslintIgnores = [...common, ...(master.linters?.eslint || [])];
      const formattedIgnores = eslintIgnores.map((line) => `            "${line}",`).join("\n");

      const newContent =
        content.slice(0, startIndex + startMarker.length) +
        "\n        ignores: [\n" +
        formattedIgnores +
        "\n        ],\n        " +
        content.slice(endIndex);

      fs.writeFileSync(eslintConfigPath, newContent);
      console.log("✅ Synced eslint.config.js");
    } else {
      console.warn("⚠️  Markers not found in eslint.config.js - skipping injection.");
    }
  } catch (error) {
    console.error("❌ Failed to sync eslint.config.js:", error.message);
  }
}

// 8. .vscode/settings.json
const vscodeSettingsPath = path.resolve(process.cwd(), ".vscode/settings.json");
if (fs.existsSync(vscodeSettingsPath) && master.vscode) {
  try {
    const settings = JSON.parse(fs.readFileSync(vscodeSettingsPath, "utf-8"));

    // Exact sync to allow removals from master
    settings["files.exclude"] = master.vscode["files.exclude"] || {};

    if (master.vscode["markdown.validate.referenceLinks.enabled"] !== undefined) {
      settings["markdown.validate.referenceLinks.enabled"] =
        master.vscode["markdown.validate.referenceLinks.enabled"];
    }

    if (master.vscode["stylelint.validate"]) {
      settings["stylelint.validate"] = master.vscode["stylelint.validate"];
    }

    if (master.vscode["editor.codeActionsOnSave"]) {
      settings["editor.codeActionsOnSave"] = master.vscode["editor.codeActionsOnSave"];
    }

    fs.writeFileSync(vscodeSettingsPath, JSON.stringify(settings, null, 4));
    console.log("✅ Synced .vscode/settings.json");
  } catch (error) {
    console.error("❌ Failed to sync .vscode/settings.json:", error.message);
  }
}

/**
 * Self-Healing: Bootstrap Verification
 * Ensures the "Big 5" Rule Files and Project Pillars exist.
 */
function verifyPillars() {
  const REPO_ROOT = process.cwd();
  const pillars = [
    ".agent/rules/01-foundation.md",
    ".agent/rules/04-shield.md",
    ".agent/scripts/summarize.js",
    "package.json",
    "vite.config.js",
    "eslint.config.js",
    "stylelint.config.cjs",
    ".htmlhintrc",
    ".markdownlint-cli2.mjs",
  ];
  let missing = [];

  console.log("⚡ Verifying Pillars...");

  for (const pillar of pillars) {
    if (!fs.existsSync(path.join(REPO_ROOT, pillar))) {
      console.error(`   ❌ MISSING PILLAR: ${pillar}`);
      missing.push(pillar);
    }
  }

  if (missing.length > 0) {
    console.error("⚠️ Environment Corrupt. The following Pillars are missing:");
    missing.forEach((p) => console.error(`   - ${p}`));
    console.error("Halting synchronization.");
    process.exit(1);
  }

  console.log("✅ Pillars Verified.");
}

// Execute Self-Healing
verifyPillars();
