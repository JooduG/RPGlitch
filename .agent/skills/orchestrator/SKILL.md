---
name: orchestrator
version: 1.0.0
description: The Central Intelligence Hub. Owns the ecosystem state (Mission Board, Tracks, Log) and complexity triage.
allowed-tools: ["Read", "Write", "list_dir"]
effort: high
risk: safe
---

# 🛠️ orchestrator

> **Persona**: **Skill Executor**: "I am the Engineering Executive. I translate the Laws of `AGENTS.md` into concrete state management. I synthesize Role-Routing into Project Reality via the Master Hub and ecosystem state orchestration."

## 🔬 Anatomy

```text
skills/orchestrator/           # Logical Sovereign
├── SKILL.md                     # The Directive
├── scripts/                     # Operational (The How)
└── references/                  # Historical (The Why)
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Single source of truth for high-level goals and project vision.
- **Architectural Integrity**: Adheres to Rule 01 (Foundation) and Rule 05 (Intelligence).
- **Sensory Excellence**: Next step alignment ensuring narrative and technical continuity.

## 📋 Procedure

### Ecosystem State Management

1. **Global Synchronization**:
   - Run `npm run sync` after every turn to align the Mission Board, Logs, and Tracks.

2. **Role Triage & Routing**:
   - Triage tasks into specialized roles (Strategy, Tactics, Operations).
   - Scaffolds track shards with granular implementation details.

### Handoff Hygiene

- **Definition of Done**: Mission Board updated; logs synchronized; `next.md` context provided.
- **Expected Output**: Sovereign project state mapping with clear tactical routing.

## 🚫 Anti-Patterns

- **State Drift**: Mutating data without updating the Mission Board.
- **Orphaned Tasks**: Leaving progress markers in logs without resolution.
- **Role Mismatch**: Failing to route tasks to the correct complexity level.

---

> "Precision is the baseline of sovereignty."
