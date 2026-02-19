---
name: project
version: 1.1.0
description: >
    Manages project state, roadmaps, and task tracking. Enforces the 'Task Flux'
    protocol (Plan -> Track -> Code).
    Triggers:
    - "Plan feature"
    - "Update tracks"
    - "Check status"
    - "Next task"
    - "Implement"
    - "Sync Configuration"
    - ".agent/tasks/**"
    - "Context: [Project]"
---

# 🚀 Project

> **Mandate**: "I am the executive function. I provide crystal-clear visibility into project state and ensure that no code is written without a tracked plan."

## 1. Core Philosophy

1. **Strict Text-Based State**: The `.agent/tasks/tracks.md` file is the ultimate source of truth. No internal hallucinations or "persona-based" state.
2. **Task Flux Protocol**: Every change follows a strict path: `Plan` (Define requirements) -> `Track` (Log in tracks.md) -> `Code` (Implementation).
3. **YAGNI State**: Do not track what does not exist. If a feature is not in `tracks.md`, it is not part of the current roadmap.

## 2. Procedures

### 📝 Plan Feature (`/02-feature`)

1. **Trigger**: User asks to build a new feature or "Plan <feature>".
2. **Action**: Follow `02-feature.md` workflow — Clarity Gate → Spec → Plan → Register.
    - **Estimation**: Use `waldzell-stochastic-thinking` for effort/risk analysis if scope > 3 files.
    - **Architectural Forks**: Use `waldzell-decision-framework` if multiple valid approaches exist.
3. **Validation**: Ensure User Story, Tech Specs, and Checklist are present.

### 🔧 Implement Task (`/03-implement`)

1. **Trigger**: Plan approved, "Next task", "Continue", "Implement".
2. **Action**: Follow `03-implement.md` workflow — Select → Build → Test → Commit → Update.
3. **Standard**: Skeleton-First (State → Logic → Markup → Style).

### 🔄 Update Tracks

1. **Trigger**: Completion of a task or shift in priority.
2. **Action**: Modify `.agent/tasks/tracks.md`.
3. **Standard**: Move items between `Backlog`, `In Progress`, and `Done`.

### 🔍 Check Status

1. **Trigger**: "Check status" or "What's next?".
2. **Action**: Read `.agent/tasks/tracks.md` and summarize current `In Progress` and the next high-priority `Backlog` item.

### 🔄 Sync Configuration

1. **Trigger**: "Sync Configuration" or manual execution of the sync script.
2. **Action**: `node .agent/skills/project/scripts/sync.js`.
3. **Standard**: Reads `ignores.master.json` and updates `.gitignore`, `.prettierignore`, `.stylelintignore`, and `.htmlhintignore`.

### 🛡️ ESLint Sync Guide

1. **Constraint**: Modern `eslint.config.js` (Flat Config) does not use `.eslintignore`.
2. **Manual Sync**: When `ignores.master.json`'s `eslint` section changes, you MUST update the `ignores: [...]` array in `eslint.config.js`.
3. **Verification**: Run `npm run lint` after sync to ensure no unexpected files are being linted.

## 3. Tools

- [.agent/tasks/tracks.md](../../tasks/tracks.md): The project's state registry.
- [templates/TRACK_ENTRY.md](./templates/TRACK_ENTRY.md): Standard for new work definitions.

## 4. Anti-Patterns

| Pattern                           | Mitigation                                                               |
| :-------------------------------- | :----------------------------------------------------------------------- |
| **Coding without a tracked plan** | **Forbidden**. All work must exist in `tracks.md` before implementation. |
| **Hallucinated project state**    | **Forbidden**. Only reference what is written in `tracks.md`.            |
| **Tracking unbuilt features**     | **Avoid**. YAGNI — if it's not being built now, it's not on the roadmap. |
| **Skipping the plan**             | **Forbidden**. No code without a `plan.md` entry.                        |
