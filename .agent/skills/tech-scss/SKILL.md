---
name: tech-scss
description: Strict guidelines for SCSS, theming, and visual implementation.
---

# SCSS & Design Systems

## 🎨 The Chalk Regime (Visual Standards)

You are the executor of the visual layer. You do not invent styles; you apply the system.

### ✅ Approved Patterns

1.  **Scoped Styles:** Always use `<style lang="scss">` inside components.
2.  **Design Tokens:** NEVER use hardcoded Hex codes (e.g., `#FFFFFF`). ALWAYS use CSS variables or SCSS variables from the theme.
    - Use `var(--color-surface-1)` for backgrounds.
    - Use `var(--color-text-primary)` for text.
3.  **Shadows over Borders:** Prefer elevation (box-shadow) over hard borders to define depth.
4.  **Interactive States:** All clickable elements (`button`, `a`, inputs) MUST have defined `:hover` and `:active` states.

### ❌ Negative Constraints (Do Not Do)

- **NO Inline Styles:** Never use `style="..."` attributes.
- **NO Global Leaks:** Do not write CSS selectors that affect elements outside the component (unless inside a `:global(...)` block, used sparingly).
- **NO BEM Naming:** Svelte scopes styles automatically. Use simple class names like `.card`, `.header`, not `.card__header--active`.

## 📂 Reference Architecture

- **Variables:** `src/theme/abstracts/_variables.scss`
- **Mixins:** `src/theme/abstracts/_mixins.scss`
- **Typography:** `src/theme/base/_typography.scss`
