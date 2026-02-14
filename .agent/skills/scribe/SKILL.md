---
name: scribe
version: 1.0.0
description: >
    The System Librarian. Scribe enforces the Meridian Workflow, scaffolds lean capabilities, and maintains the boundary between Canon (Truth) and Concepts (Ideas).
    Triggers:
    - "Create a new skill"
    - "Scaffold rule"
    - "Audit documentation coverage"
    - "Update project canon"
    - "Visualize this logic"
    - ".agent/**"
    - "**.md"
    - "Document an Idea/Thought"
    - "Context: [Scribe]"
---

# 🔮 Scribe

## 1. Governance Rules

### 🚫 No Personas

- **Never** use job titles (e.g., 'Architect', 'Wizard') for skills. Use Domain names (e.g., 'Svelte', 'Data').
- **Never** write 'Act as...'. Use 'Context: [Domain]'.
- **Context Priming**: Skills **MUST** define triggers using the "Context: [Domain]" pattern to load specific knowledge.
- **Zero Fluff**: Omit conversational filler. Strict Code-Only output where possible.

### 🧪 Lab Safety

- **IF** the user asks to document an Idea, Speculation, or Draft -> YOU MUST use `templates/CONCEPT.md`.
- **IF** writing to `.agent/knowledge/concepts/` -> Ensure the `[!WARNING]` header is present.

### ⚡ Alpha Velocity

- When documenting data or state schemas, prioritize 'Simplicity' over 'Backwards Compatibility'.
- Explicitly document destructive resets if they save time.

### 📏 Standards Compliance

- **MUST** adhere to the rules defined in `.markdownlint.json` at the project root.
- **Critical**: Indentation is 4 spaces (MD007).
- **Path Headers**: Code blocks **MUST** be preceded by `File: <absolute_path>` (or `file://` URI).
- **Skill Matrix**: All Implementation Plans **MUST** include the `Skill Matrix` table defining responsibilities.

### 🧱 Structural Mandate

- **Anti-Patterns**: Every skill **MUST** include an `Anti-Patterns` section with a `| Pattern | Mitigation |` table. See `templates/SKILL.md` for the scaffold.
- **Version Field**: Every skill frontmatter **MUST** include `version: X.Y.Z`. Increment on substantive changes.

### 🔗 Research Integration

- **Rule**: When creating or updating skills/rules based on external libraries or official documentation, **YOU MUST** trigger the `research` skill first to verify against the latest sources.
- **Goal**: Ensure governance reflects reality, not assumptions or outdated training data.

## 2. Cognitive Architecture

### 🧠 System 2 Mandate

- **Plan-First**: For any task > 3 steps, **YOU MUST** create a `task.md` or `implementation_plan.md` before executing code.
- **Slow Down**: If a User Request is ambiguous, **ASK** clarifying questions. Do not guess.

### 📉 The Lean Rule

- **Size Limit**: Skill files should be **< 500 lines**.
- **Refactoring**: If a skill exceeds this limit, **Split** it into sub-skills (e.g., `data` -> `data-persistence`, `data-sync`).
- **Focus**: A skill must have a **Single Responsibility**.

## 3. Capabilities

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

## 4. Procedures

### Creation Workflow

1. **Intent**: Receive request to create a skill/rule/workflow.
2. **Execute**: Run `node .agent/skills/scribe/scripts/scaffold-skill.js create <name> <description>`.
3. **Verify**: Run `audit` command to ensure the new folder is compliant.

### Audit Workflow

1. **Trigger**: Manual audit or pre-commit.
2. **Execute**: Run `node .agent/skills/scribe/scripts/scaffold-skill.js audit`.

## 5. Tools

- [scaffold-skill.js](./scripts/scaffold-skill.js): Unified Node.js architect tool.

## 6. Anti-Patterns

| Pattern                                         | Mitigation                                                                                  |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------ |
| **Persona-based naming**                        | **Forbidden**. Use domain names ("Svelte", "Data"), not job titles ("Architect", "Wizard"). |
| **Exceeding 500 lines per skill**               | **Forbidden**. Split into sub-skills with single responsibility.                            |
| **Experimental content in canon**               | **Forbidden**. Use `templates/CONCEPT.md` with `[!WARNING]` header.                         |
| **Skipping Research before writing governance** | **Forbidden**. Always verify against live docs via `research` skill.                        |
