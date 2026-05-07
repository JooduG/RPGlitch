import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import type { IssueAnalysis } from "./types.js";
import { getGitRepoInfo, getCurrentBranch } from "./github/git.js";
import { get_swarm_dir } from "./utils.js";
import { swarm } from "../swarm-engine.js";
import type { DispatchResult, SwarmTask, InputTask } from "../swarm-types.js";

const swarm_dir = await get_swarm_dir();
const tasks_path = path.join(swarm_dir, "issue_tasks.json");
const analysis = JSON.parse(await readFile(tasks_path, "utf-8")) as IssueAnalysis;
const { tasks } = analysis;

// Resolve repo info dynamically from git remote
const repo_info = await getGitRepoInfo();
const base_branch = process.env.SWARM_BASE_BRANCH ?? (await getCurrentBranch());

// Pre-dispatch ownership validation
function validateOwnership(input: IssueAnalysis): void {
  const claimed = new Map<string, string>();
  for (const task of input.tasks) {
    const allFiles = [...task.files, ...task.new_files, ...(task.test_files ?? [])];
    for (const file of allFiles) {
      const existing = claimed.get(file);
      if (existing) {
        throw new Error(
          `Ownership conflict: "${file}" claimed by both "${existing}" and "${task.id}". These tasks must be merged.`,
        );
      }
      claimed.set(file, task.id);
    }
  }
}

validateOwnership(analysis);
console.log(`✅ Ownership validated: ${analysis.tasks.length} tasks, no conflicts.`);

console.log(`🚀 Dispatching swarm for ${repo_info.fullName} (${tasks.length} tasks)...`);

const results: DispatchResult = await swarm.dispatch_manifest(tasks, {
  base_branch,
  repo_full_name: repo_info.fullName,
  delay_ms: 1000,
});

const sessionResults = results.results.map((task: SwarmTask) => ({
  taskId: task.id,
  sessionId: task.sessionId,
}));

for (const res of sessionResults) {
  console.log(`Task ${res.taskId} → Session ${res.sessionId}`);
}

// Write session mapping for swarm_merge.ts
const sessions_path = path.join(swarm_dir, "sessions.json");
await writeFile(sessions_path, JSON.stringify(sessionResults, null, 2));
console.log(`📝 Session mapping written to ${sessions_path}`);
