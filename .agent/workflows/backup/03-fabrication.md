---
name: 03-fabrication
description: Coding & Implementation. The core implementation loop.
---

# 03-fabrication (The Forge)

> **Goal:** Build with technical supremacy. Logic is math; UI is physics.

## 1. Triggers
- **Approved Plan**: Genesis complete.
- **Refactor**: "Clean up this module".
- **Slash Command**: `/03-fabrication`

## 2. Brain (Context Injection)
- **Physics**: `.agent/rules/03-technetium.md` (Svelte 5 Runes / Chalk tokens).
- **Active Plan**: `.agent/state/tracks/<slug>/<slug>.md`.

## 3. Procedures

### Phase 1: The TDD Loop
1. **Red**: Write a Vitest unit test. Confirm failure.
2. **Green**: Implement using **Runes exclusively**. No legacy exports/stores.
3. **Refactor**: Polishing styles using **Chalk CSS tokens** only.

### Phase 2: Evidence Gate
1. **Verify**: Run `npm run check` and `npm test`. 
2. **Report**: You MUST read the terminal output. **State the results with evidence.**

### Phase 3: Documentation
1. **Sync**: Update the plan file checklist `[x]`.
2. **Annotate**: Use functional banners for major logic areas (as per Technetium).

## 4. Anti-Patterns
- **Blind Commits**: Implementing without running tests.
- **Style Hallucination**: Hardcoding hex colors instead of using tokens.
- **Rune Violation**: Using `export let` or `$:`.
