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
- **COMPLETED:** Automated Perchance deployment via Playwright. `npm run deploy:perchance` handles pre-flight, cookie consent, login detection, and injection into CodeMirror 6 editors. Live site verified.
- **COMPLETED:** UI Refactor track (`tasks/ui-refactor.md`) — Migrated legacy event listeners, standardized modal backgrounds, and verified Perchance compatibility.
- **PENDING:** Intelligence Kernel track (`tasks/intelligence-kernel.md`) — Refining ContextBroker, PromptBuilder, and VectorEngine for core simulation loop.
