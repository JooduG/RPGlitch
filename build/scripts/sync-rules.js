#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// --- PATHS ---
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_RULES_DIR = path.join(REPO_ROOT, 'rules');
const TARGET_DIRS = [
    path.join(REPO_ROOT, '.cursor', 'rules'),
    path.join(REPO_ROOT, '.windsurf', 'rules'),
    path.join(REPO_ROOT, '.amazonq', 'rules'),
];

// --- UTILITY ---
function copyDirectory(sourceDir, targetDir) {
    try {
        if (!fs.existsSync(sourceDir)) {
            console.warn(`- Source directory not found, skipping: ${sourceDir}`);
            return;
        }
        // Nuke and pave: remove old directory to ensure perfect sync
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.cpSync(sourceDir, targetDir, { recursive: true });
        console.log(`✅ Synced rules to ${path.relative(REPO_ROOT, targetDir)}`);
    } catch (error) {
        console.error(`❌ Error syncing rules to ${targetDir}:`, error);
    }
}

// --- MAIN LOGIC ---
function syncAllRules() {
    console.log('🔄 Syncing rules directories...');
    TARGET_DIRS.forEach(target => copyDirectory(SOURCE_RULES_DIR, target));
    console.log('✅ Rules directories synced.');
}

syncAllRules();
