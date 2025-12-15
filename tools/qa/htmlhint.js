#!/usr/bin/env node
/**
 * Run HTMLHint from the project root directory.
 *
 * It correctly locates .htmlhintrc and .htmlhintignore in the root.
 */
const path = await import("path");
const { fileURLToPath } = await import("url");
const { spawnSync } = await import("child_process");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the root of the repository
// tools/qa -> tools -> root
const ROOT = path.resolve(__dirname, "../..");

// Get the user's file glob (defaulting to all HTML files in apps/)
const userGlob = process.argv[2] || "apps/**/*.html";

// Arguments passed directly to HTMLHint
const args = [
  // Use the user's glob as provided
  userGlob,
  "--config",
  // The config file is expected to be in the root (ROOT)
  path.join(ROOT, ".htmlhintrc"),
];

// Execute htmlhint from the ROOT directory to correctly pick up .htmlhintignore.
console.log(`Running HTMLHint from: ${ROOT}`);
console.log(`Checking files: ${userGlob}`);

const res = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["-y", "htmlhint", ...args],
  {
    stdio: "inherit",
    cwd: ROOT,
    env: process.env,
  },
);

process.exit(res.status ?? 0);
