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
import { readdir } from "node:fs/promises";
import { findUpSync } from "find-up";

/**
 * Normalizes the date as YYYY_MM_DD for swarm directory naming.
 */
export function get_formatted_date(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" })
    .format(date)
    .replaceAll("-", "_");
}

/**
 * Resolves the root of the git repository.
 */
export function get_git_root(): string {
  const git_marker = findUpSync(".git");
  if (!git_marker) {
    throw new Error(
      "Could not find .git directory. Please run this script from within a git repository.",
    );
  }
  return path.dirname(git_marker);
}

/**
 * Resolves the swarm directory, handling date boundaries by looking for the
 * most recent directory if the today-exact match is missing.
 */
export async function get_swarm_dir(): Promise<string> {
  const root = get_git_root();
  const today = get_formatted_date();

  // 1. Explicit override via env
  if (process.env.SWARM_DIR) {
    return path.isAbsolute(process.env.SWARM_DIR)
      ? process.env.SWARM_DIR
      : path.join(root, process.env.SWARM_DIR);
  }

  const swarm_base = path.join(root, ".agent", "archive", "swarm");

  // 2. Exact match for today
  const today_dir = path.join(swarm_base, today);

  // 3. Robust lookup: find the most recent subdirectory in .swarm
  try {
    const entries = await readdir(swarm_base, { withFileTypes: true });
    const date_dirs = entries
      .filter((d) => d.isDirectory() && /^\d{4}_\d{2}_\d{2}$/.test(d.name))
      .map((d) => d.name)
      .sort((a, b) => b.localeCompare(a)); // Reverse sort for latest

    if (date_dirs.length > 0) {
      // If today exists, use it. Otherwise, use the latest one found.
      const latest = date_dirs[0]!;
      const selected_dir = path.join(swarm_base, latest);

      if (latest !== today) {
        console.log(`  ℹ️  No swarm directory found for today (${today}). Using latest: ${latest}`);
      }
      return selected_dir;
    }
  } catch (err) {
    // If .swarm doesn't exist yet, we'll create it for today
  }

  return today_dir;
}
