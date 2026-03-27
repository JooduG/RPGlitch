---
description: Local GitHub Ops. Automates PRs, issues, and local sync.
---

# [/08-github](./08-github.md) - The Bridge

> **Goal:** Synchronize local state with the cloud Sovereign and automate repository management.

## 1. Triggers

- **Command**: "Create PR", "Sync with GitHub", "Update issue".
- **Slash Command**: [/08-github](./08-github.md)
- **Quality Gate Passed**: Moving from Review to Cloud Sync.

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Compliance](../rules/06-compliance.md).
- **Rules**: [Intelligence](../rules/05-intelligence.md).
- **State**: [.agent/project-management/log.md](../project-management/log.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Audit)

1. **Hygiene Scan**: Run [/03-clean](./03-clean.md) (Focus: Security & Lint). [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Conflict Check**: Pull latest from `origin/main` to ensure no upstream divergence. [[Invoke: devops]](../skills/devops/SKILL.md)

### Phase 2: Transmission

1. **PR Fabrication**: Create or update the Pull Request for the current track. [[Invoke: devops]](../skills/devops/SKILL.md)
2. **Issue Binding**: Link the local track status to the corresponding remote Issue.
3. **CI/CD**: Dispatch manual test runs via [GitHub Workflows](../../.github/workflows/).

### Phase 3: expression (Reporting)

1. **Log**: Update [log](../project-management/log.md) with the PR URL and remote status.
2. **Handoff**: Prepare [Next](../project-management/next.md) with the remote environment context. [[Invoke: intake]](../skills/intake/SKILL.md)

## 4. Anti-Patterns

- **Solo Branching**: Pushing changes without an active track or PR context.
- **Blind Push**: Skipping the hygiene/security audit before orbiting.

### 🕹️ Operational Heartbeat

- **🤖 AGENTS.md**: Step 8.2 (The Close-out - Bridge sync active)
- **📜 Rules**: Rule 01 (Foundation), Rule 06 (Compliance)
- **🧠 Capabilities**: devops (Sync), project-manager (State Tracker)
- **💾 State**: .agent/project-management/log.md
