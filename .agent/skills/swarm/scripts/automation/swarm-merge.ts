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
import { jules } from "@google/jules-sdk";
import type { IssueAnalysis, Task } from "./types.js";
import { getGitRepoInfo, getCurrentBranch } from "./github/git.js";
import { get_swarm_dir } from "./utils.js";

const repo_info = await getGitRepoInfo();
const OWNER = repo_info.owner;
const REPO = repo_info.repo;
const BASE_BRANCH = process.env.SWARM_BASE_BRANCH ?? (await getCurrentBranch());
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Re-dispatch configuration
const MAX_RETRIES = Number(process.env.SWARM_MAX_RETRIES ?? 2);
const PR_POLL_INTERVAL_MS = 30_000;
const PR_POLL_TIMEOUT_MS = 15 * 60 * 1000;

if (!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN environment variable is required.");
}

const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
} as const;

const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

const swarm_dir = await get_swarm_dir();

// Load task ordering (already sorted by risk in the analysis phase)
const analysis = JSON.parse(
  await readFile(path.join(swarm_dir, "issue_tasks.json"), "utf-8"),
) as IssueAnalysis;

// Load session mapping written by swarm_dispatch.ts
const sessions = JSON.parse(
  await readFile(path.join(swarm_dir, "sessions.json"), "utf-8"),
) as Array<{
  taskId: string;
  sessionId: string;
}>;

interface GitHubPR {
  number: number;
  head: { ref: string };
  body: string | null;
}

// Find open PRs created by swarm sessions
async function findSwarmPRs() {
  const res = await fetch(`${API}/pulls?state=open&per_page=100`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch PRs (${res.status}): ${await res.text()}`);
  const pulls = (await res.json()) as GitHubPR[];

  const prMap = new Map<string, GitHubPR>();
  for (const session of sessions) {
    const matchingPR = pulls.find(
      (pr: GitHubPR) =>
        pr.head.ref.includes(session.sessionId) || pr.body?.includes(session.sessionId),
    );
    if (matchingPR) {
      prMap.set(session.taskId, matchingPR);
    }
  }
  return prMap;
}

interface CheckRun {
  status: string;
  conclusion: string | null;
}

async function waitForCI(prNumber: number, maxWaitMs = 10 * 60 * 1000): Promise<boolean> {
  const start = Date.now();

  // First, get the head SHA for this PR
  const prRes = await fetch(`${API}/pulls/${prNumber}`, { headers });
  if (!prRes.ok)
    throw new Error(`Failed to fetch PR #${prNumber} (${prRes.status}): ${await prRes.text()}`);
  const prData = (await prRes.json()) as { head: { sha: string } };
  const head_sha = prData.head.sha;

  let checks_found = false;
  let attempts_without_checks = 0;
  const MAX_ATTEMPTS_WITHOUT_CHECKS = 3;

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${API}/commits/${head_sha}/check-runs`, { headers });
    if (!res.ok)
      throw new Error(
        `Failed to fetch check-runs for ${head_sha} (${res.status}): ${await res.text()}`,
      );
    const data = (await res.json()) as { check_runs: CheckRun[] };

    if (data.check_runs.length === 0) {
      if (!checks_found && attempts_without_checks < MAX_ATTEMPTS_WITHOUT_CHECKS) {
        attempts_without_checks++;
        console.log(
          `  ℹ️  No check runs found yet for PR #${prNumber} (attempt ${attempts_without_checks}/${MAX_ATTEMPTS_WITHOUT_CHECKS}). Waiting...`,
        );
        await new Promise((r) => setTimeout(r, 10_000));
        continue;
      }
      console.log(`  ℹ️  No check runs found for PR #${prNumber}. Proceeding without CI.`);
      return true;
    }

    checks_found = true;

    const allComplete = data.check_runs.every((run: CheckRun) => run.status === "completed");
    const allPassed = data.check_runs.every(
      (run: CheckRun) => run.conclusion === "success" || run.conclusion === "skipped",
    );

    if (allComplete && allPassed) return true;
    if (allComplete && !allPassed) return false;

    console.log(`  ⏳ CI still running for PR #${prNumber}... waiting 30s`);
    await new Promise((r) => setTimeout(r, 30_000));
  }
  console.log(`  ⏰ CI timeout for PR #${prNumber}`);
  return false;
}

// Re-dispatch a task as a new Jules session against current main
async function redispatchTask(task: Task, oldPr: GitHubPR): Promise<GitHubPR> {
  // Close the conflicting PR
  console.log(`  🔒 Closing conflicting PR #${oldPr.number}...`);
  const close_res = await fetch(`${API}/pulls/${oldPr.number}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      state: "closed",
      body: `${oldPr.body ?? ""}\n\n---\n⚠️ Closed by swarm-merge: merge conflict detected. Task re-dispatched as a new session.`,
    }),
  });
  if (!close_res.ok)
    throw new Error(
      `Failed to close PR #${oldPr.number} (${close_res.status}): ${await close_res.text()}`,
    );

  // Create a new Jules session with the same prompt
  console.log(`  🚀 Re-dispatching task "${task.id}" against current ${BASE_BRANCH}...`);
  const session = await jules.session({
    prompt: task.prompt,
    source: {
      github: `${OWNER}/${REPO}`,
      baseBranch: BASE_BRANCH,
    },
  });
  console.log(`  📝 New session: ${session.id}`);

  // Update sessions.json with new session ID
  const session_entry = sessions.find((s) => s.taskId === task.id);
  if (session_entry) {
    session_entry.sessionId = session.id;
    const sessions_path = path.join(swarm_dir, "sessions.json");
    await writeFile(sessions_path, JSON.stringify(sessions, null, 2));
  }

  // Poll for the new PR
  console.log(`  ⏳ Waiting for new PR from session ${session.id}...`);
  const start = Date.now();
  while (Date.now() - start < PR_POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, PR_POLL_INTERVAL_MS));
    const res = await fetch(`${API}/pulls?state=open&per_page=100`, { headers });
    if (!res.ok) throw new Error(`Failed to poll PRs (${res.status}): ${await res.text()}`);
    const pulls = (await res.json()) as GitHubPR[];
    const newPr = pulls.find(
      (pr: GitHubPR) => pr.head.ref.includes(session.id) || pr.body?.includes(session.id),
    );
    if (newPr) {
      console.log(`  ✅ New PR #${newPr.number} found (${newPr.head.ref})`);
      return newPr;
    }
    console.log(`  ⏳ No PR yet... polling again in 30s`);
  }
  throw new Error(`Timed out waiting for new PR from re-dispatched session ${session.id}`);
}

// Main: sequential merge in task order
const pr_map = await findSwarmPRs();

console.log(`Found ${pr_map.size}/${analysis.tasks.length} swarm PRs`);
for (const [taskId, pr] of pr_map) {
  console.log(`  ${taskId} → PR #${pr.number} (${pr.head.ref})`);
}

if (pr_map.size !== analysis.tasks.length) {
  throw new Error(
    `Expected ${analysis.tasks.length} PRs but found ${pr_map.size}. All PRs must be ready before merging.`,
  );
}

for (const task of analysis.tasks) {
  let pr = pr_map.get(task.id);
  if (!pr) {
    throw new Error(`No PR found for task "${task.id}". Aborting.`);
  }

  let retry_count = 0;
  let merged = false;

  while (!merged) {
    console.log(
      `\n📦 Processing Task "${task.id}" → PR #${pr!.number}${retry_count > 0 ? ` (retry ${retry_count})` : ""}`,
    );

    // Update branch from base before merging (skip for first PR on first attempt)
    if (analysis.tasks.indexOf(task) > 0 || retry_count > 0) {
      console.log(`  🔄 Updating PR #${pr!.number} branch from ${BASE_BRANCH}...`);
      const update_res = await fetch(`${API}/pulls/${pr!.number}/update-branch`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      if (!update_res.ok) {
        const body = await update_res.text();
        if (update_res.status === 422) {
          if (retry_count >= MAX_RETRIES) {
            console.error(
              `  ❌ Conflict persists after ${MAX_RETRIES} retries. Human intervention required.`,
            );
            console.error(`  PR: https://github.com/${OWNER}/${REPO}/pull/${pr!.number}`);
            throw new Error(
              `Merge conflict persists for task "${task.id}" after ${MAX_RETRIES} retries.`,
            );
          }
          console.log(`  ⚠️ Merge conflict detected. Re-dispatching task "${task.id}"...`);
          pr = await redispatchTask(task, pr!);
          retry_count++;
          continue;
        }
        throw new Error(`Update branch failed (${update_res.status}): ${body}`);
      }
      // Wait for the update to propagate
      await new Promise((r) => setTimeout(r, 5_000));
    }

    // Wait for CI to pass
    console.log(`  🧪 Waiting for CI on PR #${pr!.number}...`);
    const ciPassed = await waitForCI(pr!.number);
    if (!ciPassed) {
      throw new Error(`CI failed for PR #${pr!.number}. Aborting sequential merge.`);
    }

    // Merge with retry
    console.log(`  ✅ CI passed. Merging PR #${pr!.number}...`);
    let merge_success = false;
    let merge_attempts = 0;
    const MAX_MERGE_ATTEMPTS = 3;

    while (merge_attempts < MAX_MERGE_ATTEMPTS && !merge_success) {
      merge_attempts++;
      const merge_res = await fetch(`${API}/pulls/${pr!.number}/merge`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ merge_method: "squash" }),
      });

      if (merge_res.ok) {
        merge_success = true;
      } else {
        const body = await merge_res.text();
        console.error(`  ⚠️ Attempt ${merge_attempts} failed to merge PR #${pr!.number}: ${body}`);
        if (merge_attempts < MAX_MERGE_ATTEMPTS) {
          console.log(`  🔄 Retrying merge in 5s...`);
          await new Promise((r) => setTimeout(r, 5000));
        } else {
          throw new Error(
            `Failed to merge PR #${pr!.number} after ${MAX_MERGE_ATTEMPTS} attempts: ${body}`,
          );
        }
      }
    }
    console.log(`  🎉 PR #${pr!.number} merged successfully.`);
    merged = true;
  }
}

console.log(`\n✅ All ${analysis.tasks.length} PRs merged sequentially. No conflicts.`);
