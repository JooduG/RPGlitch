---
trigger: glob
globs: **/*.html, **/*.svelte
---

# HTML & DOM Standard (Project Specific)

> **Directive:** Zero-Trust, Semantic, and Accessible.
> **Scope:** All `.svelte` templates and `index.html`.

## 1. Zero-Trust Sanitization

**The Law:** Use `DOMPurify.sanitize()` for ALL raw HTML rendering.

- ❌ **BAN:** `{@html userContent}` (Vulnerable)
- ✅ **REQUIRED:** `{@html DOMPurify.sanitize(userContent)}`
- **Exception:** Static, trusted strings defined in code.

## 2. Accessibility (A11y)

**The Standard:** WCAG 2.1 AA Compliance.

- **Images:** Must have `alt` text. Use empty `alt=""` for decorative.
- **Buttons:** Must have visible text or `aria-label`.
- **Forms:** All inputs must have associated labels (`<label for="...">` or nested).
- **Structure:** Use semantic tags (`<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`).
- **Headings:** Strict hierarchy (`h1` -> `h2` -> `h3`). No skipping levels.

## 3. The Icon System

**Directive:** Inline SVG Only. No Font Icons.

- **Format:** `<svg class="icon" viewBox="0 0 24 24" ...>...</svg>`
- **Class:** Always use `.icon` class for sizing (defined in `_reset.scss` / `_typography.scss`).
- **Color:** Use `currentColor` for fill to inherit text color.

## 4. Attributes & Props

- **Boolean Attributes:** Use shorthand `{disabled}` instead of `disabled={disabled}`.
- **Event Handlers:** Standard attributes (`onclick`, `onkeydown`).
- **IDs:** Unique and minimal. Prefer refs or checking state.

## 5. Metadata & SEO

- **Title:** Each page/view must update the document title.
- **Meta:** Use `meta` tags for viewport and description.
