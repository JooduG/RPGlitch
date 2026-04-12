---
name: using-agent-skills
description: The Master Dispatcher. Governs skill discovery, complexity triage, and invocation protocol for all agent operations. Single authoritative routing surface — supersedes the deprecated orchestration skill.
---

# Using Agent Skills

> "I am the Master Dispatcher. I ensure that every agent action is grounded in verified processes and that complexity is triaged to the correct operational tier."

## Overview

Skills are not passive reference documents; they are **active engineering workflows**. When a skill is invoked, the agent enters a state of deep procedural discipline, baking in battle-tested practices. This skill serves as the central router and "brain" of the agent's capability library, ensuring that every task is mapped to the correct domain expertise and operational level.

### Strategic Context

- **Procedural Sovereignty**: Skills dictate not just _what_ to do, but _how_ to ensure quality at every level of the development lifecycle.
- **Complexity Guard**: Prevent architectural leakage by triaging tasks into Operations (Fixed), Tactics (Enhanced), or Strategy (Speculative) tiers.
- **Standardized Invocations**: Use a consistent protocol to declare intent and success criteria before touchings the code.

## When to Use

- **Positive Triggers**: When a new task arrives, when switching development phases (Define → Plan → Build → Verify → Ship), or when complexity needs to be triaged.
- **Context Boundaries**: Must be consulted at the start of _every_ session and _every_ major task transition (Rule 01).
- **EXCLUSIONS**: Do not use this for direct code implementation; use specific domain skills (e.g., `svelte`, `javascript`) instead.

## How It Works

1. **Task Arrival**: Receive the user request and any metadata.
2. **Phase Identification**: Map the request to a development phase (Define, Plan, Build, Verify, Ship).
3. **Complexity Triage**: Determine the tier (Level 1, 2, or 3) and set the active role (Operations, Tactics, Strategy).
4. **Skill Selection**: Invoke the primary skill for the current phase using the Skill Discovery map.
5. **Execution Protocol**: Declare the anchor, task, and exit criteria before beginning.

### Skill Discovery Map

Use this map to route your current task to the appropriate specialized skill:

- **Planning**: `idea-refine`, `spec-driven-development`, `planning-and-task-breakdown`.
- **Engineering**: `incremental-implementation`, `svelte`, `simulation`, `javascript`, `source-driven-development`.
- **Sensory**: `designer`, `css`, `motion`, `audio`, `image-generation`.
- **Governance**: `security-and-hardening`, `directives`, `data`.
- **Verification**: `test-driven-development`, `browser-testing-with-devtools`, `debugging-and-error-recovery`.
- **Shipping**: `git-workflow-and-versioning`, `shipping-and-launch`, `documentation-and-adrs`.

### Complexity Triage

| Level       | Role          | Workflow                        | Scope                                               |
| :---------- | :------------ | :------------------------------ | :-------------------------------------------------- |
| **Level 1** | ⚒️ Operations | ⚡ `/test` → `/build`           | Typos, CSS tweaks, minor logic.                     |
| **Level 2** | 🎨 Tactics    | 🧠 `/plan` → `/build`           | New features, refactors, multi-file changes.        |
| **Level 3** | 🎭 Strategy   | 🤔 `/spec` → `/plan` → `/build` | Architectural shifts, high ambiguity, core systems. |

### Skill Invocation Protocol

Declare your anchor before work begins:

```text
SKILL:  [skill-name]
TASK:   [tasks/todo.md anchor | task description]
EXIT:   [specific, measurable verification criterion]
```

## Usage

```bash
# Analyze skill compliance and health
npm run audit:skills

# Update the Skill Log in tasks/todo.md (Rule 05)
# | Timestamp | Task | Skill | Outcome |
```

## Present Results

Present the selected skill and the reasoning for its choice, followed by the specific invocation protocol.

- **Evidence**: Quote the specific directive or logic from the target skill.
- **Validation**: Demonstrate how the chosen skill satisfies the requirements of the task.

## Common Rationalizations

| Agent Excuse                            | The Reality                                                                       |
| :-------------------------------------- | :-------------------------------------------------------------------------------- |
| "I can fix this without a skill."       | Bypassing skills leads to technical debt and missed quality gates.                |
| "This task is too simple for triage."   | Even small tasks benefit from being correctly tiered to ensure minimal footprint. |
| "I'll update the Skill Log at the end." | Real-time logging (Rule 05) ensures historical continuity for future agents.      |

## Red Flags

- **Logic Drift**: Modifying code without an active skill declaration or task anchor.
- **Role Mismatch**: Attempting a Level 3 (Strategy) task with a Level 1 (Operations) workflow.
- **Unverified Success**: Marking a task as complete without confirming the specific EXIT criteria.

## Troubleshooting

- **Ambiguity**: If a task maps to multiple skills, favor the "Strategy" skills (spec/plan) first to resolve intent.
- **Token Debt**: If memory is degrading, use `context-engineering` to prune active context.

## Verification

- [ ] All skill invocations include a clear TASK anchor and EXIT criterion.
- [ ] Complexity tier is correctly identified before implementation starts.
- [ ] **Hard Evidence Recorded**: Current active skill is logged in `tasks/todo.md` (Rule 05).
