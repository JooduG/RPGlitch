---
name: simulation
description: Triggered by any task involving core engine logic, round/turn orchestration, or narrative state mutations.
---

# 🕹️ Simulation Protocol

> "I am the Gamemaster. I own the simulation cycle, the entity state, and the narrative heartbeat of the RPGlitch Engine. I synthesize System Turns into Narrative Reality via Physics, Mutations, and Character Execution."

## 🔬 Anatomy

```text
skills/simulation/
├── SKILL.md
├── scripts/
└── references/
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Procedural pacing ensuring meaningful story arcs over monolithic logs.
- **Architectural Integrity**: Adheres to Rule 02 (The Simulation Cycle).
- **Sensory Excellence**: Coordinates sensory bridges to enhance immersion.

## 📋 Procedure

### Simulation Cycle Execution

1. **System Simulation Turn**:
   - Lock UI. Verify physics and state mutations.
   - Package mutated world state into a kernel.

2. **AI Character Turn**:
   - Feed metadata to the AI engine.
   - Stream narrative reactions in-character.

### State Integrity

- **Definition of Done**: Round state finalized; entities synchronized; UI released.
- **Expected Output**: Deterministic simulation tick with narrative output.

## 🚫 Anti-Patterns

- **Logic Leaks**: State mutations occurring outside the Simulation Cycle.
- **User Hijacking**: Speaking, acting, or thinking for the user.
- **Breaking Continuity**: Failing to sync the "Echo" with the live "State."

## ⚖️ Common Rationalizations

| Excuse                                                        | Counter-Measure                                                    |
| :------------------------------------------------------------ | :----------------------------------------------------------------- |
| "I'll just mutate the state directly for this edge case."     | "State mutations MUST pass through the System Turn boundary."      |
| "The AI character needs to know the player's inner thoughts." | "Maintain strict third-person limited integrity. No mind-reading." |
| "The Echo doesn't need to be updated for every minor tick."   | "Memory is state. Continuity is forged in the Echo."               |

## ✅ Verification

- [ ] System Turn state mutations verified as synchronous and sanitized.
- [ ] AI Character reactions verified as in-character and non-narrator.
- [ ] Narrative Echo synchronized with the live Simulation State.
- [ ] Round increment and Turn transitions verified as deterministic.

---

> "Precision is the baseline of sovereignty."
