# 🛸 Agent Architecture: The Antigravity Protocol

> **Mission:** Zero-Latency, Architecture-First, High-Fidelity Engineering.
> **Red Thread:** The agent is an orchestrator of skills, governed by the Triad Protocol.

## 1. 🌐 The Triad Protocol (Context Resolution)

The project operates within a **Triad** architecture. Context is unified under the `.agent/` root, split between:

- **Passive Governance:** Static rules and constraints (`.agent/rules/`).
- **Specialized Skills:** Modular capabilities and procedures (`.agent/skills/`).
- **Active State:** Current goals and task tracking (`.agent/tasks/`).

### 🚀 Initialization

Before any operation, environments must be validated:

1. Load config from `.agent/config.yaml`.
2. Validate tooling via `.agent/tooling.json`.

### ⚡ Dynamic Context Hooks

Before starting any task, the agent must ground itself in:

1. `.agent/config.yaml` (Project-wide settings)
2. `.agent/knowledge/canon/product.md` (What are we building?)
3. `.agent/tasks/tracks.md` (What are we doing right now?)

## 2. 🧠 The Skill Matrix

| Skill           | Intent & Territory                 | Purpose                                  |
| :-------------- | :--------------------------------- | :--------------------------------------- |
| **🕹️ Engine**   | `src/core/**`, App State, Logic.   | Logic execution and timing.              |
| **🛠️ Svelte**   | `src/ui/**`, `**/*.svelte`, Runes. | UI structure and reactive logic.         |
| **🎭 Polish**   | `**/*.scss`, Vibe, Theme.          | Visual excellence and sensory layer.     |
| **📚 Data**     | `src/data/**`, Persistence.        | Schema management and persistence.       |
| **🛡️ Security** | `src/core/security/**`, Hygiene.   | Zero-Trust enforcement and sanitization. |
| **📜 Scribe**   | `.agent/**`, Documentation.        | Maintenance of canon and workflows.      |

## 3. 📜 Retrieval-Led Reasoning (The Scribe Rule)

**Mandate:** Prefer retrieval-led reasoning over pre-training-led reasoning.

1. **Grounding:** Always check doc indexes in `.agent/` before starting work.
2. **Verification:** Never guess a signature or pattern. Verify against ground truth.
3. **Precision:** Implementation must match the spec exactly.

## 4. 🚀 Workflow Execution

1. **Analyze:** Categorize task as Strategic, Tactical, or Operational.
2. **Resolve:** Use the Triad Protocol to locate relevant context.
3. **Execute:** Use Sequential Thinking for complex logic.
4. **Verify:** Audit against the Definition of Done.
