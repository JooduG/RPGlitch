#!/usr/bin/env node

import { execSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

// ESM replacement for __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try to import dotenv if available
let dotenv;
try {
  // Use dynamic import for optional dependency
  dotenv = await import("dotenv");
} catch (e) {
  // dotenv might not be installed in all environments
}

// --- GENERIC SETUP & UTILITIES ---
const REPO_ROOT = path.resolve(__dirname, "../..");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(
      `⚠️  File not found: ${path.relative(
        REPO_ROOT,
        filePath,
      )}. Returning empty object.`,
    );
    return {};
  }
  try {
    let content = fs.readFileSync(filePath, "utf8");
    if (content.trim() === "") {
      console.warn(
        `⚠️  File is empty: ${path.relative(
          REPO_ROOT,
          filePath,
        )}. Returning empty object.`,
      );
      return {};
    }
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
    return JSON.parse(content);
  } catch (e) {
    console.error(
      `❌  Could not parse JSON from ${path.relative(
        REPO_ROOT,
        filePath,
      )}. Returning empty object.`,
      e,
    );
    return {};
  }
}

function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`📝 Wrote ${path.relative(REPO_ROOT, filePath)}`);
}

function writeTextFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`📝 Wrote ${path.relative(REPO_ROOT, filePath)}`);
}

// --- SYNC LIBS LOGIC ---
async function syncLibs() {
  console.log("\n⬇️  Fetching and verifying local libs...");
  const LOCAL_LIBS_DIR = path.join(REPO_ROOT, "libs");
  const SOURCES = [
    {
      url: "https://unpkg.com/@picocss/pico@2.0.6/css/pico.min.css",
      file: "pico.min.css",
      sha256:
        "dd5fd5591afd81ee21dcc117ad85c014dc3f1f19dc2d7b7d101ea0acc29274c2",
    },
    {
      url: "https://unpkg.com/cash-dom@8.1.5/dist/cash.min.js",
      file: "cash.min.js",
      sha256:
        "9a044188efdb625c5e04d1220698c099927ff16bfb434c37cd7f04dd5ee1ae1f",
    },
    {
      url: "https://unpkg.com/dexie@4.0.7/dist/dexie.js",
      file: "dexie.js",
      sha256:
        "abf1352af0b3d46aa875be259fcee0454bfc7e95e5f8b22e071c19027b6a3b64",
    },
    {
      url: "https://unpkg.com/dexie@4.0.7/dist/dexie.min.js",
      file: "dexie.min.js",
      sha256:
        "03337c3ff922434111a698fc4c3a28da72d20fe543859ebae1a1421e42106f1e",
    },
    {
      url: "https://unpkg.com/dompurify@3.1.6/dist/purify.min.js",
      file: "purify.min.js",
      sha256:
        "c0845096a7c4a6741f362ac506c94c1c7d27dc603bcc1bf64a587f76f2dbe3a1",
    },
    {
      url: "https://unpkg.com/hyperscript.org@0.9.12/dist/_hyperscript.min.js",
      file: "_hyperscript.min.js",
      sha256:
        "cd737e9904a7eed1ee9639b75eb07915baad92961586d0a1fd6d998d24179de6",
    },
  ];

  const getFileChecksum = (filePath) =>
    crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

  const download = (url, dest, sha256) =>
    new Promise((resolve, reject) => {
      if (fs.existsSync(dest) && getFileChecksum(dest) === sha256)
        return resolve();
      const tmpDest = `${dest}.tmp`;
      const file = fs.createWriteStream(tmpDest);
      https
        .get(url, (res) => {
          if (res.statusCode !== 200) {
            file.close();
            if (fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest);
            return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          }
          res.pipe(file);
          file.on("finish", () => {
            file.close(() => {
              const actualHash = getFileChecksum(tmpDest);
              if (actualHash === sha256) {
                fs.renameSync(tmpDest, dest);
                resolve();
              } else {
                if (fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest);
                reject(
                  new Error(`Checksum mismatch for ${path.basename(dest)}.`),
                );
              }
            });
          });
        })
        .on("error", (err) => {
          if (fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest);
          reject(err);
        });
    });

  if (!fs.existsSync(LOCAL_LIBS_DIR))
    fs.mkdirSync(LOCAL_LIBS_DIR, { recursive: true });

  await Promise.all(
    SOURCES.map(async ({ url, file, sha256 }) => {
      const dest = path.join(LOCAL_LIBS_DIR, file);
      try {
        await download(url, dest, sha256);
        console.log(`✅ ${file}`);
      } catch (err) {
        console.error(`❌ Failed to fetch ${file}: ${err.message}`);
        process.exit(1);
      }
    }),
  );
  console.log("✅ Lib sync complete.");
}

// --- SYNC IGNORES LOGIC ---
function syncIgnores() {
  console.log("\n🔄 Syncing ignore files...");
  const masterIgnoresPath = path.join(REPO_ROOT, "ignores.master.json");
  const jsconfigPath = path.join(REPO_ROOT, "jsconfig.json");
  const settingsPath = path.join(REPO_ROOT, ".vscode", "settings.json");

  const masterIgnores = readJson(masterIgnoresPath);
  if (Object.keys(masterIgnores).length === 0) return;

  const header = "# Generated by scripts/sync.js – do not edit.\n";
  const getPatterns = (key) => masterIgnores[key] || [];

  writeTextFile(
    path.join(REPO_ROOT, ".gitignore"),
    header + getPatterns("gitignore").join("\n") + "\n",
  );

  writeTextFile(
    path.join(REPO_ROOT, ".stylelintignore"),
    header + (masterIgnores.linters?.stylelint || []).join("\n") + "\n",
  );

  writeTextFile(
    path.join(REPO_ROOT, ".htmlhintignore"),
    header + (masterIgnores.linters?.htmlhint || []).join("\n") + "\n",
  );

  writeTextFile(
    path.join(REPO_ROOT, ".prettierignore"),
    header + (masterIgnores.linters?.prettier || []).join("\n") + "\n",
  );

  const markdownlintConfigPath = path.join(
    REPO_ROOT,
    ".markdownlint-cli2.jsonc",
  );
  const markdownlintConfig = readJson(markdownlintConfigPath);
  markdownlintConfig.ignores = Array.from(
    new Set([...(masterIgnores.linters?.markdownlint || [])]),
  ).sort();
  writeJson(markdownlintConfigPath, markdownlintConfig);

  const jsconfig = readJson(jsconfigPath);
  jsconfig.compilerOptions = jsconfig.compilerOptions || {};
  jsconfig.exclude = Array.from(
    new Set(["node_modules", ...(masterIgnores.gitignore || [])]),
  ).sort();
  writeJson(jsconfigPath, jsconfig);

  const settings = readJson(settingsPath);
  settings["files.exclude"] = masterIgnores.vscode?.filesExclude || {};
  writeJson(settingsPath, settings);

  console.log("✅ Ignore files sync process complete.");
}

// --- SYNC MCP LOGIC ---
function syncMcp() {
  console.log("\n🔄 Syncing MCP configurations...");
  const masterMcpPath = path.join(REPO_ROOT, "mcp.master.json");
  const envPath = path.join(REPO_ROOT, ".env");
  const masterMcp = readJson(masterMcpPath);
  if (Object.keys(masterMcp).length === 0) return;

  const envMap =
    fs.existsSync(envPath) && dotenv
      ? { ...process.env, ...dotenv.default.parse(fs.readFileSync(envPath)) } // Note: dotenv.default for ESM default import
      : { ...process.env };

  const substituteEnvVariables = (obj) =>
    JSON.parse(
      JSON.stringify(obj).replace(
        /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
        (match, key) => envMap[key] || match,
      ),
    );

  const resolvedMcp = substituteEnvVariables(masterMcp);

  writeJson(path.join(REPO_ROOT, "mcp.json"), resolvedMcp);
  console.log("✅ MCP sync complete.");
}

// --- SYNC MCP TO CLAUDE CODE CLI ---
function syncMcpToClaudeCode() {
  console.log("\n🔄 Syncing MCP servers to Claude Code CLI...");
  const mcpJsonPath = path.join(REPO_ROOT, "mcp.json");

  if (!fs.existsSync(mcpJsonPath)) {
    console.log("⚠️  mcp.json not found. Run sync:mcp first.");
    return;
  }

  const mcpConfig = readJson(mcpJsonPath);
  const servers = mcpConfig.mcpServers || {};

  if (Object.keys(servers).length === 0) {
    console.log("⚠️  No MCP servers found in mcp.json");
    return;
  }

  let successCount = 0;
  let existsCount = 0;
  let failCount = 0;

  for (const [name, config] of Object.entries(servers)) {
    try {
      console.log(`  Adding ${name}...`);
      const jsonString = JSON.stringify(config);
      const command = `claude mcp add-json "${name}" ${JSON.stringify(
        jsonString,
      )}`;
      execSync(command, { stdio: "pipe" });

      successCount++;
      console.log(`    ✅ Added`);
    } catch (error) {
      const errorMsg = error.message || "";
      if (errorMsg.includes("already exists")) {
        existsCount++;
        console.log(`    ⏭️  Already exists (skipped)`);
      } else {
        failCount++;
        console.error(`    ❌ Failed:`, errorMsg.split("\n")[0]);
      }
    }
  }

  console.log(
    `\n✅ Complete: ${successCount} added, ${existsCount} already existed, ${failCount} failed`,
  );

  if (failCount === 0) {
    console.log("🎉 All MCP servers synced to Claude Code CLI!");
    console.log("   Restart Claude Code to see the changes.");
  } else {
    console.log(
      "⚠️  Some servers failed. Check errors above and add manually if needed.",
    );
  }
}

// --- SYNC COLORS FROM config.js TO _variables.scss ---
function syncColors() {
  console.log(
    "\n🎨 Syncing signature colors from config.js to _variables.scss...",
  );

  const configPath = path.join(REPO_ROOT, "src/gamemaster/config.js");
  const scssPath = path.join(
    REPO_ROOT,
    "src/mesmer/scss/abstracts/_variables.scss",
  );

  if (!fs.existsSync(configPath)) {
    console.error("❌ config.js not found");
    return;
  }

  if (!fs.existsSync(scssPath)) {
    console.error("❌ _variables.scss not found");
    return;
  }

  // Read config.js and extract PALETTE
  const configContent = fs.readFileSync(configPath, "utf8");
  const paletteMatch = configContent.match(/PALETTE:\s*\{([^}]+)\}/s);

  if (!paletteMatch) {
    console.error("❌ Could not find PALETTE in config.js");
    return;
  }

  // Parse palette entries: key: "value" or key: "#value"
  const paletteEntries = {};
  const entryRegex = /(\w+):\s*["']([^"']+)["']/g;
  let match;
  while ((match = entryRegex.exec(paletteMatch[1])) !== null) {
    paletteEntries[match[1]] = match[2];
  }

  console.log(`  Found ${Object.keys(paletteEntries).length} palette colors`);

  // Read SCSS and update signature colors
  let scssContent = fs.readFileSync(scssPath, "utf8");

  // Update each signature color variable
  let updatedCount = 0;
  for (const [name, hex] of Object.entries(paletteEntries)) {
    if (name === "default") continue; // Skip default, it's an alias

    const varName = `$signature-${name}`;
    const regex = new RegExp(`(\\${varName}:\\s*)#[0-9a-fA-F]{6}`, "g");

    if (regex.test(scssContent)) {
      scssContent = scssContent.replace(regex, `$1${hex}`);
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    fs.writeFileSync(scssPath, scssContent, "utf8");
    console.log(
      `✅ Updated ${updatedCount} signature colors in _variables.scss`,
    );
  } else {
    console.log("ℹ️  No colors needed updating (already in sync)");
  }
}
async function main() {
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.split("=");
    acc[key.replace("--", "")] = value === undefined ? true : value;
    return acc;
  }, {});

  const runAll = args.all || Object.keys(args).length === 0;

  if (runAll || args.libs) await syncLibs();

  if (runAll || args.ignores) syncIgnores();
  if (runAll || args.mcp) syncMcp();
  if (runAll || args.colors) syncColors();
  if (args.claude) syncMcpToClaudeCode();
}

main().catch((err) => {
  console.error("❌ An error occurred during the sync process:", err);
  process.exit(1);
});
