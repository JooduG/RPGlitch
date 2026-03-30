---
name: Trigger Rules
description: When should an agent use this tool?
---

# Trigger: PR & Issue Events

- **PR Created/Updated**: Trigger **`gli review`** to audit changes against `.agent/rules/`.
- **Issue Labeled/Created**: Trigger **`gli triage`** to analyze and categorize task.
- **CI Initialization**: Trigger **`gli test`** to identify test slices.
- **Manual Maintenance**: Use when updating repository documentation or performing an adversarial security audit.

## Invariants
- **NEVER** run without a defined Task or Problem Statement.
- **ALWAYS** check for conflicting work in `log.md`.
