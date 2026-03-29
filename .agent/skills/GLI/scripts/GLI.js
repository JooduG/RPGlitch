#!/usr/bin/env node

/**
 * GLI - Glitch CLI (RPGlitch AI-Native CLI)
 * Spec Version: v0.1 (Agent-Friendly)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const flags = {
  human: args.includes('--human'),
  agent: args.includes('--agent'),
  brief: args.includes('--brief'),
  help: args.includes('--help') || args.includes('-h'),
  yes: args.includes('--yes'),
  dryRun: args.includes('--dry-run')
};

// Default to agent mode unless --human is specified
const isAgent = !flags.human;

// Helper to output structured data
function output(data) {
  if (isAgent) {
    // Agent-friendly JSON output
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  } else {
    // Human-friendly output logic
    if (typeof data === 'string') {
      console.log(data);
    } else {
      console.table(data.result || data);
    }
  }
}

// Helper for structured errors
function error(code, message, suggestion) {
  const errBody = {
    error: true,
    code,
    message,
    suggestion
  };
  if (isAgent) {
    console.error(JSON.stringify(errBody, null, 2));
  } else {
    console.error(`\x1b[31m[ERROR ${code}]\x1b[0m ${message}`);
    if (suggestion) console.error(`\x1b[34m[SUGGESTION]\x1b[0m ${suggestion}`);
  }
  process.exit(code === 'USAGE_ERROR' ? 2 : 1);
}

// Metadata for self-description
const META = {
  name: "GLI",
  description: "General Logistics Interface",
  version: "0.1.0",
  commands: [
    { name: "review", description: "Perform an AI-driven PR review" },
    { name: "triage", description: "Analyze issues and TODOs" },
    { name: "test", description: "Run smart test selection" },
    { name: "brief", description: "Display CLI identity" }
  ]
};

// Command Router
async function main() {
  const command = args.find(a => !a.startsWith('-'));

  if (flags.help || !command) {
    output(META);
    return;
  }

  if (flags.brief || command === 'brief') {
    const briefPath = path.join(__dirname, '..', 'references', 'brief.md');
    if (fs.existsSync(briefPath)) {
      output(fs.readFileSync(briefPath, 'utf8'));
    } else {
      error('NOT_FOUND', 'agent/brief.md not found', 'Run gli setup to initialize agent directory');
    }
    return;
  }

  switch (command) {
    case 'review':
      await handleReview();
      break;
    case 'triage':
      await handleTriage();
      break;
    case 'test':
      await handleTest();
      break;
    default:
      error('USAGE_ERROR', `Unknown command: ${command}`, 'Use --help to see available commands');
  }
}

async function handleReview() {
  output({ result: "Review logic pending implementation", status: "STUB" });
}

async function handleTriage() {
  output({ result: "Triage logic pending implementation", status: "STUB" });
}

async function handleTest() {
  output({ result: "Test selection logic pending implementation", status: "STUB" });
}

main().catch(err => {
  error('INTERNAL_ERROR', err.message);
});
