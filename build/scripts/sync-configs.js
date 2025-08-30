/**
 * @fileoverview This script synchronizes configuration files across the workspace.
 * It reads master configuration files and distributes them to various locations,
 * ensuring consistency for linters, IDEs, and other development tools.
 *
 * Key Functions:
 * - Syncs ignore files (.gitignore, .eslintignore, etc.) from a master JSON file.
 * - Manages and syncs MCP (Model Context Protocol) server configurations.
 * - Copies development rules to IDE-specific directories.
 * - Handles environment variable substitution for client-specific configs.
 */

const fs = require('fs');
const path = require('path');

// --- Constants: Define all paths in one place for easy maintenance ---

const ROOT_DIR = path.resolve(__dirname, '../../');

const PATHS = {
  // Source configurations
  configDir: path.join(ROOT_DIR, 'build', 'config'),
  masterIgnores: path.join(ROOT_DIR, 'build', 'config', 'ignores.master.json'),
  masterRules: path.join(ROOT_DIR, 'rules'),
  masterMcp: path.join(ROOT_DIR, 'build', 'config', 'mcp.master.json'),
  toolsMcp: path.join(ROOT_DIR, 'tools', 'mcp.json'),
  masterCodacy: path.join(ROOT_DIR, 'build', 'config', 'codacy'),
  envFile: path.join(ROOT_DIR, '.env'),

  // Target IDE and tool directories
  vscodeDir: path.join(ROOT_DIR, '.vscode'),
  geminiDir: path.join(ROOT_DIR, '.gemini'),
  cursorDir: path.join(ROOT_DIR, '.cursor'),
  windsurfDir: path.join(ROOT_DIR, '.windsurf'),
  amazonqDir: path.join(ROOT_DIR, '.amazonq'),
  codacyDir: path.join(ROOT_DIR, '.codacy'),

  // Target files
  gitignore: path.join(ROOT_DIR, '.gitignore'),
  cursorignore: path.join(ROOT_DIR, '.cursorignore'),
  basicmemoryignore: path.join(ROOT_DIR, '.basicmemoryignore'),
  geminiignore: path.join(ROOT_DIR, '.geminiignore'),
  eslintIgnore: path.join(ROOT_DIR, 'build', 'config', 'ignore.eslint.json'),
  stylelintIgnore: path.join(ROOT_DIR, 'build', 'config', '.stylelintignore'),
  htmlhintIgnore: path.join(ROOT_DIR, 'build', 'config', '.htmlhintignore'),
  markdownlintIgnore: path.join(ROOT_DIR, 'build', 'config', '.markdownlintignore'),
  vscodeSettings: path.join(ROOT_DIR, '.vscode', 'settings.json'),
  geminiSettings: path.join(ROOT_DIR, '.gemini', 'settings.json'),
  rootMcp: path.join(ROOT_DIR, 'mcp.json'),
};

// --- File System Utilities ---

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The path to the directory.
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Reads a JSON file and returns its content.
 * @param {string} filePath - The path to the JSON file.
 * @param {any} [fallback={}] - The value to return if the file doesn't exist or is invalid.
 * @returns {object} The parsed JSON object.
 */
function readJson(filePath, fallback = {}) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    // console.warn(`Warning: Could not read JSON file at ${filePath}. Returning fallback.`, error.message);
    return fallback;
  }
}

/**
 * Writes text content to a file.
 * @param {string} filePath - The path to the file.
 * @param {string} content - The content to write.
 */
function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`📝 Wrote ${path.relative(ROOT_DIR, filePath)}`);
}

/**
 * Writes a JavaScript object to a JSON file.
 * @param {string} filePath - The path to the file.
 * @param {object} data - The object to serialize and write.
 */
function writeJson(filePath, data) {
  writeText(filePath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Recursively copies a directory.
 * @param {string} sourceDir - The source directory path.
 * @param {string} targetDir - The target directory path.
 * @param {object} [options={}] - Options for copying.
 * @param {string[]} [options.fileExtensions] - Optional array of file extensions to include.
 * @param {string[]} [options.exclude] - Optional array of file/directory names to exclude.
 */
function copyDirectory(sourceDir, targetDir, options = {}) {
  if (!fs.existsSync(sourceDir)) return;

  ensureDir(targetDir);
  const { fileExtensions, exclude = [] } = options;
  const files = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const file of files) {
    if (exclude.includes(file.name)) continue;

    const sourcePath = path.join(sourceDir, file.name);
    const targetPath = path.join(targetDir, file.name);

    if (file.isDirectory()) {
      copyDirectory(sourcePath, targetPath, options);
    } else if (!fileExtensions || fileExtensions.some(ext => file.name.endsWith(ext))) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`↳ Copied ${path.relative(ROOT_DIR, targetPath)}`);
    }
  }
}

// --- Core Logic ---

/**
 * Synchronizes various ignore files from the master configuration.
 */
function syncIgnoreFiles() {
  console.log('\n🔄 Syncing ignore files...');
  const masterIgnores = readJson(PATHS.masterIgnores);
  const header = '# Generated by build/scripts/sync-configs-v2.js – Do not edit.\n';

  // Helper to write an ignore file from a given source array in the master config
  const writeIgnoreFile = (filePath, sourceArray) => {
    if (Array.isArray(sourceArray) && sourceArray.length > 0) {
      writeText(filePath, header + sourceArray.join('\n') + '\n');
    }
  };

  writeIgnoreFile(PATHS.gitignore, masterIgnores.gitignore);
  writeIgnoreFile(PATHS.cursorignore, masterIgnores.cursorignore);
  writeIgnoreFile(PATHS.basicmemoryignore, masterIgnores.basicmemoryignore);
  writeIgnoreFile(PATHS.stylelintIgnore, masterIgnores.stylelintIgnore);
  writeIgnoreFile(PATHS.htmlhintIgnore, masterIgnores.htmlhintIgnore);
  writeIgnoreFile(PATHS.markdownlintIgnore, masterIgnores.markdownlintIgnore);

  // ESLint uses a JSON format
  if (masterIgnores.eslintIgnore) {
    writeJson(PATHS.eslintIgnore, { ignorePatterns: masterIgnores.eslintIgnore });
  }

  // Gemini uses cursorignore as a fallback
  const geminiIgnores = masterIgnores.geminiignore || masterIgnores.cursorignore || [];
  writeIgnoreFile(PATHS.geminiignore, geminiIgnores);

  // Update VS Code settings with markdownlint ignores
  const settings = readJson(PATHS.vscodeSettings, {});
  settings['markdownlint.ignore'] = masterIgnores.markdownlintIgnore || [];
  writeJson(PATHS.vscodeSettings, settings);
}

/**
 * Loads and merges MCP configurations from master and tools files.
 * @returns {object} The resolved MCP configuration.
 */
function resolveMcpConfig() {
    const masterConfig = readJson(PATHS.masterMcp, { mcpServers: {} });
    const toolsConfig = readJson(PATHS.toolsMcp, { mcpServers: {} });

    // Start with the master config and merge in any tools that are not already defined
    const resolvedServers = { ...toolsConfig.mcpServers, ...masterConfig.mcpServers };

    // Standardize the basic-memory path
    if (resolvedServers['basic-memory']?.env) {
        resolvedServers['basic-memory'].env.BASIC_MEMORY_PROJECT_ROOT = path.join(ROOT_DIR, 'memory-bank');
    }

    return { ...masterConfig, mcpServers: resolvedServers };
}

/**
 * Substitutes environment variables in a configuration object.
 * @param {object} config - The configuration object.
 * @returns {object} The configuration with variables substituted.
 */
function substituteEnvVariables(config) {
    const envContent = fs.existsSync(PATHS.envFile) ? fs.readFileSync(PATHS.envFile, 'utf8') : '';
    const envFromFile = Object.fromEntries(
        envContent.split('\n').map(line => line.match(/^\s*([^=]+)=(.*)\s*$/)).filter(Boolean).map(match => [match[1], match[2]])
    );

    const envMap = { ...envFromFile, ...process.env };
    const configString = JSON.stringify(config);

    const substitutedString = configString.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, key) => {
        return envMap[key] || `\${${key}}`; // Keep placeholder if var not found
    });

    return JSON.parse(substitutedString);
}


/**
 * Synchronizes MCP and other development configurations.
 */
function syncDevConfigs() {
  console.log('\n🔄 Syncing development configs (Rules, MCP)...');

  // 1. Copy Rules
  const ruleOptions = { fileExtensions: ['.md', '.mdc'], exclude: ['templates'] };
  copyDirectory(PATHS.masterRules, path.join(PATHS.cursorDir, 'rules'), ruleOptions);
  copyDirectory(PATHS.masterRules, path.join(PATHS.windsurfDir, 'rules'), ruleOptions);
  copyDirectory(PATHS.masterRules, path.join(PATHS.amazonqDir, 'rules'), ruleOptions);

  // 2. Copy Codacy Configs
  copyDirectory(PATHS.masterCodacy, PATHS.codacyDir);

  // 3. Resolve and Distribute MCP Configs
  const masterMcp = resolveMcpConfig();
  const clientMcp = substituteEnvVariables(masterMcp);

  // Create the compatibility alias for clients that need "servers"
  const clientMcpWithAlias = {
    ...clientMcp,
    servers: clientMcp.mcpServers,
  };

  // Write substituted configs to untracked IDE locations
  writeJson(path.join(PATHS.vscodeDir, 'mcp.json'), clientMcpWithAlias);
  writeJson(path.join(PATHS.cursorDir, 'mcp.json'), clientMcpWithAlias);
  writeJson(path.join(PATHS.windsurfDir, 'mcp.json'), clientMcpWithAlias);

  // Write the master (unsubstituted) config to the root mcp.json for tracking
  writeJson(PATHS.rootMcp, { ...masterMcp, servers: masterMcp.mcpServers });
  
  // Update Gemini settings carefully
  const geminiSettings = readJson(PATHS.geminiSettings);
  geminiSettings.mcpServers = clientMcp.mcpServers;
  writeJson(PATHS.geminiSettings, geminiSettings);
}


/**
 * Main function to run all synchronization tasks.
 */
function main() {
  console.log('Starting workspace configuration sync...');
  syncIgnoreFiles();
  syncDevConfigs();
  console.log('\n✅ All configurations synchronized successfully!');
}

main();
