# RPGlitch Antigravity Engine - Active State

## The Chalk Regime (Visual Constitution)

- Native CSS variables (`var(--color-chalk)`) are strictly enforced.
- No raw hex codes or generic UI defaults.

## Architectural Mandates

- **Svelte 5 Supremacy:** All Svelte 3/4 legacy code must be refactored to Runes (`$state`, `$derived`, `$effect`, snippets).
- **Perchance Constraints:** Self-contained bundles, single `index.html` output, zero backend Node.js modules.

## Active WIP & Known Quirks

- **COMPLETED:** Agent capabilities directory purge. `.agent/skills/` has been sanitized. Bloated `automate-github-issues` and `local-action-verification` removed. Svelte/Perchance rules moved to `.agent/rules/`.
- **COMPLETED:** Refactored `tool-design` skill to eliminate Python/Backend bias. Rewritten to focus on Host MCP invocation, Perchance `window.exposed` bridges, and Svelte 5 integrations.
- **PENDING:** Implementation of the Autonomous Baton-Passing Loop (`next-prompt.md`) to enable continuous swarm execution.
