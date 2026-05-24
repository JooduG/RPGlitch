---
name: /update-npm-dependencies-check-updates
description: Interactively check and update outdated packages
risk: low
source: AI
date_added: 2024-03-29
---

# [/update-npm-dependencies-check-updates](./rare-update-npm.md) - Interactive Dependency Maintenance Loop

## Objectives: Phase CI/CD & AUTOMATION - Update

- Objective: Synchronize the repository dependencies with the latest stable versions.
- Objective: Minimize security vulnerabilities and technical debt.

## Context-Injection: Dependency Management

- Rules: [Compliance](../../GEMINI.md#️-06-compliance)
- Skill: [CI/CD & Automation](../skills/git/SKILL.md)
- Tool: [npm-check-updates (ncu)](../../package.json)

## Capabilities: Dependency Audit

- **Vulnerability Scan**: npm audit.
- **Update Check**: ncu --interactive.

## Procedure

### Phase 1: Pre-Audit (Step 3: Research)

1. **Hygiene Scan**: Run `npm audit` to determine the current security risk. [[Invoke: security]](../skills/security/)
2. **Current Baseline**: Record the current versions of any major dependencies (Svelte, Vite).

### Phase 2: Interactive Update (Step 5: Execution)

1. **Candidate Review**: Run npm run update:check (or ncu -i). Select the packages for update. [[Invoke: ci-cd-and-automation]](../skills/git/)
2. **Execution**: Apply the updates and run `npm install`.

### Phase 3: Finalization

- **Definition of Done**: Updated package.json and package-lock.json verified via regression tests.
- **Expected Output**: Normalized dependency baseline and verified scan results (Update Log).

## Anti-Patterns

- **Blind Updating**: Updating all packages without a post-update test suite.
- **Dependency Bloat**: Adding new packages instead of updating existing ones.
- **Ignoring Warnings**: Closing the update turn while audit warnings still exist.
