---
name: {{Skill-Slug}}
description: >
  Build/Analyze/Deploy (WHAT)... 
  
  Use when: (WHEN Scenario 1), (WHEN Scenario 2), or troubleshooting (Error/Keyword).
  Triggers: (Glob), (Phrase)
---

# {{Skill-Slug}} _Mandatory_

> **Persona**: {{Persona}}: "I am the {{Role}}. I {{Function}} to ensure {{Goal}}."

## Structure _Mandatory_

skills/{{Skill-Slug}}/
├── SKILL.md # Main documentation _Mandatory_
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

## {{Objectives}} _Optional_

- (Objective)
- (Objective)

## {{Context-Injection}} _Optional_

- Rule: (Relationship)
- Skill: (Relationship)

## {{Capabilities}} _Optional_

- (Mandate)
- (Capability)
- (Skill)
- (Tool)
- (MCP)

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
