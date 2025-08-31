#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// --- PATHS ---
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CONFIG_SOURCE_DIR = path.join(REPO_ROOT, 'build', 'config');

// --- CONFIGURATION MAPPING ---
const CONFIG_MAP = [
    // Simple copies (overwrite)
    { type: 'copy', src: '.htmlhintrc', dest: 'build/config/.htmlhintrc' },
    { type: 'copy', src: '.markdownlint.json', dest: 'build/config/.markdownlint.json' },
    { type: 'copy', src: 'eslint.config.mjs', dest: 'eslint.config.mjs' },
    { type: 'copy', src: 'stylelint.config.js', dest: 'stylelint.config.js' },
    { type: 'copy', src: 'jest.config.js', dest: 'jest.config.js' },


    // Surgical merges (read, update, write)
    { type: 'merge', src: 'vscode.settings.json', dest: '.vscode/settings.json' },
    { type: 'merge', src: 'gemini.settings.json', dest: '.gemini/settings.json' },
    { type: 'merge', src: 'amazonq.chat-preferences.json', dest: '.amazonq/chat-preferences.json' },
];

// --- UTILITIES ---
function readJson(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        const jsonString = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        return JSON.parse(jsonString);
    } catch (err) {
        console.warn(`⚠️  Could not read/parse ${path.relative(REPO_ROOT, filePath)}.`);
        return null;
    }
}

function writeJson(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`📝 Synced ${path.relative(REPO_ROOT, filePath)}`);
}

function copyFile(sourcePath, destPath) {
    const destDir = path.dirname(destPath);
    ensureDirectoryExists(destDir);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`📝 Synced ${path.relative(REPO_ROOT, destPath)}`);
}

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// --- MAIN LOGIC ---
function syncAllConfigs() {
    console.log('Syncing tool and IDE configuration files...');
    for (const mapping of CONFIG_MAP) {
        const sourcePath = path.join(CONFIG_SOURCE_DIR, mapping.src);
        const destPath = path.join(REPO_ROOT, mapping.dest);

        if (!fs.existsSync(sourcePath)) {
            console.warn(`- Skipping: Master config not found at ${sourcePath}`);
            continue;
        }

        try {
            if (mapping.type === 'copy') {
                copyFile(sourcePath, destPath);
            } else if (mapping.type === 'merge') {
                const sourceData = readJson(sourcePath);
                const destData = readJson(destPath) || {};
                
                if (sourceData) {
                    // Using Object.assign for a clean, dependency-free deep merge effect for JSON
                    const mergedData = Object.assign({}, destData, sourceData);
                    writeJson(destPath, mergedData);
                }
            }
        } catch (error) {
            console.error(`❌ Error syncing ${mapping.dest}:`, error);
        }
    }
    console.log('Configuration file sync process complete.');
}

syncAllConfigs();
