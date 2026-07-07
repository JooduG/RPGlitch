#!/usr/bin/env node

import { jules } from '@google/jules-sdk';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';
import { execSync } from 'child_process';

const SWARM_DIR = path.resolve(process.cwd(), '.agents/skills/swarm');
const SESSIONS_FILE = path.join(SWARM_DIR, 'sessions.json');
const ROOT_DIR = process.cwd();
const TASKS_DIR = path.join(ROOT_DIR, 'tasks');
const TRACKS_DIR = path.join(TASKS_DIR, 'tracks');

const REPO_SLUG = process.env.GITHUB_REPOSITORY || 'JooduG/RPGlitch';
const BASE_BRANCH = process.env.GITHUB_REF_NAME || 'main';

async function init() {
  await fs.mkdir(SWARM_DIR, { recursive: true });
}

function parseArgs(args) {
  const parsed = { positional: [], options: {} };
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      parsed.options[key] = val !== undefined ? val : true;
    } else {
      parsed.positional.push(arg);
    }
  }
  return parsed;
}

async function getActiveTrack() {
  try {
    // Check FUTURE.md for the active track
    const future = await fs.readFile(path.join(TASKS_DIR, 'FUTURE.md'), 'utf-8');
    const match = future.match(/- \[~\] \[(.*?)\]\(.*?\)/) || future.match(/- \[~\] (.*)/);
    if (match) {
      const slugMatch = match[1].match(/[a-zA-Z0-9-]+/);
      if (slugMatch) return slugMatch[0];
    }
    // Fallback: list tracks and pick newest
    const files = await fs.readdir(TRACKS_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    if (mdFiles.length > 0) {
      let newest = mdFiles[0];
      let newestTime = 0;
      for (const f of mdFiles) {
        const stat = await fs.stat(path.join(TRACKS_DIR, f));
        if (stat.mtimeMs > newestTime) {
          newestTime = stat.mtimeMs;
          newest = f;
        }
      }
      return newest.replace('.md', '');
    }
  } catch (e) {
    console.error("Error detecting active track:", e);
  }
  return null;
}

async function getTrackFile(trackId) {
  let id = trackId;
  if (!id) {
    id = await getActiveTrack();
    if (!id) {
      console.error("No track provided and no active track detected.");
      process.exit(1);
    }
    console.log(`[info] Auto-detected active track: ${id}`);
  }
  const trackPath = path.join(TRACKS_DIR, `${id}.md`);
  try {
    await fs.access(trackPath);
    return trackPath;
  } catch {
    console.error(`Track file not found: ${trackPath}`);
    process.exit(1);
  }
}

async function parseTasksMarkdown(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  // Find the # FUTURE section
  const lines = content.split('\n');
  const tasks = [];
  let currentTask = null;
  let inFutureSection = false;

  for (const line of lines) {
    if (line.match(/^##?\s+FUTURE/)) {
      inFutureSection = true;
      continue;
    }
    // Exit if we hit another H1 or H2
    if (inFutureSection && line.match(/^##?\s+/) && !line.includes('FUTURE')) {
      inFutureSection = false;
      continue;
    }

    if (!inFutureSection) continue;

    const match = line.match(/^[-*]\s+\[([xX\s])\]\s+(.*)/);
    if (match) {
      if (currentTask) tasks.push(currentTask);
      currentTask = {
        checked: match[1].toLowerCase() === 'x',
        prompt: match[2].trim(),
        files: []
      };
    } else if (currentTask && line.trim().startsWith('- Files:')) {
      const filesStr = line.replace('- Files:', '').trim();
      const files = [...filesStr.matchAll(/`([^`]+)`/g)].map(m => m[1]);
      currentTask.files = files;
    } else if (currentTask && line.trim() !== '') {
      currentTask.prompt += '\n' + line.trim();
    }
  }
  if (currentTask) tasks.push(currentTask);
  return tasks;
}

async function commandPlan() {
  console.log(`[plan] Use the standard '/01-plan' workflow to initialize tracks in tasks/tracks/`);
  console.log(`Example: Run 'npm run swarm:dispatch my-feature' once the track is planned.`);
}

async function commandDispatch(args) {
  const { positional, options } = parseArgs(args);
  const trackId = positional[0];
  const trackFile = await getTrackFile(trackId);
  
  const tasks = await parseTasksMarkdown(trackFile);
  const selected = tasks.filter(t => t.checked);
  
  if (selected.length === 0) {
    console.error(`[dispatch] No tasks selected. Check boxes using '- [x]' under the '# FUTURE' section in ${trackFile}`);
    process.exit(1);
  }

  let workflowInjection = "";
  if (options.workflow) {
    const wfPath = path.resolve(ROOT_DIR, options.workflow);
    try {
      workflowInjection = await fs.readFile(wfPath, 'utf-8');
      console.log(`[info] Injected workflow from ${options.workflow}`);
    } catch {
      console.error(`⚠️ Could not read workflow file: ${wfPath}. Proceeding without workflow injection.`);
    }
  }

  console.log(`🚀 Dispatching ${selected.length} tasks via Jules...`);
  const client = jules.with({ apiKey: process.env.JULES_API_KEY });
  
  const sessionsList = [];
  const sessions = await client.all(selected, (task) => {
    let finalPrompt = task.prompt;
    if (workflowInjection) {
      finalPrompt = `You must STRICTLY follow this workflow:\n\n---\n${workflowInjection}\n---\n\nYour task is:\n${task.prompt}`;
    }
    
    return {
      prompt: finalPrompt,
      files: task.files,
      source: { github: REPO_SLUG, baseBranch: BASE_BRANCH },
      autoPr: true
    };
  }, { concurrency: 5 });

  for (const s of sessions) {
    sessionsList.push({ id: s.id, prompt: s.prompt });
  }

  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessionsList, null, 2));
  console.log(`✅ Dispatched ${sessionsList.length} sessions. Sessions saved to ${SESSIONS_FILE}`);
}

async function commandStatus() {
  let sessions;
  try {
    sessions = JSON.parse(await fs.readFile(SESSIONS_FILE, 'utf-8'));
  } catch {
    console.log('[status] No active sessions found.');
    return;
  }
  const client = jules.with({ apiKey: process.env.JULES_API_KEY });
  
  for (const s of sessions) {
    const sessionInfo = await client.getSession(s.id);
    console.log(`Session: ${s.id} | Status: ${sessionInfo.state}`);
  }
}

async function commandMerge() {
  let sessions;
  try {
    sessions = JSON.parse(await fs.readFile(SESSIONS_FILE, 'utf-8'));
  } catch {
    console.error('[merge] No sessions found.');
    return;
  }

  for (const s of sessions) {
    const branchName = `jules/session-${s.id}`;
    console.log(`\n======================================`);
    console.log(`Attempting to merge session ${s.id}...`);
    
    try {
      execSync(`git fetch origin ${branchName}`);
      execSync(`git merge origin/${branchName} --no-commit`);
      console.log(`✅ Merged session ${s.id} successfully!`);
    } catch (_e) {
      console.error(`⚠️ Merge conflict or error on session ${s.id}.`);
      console.log(`Please resolve conflicts in your IDE, stage the files, and press ENTER to continue...`);
      process.stdin.resume();
      await new Promise(resolve => process.stdin.once('data', resolve));
      process.stdin.pause();
    }
  }
}

async function commandCancel() {
  let sessions;
  try {
    sessions = JSON.parse(await fs.readFile(SESSIONS_FILE, 'utf-8'));
  } catch {
    console.log('[cancel] No active sessions to cancel.');
    return;
  }
  const client = jules.with({ apiKey: process.env.JULES_API_KEY });
  
  for (const s of sessions) {
    await client.cancelSession(s.id);
    console.log(`Cancelled session ${s.id}`);
  }
}

async function main() {
  await init();
  const args = process.argv.slice(2);
  const cmd = args[0];

  switch(cmd) {
    case 'plan': await commandPlan(); break;
    case 'dispatch': await commandDispatch(args.slice(1)); break;
    case 'status': await commandStatus(); break;
    case 'merge': await commandMerge(); break;
    case 'cancel': await commandCancel(); break;
    default:
      console.log(`Usage: node cli.js <plan|dispatch|status|merge|cancel> [--workflow=<path>] [track_id]`);
  }
}

main().catch(e => {
  console.error("Fatal Error:", e);
  process.exit(1);
});
