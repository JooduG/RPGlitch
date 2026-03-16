# Workflow: 10-bug-fix (Automated Resolution)

> **Triggered by**: GitHub Issue labeled 'bug'.

## Phase 1: Context & Physics

1. Read `.agent/state/global.md` to understand current WIP.
2. Read `.agent/rules/03-technetium.md` (Svelte/Chalk) and `.agent/rules/04-shield.md` (Security). ALL fixes must strictly adhere to these physics.

## Phase 2: Diagnosis & Resolution

1. **Trace**: Analyze the provided issue body and trace the logic through the codebase.
2. **Fix**: Implement a minimal, targeted fix using Svelte 5 Runes and Chalk tokens.
3. **Test**: Write/update a unit test that proves the bug is squashed.
4. **Document**: Explain the root cause in the PR body.

## Anti-Patterns

- Using Tailwind or React paradigms to patch UI bugs.
- Committing fixes without a corresponding test.
