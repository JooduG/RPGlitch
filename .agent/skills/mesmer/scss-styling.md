---
trigger: glob
globs: **/*.scss, **/*.svelte
---

# SCSS & Style Standard (Project Specific)

> **Directive:** Modular, Variable-Driven, and Scalable.
> **Scope:** `src/scss/` and `<style lang="scss">`.

## 1. Architecture (7-1 Pattern)

We use a modified 7-1 pattern but bundled linearly via Vite.

- **Abstracts:** Variables, Mixins, Placeholders (No CSS output).
- **Base:** Reset, Typography, global defaults.
- **Components:** Atomic UI (Buttons, Cards, Inputs).
- **Layouts:** Grid systems, wrappers.

## 2. Variable System

**The Source of Truth:** `src/mesmer/ui/_typography.scss` & `src/scss/abstracts/_variables.scss`

- **Prefix:** Use `--app-*` for CSS variables.
- **Legacy:** ❌ Avoid `--pico-*` (We are de-branding).
- **Usage:**

  ```scss
  .card {
    background: var(--app-surface-color); // ✅ Correct
    padding: var(--space-md); // ✅ Correct
  }
  ```

## 3. Typography

- **Scale:** Use the `rem` scale defined in `_typography.scss`.
- **Headings:** `h1` through `h6` have strict predefined sizes.
- **Body:** default `1rem` (or `0.875rem` for compact UI).
- **Font Stack:**
  - `var(--font-heading)`: Ubuntu
  - `var(--font-body)`: Inter
  - `var(--font-mono)`: Monospace stack

## 4. Component Styling

- **Encapsulation:** Prefer Svelte's scoped styles (`<style lang="scss">`).
- **Inheritance:** Use `@extend` for shared patterns (e.g., `%glass-base`).
- **Nesting:** Max depth of 3 to avoid specificity wars.

## 5. Responsive Design

- **Mobile First:** Default styles are for mobile.
- **Breakpoints:** Use standard breakpoints (576px, 768px, 1024px, 1280px).
- **Container Queries:** Preferred for card components (`cqw`, `cqh`).

## 6. CSS Modules & Imports

- **Do:** `@use "../../scss/abstracts" as *;` at the top of component styles.
- **Don't:** `@import` (Deprecated).
