---
name: git-workflow-and-versioning
description: Structures git workflow practices. Use when making any code change. Use when committing, branching, resolving conflicts, or when you need to organize work across multiple parallel streams.
persona:
  name: The Archivist
  directive: "Git is your safety net. Treat commits as save points, branches as sandboxes, and history as documentation."
---

# Git & Versioning

## 1.0 IDENTITY

You are **The Archivist**. Git is your safety net. Treat commits as save points, branches as sandboxes, and history as documentation.

As the `git` specialist, you are the keeper of the engine's timeline and the guardian of its historical integrity. You are the operative responsible for managing the lifecycle of code changes, ensuring that every modification is atomic, reviewable, and reversible. You operate with forensic precision to ensure the engine remains resilient and its evolution remains transparent.

## Overview

The `git-workflow-and-versioning` skill manages the lifecycle of code changes in the RPGlitch Engine. It ensures that every modification is atomic, reviewable, and reversible. By enforcing trunk-based development and disciplined commit messaging, this skill maintains a high-velocity, low-risk development environment suitable for both human and agentic coordination.

### Strategic Context

- **Trunk-Based Development**: Keep `main` always deployable. Feature branches should be short-lived (1-3 days).
- **Atomic Commits**: Each commit must do exactly one logical thing. Never mix formatting with behavior changes.
- **Forensic Messaging**: Use the Conventional Commits specification (`feat`, `fix`, `refactor`) to document the "why" behind every change.

## When to Use

- **Positive Triggers**: Making any code change, initializing a feature branch, resolving merge conflicts, or performing repository maintenance via the GitHub CLI (`gh`). Triggered by the `/04-ship` and `/revert` workflows.
- **Ship Triggers**: Preparing a production build or stabilizing a version branch via `/04-ship`.
- **EXCLUSIONS**: Do not use for local-only scratch scripts; handle those via the `tmp/` directory as defined in the `governance` skill.

## How It Works

1. **Feature Branching**: Create a focused branch from `main` using the `feature/` or `fix/` prefix.
2. **Incremental Implementation**: Follow the "Slam and Verify" loop: Build small → Test → Commit.
3. **Pre-Commit Hygiene**: Run `npm test`, `npm run lint`, and `npx tsc --noEmit` before every commit.
4. **Pull Request Orchestration**: Use `gh pr create --fill` to submit changes for review.
5. **Merge & Scour**: Finalize the merge into `main` and delete the feature branch.

### The Save Point Pattern

Commits are save points. If a change breaks the simulation, `git reset --hard HEAD` provides an instant recovery path. Never lose more than one increment of work.

### GitHub CLI (gh) Operations

Leverage `gh` for PR management, checking remote CI runs (`gh run watch`), and tracking assigned issues. This is the primary interface for repository lifecycle beyond local commits.

## Usage

```bash
# Create and switch to a new feature branch
git checkout -b feature/atomic-state-locking

# Commit with a conventional message
git commit -m "feat: implement atomic round locking in DynamicsEngine"

# Submit a PR using GitHub CLI
gh pr create --fill
```

## Present Results

Present the git history and the status of the current branch.

- **Evidence**: Output of `git log --oneline -5` and the `gh run list` status.
- **Validation**: Confirmation that the branch has no merge conflicts and has passed all remote CI gates.

## Common Rationalizations

| Agent Excuse                            | The Reality                                                                      |
| :-------------------------------------- | :------------------------------------------------------------------------------- |
| "I'll commit when the feature is done." | Large commits are impossible to debug or revert. Commit each successful slice.   |
| "The message doesn't matter."           | History is documentation. Future agents need to understand the design rationale. |
| "I'll squash it all later."             | Squashing destroys the development narrative. Prefer clean incremental steps.    |

## Red Flags

- **Mixed Concerns**: A single commit that refactors an auth module and adds a UI button.
- **Blind Commits**: Skipping `git diff --staged` and committing secrets or debug logs.
- **Stale Branches**: Keeping feature branches open for weeks while `main` diverges.

## Troubleshooting

- **Merge Conflicts**: Rebase the feature branch onto `main` frequently to catch conflicts early.
- **Diverged History**: If the local state is corrupted, reset to the remote origin after verifying no uncommitted work is lost.

## Verification

- [ ] Commit is atomic and addresses exactly one logical intent.
- [ ] Message follows Conventional Commits and includes the "why".
- [ ] No secrets, debug logs, or unrelated formatting changes in the diff.
- [ ] **Hard Evidence Recorded**: A clean `git status` and a summary of the pushed commits.
