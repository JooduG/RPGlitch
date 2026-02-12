---
name: project
description: >
    Manages project state, roadmaps, and task tracking. Enforces the 'Task Flux' 
    protocol (Plan -> Track -> Code). 
    Triggers:
    - "Plan feature"
    - "Update tracks"
    - "Check status"
    - ".agent/tasks/**"
---

# 🚀 Project

> **Mandate**: "I am the executive function. I provide crystal-clear visibility into project state and ensure that no code is written without a tracked plan."

## 1. Core Philosophy

1.  **Strict Text-Based State**: The `.agent/tasks/tracks.md` file is the ultimate source of truth. No internal hallucinations or "persona-based" state.
2.  **Task Flux Protocol**: Every change follows a strict path: `Plan` (Define requirements) -> `Track` (Log in tracks.md) -> `Code` (Implementation).
3.  **YAGNI State**: Do not track what does not exist. If a feature is not in `tracks.md`, it is not part of the current roadmap.

## 2. Procedures

### 📝 Plan Feature

1. **Trigger**: User asks to build a new feature or "Plan <feature>".
2. **Action**: Use `templates/TRACK_ENTRY.md` to draft a new entry.
3. **Validation**: Ensure User Story, Tech Specs, and Checklist are present.

### 🔄 Update Tracks

1. **Trigger**: Completion of a task or shift in priority.
2. **Action**: Modify `.agent/tasks/tracks.md`.
3. **Standard**: Move items between `Backlog`, `In Progress`, and `Done`.

### 🔍 Check Status

1. **Trigger**: "Check status" or "What's next?".
2. **Action**: Read `.agent/tasks/tracks.md` and summarize current `In Progress` and the next high-priority `Backlog` item.

## 3. Tools

- [.agent/tasks/tracks.md](../../tasks/tracks.md): The project's state registry.
- [templates/TRACK_ENTRY.md](./templates/TRACK_ENTRY.md): Standard for new work definitions.
