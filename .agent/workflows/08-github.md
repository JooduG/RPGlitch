---
name: 08-github
description: Local GitHub Ops. Automates PRs, issues, and local sync.
---

# [/08-github](./08-github.md) - The Bridge

> **Goal:** Synchronize local state with GitHub and automate repository-level repository management.

## 1. Triggers

- **Command**: "Create PR", "Sync with GitHub", "Update issue".
- **Slash Command**: [/08-github](./08-github.md)
- **Quality Gate Passed**: Moving from Review to Cloud Sync.

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Compliance](../rules/06-compliance.md).
- **State**: [Track Log](../project-management/track-log.md) (Mission Board).
- **Commands**: [GitHub Commands](../../.github/commands/) (Directives).

## 3. Procedures

### Phase 1: The Clarity Gate

1. **Hygiene Scan**: Run [/03-clean](./03-clean.md) (Focus: Security & Lint). [[Invoke: Warden]](../skills/warden/SKILL.md)
2. **Conflict Check**: Pull latest from `origin/main` to ensure no upstream divergence. [[Invoke: DevOps]](../skills/devops/SKILL.md)

### Phase 2: Launch

1. **PR Fabrication**: Create or update the Pull Request for the current track. [[Invoke: DevOps]](../skills/devops/SKILL.md)
2. **Issue Binding**: Link the local track status to the corresponding GitHub Issue. [[Invoke: Project Manager]](../skills/project-manager/SKILL.md)
3. **CI/CD Trigger**: Dispatch a manual test run if needed via [Github Workflows](../../.github/workflows/). [[Invoke: DevOps]](../skills/devops/SKILL.md)

### Phase 3: The Quality Gate

1. **Registry Update**: Update [.agent/project-management/track-log.md](../project-management/track-log.md) with the PR URL and remote status. [[Invoke: Project Manager]](../skills/project-manager/SKILL.md)
2. **Handoff**: Prepare [Next](../project-management/next.md) with the remote environment context. [[Invoke: Intent Crucible]](../skills/intent-crucible/SKILL.md)

## 4. Anti-Patterns

- **Solo Branching**: Pushing changes without an active track or PR context.
- **State Drift**: Letting local [Project Management](../project-management/) diverge from GitHub Issue status.
- **Blind Push**: Skipping the hygiene/security audit before orbiting.
