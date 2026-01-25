---
name: skill-forge
description: The official factory for creating and validating new Agent Skills. Use this to extend the agent's capabilities while strictly adhering to Antigravity architecture.
license: MIT
---

# ⚒️ The Skill Forge

## Purpose

You are the **Skill Forge**. Your goal is not just to create files, but to **encapsulate expertise**.
When a user wants to "teach you how to do X", you use this skill to crystalize that knowledge into a reusable tool.

## 🧠 What Makes a Good Skill?

Before forging, evaluate if the expertise meets these criteria:

1. **High Reuse**: Is this a problem that will occur 10+ times?
2. **Complexity Compression**: Does it turn 50 lines of instructions into a single command or mental model?
3. **Unique Physics**: Does it govern a specific "world rule" (e.g., Svelte 5 Runes, Perchance Frame limits)?
4. **Implicit Knowledge**: Does it contain "unspoken" best practices that an agent might otherwise forget?

## ⚡ The Trigger Matrix

The `description` in the frontmatter is the **Activation Signal**. It MUST be optimized for zero-shot recognition.

| Trigger Type     | Pattern              | Purpose                  | Example                                                       |
| :--------------- | :------------------- | :----------------------- | :------------------------------------------------------------ |
| **Path-based**   | `src/mesmer/**`      | Scope-level activation.  | Triggers whenever a file in `mesmer/` is touched.             |
| **Action-based** | `deploy`, `refactor` | Intent-level activation. | Triggers when the user asks to "deploy the app".              |
| **Pillar-based** | `Scholar`, `Warden`  | Domain-level activation. | Triggers when modifying the project's "Security" or "Memory". |

## The Process

### 1. Analysis (Before you build)

Ask: _Is this a Skill or a Workflow?_

- **Skill:** "I need new tools/commands or specialized expertise." (e.g., "SQL Expert", "Deploy to Vercel").
- **Workflow:** "I need a standard procedure for my existing tools." (e.g., "Review PR", "Fix Bug"). -> _Use `.agent/workflows/` instead._

### 2. Initialization

Run the forge script to generate the compliant structure.

```bash
python .agent/skills/skill-forge/scripts/init.py [skill-name]
```

### 3. The "Progressive Disclosure" Structure

Every skill must follow this anatomy to prevent context bloating:

```text
skill-name/
├── SKILL.md                 # 🟢 The Interface (Triggers & High-level Logic)
├── scripts/                 # ⚡ Executable Tools (Python/Bash)
└── knowledge/               # 📚 Reference Material (Loaded only when needed)
    ├── api-docs.md
    └── templates.md

```

## Guidelines for Authors

1. **The 500-Line Rule:** If `SKILL.md` exceeds 500 lines (excluding metadata), move detail to `knowledge/`.
2. **Explicit Triggers:** The `description` MUST list the conditions under which the skill is useful.
    - _Bad:_ "A tool for databases."
    - _Good:_ "Triggers on `supabase/**` or `.sql` files. Governs SQL migrations and schema architecture."
3. **Logic over Text:** Prefer a script in `scripts/` over a long markdown explanation of how to do a calculation.

## Validation

Before finishing, run the validator to ensure the skill meets architectural standards.

```bash
python .agent/skills/skill-forge/scripts/validate.py [skill-name]
```
