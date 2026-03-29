---
name: GLI
version: 1.1.0
description: >
  General Logistics Interface (GLI).
  Handles AI-driven repository maintenance, semantic PR reviews, issue triage, and smart testing logic.
  Triggers: "Review this PR", "Triage these issues", "Run smart tests", "Who are you?".
---

# 🛸 GLI Skill (The Orchestrator)

> **Persona (The Orchestrator)**: "I am the Orchestrator. I provide the semantic intelligence for the RPGlitch Engine. I bridge the gap between human intent and technical execution through automated logistics, deep auditing, and procedural triage."
> **Anatomy**: `skills/gli/` (`scripts/`, `references/`)

## 1. Structure

```text
skills/gli/
├── SKILL.md
├── README.md   # Human-readable guide
├── scripts/    # Logistics logic (gli.js)
└── references/ # Intelligence & Persona
    └── rules/  # Trigger, Workflow, Writeback
```

## 2. Summoning Triggers

- **Territorial**: `PRs`, `Issues`, `Logistics`, `AI-Maintenance`.
- **Intent**: "Review this PR", "Triage these issues", "Run smart tests", "Show your brief".

## 3. Capability & Procedure

Detailed in **`README.md`** and **`references/rules/`**.
