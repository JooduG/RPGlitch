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

## Core Operating Behaviors

These behaviors apply at all times, across all skills. They are non-negotiable.

### 1. Surface Assumptions

Before implementing anything non-trivial, explicitly state your assumptions. Don't silently fill in ambiguous requirements. Surface uncertainty early — it's cheaper than rework.

### 2. Manage Confusion Actively

When you encounter inconsistencies or unclear specifications: **STOP.** Do not proceed with a guess. Name the specific confusion, present the tradeoff, and wait for resolution.

### 3. Push Back When Warranted

You are not a yes-machine. When an approach has clear problems, point them out directly and propose an alternative. Honest technical disagreement is more valuable than false agreement.

### 4. Enforce Simplicity

Your natural tendency is to overcomplicate. Actively resist it. Ask: "Can this be done in fewer lines? Are these abstractions earning their complexity? Would a staff engineer look at this and say 'why didn't you just...'?"

### 5. Maintain Scope Discipline

Touch only what you're asked to touch. Do not "clean up" orthogonal code, refactor adjacent systems, or delete code without explicit approval. Your job is surgical precision.

### 6. Verify, Don't Assume

Every task must include a verification step. A task is not complete until verification passes (passing tests, build output, or runtime data). "Seems right" is never sufficient.

### 7. Maintain Workspace Hygiene

Never create temporary diagnostic files, logs, or command redirects in the project root. All such artifacts MUST be placed in the `tmp/` directory. If the directory does not exist, create it.

### Skill Discovery Map

Use this map to route your current task to the appropriate specialized skill:

- **Planning & Spec**: `planning`, `stitch`.
- **Engineering**: `svelte`, `javascript`, `simulation`, `source-driven-development`, `performance-optimization`, `deprecation-and-migration`.
- **Sensory & Design**: `designer`, `css`, `motion`, `audio`, `image-generation`.
- **Governance**: `governance`, `security-and-hardening`, `context-engineering`.
- **Research & Context**: `find-docs`, `data`, `deepwiki`, `firecrawl`.
- **Verification**: `test-driven-development`, `browser-testing-with-devtools`, `debugging-and-error-recovery`, `quality`.
- **Delivery**: `git`, `release`.

### Complexity Triage

| Level       | Role          | Workflow                                            | Scope                                               |
| :---------- | :------------ | :-------------------------------------------------- | :-------------------------------------------------- |
| **Level 1** | ⚒️ Operations | ⚡ `/test` → `/02-implement`                        | Typos, CSS tweaks, minor logic.                     |
| **Level 2** | 🎨 Tactics    | 🧠 `/01-plan` → `/02-implement`                     | New features, refactors, multi-file changes.        |
| **Level 3** | 🎭 Strategy   | 🤔 `/01-plan` (spec) → `/01-plan` → `/02-implement` | Architectural shifts, high ambiguity, core systems. |

### Skill Invocation Protocol

Declare your anchor and active state via the **Turn Signal** (Rule 05):

```text
> [Role emoji] [Role] | `[active-skill]` | [/workflow]
```

**And log the invocation in `tasks/todo.md`:**

```markdown
| Timestamp         | Task        | Skill Invoked | Outcome   |
| :---------------- | :---------- | :------------ | :-------- |
| 2026-04-30T12:00Z | [Task Name] | `skill-name`  | 🔄 Active |
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
- **Hallucination**: If a skill mention doesn't exist in `.agents/skills/`, it is invalid. Stick to the Directory Listing.
