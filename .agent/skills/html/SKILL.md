---
name: html
description: Triggers on **/*.html or where otherwise relevant. Governs semantic markup standards, accessibility compliance, and DOM interaction.
---

# HTML: Semantic & Accessibility Skill

## When to use this skill

- Writing component markup in `.svelte` files.
- Implementing structural tags (`<header>`, `<main>`, etc.).
- Ensuring accessibility compliance (A11y).

## Workflow

1.  **Semantic Structuring**: Select the correct landmarks for the component body.
2.  **A11y Check**: Ensure all images have `alt` text and inputs have linked `<label>`s.
3.  **Interaction Mapping**: Verify buttons have text labels or `aria-label`s.
4.  **DOM Binding**: Use Svelte `bind:this` instead of raw query selectors.

## Instructions

- **Semantic Tags**: Prefer `<article>`, `<section>`, and `<nav>` over generic `<div>`s.
- **Buttons vs Links**: Use `<button>` for actions and `<a>` for navigation.
- **Touch Targets**: Ensure a minimum 44x44px clickable area.
- **Perchance Context**: Remember the app runs in an `<iframe>`; avoid absolute asset paths.

## Resources

- [W3C Semantic HTML Reference](https://www.w3.org/WAI/tutorials/page-structure/content/)
- [A11y Checklist for Svelte](https://svelte.dev/docs/accessibility-warnings)