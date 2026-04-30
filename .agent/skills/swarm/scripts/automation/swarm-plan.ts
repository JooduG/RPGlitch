import { jules } from "@google/jules-sdk";
import { getGitRepoInfo, getCurrentBranch, getGitContext } from "./github/git.js";
import { swarm } from "../swarm-engine.js";
import { getIssuesAsMarkdown } from "./github/markdown.js";
import { analyzeIssuesPrompt } from "./prompts/analyze-issues.js";
import { get_formatted_date, get_git_root } from "./utils.js";
import type { PlanData, ProgressData, AgentMessageData } from "../swarm-types.js";

const repo_info = await getGitRepoInfo();
const base_branch = process.env.SWARM_BASE_BRANCH ?? (await getCurrentBranch());
const issues_markdown = await getIssuesAsMarkdown();
const git_context = await getGitContext();
const prompt = `${git_context}\n\n--- TASK BORDER ---\n\n${analyzeIssuesPrompt({
  issuesMarkdown: issues_markdown,
  repoFullName: repo_info.fullName,
})}`;

console.log(`🔍 Planning swarm for ${repo_info.fullName} (branch: ${base_branch})`);

const session = await jules.session({
  prompt,
  source: {
    github: repo_info.fullName,
    baseBranch: base_branch,
  },
  autoPr: true,
});

console.log(`✅ Planner session started: ${session.id}`);

await swarm.logStream(session, {
  planGenerated: (data: PlanData) => console.log(`📋 Plan Generated:\n${data.plan}`),
  progressUpdated: (data: ProgressData) =>
    console.log(`⏳ Progress: ${data.percent}% - ${data.message}`),
  agentMessaged: (data: AgentMessageData) => console.log(`💬 Agent: ${data.message}`),
});
