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

## 4. The Operational Heartbeat

Every turn response must conclude with this metadata block to log operational weights:

```text
### 🕹️ Operational Heartbeat
- **🤖 AGENTS.md**: [Specific step from AGENTS.md]
- **📜 Rules**: [Active rule enforced this turn]
- **🧠 Capabilities**: [Skill or Workflow utilized]
- **💾 State**: [Specific file in .agent/project-management/ updated]
- **🛠️ Tools & MCPs**: [Specific tool or MCP-server called]
```
