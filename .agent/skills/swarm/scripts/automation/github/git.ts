import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface GitRepoInfo {
  owner: string;
  repo: string;
  /** Full GitHub path in "owner/repo" format */
  fullName: string;
}

/**
 * Parses the current git repository's remote URL to extract owner and repo.
 * Supports both HTTPS and SSH remote URL formats.
 *
 * @param remoteName - The name of the remote to parse (default: "origin")
 * @returns The parsed repository information
 * @throws Error if not in a git repository or remote URL cannot be parsed
 *
 * @example
 * const repo = await getGitRepoInfo();
 * console.log(repo.fullName); // "owner/repo"
 */
export async function getGitRepoInfo(remoteName = "origin"): Promise<GitRepoInfo> {
  // Validate remoteName to prevent command injection
  if (!/^[a-zA-Z0-9._-]+$/.test(remoteName)) {
    throw new Error(`Invalid remote name: ${remoteName}`);
  }

  const { stdout } = await execFileAsync("git", ["remote", "get-url", remoteName]);
  const remoteUrl = stdout.trim();

  return parseGitRemoteUrl(remoteUrl);
}

/**
 * Parses a git remote URL to extract owner and repo.
 * Supports both HTTPS and SSH URL formats:
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 *
 * @param remoteUrl - The git remote URL to parse
 * @returns The parsed repository information
 * @throws Error if the URL format is not recognized
 */
export function parseGitRemoteUrl(remoteUrl: string): GitRepoInfo {
  // SSH format: git@github.com:owner/repo.git
  const sshMatch = remoteUrl.match(/git@github\.com:([^/]+)\/(.+?)(\.git)?$/);
  if (sshMatch) {
    const [, owner, repo] = sshMatch;
    return {
      owner,
      repo: repo.replace(/\.git$/, ""),
      fullName: `${owner}/${repo.replace(/\.git$/, "")}`,
    };
  }

  // HTTPS format: https://github.com/owner/repo.git
  const httpsMatch = remoteUrl.match(/https?:\/\/github\.com\/([^/]+)\/(.+?)(\.git)?$/);
  if (httpsMatch) {
    const [, owner, repo] = httpsMatch;
    return {
      owner,
      repo: repo.replace(/\.git$/, ""),
      fullName: `${owner}/${repo.replace(/\.git$/, "")}`,
    };
  }

  throw new Error(`Unable to parse git remote URL: ${remoteUrl}`);
}

/**
 * Gets the current git branch name.
 *
 * @returns The current branch name
 * @throws Error if not in a git repository
 */
export async function getCurrentBranch(): Promise<string> {
  const { stdout } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  return stdout.trim();
}

/**
 * Gets the current git context (log and show) for agent prompts.
 */
export async function getGitContext(): Promise<string> {
  const { stdout: log } = await execFileAsync("git", ["log", "--oneline", "-n", "20", "--stat"]);
  const { stdout: show } = await execFileAsync("git", ["show", "HEAD"]);
  return `--- GIT LOG ---\n${log}\n\n--- GIT SHOW HEAD ---\n${show}`;
}
