/**
 * .agents/skills/graph-it-live/scripts/scan-dead-code.js
 * Runs `graph-it tool scan_dead_code --format json` and filters out `.svelte`
 * template / `export *` barrel false positives using comment-stripped source checks.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");

/**
 * Strips JS/CSS/HTML comments so JSDoc mentions don't count as code references.
 * @param {string} source
 * @returns {string}
 */
function strip_comments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\/\/.*$/gm, " ");
}

/**
 * Recursively collects all `.js` and `.svelte` files under `dir`.
 * @param {string} dir
 * @returns {Array<{ rel: string, code: string }>}
 */
function load_source_files(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...load_source_files(full));
    } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".svelte"))) {
      const rel = path.relative(ROOT, full).replace(/\\/g, "/");
      results.push({ rel, code: strip_comments(fs.readFileSync(full, "utf8")) });
    }
  }
  return results;
}

function main() {
  const raw = execSync("graph-it tool scan_dead_code --format json", { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });

  // `graph-it` may print a status line before the JSON payload.
  const json_start = raw.indexOf("{");
  if (json_start === -1) {
    console.error("Failed to parse JSON output from graph-it.");
    process.exit(1);
  }
  const report = JSON.parse(raw.slice(json_start));
  const files = load_source_files(SRC_DIR);

  const unreferenced = [];
  const internal_only = [];
  let filtered_false_positives = 0;

  for (const entry of report.entries || []) {
    const raw_path = path.isAbsolute(entry.filePath) ? path.relative(ROOT, entry.filePath) : entry.filePath;
    const file_rel = raw_path.replace(/\\/g, "/");
    const own_file = files.find((f) => f.rel === file_rel);

    for (const sym of entry.unusedSymbols || []) {
      const test_re = new RegExp(`\\b${sym.name}\\b`);
      const match_re = new RegExp(`\\b${sym.name}\\b`, "g");
      const used_elsewhere = files.some((f) => f.rel !== file_rel && test_re.test(f.code));
      if (used_elsewhere) {
        filtered_false_positives++;
        continue;
      }

      const own_hits = own_file ? (own_file.code.match(match_re) || []).length : 0;
      const item = { file: file_rel, line: sym.line, name: sym.name, kind: sym.category || sym.kind };
      if (own_hits > 1) {
        internal_only.push(item);
      } else {
        unreferenced.push(item);
      }
    }
  }

  console.log(`\nDead-Code Audit (${report.scannedFiles} files scanned, ${filtered_false_positives} .svelte/barrel false positives filtered)\n`);

  console.log(`Truly Unreferenced (${unreferenced.length}):`);
  for (const item of unreferenced) {
    console.log(`  - ${item.file}:${item.line}  ${item.name} (${item.kind})`);
  }

  console.log(`\nInternal-Only Exports (${internal_only.length}):`);
  for (const item of internal_only) {
    console.log(`  - ${item.file}:${item.line}  ${item.name} (${item.kind})`);
  }
}

main();
