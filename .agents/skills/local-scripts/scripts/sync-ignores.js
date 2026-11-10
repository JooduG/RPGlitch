/**
 * .agents/skills/local-scripts/scripts/sync-ignores.js
 * 🔄 IGNORE FAN-OUT — reconciles ignores.master.json into all config layers.
 *
 * Split from workspace.js Pipeline 1 with one upgrade: DIFF-THEN-WRITE.
 * Every target is read first and rewritten ONLY when the content actually
 * changes, so no-update runs leave zero phantom diffs in `git status` —
 * which previously tripped the planning-handoff gate on clean trees.
 */

import fs from "fs";
import path from "path";
import { ROOT_DIRECTORY } from "./lib/io.js";

/**
 * Writes file_path only when next_content differs from disk.
 *
 * @param {string} file_path Absolute target path.
 * @param {string} next_content Desired content.
 * @param {string} label Log label.
 * @returns {boolean} True when the file was written.
 */
export function write_if_changed(file_path, next_content, label) {
  let prev_content;
  try {
    prev_content = fs.readFileSync(file_path, "utf8");
  } catch {
    prev_content = null;
  }
  if (prev_content === next_content) {
    console.log(`⏭️  Skipped ${label} (unchanged)`);
    return false;
  }
  fs.writeFileSync(file_path, next_content);
  console.log(`✅ Synced ${label}`);
  return true;
}

/**
 * Reconciles ignore files across all repository layers based on ignores.master.json.
 *
 * @param {string} [root_directory=ROOT_DIRECTORY]
 * @returns {{ written: number, skipped: number }}
 */
export function sync_workspace(root_directory = ROOT_DIRECTORY) {
  console.log("\n================================================================================");
  console.log("🎨  WORKSPACE SYNCHRONIZER (diff-then-write)");
  console.log("================================================================================\n");

  let written = 0;
  let skipped = 0;
  const tally = (did_write) => {
    if (did_write) written += 1;
    else skipped += 1;
  };

  const master_ignores_path = path.join(root_directory, "ignores.master.json");
  if (!fs.existsSync(master_ignores_path)) {
    console.error("❌ ignores.master.json not found. Aborting sync.");
    return { written, skipped };
  }

  const master_configuration = JSON.parse(fs.readFileSync(master_ignores_path, "utf8"));
  const common_patterns = master_configuration.common || [];

  console.log("📡 Reconciling Ignore Layers:");

  // 1a. ESLint Configuration
  const eslint_configuration_path = path.join(root_directory, "eslint.config.js");
  if (fs.existsSync(eslint_configuration_path)) {
    const eslint_content = fs.readFileSync(eslint_configuration_path, "utf8");
    const start_marker = "// @agent:ignore-start";
    const end_marker = "// @agent:ignore-end";
    const start_index = eslint_content.indexOf(start_marker);
    const end_index = eslint_content.indexOf(end_marker);

    if (start_index !== -1 && end_index !== -1) {
      const updated_eslint_content =
        eslint_content.slice(0, start_index + start_marker.length) +
        "\n    ignores: " +
        JSON.stringify(common_patterns, null, 2).replace(/\n/g, "\n    ") +
        ",\n    " +
        eslint_content.slice(end_index);
      tally(write_if_changed(eslint_configuration_path, updated_eslint_content, "eslint.config.js"));
    }
  }

  // 1b. Line-Based Ignore Files
  const line_based_files = [
    { file: ".gitignore", patterns: [...common_patterns, ...(master_configuration.gitignore || [])] },
    { file: ".antigravityignore", patterns: [...common_patterns, ...(master_configuration.antigravityignore || [])] },
    { file: ".markdownlintignore", patterns: [...common_patterns, ...(master_configuration.linters?.markdownlint || [])] },
    { file: ".prettierignore", patterns: [...common_patterns, ...(master_configuration.linters?.prettier || [])] },
    { file: ".stylelintignore", patterns: [...common_patterns, ...(master_configuration.linters?.stylelint || [])] },
  ];

  line_based_files.forEach((line_based_entry) => {
    const file_path = path.join(root_directory, line_based_entry.file);
    tally(write_if_changed(file_path, line_based_entry.patterns.join("\n") + "\n", line_based_entry.file));
  });

  // 1c. VSCode Settings
  const vscode_settings_path = path.join(root_directory, ".vscode", "settings.json");
  if (fs.existsSync(vscode_settings_path) && master_configuration.vscode) {
    let settings_object = {};
    try {
      settings_object = JSON.parse(fs.readFileSync(vscode_settings_path, "utf8"));
    } catch {
      console.warn("⚠️ Could not parse .vscode/settings.json, initializing clean object.");
    }

    if (master_configuration.vscode["files.exclude"]) {
      settings_object["files.exclude"] = master_configuration.vscode["files.exclude"];
    }

    const vscode_directory = path.dirname(vscode_settings_path);
    if (!fs.existsSync(vscode_directory)) fs.mkdirSync(vscode_directory, { recursive: true });

    tally(write_if_changed(vscode_settings_path, JSON.stringify(settings_object, null, 2) + "\n", ".vscode/settings.json"));
  }

  // 1d. JSConfig Configuration
  const jsconfig_path = path.join(root_directory, "jsconfig.json");
  if (fs.existsSync(jsconfig_path) && master_configuration.jsconfig?.exclude) {
    try {
      const jsconfig_object = JSON.parse(fs.readFileSync(jsconfig_path, "utf8"));
      jsconfig_object.exclude = master_configuration.jsconfig.exclude;
      tally(write_if_changed(jsconfig_path, JSON.stringify(jsconfig_object, null, 2) + "\n", "jsconfig.json"));
    } catch (parse_error) {
      console.warn(`⚠️ Could not sync jsconfig.json: ${parse_error.message}`);
    }
  }

  // 1e. Vitest Configuration
  const vitest_configuration_path = path.join(root_directory, "vitest.config.js");
  if (fs.existsSync(vitest_configuration_path) && master_configuration.vitest?.exclude) {
    const vitest_content = fs.readFileSync(vitest_configuration_path, "utf8");
    const start_marker = "// @agent:ignore-start";
    const end_marker = "// @agent:ignore-end";
    const start_index = vitest_content.indexOf(start_marker);
    const end_index = vitest_content.indexOf(end_marker);

    if (start_index !== -1 && end_index !== -1) {
      const updated_vitest_content =
        vitest_content.slice(0, start_index + start_marker.length) +
        "\n    exclude: " +
        JSON.stringify(master_configuration.vitest.exclude, null, 2).replace(/\n/g, "\n    ") +
        ",\n    " +
        vitest_content.slice(end_index);
      tally(write_if_changed(vitest_configuration_path, updated_vitest_content, "vitest.config.js"));
    }
  }

  console.log(`\n📊 SYNC COMPLETE: ${written} written, ${skipped} unchanged.\n`);
  return { written, skipped };
}

const is_main_execution = process.argv[1] && path.resolve(process.argv[1]).endsWith("sync-ignores.js");

if (is_main_execution) {
  sync_workspace();
}

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Split from workspace.js Pipeline 1. Added diff-then-write (write_if_changed) so
 *   no-update runs leave zero phantom diffs for the planning-handoff gate.
 */
