---
name: scss
description: Single Source of Truth for SCSS architecture, Svelte 5 styling rules, and design tokens. Enforces Neural Minimalism and strict variable usage.
---

# 🎨 SCSS Design System

> "Visuals are a function of state. We write CSS that is predictable, token-based, and scoped."

## 🎯 Triggers

- **Files**: `src/**/*.scss`, `src/**/*.svelte`
- **Intents**: "Fix CSS", "Add styles", "Check styling rules", "What are the color tokens?"

## 🛠️ Core Competencies

- **Neural Minimalism**: High contrast, deep shadows, receding UI elements.
- **Svelte 5 Scoping**: Styles are strictly scoped to components. Global BEM is forbidden inside `.svelte` files.
- **Token-First Development**: Hardcoded values (hex, px) are strictly prohibited. Always use `var(--token)`.
- **Modern Sass**: `@import` is **strictly forbidden**. Use `@use` and `@forward` for all module loading.
- **Constraint Layouts**: Layouts rely on `flex` and `grid` gaps, not margins.

## ⚡ Operational Rules

1. **Depth Physics**: Use `box-shadow` for elevation. Borders are forbidden on containers unless creating a specific "selected" state.
2. **Layering**: `backdrop-filter` is permitted **only** for Overlays (Modals, Tooltips) and Floating Elements.
3. **Motion**: All interactive transitions must use the `var(--curve-snappy)` timing function.
4. **Interaction**: All interactive elements (`button`, `a`) must have a defined `:active` state (e.g., `transform: scale(0.98)`).

## 📚 Resources

- **Tokens**: [TOKENS.scss](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/scss/templates/TOKENS.scss)
- **Audit Script**: [style_audit.js](file:///c:/Users/johng/Documents/GitHub/default/.agent/skills/scss/scripts/style_audit.js)

## 🚦 Usage

To audit the styles for compliance with the design system, run:

```bash
npm run lint:css
```
