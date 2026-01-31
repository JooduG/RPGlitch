---
description: Structured Review Protocol. Audits track quality and readiness against system standards.
---

# 🔍 /06-review

> **Goal:** Provide a formal, auditable assessment of a track's quality before merging or checkpointing.

## 1. Scope Identification

1.  **Target**: Identify the Track or Phase to be reviewed.
2.  **Retrieve**: Load `spec.md`, `plan.md`, and recent git logs for the target.

## 2. Verification Protocol

Check the logic against the following matrices:

- [ ] **Plan Compliance**: Does the code match the approved `plan.md`?
- [ ] **Standard Compliance**:
    - [x] [Chalk Regime](../../rules/06-aesthetic.md) (SCSS/CSS)
    - [x] [Runes](../../rules/03-tech-stack.md) (Svelte 5)
    - [x] [Security](../../rules/04-security.md) (Sanitization)
- [ ] **Test Integrity**: Are there passing tests for new logic?

## 3. The Review Report

Output findings in the following format:

### Review Report: [Track-Slug]

**Summary**: [Single sentence on overall quality]

| Check            | Status        | Comment |
| :--------------- | :------------ | :------ |
| Plan Compliance  | [Pass/Fail]   |         |
| Style Compliance | [Pass/Fail]   |         |
| Test Coverage    | [Yes/No]      |         |
| Sanitization     | [Clean/Dirty] |         |

### Findings

_(Grouped by Severity)_

- **[CRITICAL]**: Breaking changes or security vulnerabilities.
- **[HIGH]**: Logic errors or major pillar violations.
- **[MEDIUM]**: Aesthetic inconsistencies or missed edge cases.
- **[LOW]**: Hygiene, comments, or micro-optimizations.

## 4. Completion

- **Verdict**: Proceed to `/checkpoint` OR "Revision Required".
