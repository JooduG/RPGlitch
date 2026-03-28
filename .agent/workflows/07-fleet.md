---
description: [STUB - NOT IMPLEMENTED] Orchestration & Sync. Coordinates the multi-agent fleet and swarm sub-routines.
---

# [/07-fleet](./07-fleet.md) - The Orchestrator

> [!CAUTION]
> **STUB - NOT IMPLEMENTED**
> This workflow is currently a structural draft and is NOT wired to the Sovereign Intelligence Kernel. It must NOT be autonomously invoked by agents until core fleet and swarm logic are fully instantiated.
>
> **Goal:** Propagate core changes, dispatch specialized sub-agents, and coordinate the system-wide swarm (Rule 01).

## 1. Future Triggers (Disabled)

- **Manual Override**: For testing only.
- **Slash Command**: [/07-fleet](./07-fleet.md) (Use with extreme caution)

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Compliance](../rules/06-compliance.md).
- **Rules**: [Intelligence](../rules/05-intelligence.md).
- **State**: [.agent/project-management/log.md](../project-management/log.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Mapping)

1. **Analysis**: Identify child repositories affected by the current core logic change. [[Invoke: orchestrator]](../skills/orchestrator/SKILL.md)
2. **Swarm Scope**: Define precise boundaries for sub-routine dispatch (e.g., `codebase_investigator`). [[Invoke: directives]](../skills/directives/SKILL.md)
3. **Conflict Check**: Assess potential breaking changes in downstream repositories. [[Invoke: warden]](../skills/warden/SKILL.md)

### Phase 2: Dispatch & Execution

1. **Transmission**: Trigger the `fleet-dispatch` GitHub Action. [[Invoke: devops]](../skills/devops/SKILL.md)
2. **Tracking**: Create tracking PRs in child repositories with the `fleet-dispatch` label.
3. **Internal Swarm**: Dispatch internal sub-agents with strict, isolated objectives.

### Phase 3: The Quality Gate (Merge)

1. **Reconciliation**: merge sub-routine results back into the main track. Verify **Svelte 5** and **Chalk Regime** compliance.
2. **Report**: Verify all child repos have acknowledged the update and all swarm tasks are reconciled.

## 4. Anti-Patterns

- **Solo Divergence**: Letting child repos diverge from the Sovereign Engine logic.
- **Untracked Swarm**: Dispatching sub-agents without logging them in the trackers.

### 🕹️ Operational Heartbeat

- **🤖 AGENTS.md**: Step 3 (Cognitive Routing - Fleet active)
- **📜 Rules**: Rule 01 (Foundation), Rule 05 (Intelligence)
- **🧠 Capabilities**: orchestrator (Orchestration), warden (Audit)
- **💾 State**: .agent/project-management/log.md
