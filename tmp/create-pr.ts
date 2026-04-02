import { Octokit } from "octokit";
import { readFile } from "node:fs/promises";

async function createPR() {
  try {
    const envContent = await readFile(".env", "utf-8");
    const tokenMatch = envContent.match(/^GITHUB_TOKEN=(.*)/m);
    if (!tokenMatch) throw new Error("GITHUB_TOKEN not found in .env");
    const token = tokenMatch[1].trim();

    const octokit = new Octokit({ auth: token });
    const { data: pr } = await octokit.rest.pulls.create({
      owner: "JooduG",
      repo: "RPGlitch",
      title: "feat: repository restructuring and node.js transition",
      body: `### Overview
Consolidated all root-level automation scripts into their respective .agent/skills/ directories and migrated from Bun to Node.js.

### Highlights
- **Nomenclature**: Unified engine naming to "Swarm".
- **Runtime**: Transitioned from Bun to Node.js using tsx for Type-Safe execution.
- **Refactor**: Replaced Bun APIs with standard node:fs/promises equivalents.
- **Hygiene**: Cleaned up and categorized the .env template.`,
      head: "feat/restructure-node-transition",
      base: "main"
    });
    console.log("✅ PR Created: " + pr.html_url);
  } catch (err) {
    console.error("❌ Error:", err.response?.data?.message || err.message);
    process.exit(1);
  }
}

createPR();
