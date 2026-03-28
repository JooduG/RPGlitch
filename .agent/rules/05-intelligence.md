---
trigger: always_on
description: The conceptual and linguistic laws governing agent intelligence.
---

# ⚡ Rule 05: Intelligence

> **Persona**: "I am the nervous system of the agent. I enforce the linguistic law, manage complexity, and ensure that every action is grounded in a verified plan. I am the bridge between intent and reality."

---

## 1. Cognitive Routing Reference

Use this reference to select the appropriate MCP reasoning framework based on the shape of the problem.

| Block Type      | Trigger                                 | MCP / Framework                     |
| :-------------- | :-------------------------------------- | :---------------------------------- |
| **Research**    | Knowledge gaps, library patterns.       | `context7`, `svelte`, `deepwiki`    |
| **Reasoning**   | Multi-step breakdown, chain-of-thought. | `mcp-sequentialthinking-tools`      |
| **Reframing**   | "Impossible" bugs, flawed approach.     | `waldzell-clear-thought`            |
| **Diversity**   | Trade-offs, simulated expertise.        | `waldzell-collaborative-reasoning`  |
| **Decision**    | Complex choices, multi-criteria.        | `waldzell-decision-framework`       |
| **Calibration** | Bias detection, confidence assessment.  | `waldzell-metacognitive-monitoring` |
| **Systems**     | Pattern recognition, spatial mapping.   | `waldzell-visual-reasoning`         |

---

## 2. Information Grounding

Every claim must be anchored in the "Reality of the Codebase."

- **Quoting Mandate**: Verify logic state by quoting exact applicable information.
- **Path Sovereignty**: All internal file/logical references MUST use relative paths.
- **Absolute Mapping**: Technical explanations MUST map to actual file paths and line numbers.

---

## 3. Lexical Laws & Nomenclature

To prevent cognitive drift, nomenclature is absolute.

### **Casing Standards**

- **kebab-case**: Folders and files (e.g., `simulation-engine/`, `context-broker.js`).
- **PascalCase**: Svelte components (e.g., `StoryPanel.svelte`).
- **snake_case**: Variables and process state (e.g., `current_char`).
- **question_snake**: Booleans (e.g., `is_active`, `has_token`).
- **SCREAMING_SNAKE**: Constants and Globals (e.g., `MAX_ENTROPY`).
- **User-Facing**: All user-facing labels, nomenclature, and typography are defined in [Aesthetics](./04-aesthetics.md).

### **The RPGlitch Lexicon**

- **Simulation**: The overall story/state container. A `simulation` is a story and requires `entities` in order to play out. The engine is designed for frequent story swapping; concluding a story and starting a new one should be a seamless state transition.
- **Entity**: The fundamental unit of the simulation. An `entity` is either a `character` or a `fractal`.
- **Fractal**: World, setting, or environmental entity.
- **User Persona**: Human-controlled character (Entity).
- **AI Character**: Agent-controlled character (Entity).
- **Character**: An entity that can be used as either a `User Persona` or an `AI Character`. All characters and fractals share the same underlying entity pool.
- **Devmode**: Developer workspace.
- **Localization**: Metric/SI only. ISO 8601. GMT+1.

---

## 4. Complexity & Role Routing

To optimize cognitive load, tasks are triaged into three complexity levels, each triggering a specific role and thinking approach.

### **Level 1: Quick Fix (⚒️ Operational Role)**
- **Scope**: Typos, CSS tweaks, minor logic, or well-defined single-file edits.
- **Approach**: ⚡ **Professional Coding**.
- **Execution**: Bypass Step 3 Research. Proceed directly to Step 5.
- **Skill**: `orchestration-operations`.

### **Level 2: Enhancement (🎨 Tactical Role)**
- **Scope**: New small features, refactors, state migrations, or multi-file logic changes.
- **Approach**: 🧠 **Sequential Thinking**.
- **Execution**: Full analysis and implementation plan required.
- **Skill**: `orchestration-tactics` (for scoping).

### **Level 3: Complex Feature (🎭 Strategic Role)**
- **Scope**: Major architectural changes, new core systems, or highly ambiguous requirements.
- **Approach**: 🤔 **Contemplative Thinking**.
- **Execution**: Trigger `warden:debugging` if high risk. Requires transition from `intake` to `strategy`.
- **Skill**: `orchestration-strategy` (for architecture).

---

## 5. Thinking Approach Triggers

| Approach | Marker | Trigger Framework | When to Use |
| :--- | :--- | :--- | :--- |
| **Contemplative** | 🤔 | `waldzell-clear-thought` | Deep exploration, architectural mapping, reframing. |
| **Sequential** | 🧠 | `mcp-sequentialthinking-tools` | Multi-step logic, tool-guided analysis, implementation plans. |
| **Professional** | ⚡ | Internal Logic | Direct execution, TDD, quick fixes, and cleanup. |

---

## 6. The Operational Heartbeat

Every turn response must conclude with this metadata block to log operational weights. Include the active Role and Approach emojis.

```text
### 🕹️ Operational Heartbeat
- **🎭 Role**: [Strategic/Tactical/Operational]
- **🤔 Approach**: [Contemplative/Sequential/Professional]
- **🤖 AGENTS.md**: [Specific step from AGENTS.md]
- **📜 Rules**: [Active rule enforced this turn]
- **🧠 Capabilities**: [Skill or Workflow utilized]
- **💾 State**: [Specific file in .agent/project-management/ updated]
- **🛠️ Tools & MCPs**: [Specific tool or MCP-server called]
```
