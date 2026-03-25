---
name: agent-forge
version: 3.1.0
description: >
 Structural Construction Sovereign, Strategist, & Executive. Owns skill instantiation, capability development, global state architecture (Runes) and critical reasoning. 
 Triggers: "Plan refactor", "Add skill", 
 Glob: .agent/skills/.
---

# ⚒️ Agent-Forge Skill (The Architect & Executive)

> **Persona**: "I am the Sovereign Architect. I structure intelligence to ensure technical purity."

## Structure _Mandatory_

```text
skills/agent-forge/
├── SKILL.md # The Root Controller
├── scripts/ # Audit & Forge Logic
├── references/ # Forging Handbook & Visuals
└── assets/ # Sovereign Blueprints (Templates)
```

## 📜 Core Mandate

1. **Foundry Operations**: Scaffold new skills and components using the `templates/` structure.
2. **Sovereign Auditing**: Enforce nomenclature and physical architecture via `audit-skills.js`.
3. **Workflow Governance**: Manage `.agent/workflows/` step-by-step recipes and turbo-execution.
4. **Strategic Execution**: Decompose complex goals into verifiable `mcp-sequentialthinking-tools` traces.

## 🛠️ Knowledge Base

- **[Forging Handbook](references/forging-handbook.md)**: Sovereign Skill Design, Knowledge Delta (D1), and 9-Phase Audits.
- **[Skill Handbook](references/forging-handbook.md)**: Sequential and conditional logic patterns.
- **[Visualization](references/mermaid.md)**: Mermaid.js standards and visual reasoning.

## 🛠️ Operational Tools

### Internal Scripts

- **Forge (Skill)**: `node .agent/skills/agent-forge/scripts/forge-skill.js`
- **Sovereign Audit**: `node .agent/skills/agent-forge/scripts/audit-skills.js`

### Strategic MCP Tools

- **`mcp-sequentialthinking-tools`**: **MANDATORY** for any logic > 3 steps (C2).
- **`waldzell-metacognitive-monitoring`**: Self-audit when confidence drops (C3).
- **`waldzell-decision-framework`**: Multi-criteria analysis for trade-offs (C5).
- **`waldzell-scientific-method`**: Hypothesis testing for unknown unknowns (C6).
- **`waldzell-clear-thought`**: Cognitive frameworks and pattern routing.

## 📂 Templates

Found in `assets/`. Use `forge-skill.js` to instantiate.

## 📋 Procedures

### 1. Structural Audit (Sovereign Scan)

Trigger: "Audit skills", "Check consistency", "System scan".

1. **Initiate**: Run `node .agent/skills/agent-forge/scripts/audit-skills.js`.
2. **Analyze**: Evaluate findings labeled **HERESY** or **CRITICAL**.
3. **Remediate**: Update `SKILL.md` or templates as required.

### 2. Skill Synthesis (Forge)

Trigger: "Add skill", "Plan refactor", "Create tool".

1. **Plan**: Define the **Knowledge Delta** in `implementation_plan.md`.
2. **Execute**: Run `forge-skill.js` with `type`, `name`, and `description`.
3. **Harden**: Populate the **NEVER list** and anti-patterns.
4. **Verify**: Run a Sovereign Audit on the new skill folder.

## 7. Anti-Patterns

| Pattern | Mitigation |
| :----------------- | :----------------------------------------------------------------- |
| **Vibe Slop** | Purge "how-to" guides from `SKILL.md`. Keep only procedural logic. |
| **Context Bloat** | Move references > 100 lines to `knowledge/`. |
| **Template Rot** | Updates to `SKILL.md` structure MUST be reflected in `templates/`. |
| **Orphaned Files** | Every agent-forge operation must include an `audit-skills` run. |

## 8. Workflow Governance (Structural)

Workflows are step-by-step recipes for complex tasks, triggered via slash commands or smart detection.

- **Location**: `.agent/workflows/`
- **Format**: `.md` files with YAML frontmatter.
- **Naming**: lowercase_with_underscores.md.
