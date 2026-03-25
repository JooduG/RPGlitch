---
name: { { Workflow-Slug } }
description: >
  {{Description}}
  Triggers: (Glob), (Phrase), (/slash-command)
---

# {{Workflow-Slug}} _Mandatory_

> **Goal:** {{Description}}.

## Anatomy _Mandatory_

skills/{{Workflow-Slug}}/
├── SKILL.md
├── scripts/
│ └── (Script.js)
├── references/
│ └── (Knowledge)
│ └── (Documentation)
│ └── (Plan)
│ └── (Work-in-progress)
└── assets/
└── (TEMPLATE)
└── (Image)

## {{Objectives}} _Mandatory_

- Objective: (Description)
- Objective: (Description)

## {{Context-Injection}} _Optional_

- Rules: (Rule)
- Skill: (Skill)

## {{Capabilities}} _Optional_

- (Mandate)
- (Capability)
- (Skill)
- (Tool)
- (MCP)

- `// turbo`: Auto-run the SINGLE next `run_command` step.
- `// turbo-all`: Auto-run EVERY `run_command` step in the workflow.
- `MANDATE`: Only use for non-destructive, safe operations.

## Procedure _Mandatory_

### {{Sequential-Phase}} _Optional_

1. (Step)
2. (Step)
3. (Step)

### {{Conditional-Phase}} _Optional_

- (Condition):
  - (True) → (Consequence)
  - (False) → (Consequence)

### {{Last-Phase}} _Mandatory_

- (Definition-of-done)

## {{Output-Expectations}} _Optional_

- (Result)
- (Outcome)

## Anti-Patterns _Mandatory_

- (Anti-Pattern)
