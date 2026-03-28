---
name: directives
version: 4.0.0
description: >
  The Architect of Directives. Owns instruction refinement, skill instantiation, capability development, and global state architecture (Runes).
Triggers: "Optimize instructions", "Add skill", "Refine logic", "Create Rule", "Scaffold Workflow"
Globs: .agent/skills/, .agent/rules/, .agent/workflows/
---

# 🧠 Directives

> **Persona**: "I am the Architect of Directives. I structure intelligence to ensure technical purity. My philosophy is that a skill is not a tutorial; it is a knowledge externalization mechanism. The value of a skill is the gap between its expert-only knowledge and what the Agent already knows."

- `skills/directives/`
    - `SKILL.md` (Philosophy & Triggers)
    - `scripts/` (Deterministic automation logic)
    - `assets/` (Templates & plans)
    - `references/` (Standards & Instruction maps)

---

## 💎 The Knowledge Delta

**Formula**: `Good Skill = Expert-only Knowledge − What the Agent Already Knows`

Every token in a skill competes for context. To maximize the "Delta":

- **Expert knowledge**: Decision trees, trade-offs, non-obvious edge cases, anti-patterns, domain-specific frameworks.
- **Redundant knowledge**: Basic tutorials, standard library usage ("how to write a loop"), generic best practices.
- **NEVER** explain TO the Agent; explain FOR the Agent using expertise the Agent hasn't been trained on.

---

## 🎯 Description Targeting

The frontmatter `description` is the **only** part the Agent sees before activation. If it is vague, the skill is invisible.

### The Two-Paragraph Rule

1. **WHAT**: What functionality do you bridge? (Use active voice: "Build...", "Analyze...", "Deploy...")
2. **WHEN**: 3-5 specific trigger scenarios + common error keywords/imports.

**Target Length**: 250-350 characters.

---

## 🪜 Progressive Disclosure

Load information in layers to respect the Context Window:

- **Layer 1: YAML Metadata**: Name + Description (Always in context).
- **Layer 2: SKILL.md body**: Core philosophy and routing triggers (<500 lines).
- **Layer 3: Sub-folder Resources**: `scripts/`, `references/`, `assets/` (Loaded only via mandatory workflow triggers).

---

## 🛡️ The 9-Phase Audit Protocol

Before shipping a skill, it must survive this gauntlet:

1. **Pre-Review**: Install skill and test discovery via natural language.
2. **Standards**: Validate YAML, gerund name (e.g. `editing-logic`), and third-person persona.
3. **Official Docs**: Verify API patterns via `context7` or latest npm/GitHub documentation.
4. **Code Evidence**: Ensure all imports in templates actually exist in production.
5. **Consistency**: Check that `SKILL.md` matches bundled `assets/` and `scripts/`.
6. **Version Drift**: Audit dependencies >90 days old.
7. **Categorization**: Label issues (HERESY, CRITICAL, HIGH, LOW).
8. **Hardening**: Auto-fix unambiguous issues; update "Last Verified" date.
9. **Final Verification**: Run the `audit-skills.js` script on the finalized package.

---

## Procedure

### 1. Skill Folder Structure

```text
skills/directives/
├── SKILL.md # The Brain (Philosophy & Triggers)
├── scripts/ # The Muscles (Forge & Audit Scripts)
├── references/ # Information (Standards & Maps)
└── assets/ # Reusable (plans)
```

### 2. Core Responsibilities

1. **Foundry Operations**: Scaffold new skills, rules, and workflows via `forge-skill.js`.
2. **Standard Auditing**: Enforce nomenclature and physical architecture via `audit-skills.js`.
3. **Workflow Governance**: Manage Step-by-Step execution and turbo-routing.
4. **Architectural Execution**: Decompose complex goals into verifiable technical traces.

### 5. Skill Creation & Management

#### 1. Structural Audit (Architectural Scan)

Trigger: "Audit skills", "Check consistency", "System scan".

1. **Initiate**: Run `node .agent/skills/directives/scripts/audit-skills.js`.
2. **Analyze**: Evaluate findings labeled **HERESY** or **CRITICAL**.
3. **Remediate**: Update `SKILL.md` or templates as required.

#### 2. Skill/Rule/Workflow Forging

Trigger: "Add skill", "Add rule", "Plan refactor", "Create tool".

1. **Plan**: Define the **Knowledge Delta** in `implementation_plan.md`.
2. **Execute**: Run `forge-skill.js` with `type`, `name`, and `description`.
3. **Harden**: Populate the **NEVER list** and anti-patterns.
4. **Verify**: Run an Architectural Audit on the new asset.

---

## ⚖️ Active Governance

This skill is the **Architectural Arbiter** of the engine. It enforces:

- **[Rule 01: Foundation](../../rules/01-foundation.md)**: Sync with Mission Board & Tracks.
- **[Rule 03: Infrastructure](../../rules/03-infrastructure.md)**: Physical architecture & Svelte 5 purity.
- **[Rule 05: Intelligence](../../rules/05-intelligence.md)**: Lexical laws & nomenclature.

---

## 8. Anti-Patterns

| Pattern            | Mitigation                                                                |
| :----------------- | :------------------------------------------------------------------------ |
| **Vibe Slop**      | Purge "how-to" guides from `SKILL.md`. Keep only procedural logic.        |
| **Context Bloat**  | Move references > 100 lines to [References](./references/).               |
| **Template Rot**   | Updates to `SKILL.md` structure MUST be reflected in [Assets](./assets/). |
| **Orphaned Files** | Every operation must include an `audit-skills` run.                       |
