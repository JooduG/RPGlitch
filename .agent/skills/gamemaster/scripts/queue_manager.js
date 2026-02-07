#!/usr/bin/env node

/**
 * 🧱 Queue Manager
 * Persists task state to .agent/tasks/queue.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const QUEUE_FILE = path.join(PROJECT_ROOT, '.agent/tasks/queue.json');

// --- Operations ---

function init() {
  if (!fs.existsSync(QUEUE_FILE)) {
    const initial = {
      active: null,
      pending: [],
      history: []
    };
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(initial, null, 2));
    console.log(`✅ Queue initialized at ${QUEUE_FILE}`);
  } else {
    console.log(`ℹ️  Queue already exists at ${QUEUE_FILE}`);
  }
}

function status() {
  if (!fs.existsSync(QUEUE_FILE)) {
    console.log("⚠️  No queue found. Run 'init' first.");
    return;
  }
  const data = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  console.log("--- 🚦 Queue Status ---");
  console.log(`▶️  Active:  ${data.active ? data.active : "None"}`);
  console.log(`playlist  Pending: ${data.pending.length}`);
  console.log(`✅ History: ${data.history.length}`);
}

// --- CLI Dispatch ---

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'init':
    init();
    break;
  case 'status':
    status();
    break;
  default:
    console.log("Usage: node queue_manager.js [init|status]");
}
