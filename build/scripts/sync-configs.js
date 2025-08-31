#!/usr/bin/env node
/**
 * Syncs all workspace configurations from a single source of truth.
 * - Reads master configs for ignores and MCP servers.
 * - Generates .gitignore, IDE-specific ignore files, and linter ignores.
 * - Syncs rules and MCP configs to all IDE folders.
 * - Injects secrets from `.env` into client-side MCP configs.
 * - Updates jsconfig.json with shared ignore patterns.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- PATHS ---
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PATHS = {
  build: {
    config: path.join(REPO_ROOT, 'build', 'config'),
    output: path.join(REPO_ROOT, 'build', 'output'),
  },
  sources: {
    masterIgnores: path.join(REPO_ROOT, 'build', 'config', 'ignores.master.json'),
    masterMcp: path.join(REPO_ROOT, 'build', 'config', 'mcp.master.json'),
    masterRules: path.join(REPO_ROOT, 'rules'),
    env: path.join(REPO_ROOT, '.env'),
  },
  targets: {
    gitignore: path.join(REPO_ROOT, '.gitignore'),
    cursorignore: path.join(REPO_ROOT, '.cursorignore'),
    geminiignore: path.join(REPO_ROOT, '.geminiignore'),
    basicmemoryignore: path.join(REPO_ROOT, '.basicmemoryignore'),
    jsconfig: path.join(REPO_ROOT, 'jsconfig.json'),
    eslintIgnore: path.join(REPO_ROOT, 'build', 'config', 'ignore.eslint.json'),
    stylelintIgnore: path.join(REPO_ROOT, 'build', 'config', '.stylelintignore'),
    htmlhintIgnore: path.join(REPO_ROOT, 'build', 'config', '.htmlhintignore'),
    markdownlintIgnore: path.join(REPO_ROOT, 'build', 'config', '.markdownlintignore'),
    vscode: {
      dir: path.join(REPO_ROOT, '.vscode'),
      settings: path.join(REPO_ROOT, '.vscode', 'settings.json'),
      mcp: path.join(REPO_ROOT, '.vscode', 'mcp.json'),
    },
    cursor: {
      rules: path.join(REPO_ROOT, '.cursor', 'rules'),
      mcp: path.join(REPO_ROOT, '.cursor', 'mcp.json'),
    },
    windsurf: {
      rules: path.join(REPO_ROOT, '.windsurf', 'rules'),
      mcp: path.join(REPO_ROOT, '.windsurf', 'mcp.json'),
    },
    amazonq: {
      rules: path.join(REPO_ROOT, '.amazonq', 'rules'),
    },
    gemini: {
      dir: path.join(REPO_ROOT, '.gemini'),
      settings: path.join(REPO_ROOT, '.gemini', 'settings.json'),
    },
    rootMcp: path.join(REPO_ROOT, 'mcp.json'),
  },
};

// --- UTILITY FUNCTIONS ---

function readJson(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1); // Strip BOM
    const jsonString = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Strip comments
    return JSON.parse(jsonString);
  } catch (err) {
    console.warn(`⚠️  Could not read or parse JSON from ${path.relative(REPO_ROOT, filePath)}.`);
    return null;
  }
}

function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`📝 Wrote ${path.relative(REPO_ROOT, filePath)}`);
}

function writeTextFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`📝 Wrote ${path.relative(REPO_ROOT, filePath)}`);
}

function copyDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return;
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file.name);
    const targetPath = path.join(targetDir, file.name);
    if (file.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`↳ Copied ${path.relative(REPO_ROOT, targetPath)}`);
    }
  }
}

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(?:(?:"((?:[^"\\]|\\.)*)")|(?:\'((?:[^'\\]|\\.)*)\')|((?:[^\s#]|\\s)+))?\s*(?:#.*)?$/);
    if (match) {
      const [, key, doubleQuoted, singleQuoted, unquoted] = match;
      env[key] = doubleQuoted ?? singleQuoted ?? unquoted ?? '';
    }
  }
  return env;
}

function substituteEnvVariables(obj, envMap) {
  const replacer = (val) => String(val).replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, key) => envMap[key] ?? `\${${key}}`);
  const walk = (val) => {
    if (Array.isArray(val)) return val.map(walk);
    if (val && typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) out[k] = walk(v);
      return out;
    }
    return typeof val === 'string' ? replacer(val) : val;
  };
  return walk(obj);
}

// --- SYNC LOGIC ---

function syncIgnoreFiles(masterIgnores) {
  console.log('\n🔄 Syncing ignore files...');
  const header = '# Generated by build/scripts/sync-configs.js – do not edit.\n';
  
  const getPatterns = (key) => masterIgnores[key]?.patterns || [];

  writeTextFile(PATHS.targets.gitignore, header + getPatterns('gitignore').join('\n') + '\n');
  writeTextFile(PATHS.targets.cursorignore, header + getPatterns('ide').join('\n') + '\n');
  writeTextFile(PATHS.targets.geminiignore, header + getPatterns('ide').join('\n') + '\n');
  writeTextFile(PATHS.targets.basicmemoryignore, header + getPatterns('memory').join('\n') + '\n');

  // Linters
  writeJson(PATHS.targets.eslintIgnore, { ignorePatterns: masterIgnores.linters?.eslint || [] });
  writeTextFile(PATHS.targets.stylelintIgnore, header + (masterIgnores.linters?.stylelint || []).join('\n') + '\n');
  writeTextFile(PATHS.targets.htmlhintIgnore, header + (masterIgnores.linters?.htmlhint || []).join('\n') + '\n');
  writeTextFile(PATHS.targets.markdownlintIgnore, header + (masterIgnores.linters?.markdownlint || []).join('\n') + '\n');
  
  // Sync to jsconfig.json
  const jsconfig = readJson(PATHS.targets.jsconfig) || { compilerOptions: {}, exclude: [] };
  jsconfig.exclude = [...new Set(['node_modules', ...(getPatterns('gitignore')), ...(getPatterns('ide'))])];
  writeJson(PATHS.targets.jsconfig, jsconfig);

  // Sync to VS Code settings
  const settings = readJson(PATHS.targets.vscode.settings) || {};
  settings['markdownlint.ignore'] = masterIgnores.linters?.markdownlint || [];
  writeJson(PATHS.targets.vscode.settings, settings);
}

function syncDevConfigs(masterIgnores) {
  console.log('\n🔄 Syncing development configs (Rules, MCP)...');
  
  // Sync Rules
  copyDirectory(PATHS.sources.masterRules, PATHS.targets.cursor.rules);
  copyDirectory(PATHS.sources.masterRules, PATHS.targets.windsurf.rules);
  copyDirectory(PATHS.sources.masterRules, PATHS.targets.amazonq.rules);

  // Sync MCP
  const masterMcp = readJson(PATHS.sources.masterMcp);
  if (!masterMcp) {
      console.warn('⚠️  Master MCP config not found or invalid. Skipping MCP sync.');
      return;
  }

  const envMap = { ...process.env, ...loadEnvFile(PATHS.sources.env) };
  const clientMcp = substituteEnvVariables(masterMcp, envMap);

  // Add compatibility alias for clients expecting `servers`
  clientMcp.servers = clientMcp.mcpServers;
  
  writeJson(PATHS.targets.vscode.mcp, clientMcp);
  writeJson(PATHS.targets.cursor.mcp, clientMcp);
  writeJson(PATHS.targets.windsurf.mcp, clientMcp);
  writeJson(PATHS.targets.rootMcp, masterMcp); // Write unresolved to root for version control

  // Safely update Gemini settings
  const geminiSettings = readJson(PATHS.targets.gemini.settings) || {};
  geminiSettings.mcpServers = clientMcp.mcpServers || {};
  writeJson(PATHS.targets.gemini.settings, geminiSettings);
}


// --- MAIN EXECUTION ---

(function main() {
  console.log('Starting workspace configuration sync...');
  const masterIgnores = readJson(PATHS.sources.masterIgnores);

  if (masterIgnores) {
    syncIgnoreFiles(masterIgnores);
  } else {
    console.warn('⚠️  Master ignores config not found. Skipping ignore file sync.');
  }
  
  syncDevConfigs();

  console.log('\n✅ All configurations synchronized successfully!');
})();
