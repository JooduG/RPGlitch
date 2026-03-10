---
trigger: always_on
description: System Architecture, Skill Matrix, and logic flow.
---

# 🏗️ Architecture (The Skeleton)

> **Mission:** Zero-Latency, Architecture-First, High-Fidelity Engineering.
> **Red Thread:** The agent is an orchestrator of skills, governed by the Triad Protocol.

## 1. 🌐 The Triad Protocol (Context Resolution)

The project operates within a **Triad** architecture. Context is unified under the `.agent/` root:

- **Passive Governance:** Rules and constraints (`.agent/rules/`).
- **Specialized Skills:** Modular capabilities and procedures (`.agent/skills/`).
- **Active State:** Current goals and task tracking (`.agent/tasks/`).

## 2. 🧠 The Skill Matrix

The system is divided into five core functional areas:

| Skill           | Territory            | Responsibility                                       |
| :-------------- | :------------------- | :--------------------------------------------------- |
| **🕹️ Engine**   | `src/core/**`        | Narrative progression, time, and logic execution.    |
| **🛠️ UI**       | `src/ui/**`          | Reactive UI structure and component logic.           |
| **🎭 Polish**   | `src/theme/**`       | Visual excellence, Native CSS, and sensory fidelity. |
| **📚 Data**     | `src/data/**`        | Persistence (Dexie.js) and schema management.        |
| **🛡️ Security** | `src/core/security/` | Zero-Trust enforcement and sanitization.             |

## 3. 📜 Retrieval-Led Reasoning

**Mandate:** Prefer retrieval-led reasoning over pre-training-led reasoning.

1. **Grounding:** Always check doc indexes in `.agent/` before starting work.
2. **Verification:** Never guess a signature or pattern. Verify against ground truth in the codebase.
3. **Precision:** Implementation must match the spec exactly as defined in `task.md`.

## 4. Logical Data Flow

1. **User Input** -> **Security** (Sanitization) -> **Engine** (Logic Tick)
2. **Engine State** -> **Data** (Persistence) -> **Svelte Runes** (Reactivity)
3. **Svelte UI** -> **Polish** (Sensory Layer) -> **User Perception**
