import { Octokit } from "octokit";
import { config } from "dotenv";
import {
  getGitRepoInfo,
  getCurrentBranch,
} from "../.agent/skills/swarm/scripts/automation/github/git.js";

async function create_pr() {
  try {
    config(); // Load .env
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN not found in environment");

    const repo_info = await getGitRepoInfo();
    const branch = await getCurrentBranch();

    const octokit = new Octokit({ auth: token });
    const { data: pr } = await octokit.rest.pulls.create({
      owner: repo_info.owner,
      repo: repo_info.repo,
      title: "feat: repository restructuring and node.js transition",
      body: `### Overview
Consolidated all root-level automation scripts into their respective .agent/skills/ directories and migrated from Bun to Node.js.

### Highlights
- **Nomenclature**: Unified engine naming to "Swarm".
- **Runtime**: Transitioned from Bun to Node.js using tsx for Type-Safe execution.
- **Refactor**: Replaced Bun APIs with standard node:fs/promises equivalents.
- **Hygiene**: Cleaned up and categorized the .env template.`,
      head: branch,
      base: "main",
    });
    console.log("✅ PR Created: " + pr.html_url);
  } catch (err: any) {
    console.error("❌ Error:", err.response?.data?.message || err.message);
    process.exit(1);
  }
}

create_pr();
