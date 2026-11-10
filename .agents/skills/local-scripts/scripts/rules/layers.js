/**
 * .agents/skills/local-scripts/scripts/rules/layers.js
 * 🏛️ LAYER RULE PACK — Strict Layer Boundary Enforcement Gate.
 *
 * Moved from audit-layers.js (logic unchanged, now importable).
 * Verifies imports flow DOWNWARD (lateral imports within the same rank allowed):
 * src/ui/ (4) -> src/engine/ + src/data/ (2) -> src/media/ + src/utils/ (1)
 *
 * Upward imports are prohibited:
 * - src/engine/ CANNOT import from src/ui/
 * - src/data/ CANNOT import from src/ui/
 * - src/media/, src/utils/ CANNOT import from data, engine, or ui
 */

import fs from "fs";
import path from "path";

export const LAYER_HIERARCHY = Object.freeze({
  "src/ui": 4,
  "src/engine": 2,
  "src/data": 2,
  "src/media": 1,
  "src/utils": 1,
});

export const ALIAS_LAYER_MAP = Object.freeze({
  "@ui": "src/ui",
  "@primitives": "src/ui",
  "@data": "src/data",
  "@engine": "src/engine",
  "@media": "src/media",
  "@utils": "src/utils",
});

/**
 * Returns the layer key for a given file path.
 * @param {string} file_path
 * @returns {string|null}
 */
export function get_file_layer(file_path) {
  const normalized = file_path.replace(/\\/g, "/");
  for (const layer of Object.keys(LAYER_HIERARCHY)) {
    if (normalized.includes(`/${layer}/`) || normalized.startsWith(`${layer}/`)) {
      return layer;
    }
  }
  return null;
}

/**
 * Recursively scans directory for source files (.js, .svelte).
 * @param {string} dir
 * @returns {string[]}
 */
export function walk_dir(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full_path = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
        files = files.concat(walk_dir(full_path));
      }
    } else if ((entry.name.endsWith(".js") || entry.name.endsWith(".svelte")) && !entry.name.endsWith(".test.js")) {
      files.push(full_path);
    }
  }
  return files;
}

/**
 * Audits all source files in src/ for architectural layer violations.
 * @param {string} [root_dir=process.cwd()]
 * @returns {Array<{ file: string, file_layer: string, specifier: string, imported_layer: string }>}
 */
export function audit_layers(root_dir = process.cwd()) {
  const src_dir = path.join(root_dir, "src");
  const files = walk_dir(src_dir);

  const violations = [];

  for (const file of files) {
    const relative_path = path.relative(root_dir, file).replace(/\\/g, "/");
    const file_layer = get_file_layer(relative_path);
    if (!file_layer) continue;

    const file_rank = LAYER_HIERARCHY[file_layer];
    const raw_content = fs.readFileSync(file, "utf8");
    // Strip block and line comments to avoid matching @typedef JSDoc or commented out imports
    const content = raw_content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

    // Match static and dynamic import statements
    const import_regex = /(?:import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"])|(?:import\(['"]([^'"]+)['"]\))/g;
    let match;

    while ((match = import_regex.exec(content)) !== null) {
      const specifier = match[1] || match[2];
      if (!specifier) continue;

      let imported_layer = null;

      // Check alias imports
      for (const [alias, mapped_layer] of Object.entries(ALIAS_LAYER_MAP)) {
        if (specifier === alias || specifier.startsWith(`${alias}/`)) {
          imported_layer = mapped_layer;
          break;
        }
      }

      // Check relative imports
      if (!imported_layer && specifier.startsWith(".")) {
        const target_path = path.resolve(path.dirname(file), specifier);
        const rel_target = path.relative(root_dir, target_path).replace(/\\/g, "/");
        imported_layer = get_file_layer(rel_target);
      }

      // If imported layer found, check rank
      if (imported_layer && LAYER_HIERARCHY[imported_layer] !== undefined) {
        const imported_rank = LAYER_HIERARCHY[imported_layer];

        // Violation: imported file layer rank is higher than importing file layer rank
        if (imported_rank > file_rank) {
          violations.push({
            file: relative_path,
            file_layer,
            specifier,
            imported_layer,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Moved from audit-layers.js into the layers rule pack. Added @engine to
 *   ALIAS_LAYER_MAP (was missing although @engine is a live vite/vitest/jsconfig alias).
 *   audit_layers() now takes root_dir and RETURNS violations (CLI reporting moved to audit.js).
 */
