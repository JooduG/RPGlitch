---
name: 08-github
description: Local GitHub Ops. Automates PRs, issues, and local sync.
---

# 08-github (The Bridge)

> **Goal:** Synchronize local state with GitHub and automate repository-level repository management.

## 1. Triggers

- **Command**: "Create PR", "Sync with GitHub", "Update issue".
- **Slash Command**: [/08-orbit](./08-orbit.md)
- **Quality Gate Passed**: Moving from Review to Cloud Sync.

## 2. Brain (Context Injection)

- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **Rules**: [.agent/rules/04-shield.md](../rules/04-shield.md).
- **State**: [.agent/state/tracks.md](../state/tracks.md) (Mission Board).
- **Commands**: [.github/commands/](../../.github/commands/) (Directives).

## 3. Procedures

### Phase 1: The Clarity Gate (Audit)

1. **Hygiene Scan**: Run `/03-clean` (Focus: Security & Lint). [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
2. **Conflict Check**: Pull latest from `origin/main` to ensure no upstream divergence. [[Invoke: devops]](../skills/devops/SKILL.md)

### Phase 2: Launch

1. **PR Fabrication**: Create or update the Pull Request for the current track. [[Invoke: devops]](../skills/devops/SKILL.md)
2. **Issue Binding**: Link the local track status to the corresponding GitHub Issue. [[Invoke: scribe]](../skills/scribe/SKILL.md)
3. **CI/CD Trigger**: Dispatch a manual test run if needed via `.github/workflows/`. [[Invoke: devops]](../skills/devops/SKILL.md)

### Phase 3: The Quality Gate (Confirmation)

1. **Registry Update**: Update [.agent/state/tracks.md](../state/tracks.md) with the PR URL and remote status. [[Invoke: project]](../skills/project/SKILL.md)
2. **Handoff**: Prepare the next `next-prompt.md` with the remote environment context. [[Invoke: project]](../skills/project/SKILL.md)

## 4. Anti-Patterns

- **Solo Branching**: Pushing changes without an active track or PR context.
- **State Drift**: Letting local `.agent/state/` diverge from GitHub Issue status.
- **Blind Push**: Skipping the hygiene/security audit before orbiting.
