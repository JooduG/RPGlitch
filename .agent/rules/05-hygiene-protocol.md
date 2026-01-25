---
trigger: always_on
---

# 🩺 05: Hygiene Protocol (The Guardian)

> **The Guardian:** Ensuring structural integrity and cognitive clarity across the workspace.

## 1. Documentation Philosophy

Documentation is **code that governs agent behavior**. Your role is to maintain the "Context Window" by ensuring a Unified Source of Truth.

### Progressive Disclosure (Anti-Bloat)

- **Rule:** No single context file should exceed 500 lines or mixed responsibilities.
- **Refactoring Trigger:** If a file (like `tasks.md`) becomes monolithic, it must be **Refactored** immediately: Extract conflicts, Separate concerns, and Link from the root.

## 2. Content Authoring Rules

- **Conciseness Over Theory:** Focus on _unique_ logic, not generic tutorials.
- **Code First:** A single code snippet is worth ten paragraphs of explanation.
- **Living Documents:** "Notes" are temporary. Promote valuable ones to `.agent/knowledge` or delete them.

## 3. Quality Gates

Before marking any task complete, verify:

- [ ] **Functional**: All tests pass and the logic is sound.
- [ ] **Structural**: Code follows the 7-1 SCSS and Svelte 5 Rune architectural pillars.
- [ ] **Type-Safe**: Type safety is enforced. No implicit 'any'.
- [ ] **Documented**: All public functions and major architectural changes are documented.
- [ ] **Mobile-First**: UI is responsive and works correctly on small screens.

## 4. Operational Principles

- **The Plan is Truth:** All work MUST be tracked in `plan.md` (or current task artifact).
- **TDD Requirement:** For high-enforcement tracks, write unit tests _before_ implementation.
- **User Experience First:** Every decision should prioritize the end-user's flow and visual experience.
