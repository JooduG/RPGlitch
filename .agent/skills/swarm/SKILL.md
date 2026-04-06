---
name: swarm
version: 3.2.0
description: The Swarm Captain. Manages parallel sub-agent dispatch, token scaling, and the 80% Confidence Gate.
allowed-tools: ["run_shell_command", "write_file", "replace", "read_knowledge_base"]
effort: high
risk: high
---

# 🛠️ The Swarm Captain

> "I am the Captain of the Swarm. I translate the Strategic Commander's manifest into parallel reality. I manage the swarm’s lifecycle, from grounding in historical memory to the final 80% Confidence Gate."

## 🔬 Anatomy

```text
skills/swarm/
├── SKILL.md
├── scripts/
│   ├── swarm-engine.js      # [LIVE] The Sovereign Dispatch Engine
│   └── automation/          # Fleet automation pipeline (analyze → plan → dispatch → merge)
│       ├── github/           # Git/GitHub helpers (git.ts, issues.ts, markdown.ts, cache-plugin.ts)
│       ├── prompts/
│       │   ├── analyze-issues.ts  # [PROMPT] Issue triage → task generation (4-phase)
│       │   ├── bootstrap.ts       # [PROMPT] Scheduled Jules session wrapper
│       │   └── swarm-review.js    # [PROMPT] The 80% Gate verifier
│       ├── swarm-analyze.ts  # CLI: npm run swarm:analyze
│       ├── swarm-dispatch.ts # CLI: npm run swarm:dispatch
│       ├── swarm-merge.ts    # CLI: npm run swarm:merge
│       ├── swarm-plan.ts     # CLI: npm run swarm:plan
│       ├── types.ts           # Shared interfaces (IssueAnalysis, Task, RootCause)
│       └── utils.ts           # Shared helpers
├── templates/
│   └── manifest.json        # [TEMPLATE] Fleet blueprint schema v5.0.0
└── .swarm/                  # Archive for dated mission outputs
    └── 2026-04-01/
        └── manifest.json    # [ARCHIVE] Historic mission artifact
```

## 🎯 Strategic Context

- **Directed Parallelism**: Triggered when **Fleet Command (/07-fleet)** or the **Tactical Architect (/01-plan)** determines a "Parallel Win" (>20m or modular boundaries).
- **The Grounding Protocol**: Every swarm MUST begin with a collective context retrieval from Pinecone to ensure shared architectural truth.

## 📋 Procedure

### Collective Grounding (Step 0: Memory Protocol)

1. **Shared Recovery**: Execute `read_knowledge_base` to retrieve the relevant architectural patterns for the mission. This context MUST be distributed to all sub-agents. [[Invoke: Data]](../../skills/data/SKILL.md)

### Task Validation

1. **Task Audit**: Read the `issue_tasks.json` (or `manifest.json`) provided by the Commander. Verify the specialized agent slots and ensure file ranges are distinct.
2. **Resource Scaling**: Analyze the token budget. Scale the swarm size (1-3 sub-agents) based on mission complexity.

### Parallel Dispatch

1. **Dispatch & Lock**: Execute `node scripts/swarm-engine.js` [LIVE] to spin up the sub-agents. Enforce range locking if multiple agents must touch the same file.

### Completion Criteria

1. **The 80% Gate**: Run `SWARM review` on all parallel outputs. Calculate the confidence score. If Score < 80%, fail the merge and generate a Draft PR.
2. **Persistence**: Ingest the final collective implementation into Pinecone. [[Invoke: Data]](../../skills/data/SKILL.md)
3. **Definition of Done**: Parallel tasks completed, verified, and merged with a confidence score >= 80%.

## 🚫 Anti-Patterns

- **Identity Drift**: Allowing sub-agents to wander outside their assigned file boundaries.
- **Silent Failure**: Merging a swarm's output without a successful `SWARM review`.
- **Dirty Grounding**: Dispatching agents without a shared context from the Knowledge Base.
