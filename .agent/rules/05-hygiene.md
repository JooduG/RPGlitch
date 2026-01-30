---
trigger: always_on
---

# 🩺 05: Hygiene Protocol (The Guardian)

> **The Guardian:** Ensuring structural integrity and cognitive clarity across the workspace.

## 1. Documentation Philosophy

- **Rule:** No single context file should exceed 500 lines or mixed responsibilities.
- **Refactoring Trigger:** If a file (like `tasks.md`) becomes monolithic, it must be **Refactored** immediately.

## 2. Clean Code Standards

- **SRP**: Single Responsibility - each function/class does ONE thing.
- **DRY**: Don't Repeat Yourself - extract duplicates, reuse.
- **KISS**: Keep It Simple - simplest solution that works.
- **Boy Scout**: Leave code cleaner than you found it.

### Naming

- **Variables**: `userCount` (Reveal intent).
- **Functions**: `getUserById()` (Verb + Noun).
- **Booleans**: `isActive` (Question form).

## 3. Structural Hygiene

- **Hierarchy**: Use `kebab-case` for all files. No 1-file folders.
- **Communication**: Use the "Enforced Context" pattern in all user-facing messages to maintain system transparency.
- **Static Scans**: Execute `npm run hygiene` (scan for `console.log`, `alert`).
- **Markdown**: Use Emojis (✅/⭕) in headers to avoid broken link linting errors.

## 4. Operational Principles

- **The Plan is Truth**: All work MUST be tracked in `plan.md` or task artifact.
- **User Experience First**: Prioritize end-user flow and visual experience.

## 5. Quality Gates (Pre-Completion)

1. **Functional**: All tests pass.
2. **Structural**: Follows Svelte 5 Runes and 7-1 SCSS.
3. **Type-Safe**: No implicit 'any'.
4. **Documented**: Changes recorded in `walkthrough.md`.

---

**Next:** Hygiene manifests in visual clarity. See [06: Aesthetic](./06-aesthetic.md).
