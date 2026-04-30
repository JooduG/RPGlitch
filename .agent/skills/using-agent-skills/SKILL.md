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
- **Standardized Invocations**: Use a consistent protocol to declare intent and success criteria before touching the code.

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

- **Planning & Spec**: `specification`, `planning`, `stitch`.
- **Engineering**: `svelte`, `javascript`, `simulation`, `source-driven-development`, `performance-optimization`, `deprecation-and-migration`.
- **Sensory & Design**: `designer`, `css`, `motion`, `audio`, `image-generation`.
- **Governance**: `governance`, `security-and-hardening`, `data`, `context-engineering`.
- **Verification**: `test-driven-development`, `browser-testing-with-devtools`, `debugging-and-error-recovery`, `quality`.
- **Delivery**: `git-workflow-and-versioning`, `delivery`.

### Complexity Triage

| Level       | Role          | Workflow                        | Scope                                               |
| :---------- | :------------ | :------------------------------ | :-------------------------------------------------- |
| **Level 1** | ⚒️ Operations | ⚡ `/test` → `/build`           | Typos, CSS tweaks, minor logic.                     |
| **Level 2** | 🎨 Tactics    | 🧠 `/plan` → `/build`           | New features, refactors, multi-file changes.        |
| **Level 3** | 🎭 Strategy   | 🤔 `/spec` → `/plan` → `/build` | Architectural shifts, high ambiguity, core systems. |

### Skill Invocation Protocol

Declare your anchor and active state via the **Turn Signal** (Rule 05):

```text
> [Role emoji] [Role] | `[active-skill]` | [/workflow]
```

**And log the invocation in `tasks/todo.md`:**

```markdown
| Timestamp | Task | Skill Invoked | Outcome |
| :--- | :--- | :--- | :--- |
| 2026-04-30T12:00Z | [Task Name] | `skill-name` | 🔄 Active |
```

## Usage

```bash
# Run the warden audit for skills and templates
npm run audit:agent

# Verify full project health
npm run verify
```

## Red Flags

- **Logic Drift**: Modifying code without an active skill declaration or task anchor.
- **Role Mismatch**: Attempting a Level 3 (Strategy) task with a Level 1 (Operations) workflow.
- **Unverified Success**: Marking a task as complete without confirming the specific EXIT criteria or running `npm run verify`.

## Troubleshooting

- **Ambiguity**: If a task maps to multiple skills, favor the "Strategy" skills (`specification`/`planning`) first to resolve intent.
- **Token Debt**: If memory is degrading, use `context-engineering` to prune active context.
- **Hallucination**: If a skill mention doesn't exist in `.agent/skills/`, it is invalid. Stick to the Directory Listing.
