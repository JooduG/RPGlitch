# Spec: Native CSS Migration

## 🎯 Objective

Eradicate the "SCSS Import Tax" and move to a compiler-free, logic-first design system architecture using native CSS Custom Properties (`:root`).

## 1. Success Criteria

- [ ] **Zero Imports**: Svelte components no longer require `@use "variables"` to access design tokens.
- [ ] **Native Reactivity**: Tokens are accessible via `var(--token-name)` in any CSS context.
- [ ] **Runtime Theming**: Design tokens can be adjusted via JS `document.documentElement.style.setProperty()` without recompilation.
- [ ] **Component Isolation**: Svelte `<style>` blocks contain zero SCSS dependencies.
- [ ] **Build Performance**: Faster HMR due to reduced SCSS dependency graph.

## 2. Technical Requirements

- All tokens must reside in `src/theme/tokens.css`.
- `tokens.css` must be imported once in the global `index.html` or main entry point.
- SCSS variables (`$var`) must be retired in favor of CSS variables (`--var`).
- SCSS mixins (`@include mobile`) should be evaluated for native CSS alternatives or kept in a minimal global layer if necessary.

## 3. Risks & Mitigations

- **Breaking Changes**: Massive refactor may break UI in untracked files.
    - _Mitigation_: Create a temporary SCSS compatibility bridge (`_variables.scss` mapping to `var()`).
- **IE/Legacy Support**: Native CSS variables are not supported in legacy IE.
    - _Mitigation_: RPGlitch targets modern evergreen browsers (Perchance/Web standard). No mitigation required.
