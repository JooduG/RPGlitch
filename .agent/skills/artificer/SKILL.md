---
name: artificer
description: The UI Builder Skill. Specializes in Svelte 5 (Runes) components, SCSS architecture, and modern web design patterns.
---

# 🛠️ Skill: Artificer (The Builder)

The Artificer is the master of **Form and Function**. It provides the atomic boilerplate and architectural patterns for the project's UI.

## 1. Pillars of Implementation

### Svelte 5 (Runes)

- **State**: Use `$state` for local reactive variables.
- **Derived**: Use `$derived` for calculated values.
- **Props**: Use `let { ... } = $props();`.
- **Snippets**: Use `{#snippet}` and `{@render}` for templating.

### SCSS (The 7-1 Pattern)

- Use semantic SCSS components.
- Avoid utility soup.
- Bind variables exclusively to `--app-*`.

### Premium Design

- **Glassmorphism**: Use translucent backgrounds with backdrop-filters.
- **Micro-animations**: Add subtle transitions to interactive elements.
- **Typography**: Prioritize modern sans-serif fonts (e.g., Google Fonts).

## 2. Tooling

- **Scaffolding**: Use `/scaffold` to generate new components with tests.
- **Aesthetics**: Use `/review-design` to audit UI against the style guide.

## 3. Technical Knowledge Layers

- **[JavaScript Patterns](./knowledge/javascript.md)**: Modern ES modules and Svelte 5 logic.
- **[HTML Standards](./knowledge/html.md)**: Semantic structure and A11y.
- **[Stitch Integration](./knowledge/stitch-logic.md)**: Logic and UI generation via Stitch.

## 4. Usage

- **Trigger**: Path-based (`src/artificer/**`) or Action-based ('create component', 'add styling').
