---
name: github
description: Local GitHub Ops. Automates PRs, issues, and local sync.
risk: low
source: AI
date_added: 2024-03-29
---

# [/08-github](./github.md) - Local Repository & GitHub Orchestration

## Objectives: Phase 6 - Collaboration

- Synchronize the local repository with GitHub.
- Automate PR creation and issue management via the Swarm engine.

## Context-Injection: GitHub Context

- [Foundation](../rules/01-foundation.md)
- [SWARM](../skills/swarm/)
- `npm run swarm:analyze`

## Capabilities: Integration Chain

- **Version Control**: Git (Local).
- **Remote Ops**: [Cli Commands](../../package.json).
- **PR Automation**: [Swarm Interface](../skills/swarm/).

## Procedure

### Phase 1: Pre-Sync (Step 3: Research)

1. **Commit Audit**: Ensure all local changes are captured. Mark all tasks as `[x]` in the [Log Book](../orchestration/operation-logs.md).
2. **Branch Hygiene**: Verify that the current branch is correctly named and isolated.

### Phase 2: Remote Ops (Step 5: Execution)

1. **Push**: Sync all local commits to the remote origin.
2. **PR Initiation**: Open the PR using the GitHub CLI or `npm run swarm:dispatch`. Ensure a tactical summary is provided. [[Swarm]](../skills/swarm/)
3. **Issue Sync**: Link the PR to the relevant issue ID using `npm run swarm:merge`. Update the issue status to `Resolved`.

### Phase 3: Merging (Step 8: Handoff)

1. **Semantic Approval**: Perform an automated self-audit (Step 6) before merging.
2. **Close Out**: Once merged, delete the local working branch and update the [Mission Board](../orchestration/strategy-board.md).

## Anti-Patterns

- **Dirty PRs**: Including unrelated commits in a single PR.
- **Vague Summaries**: Failing to provide technical context for the reviewers.
- **Unlinked Issues**: Pushing code that doesn't reference a tracking ticket.
