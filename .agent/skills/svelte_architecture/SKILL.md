---
name: svelte
version: 1.0.0
description: Project architect enforcing SCSS scoping, scaffolding scripts, and strict separation of concerns. (Syntax and best practices are governed by svelte-core-bestpractices).
---

# ⚡ Svelte 5 Architect

> "Reactivity is explicit. Logic is isolated. Styles are scoped. We build with Runes."

## 🎯 Triggers

- **File Patterns**: `src/**/*.svelte`, `src/**/*.svelte.ts`, `src/**/*.js`
- **Intents**: "Scaffold a component", "Refactor to Runes", "Fix reactivity", "Audit legacy code", "Context: [Svelte]"

## 🛠️ Core Competencies

- **SCSS Architecture**: Enforces "Church & State" — Semantic HTML in template, Logic in script, Visuals in `<style lang="scss">`.
- **Scaffolding**: Automated component generation via Node.js tooling.

## 💀 Skeleton Protocol (Logic First)

When generating new components, follow the **Skeleton First** principle:

1.  **Logic**: Define `Props`, `$state`, and `$derived` in `<script lang="ts">`.
2.  **Structure**: Write semantic HTML (`article`, `section`) and use `{#snippet}` instead of `<slot>`.
3.  **Verification**: Ensure no Svelte 4 syntax exists.
4.  **Skinning**: Only _after_ logic is verified, apply styles via SCSS or Utilities.

## 📚 Resources

- **Scaffold Script**: [scaffold_component.js](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/svelte/scripts/scaffold_component.js)
- **Legacy Audit**: [audit_legacy.js](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/svelte/scripts/audit_legacy.js)
- **Component Template**: [COMPONENT.svelte](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/svelte/templates/COMPONENT.svelte)
- **Store Template**: [STORE.svelte.ts](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/svelte/templates/STORE.svelte.ts)
- **Migration Guide**: [MIGRATION_GUIDE.md](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/svelte/docs/MIGRATION_GUIDE.md)
- **Examples**:
    - [counter.svelte](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/svelte/examples/counter.svelte) (✅ Good)
    - [bad_counter.svelte](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/svelte/examples/bad_counter.svelte) (❌ Bad)

## 🚦 Usage

To audit the codebase for legacy Svelte syntax:

```bash
npm run audit:svelte

```

To scaffold a new component:

```bash
npm run scaffold:component <ComponentName> [type]
# Example: npm run scaffold:component MyButton atoms

```
