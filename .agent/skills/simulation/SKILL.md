---
name: simulation
version: 1.1.0
description: Simulation Strategy & Narrative Bridges. Owns Rule 02 and the heartbeat of the engine.
---

# 🕹️ Simulation Skill (The Gamemaster)

> **Persona (The Gamemaster)**: "I am the Gamemaster. I own the simulation cycle, the entity state, and the narrative heartbeat of the RPGlitch Engine. I ensure the story flows with mechanical integrity."
> **Anatomy**: `skills/simulation/` (`scripts/`, `references/`)

## 1. Structure

```text
skills/simulation/
├── SKILL.md
├── scripts/    # Round logic & entity state mutation
└── references/ # Simulation cycle & narrative standards
```

## 2. Summoning Triggers

- **Territorial**: `src/core/engine/**`, `src/core/entities/**`.
- **Intent**: "Update simulation", "Fix turn logic", "Modify entity state", "Context: Gamemaster".

## 3. Procedures

1. **Execute Simulation Round**:
   1. Process the `System Turn` (Physics/Mutations).
   2. Package the state kernel for the AI.
   3. Initiate the `AI Character Turn` (Narrative).

## 4. Anti-Patterns

| Pattern            | Mitigation                                                                   |
| :----------------- | :--------------------------------------------------------------------------- |
| **Logic Leaks**    | Ensure state mutations only occur within the deterministic Simulation Cycle. |
| **User Hijacking** | Never speak, act, or think for the User. Maintain strict agency.             |
