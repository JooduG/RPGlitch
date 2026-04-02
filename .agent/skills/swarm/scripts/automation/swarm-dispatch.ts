// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { findUpSync } from "find-up";
import type { IssueAnalysis } from "./types.js";
import { jules } from "@google/jules-sdk";
import { getGitRepoInfo, getCurrentBranch } from "./github/git.js";

const date = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" })
  .format(new Date())
  .replaceAll("-", "_");

const gitRoot = findUpSync(".git");
if (!gitRoot) {
  throw new Error("Could not find .git directory. Please run this script from within a git repository.");
}
const root = path.dirname(gitRoot);
const swarmDir = path.join(root, ".swarm", date);
const tasksPath = path.join(swarmDir, "issue_tasks.json");
const analysis = JSON.parse(await readFile(tasksPath, "utf-8")) as IssueAnalysis;
const { tasks } = analysis;

// Resolve repo info dynamically from git remote
const repoInfo = await getGitRepoInfo();
const baseBranch = process.env.SWARM_BASE_BRANCH ?? await getCurrentBranch();

// Pre-dispatch ownership validation
function validateOwnership(analysis: IssueAnalysis): void {
  const claimed = new Map<string, string>();
  for (const task of analysis.tasks) {
    const allFiles = [...task.files, ...task.new_files, ...(task.test_files ?? [])];
    for (const file of allFiles) {
      const existing = claimed.get(file);
      if (existing) {
        throw new Error(
          `Ownership conflict: "${file}" claimed by both "${existing}" and "${task.id}". These tasks must be merged.`
        );
      }
      claimed.set(file, task.id);
    }
  }
}

validateOwnership(analysis);
console.log(`✅ Ownership validated: ${analysis.tasks.length} tasks, no conflicts.`);

const sessions = await jules.all(tasks, task => ({
  prompt: task.prompt,
  source: {
    github: repoInfo.fullName,
    baseBranch,
  }
}))

const sessionResults: Array<{ taskId: string; sessionId: string }> = [];
for await (const session of sessions) {
  const taskId = tasks[sessionResults.length]?.id ?? "unknown";
  sessionResults.push({ taskId, sessionId: session.id });
  console.log(`Task ${taskId} → Session ${session.id}`);
}

// Write session mapping for swarm-merge.ts
const sessionsPath = path.join(swarmDir, "sessions.json");
await writeFile(sessionsPath, JSON.stringify(sessionResults, null, 2));
console.log(`📝 Session mapping written to ${sessionsPath}`);
