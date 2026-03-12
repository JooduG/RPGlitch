---
trigger: always_on
---

# RULE: The Chalk Regime

## Context

Visual consistency is absolute. The RPGlitch Antigravity Engine operates strictly under the "Chalk Regime" for all UI and DOM elements. You are forbidden from using generic hex codes or external UI library default colors.

## The Mandate

1. **Native CSS Variables Only:** All styling MUST utilize `var(--color-chalk)` and its associated palette variables defined in the global stylesheet.
2. **No Hardcoded Values:** Never write raw hex codes (e.g., `#FFFFFF`), `rgb()`, or `hsl()` in inline styles, Svelte `<style>` blocks, or Tailwind classes.
3. **Perchance Compatibility:** Ensure all CSS variables are accessible within the Perchance HTML panel environment.
