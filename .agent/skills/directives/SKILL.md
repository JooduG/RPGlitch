---
name: directives
description: Triggered by any task involving Rule or Skill modifications within the .agent/ directory.
version: 2.0.0
effort: medium
risk: safe
---

# ⚖️ Directives & Systems Architect

> "I am the Architect of the Laws. I do not manage the project; I manage the _engine_ that manages the project. I own the rules, the skills, and the workflows that define our intelligence."

## 🔬 Anatomy

```text
skills/directives/
├── SKILL.md
├── scripts/
├── templates/
└── references/
```

## 🎯 Strategic Context

- **Sovereign Systems**: Owns the integrity of the [.agent directory](../../../.agent).
- **Law Composer**: Writer of **[Rule 01: Foundation](../../rules/01-foundation.md)** through **[Rule 06: Compliance](../../rules/06-compliance.md)**.
- **Workflow Architect**: Designs [Workflows/](../../../.agent/workflows/).
- **Skill Fabricator**: Orchestrates the creation and refactoring of [Skills](../../skills).

## 📋 Procedure

### Intelligence Refinement

1. **Rule Making**: Write new and update current to better adhere to actual project needs.
2. **Skill Forging**: Create new skills or refactor current ones.
3. **Workflow Crafting**: Implement reusable sequential and conditional logic.

### Systematic Auditing

- **Audit Trigger**: Run domain-specific audit scripts (Nomenclature, Rules, Skills, Workflows).
- **Resolution**: Fix detected debt or heresy immediately to maintain structural purity.

### Completion Criteria

- **Definition of Done**: [.agent](../../../.agent) directory synchronized with Sovereign Template and Rule 05 lexical laws.
- **Expected Output**: A resonant and self-consistent agent intelligence layer.

## 📜 Skill Standardization Protocol

Every `SKILL.md` file within the `.agent/skills/` directory must adhere to the standard defined in [SKILL.template.md](./templates/SKILL.template.md).

### 1. Naming & Metadata

- **Directory & Name**: `lowercase-hyphen-separated`. Must be identical.
- **Description**: Must include both **what** the skill does (third person) and **when** it triggers (exact symptoms or file globs).
- **Triggers**: description must enable agent discovery via system prompt injection.

### 2. Mandatory Sections

1. **Overview**: The elevator pitch (What & Why).
2. **When to Use**: Bulleted triggers and exclusions (When NOT to use).
3. **Core Process**: Step-by-step workflow (Numbered).
4. **Common Rationalizations**: Table mapping agent excuses to logical rebuttals.
5. **Red Flags**: Observable signs of skill violation.
6. **Verification**: Measurable exit criteria checklist with evidence requirements.

### 3. Writing Principles

- **Process over Knowledge**: Skills are workflows, not reference docs.
- **Specific over General**: "Run `npm test`" vs "Verify tests".
- **Evidence over Assumption**: Every checkbox requires proof (tool output/screenshot).
- **Anti-Rationalization**: Proactively block corner-cutting via the rationalization table.

---

## 📜 Workflow Standardization Protocol

Every `.md` file in the `.agent/workflows/` directory must adhere to the standard defined in the [WORKFLOW.template.md](./templates/WORKFLOW.template.md).

### 1. Header Requirement

All workflows must display an H1 header featuring the command name, a relative link to the file, and a brief description.
**Format**: `# [/command-name](./file-name.md) - Brief Descriptive Title`

### 2. YAML Frontmatter

Workflows must contain at least a `description` field in the YAML frontmatter.

---

## 🚫 Anti-Patterns

- **Strategic Overreach**: Attempting to define project goals instead of agent capabilities.
- **Logic Drift**: Modifying the engine without updating the underlying rules and templates.
