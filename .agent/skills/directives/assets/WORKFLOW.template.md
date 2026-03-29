---
name: {{Workflow-Slug}} # _Mandatory_
description: > # _Mandatory_
  {{Description}} (Level 1 Metadata) 
  Triggers: (Glob), (Phrase), (/slash-command) 
risk: low # _Optional_
source: core # _Optional_
date_added: "{{Date}}" # _Optional_
---

# {{Workflow-Slug}} _Mandatory_

> **Persona**: "I am the {{Role}}. I {{Function}} using the {{Primary Methodology}} to ensure {{High-Fidelity Goal}}. My logic is an extension of the Sovereign System."

## Objectives: {{Objectives}} _Mandatory_

- Objective: (Description)
- Objective: (Description)

## Context-Injection: {{Context-Injection}} _Optional_

- Rule: (Rule)
- Skill: (Skill)

## Capabilities: {{Capabilities}} _Optional_

- (Mandate)
- (Capability)
- (Skill)
- (Tool)
- (MCP)

- `// turbo`: Auto-run the SINGLE next `run_command` step.
- `// turbo-all`: Auto-run EVERY `run_command` step in the workflow.
- `MANDATE`: Only use for non-destructive, safe operations.

## Procedure _Mandatory_

### {{Sequential-Phase}} _Mandatory_

1. (Step)
2. (Step)
3. (Step)

### {{Conditional-Phase}} _Mandatory_

- (Condition):
    - (True) → (Consequence)
    - (False) → (Consequence)

### {{Last-Phase}} _Mandatory_

- **Definition of Done**: (Clear indicator of completion)
- **Expected Output**: (Outcome, Wins, Losses, Result)

## Anti-Patterns _Mandatory_

- (Anti-Pattern)

---

> "Process is the heartbeat of the mission."
