---
trigger: always_on
description: The conceptual and linguistic laws governing agent intelligence.
---

# ⚡ Rule 04: Intelligence

> **The Cognitive Architect**: "I am the nervous system of the agent. I enforce the linguistic law, manage complexity, and ensure that every action is grounded in a verified plan. I am the bridge between intent and reality."

---

## 1. Intent Taxonomy

Before a single line of code is evaluated, the intent must be decoded. If the input is a conceptual "vibe", it must be translated into technical reality.

| Intent        | Meaning        | Protocol                                                        |
| :------------ | :------------- | :-------------------------------------------------------------- |
| **Clear**     | **Ideal**      | Crystal clear intent. Proceed with planning.                    |
| **Inferred**  | **Contextual** | Context implies the answer. Proceed with planning.              |
| **Ambiguous** | **Draft**      | Propose **One (1)** Solution. _"Are you trying to describe X?"_ |
| **Critical**  | **Decision**   | Present **Two (2+)** Options. _"We can either do X or Y."_      |
| **Hazard**    | **Refusal**    | REFUSE. _"X is blocking progress; we must solve it first."_     |

> **Ambiguity Rule**: Human intent clarity is the absolute prerequisite for planning. If intent is **Ambiguous or higher**, session execution is HALTED. Use the `gatekeeper` skill to translate ideas into concrete technical roadmaps.

---

## 2. Cognitive Routing Reference

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

## 3. Information Grounding

Every claim must be anchored in the "Reality of the Codebase."

- **Quoting Mandate**: Verify logic state by quoting exact applicable information.
- **Path Sovereignty**: All internal file/logical references MUST use relative paths.
- **Absolute Mapping**: Technical explanations MUST map to actual file paths and line numbers.

---

## 4. Lexical Laws & Nomenclature

To prevent cognitive drift, nomenclature is absolute.

### **Casing Standards**

- **kebab-case**: Folders and files (e.g., `simulation-engine/`, `context-broker.js`).
- **PascalCase**: Svelte components (e.g., `StoryPanel.svelte`).
- **snake_case**: Variables and process state (e.g., `current_char`).
- **question_snake**: Booleans (e.g., `is_active`, `has_token`).
- **SCREAMING_SNAKE**: Constants and Globals (e.g., `MAX_ENTROPY`).

### **The RPGlitch Lexicon**

- **Simulation**: The overall story/state container.
- **Entity**: Either a Character or a Fractal.
- **Fractal**: World, setting, or environmental entity.
- **User Persona**: Human-controlled character.
- **AI Character**: Agent-controlled character.
- **Devmode**: Developer workspace.
- **Localization**: Metric/SI only. ISO 8601. GMT+1.

---

## 5. The Operational Heartbeat

Every turn response must conclude with this metadata block to log operational weights:

```text
### 🕹️ Operational Heartbeat
- **🤖 AGENTS.md**: [Specific step from AGENTS.md]
- **📜 Rules**: [Active rule enforced this turn]
- **🧠 Capabilities**: [Skill or Workflow utilized]
- **💾 State**: [Specific file in .agent/state/ updated]
- **🛠️ Tools & MCPs**: [Specific tool or MCP-server called]
```
