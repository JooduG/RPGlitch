---
description: Covers semantic HTML, accessibility, and Perchance-specific markup.
globs: **/*.html
alwaysApply: false
---
# HTML Foundations

## Scope

- Covers semantic HTML, accessibility, and Perchance-specific markup.
- Outlines best practices for structure and maintainability.
- References official HTML docs and Perchance examples.

---

## Core Principles

- **Pico.css Styling:**
    Pico.css provides modern, minimal styling for all native HTML elements.
- **Semantic Markup:**  
    Use semantic tags (`<main>`, `<section>`, `<button>`, etc.) for clarity and accessibility.
- **Minimalism:**  
    Keep markup clean and minimal; avoid unnecessary wrappers.
- **Accessibility:**  
    Use proper ARIA roles and labels where needed.
- **Integration:**  
    Structure HTML to work seamlessly with atomic CSS, Pico.css, and JS modules.

---

## Best Practices

- Use `<label>` for all form controls.
- Use `<button>` for actions, not `<div>` or `<span>`.
- Use headings (`<h2>`, `<h3>`, etc.) for structure, not just for styling.
- Test with keyboard navigation and screen readers.

---

## Example

```html
<main>
  <section>
    <h2>Character List</h2>
    <button id="add-character">Add Character</button>
    <ul id="character-list"></ul>
  </section>
</main>
```

---

## Related Rules

- [SCSS Modern CSS Frameworks](./scss-modern-css-frameworks.mdc) - Includes Pico.css usage
- [Perchance Architecture](./perchance-architecture.mdc)
- [SCSS Advanced Patterns](./scss-advanced-patterns.mdc)
- [JavaScript Development](./js-development.mdc)
- [HTML Hyperscript Usage](./html-hyperscript-usage.mdc) - For adding interactivity to semantic HTML
- [Perchance Build & Deployment](./perchance-build-deployment.mdc) - Production deployment guidance
- [Perchance Development Lifecycle](./perchance-development-lifecycle.mdc) - Planning and iteration steps

---

## References & Inspiration

- [Perchance Welcome](https://perchance.org/welcome)
- [Perchance Tutorial](https://perchance.org/tutorial)
- [Perchance Advanced Tutorial](https://perchance.org/advanced-tutorial)
- [Perchance Examples](https://perchance.org/examples)
