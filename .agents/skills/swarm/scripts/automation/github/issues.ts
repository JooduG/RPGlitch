import { Octokit } from "octokit";
import { cachePlugin } from "./cache-plugin.js";
import { getGitRepoInfo } from "./git.js";

/** Octokit with built-in ETag caching */
export const CachedOctokit = Octokit.plugin(cachePlugin) as typeof Octokit;

/** Fetch open issues from the current repository */
export async function getIssues(options?: { perPage?: number; state?: "open" | "closed" | "all" }) {
  const repoInfo = await getGitRepoInfo();
  const octokit = new CachedOctokit({
    auth: process.env.GITHUB_TOKEN,
  });
  const { data } = await octokit.rest.issues.listForRepo({
    owner: repoInfo.owner,
    repo: repoInfo.repo,
    state: options?.state ?? "open",
    per_page: options?.perPage ?? 30,
  });
  return data.filter((issue) => !issue.pull_request);
}

export { cachePlugin } from "./cache-plugin.js";
