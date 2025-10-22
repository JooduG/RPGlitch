#!/usr/bin/env node

import fs from "fs";
import path from "path";
import https from "https";
import crypto from "crypto";
import { execSync } from "child_process";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// --- GENERIC SETUP & UTILITIES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(
      `⚠️  File not found: ${path.relative(
        REPO_ROOT,
        filePath
      )}. Returning empty object.`
    );
    return {}; // Return empty object instead of null
  }
  try {
    let content = fs.readFileSync(filePath, "utf8");
    if (content.trim() === "") {
      console.warn(
        `⚠️  File is empty: ${path.relative(
          REPO_ROOT,
          filePath
        )}. Returning empty object.`
      );
      return {}; // Handle empty file
    }
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
    return JSON.parse(content);
  } catch (e) {
    console.error(
      `❌  Could not parse JSON from ${path.relative(
        REPO_ROOT,
        filePath
      )}. Returning empty object.`,
      e
    );
    return {}; // Return empty object on parse error
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
  const LOCAL_LIBS_DIR = path.join(REPO_ROOT, "build", "local_libs");
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
                  new Error(`Checksum mismatch for ${path.basename(dest)}.`)
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
    })
  );
  console.log("✅ Lib sync complete.");
}



// --- SYNC IGNORES LOGIC ---
function syncIgnores() {
  console.log("\n🔄 Syncing ignore files...");
  const masterIgnoresPath = path.join(
    REPO_ROOT,
    "build",
    "config",
    "ignores.master.json"
  );
  const jsconfigPath = path.join(REPO_ROOT, "jsconfig.json");
  const settingsPath = path.join(REPO_ROOT, ".vscode", "settings.json");

  const masterIgnores = readJson(masterIgnoresPath);
  if (Object.keys(masterIgnores).length === 0) return;

  const header = "# Generated by build/scripts/sync.js – do not edit.\n";
  const getPatterns = (key) => masterIgnores[key] || [];

  writeTextFile(
    path.join(REPO_ROOT, ".gitignore"),
    header + getPatterns("gitignore").join("\n") + "\n"
  );

  writeTextFile(
    path.join(REPO_ROOT, ".stylelintignore"),
    header + (masterIgnores.linters?.stylelint || []).join("\n") + "\n"
  );

  const jsconfig = readJson(jsconfigPath); // No || {} needed due to improved readJson
  jsconfig.compilerOptions = jsconfig.compilerOptions || {};
  jsconfig.exclude = Array.from(
    new Set([
      "node_modules",
      ...getPatterns("gitignore"),
      ...getPatterns("ide"),
    ])
  ).sort();
  writeJson(jsconfigPath, jsconfig);

  const settings = readJson(settingsPath); // No || {} needed
  settings["files.exclude"] = masterIgnores.vscode?.filesExclude || {};
  writeJson(settingsPath, settings);

  console.log("✅ Ignore files sync process complete.");
}

// --- SYNC MCP LOGIC ---
function syncMcp() {
  console.log("\n🔄 Syncing MCP configurations...");
  const masterMcpPath = path.join(
    REPO_ROOT,
    "build",
    "config",
    "mcp.master.json"
  );
  const envPath = path.join(REPO_ROOT, ".env");
  const masterMcp = readJson(masterMcpPath);
  if (Object.keys(masterMcp).length === 0) return;

  const envMap = fs.existsSync(envPath)
    ? { ...process.env, ...dotenv.parse(fs.readFileSync(envPath)) }
    : { ...process.env };

  const substituteEnvVariables = (obj) =>
    JSON.parse(
      JSON.stringify(obj).replace(
        /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
        (match, key) => envMap[key] || match
      )
    );

  const resolvedMcp = substituteEnvVariables(masterMcp);

  writeJson(path.join(REPO_ROOT, "mcp.json"), resolvedMcp);
  console.log("✅ MCP sync complete.");
}

// --- GENERATE HUB LOGIC ---
function generateHub() {
  console.log("\n🧭 Generating Hub file...");
  const OUTPUT_DIR = path.join(REPO_ROOT, "build", "output");
  const HUB_FILE = path.join(OUTPUT_DIR, "hub.md");
  const JEST_RESULT_FILE = path.join(OUTPUT_DIR, ".jest-result.json");
  const PKG_FILE = path.join(REPO_ROOT, "package.json");

  const getRepoTree = () => {
    const exclude = [
      /node_modules/,
      /\.git/,
      /\.vscode/,
      /build\/local_libs/,
      /^\.yarn/,
    ];
    const output = [];
    const hubFileDir = path.join(REPO_ROOT, "build", "output");

    function walk(dir, depth) {
      if (depth > 2) return;
      let entries;
      try {
        entries = fs
          .readdirSync(dir, { withFileTypes: true })
          .filter((entry) => !exclude.some((rx) => rx.test(entry.name)))
          .sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
          });
      } catch {
        return;
      }

      entries.forEach((entry) => {
        const prefix = "  ".repeat(depth) + "- ";
        if (entry.isDirectory()) {
          output.push(prefix + `**${entry.name}/**`);
          walk(path.join(dir, entry.name), depth + 1);
        } else if (entry.name.endsWith(".md")) {
          const fullPath = path.join(dir, entry.name);
          const linkPath = path
            .relative(hubFileDir, fullPath)
            .replace(/\\/g, "/");
          output.push(prefix + `[${entry.name}](${linkPath})`);
        }
      });
    }
    walk(REPO_ROOT, 0);
    return output.join("\n");
  };

  const getTestStats = () => {
    try {
      if (fs.existsSync(JEST_RESULT_FILE)) {
        const results = JSON.parse(fs.readFileSync(JEST_RESULT_FILE, "utf8"));
        const { numTotalTests, numPassedTests } = results;
        return `${numPassedTests}/${numTotalTests} passed`;
      }
    } catch {}
    return "No test results found.";
  };

  const getCombinedDocsLinks = () => {
    if (!fs.existsSync(OUTPUT_DIR)) return [];
    return fs
      .readdirSync(OUTPUT_DIR)
      .filter((f) => f.startsWith("combined-") && f.endsWith(".md"))
      .map(
        (f) => `  - [${f.replace("combined-", "").replace(".md", "")}](./${f})`
      )
      .join("\n");
  };

  const getPackageScripts = () => {
    try {
      const pkg = JSON.parse(fs.readFileSync(PKG_FILE, "utf8"));
      const scripts = pkg.scripts || {};
      const important = ["deploy", "test", "lint", "build:apps", "sync"];
      return important
        .filter((key) => scripts[key])
        .map((key) => `**\`npm run ${key}\`**: \`${scripts[key]}\``)
        .join("\n");
    } catch {
      return "Could not load scripts.";
    }
  };

  const content = `
# 🧭 Hub: Repository Overview
- **🧪 Tests:** ${getTestStats()}
- **Last updated:** ${new Date().toUTCString()}
---
## Repository Map
\`\`\`
${getRepoTree()}
\`\`\`
---
## 📚 Combined Documentation
${getCombinedDocsLinks()}
---
## ⚡️ Common Commands
${getPackageScripts()}
`;
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(HUB_FILE, content.trim() + "\n", "utf8");
  console.log(
    `✅ Hub file generated at: ${path.relative(REPO_ROOT, HUB_FILE)}`
  );
}

// --- MAIN CLI LOGIC ---
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
  if (runAll || args.hub) generateHub();
}

main().catch((err) => {
  console.error("❌ An error occurred during the sync process:", err);
  process.exit(1);
});
