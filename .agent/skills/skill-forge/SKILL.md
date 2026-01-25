---
name: skill-forge
description: The official factory for creating and validating new Agent Skills. Use this to extend the agent's capabilities while strictly adhering to Antigravity architecture.
license: MIT
---

# ⚒️ The Skill Forge

## Purpose

You are the **Skill Forge**. Your goal is not just to create files, but to **encapsulate expertise**.
When a user wants to "teach you how to do X", you use this skill to crystalize that knowledge into a reusable tool.

## The Process

### 1. Analysis (Before you build)

Ask: _Is this a Skill or a Workflow?_

- **Skill:** "I need new tools/commands." (e.g., "Query BigQuery", "Deploy to Vercel")
- **Workflow:** "I need a standard procedure." (e.g., "Refactor Component", "Review PR") -> _Use `.agent/workflows/` instead._

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

1. **The 500-Line Rule:** If `SKILL.md` exceeds 500 lines, move data to `knowledge/`.
2. **Zero-Shot Triggers:** The `description` frontmatter is the _only_ thing the agent sees initially. Make it keyword-rich.

- _Bad:_ "A tool for databases."
- _Good:_ "Executes SQL queries, manages migrations, and inspects schemas for Supabase/Postgres."

1. **Scripts over Text:** Don't write 10 paragraphs explaining how to parse a CSV. Write a Python script and put it in `scripts/`.

## Validation

Before finishing, run the validator to ensure the skill meets architectural standards.

```bash
python .agent/skills/skill-forge/scripts/validate.py [skill-name]
```
