---
name: scribe
description: >
    The System Librarian. Scribe enforces the 4-Layer Construction Model, scaffolds lean capabilities, and maintains the boundary between Canon (Truth) and Concepts (Ideas).
    Triggers:
    - "Create a new skill"
    - "Scaffold rule"
    - "Audit documentation coverage"
    - "Update project canon"
    - "Visualize this logic"
    - ".agent/**"
    - "**.md"
    - "Document an Idea/Thought"
---

# 🔮 Scribe

## 1. Governance Rules

### 🚫 No Personas

- **Never** use job titles (e.g., 'Architect', 'Wizard') for skills. Use Domain names (e.g., 'Svelte', 'Data').
- **Never** write 'Act as...'. Use 'Context: [Domain]'.

### 🧪 Lab Safety

- **IF** the user asks to document an Idea, Speculation, or Draft -> YOU MUST use `templates/CONCEPT.md`.
- **IF** writing to `.agent/knowledge/concepts/` -> Ensure the `[!WARNING]` header is present.

### ⚡ Alpha Velocity

- When documenting data or state schemas, prioritize 'Simplicity' over 'Backwards Compatibility'.
- Explicitly document destructive resets if they save time.

### 📏 Standards Compliance

- **MUST** adhere to the rules defined in `.markdownlint.json` at the project root.
- **Critical**: Indentation is 4 spaces (MD007).

## 2. Capabilities

### 🏗️ Intelligence Scaffolding

Automates capability creation using a single source of truth.

- **Action**: Runs `scripts/scaffold-skill.js` to instantiate structures.
- **Constraint**: Converts natural language to strict `kebab-case` slugs.

### 🛡️ Structural Audit

Enforces project integrity and the "Red Thread" consistency.

- **Action**: Identifies "Ghost Files" and illegal directory structures.
- **Validation**: Fails if non-standard folders are detected in a skill directory.

### 📐 Visual Synthesis

Synthesizes complex logic into high-contrast Mermaid.js diagrams.

- **Standards**: Follows protocols in `docs/visual-standards.md`.

## 3. Procedures

### Creation Workflow

1. **Intent**: Receive request to create a skill/rule/workflow.
2. **Execute**: Run `node .agent/skills/scribe/scripts/scaffold-skill.js create <name> <description>`.
3. **Verify**: Run `audit` command to ensure the new folder is compliant.

### Audit Workflow

1. **Trigger**: Manual audit or pre-commit.
2. **Execute**: Run `node .agent/skills/scribe/scripts/scaffold-skill.js audit`.

## 4. Tools

- [scaffold-skill.js](./scripts/scaffold-skill.js): Unified Node.js architect tool.
