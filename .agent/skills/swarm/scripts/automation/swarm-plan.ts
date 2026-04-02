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

import { get_formatted_date, get_git_root } from "./utils.js";

const repo_info = await getGitRepoInfo()
const base_branch = process.env.SWARM_BASE_BRANCH ?? await getCurrentBranch()
const issues_markdown = await getIssuesAsMarkdown()
const prompt = analyzeIssuesPrompt({ issuesMarkdown: issues_markdown, repoFullName: repo_info.fullName })

console.log(`🔍 Planning swarm for ${repo_info.fullName} (branch: ${base_branch})`)

const session = await jules.session({
  prompt,
  source: {
    github: repo_info.fullName,
    baseBranch: base_branch,
  },
  autoPr: true
})

console.log(`✅ Planner session started: ${session.id}`)
