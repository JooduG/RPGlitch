---
name: swarm
description: Triggered by any task involving multi-agent orchestration, parallel task scaling, or swarm lifecycle management.
---

# Swarm Captain: Multi-Agent Orchestration

> "I am the Captain of the Swarm. I translate the Strategic Commander's manifest into parallel reality. I manage the swarm’s lifecycle, from collective memory grounding to the final 80% Confidence Gate."

## Overview

The `swarm` skill governs the coordination of multiple sub-agents to achieve high-velocity implementation within the RPGlitch Engine. It manages task distribution, file-range locking, and collective verification. By utilizing a "Parallel Win" strategy, it enables large-scale features to be built in a fraction of the time while maintaining strict architectural consistency (Rule 03).

### Strategic Context

- **Directed Parallelism**: Triggered when a mission is modular enough for simultaneous execution (>20m or distinct file boundaries).
- **Collective Grounding**: Every swarm must begin with a shared context retrieval from the Knowledge Base to ensure a unified technical truth.
- **The 80% Gate**: Zero-tolerance policy for low-confidence merges. Every output must be peer-reviewed by the swarm logic.

## When to Use

- **Positive Triggers**: Scaling a Level 3 (Strategy) mission into parallel tasks, executing a `manifest.json` fleet blueprint, or when a manual swarm (/swarm) is requested.
- **Structural Triggers**: Building massive multi-module features (e.g., a new "Combat" system and "Inventory" system simultaneously).
- **EXCLUSIONS**: Do not use for sequential, single-threaded tasks or simple bug fixes.

## How It Works

1. **Collective Grounding**: Retrieve architectural patterns from Pinecone using the `Data` skill and distribute them to the swarm.
2. **Task Validation**: Verify the `manifest.json` or `issue_tasks.json` provided by the Commander. Ensure file ranges are distinct to prevent merge conflicts.
3. **Parallel Dispatch**: Execute the `swarm-engine.js` to initialize and manage sub-agent life-cycles and token budgets.
4. **The 80% Gate**: Perform a `SWARM review` of all outputs. If the aggregate confidence score is < 80%, fail the merge and divert to a manual Draft PR.

### Anatomy of a Swarm

A swarm consists of specialized agent slots defined in the manifest. These slots are optimized for specific domains (Logic, UI, CSS) and operate within isolated "Sanity Bubbles" until the final collective verification.

## Usage

```bash
# Initialize and analyze a repository for a swarm mission
npm run swarm:analyze

# Dispatch the fleet based on the generated manifest
npm run swarm:dispatch

# Merge and verify the collective implementation
npm run swarm:merge
```

## Present Results

Present the swarm success metrics and the final merge status.

- **Evidence**: Confidence scores from the 80% Gate and links to the merged files/PRs.
- **Validation**: Demonstrate that no file boundaries were breached and the integrated system passes all shared tests.

## Common Rationalizations

| Agent Excuse                     | The Reality                                                                                 |
| :------------------------------- | :------------------------------------------------------------------------------------------ |
| "Parallelism is too risky."      | With proper file-locking and the 80% Gate, risk is lower than manual monolithic edits.      |
| "I'll skip the grounding step."  | Without shared memory, sub-agents drift into incompatible patterns. Grounding is mandatory. |
| "75% confidence is good enough." | The 80% Gate is absolute. Follow the protocol to maintain Engine integrity.                 |

## Red Flags

- **Identity Drift**: Sub-agents attempting to edit files outside their assigned manifest range.
- **Opaque Merges**: Merging swarm output without a successful `SWARM review` log entry.
- **Dirty Grounding**: Dispatching agents without a verified architectural retrieval from Rule 05 "Echo".

## Troubleshooting

- **Merge Deadlock**: If file-locking fails, halt the swarm and re-partition the task into smaller, non-overlapping ranges.
- **Token Overflow**: If the mission budget is exceeded, suspend the lowest-priority agent slot and finalize the core logic first.

## Verification

- [ ] All sub-agents were grounded in the Knowledge Base context before dispatch.
- [ ] File-range locking was enforced and no cross-agent conflicts occurred.
- [ ] **The 80% Gate** was successfully cleared with a documented confidence score.
- [ ] **Hard Evidence Recorded**: A successful `swarm-merge` status and updated Mission Board.
