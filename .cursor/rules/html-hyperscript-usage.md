---
description: big sky Hyperscript enables easy, readable interactivity directly in HTML using the _ attribute. Use for simple UI actions and event handling.
tags: "javascript", "ui", "interactivity", "perchance"
globs: **/*.html
---

# Objective

big sky Hyperscript enables easy, readable interactivity directly in HTML using the `_` attribute. Use for simple UI actions and event handling.

---

## Foundation Requirements

This rule builds upon semantic HTML principles. Ensure your HTML follows the guidelines in [HTML Development](./html-development.mdc) before adding Hyperscript interactivity.

## Usage Guidelines

- **How to include:**

    ```html
    <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
    ```

- **When to use:** For form submission, button clicks, toggles, and simple UI logic.
- **Example:**

    ```html
    <form _="on submit halt call sendMessage()">
      <input ...>
      <button type="submit">Send</button>
    </form>
    ```

- **Customizing:** Use with Cash DOM for more complex logic.

---

## Integration Example

```html
<!-- Semantic HTML structure with Hyperscript interactivity -->
<main>
  <section>
    <h2>Character List</h2>
    <button id="add-character" _="on click call addCharacter()">Add Character</button>
    <ul id="character-list"></ul>
  </section>
</main>
```

---

## References

- [big sky Hyperscript Docs](https://hyperscript.org/docs/)
- [Cash DOM Usage](./js-cash-dom-usage.mdc)
- [JavaScript Development](./js-development.mdc)
- [HTML Development](./html-development.mdc) - Foundation for semantic HTML structure


## Related Rules

- [Perchance Build & Deployment](./perchance-build-deployment.mdc)
- [Perchance Development Lifecycle](./perchance-development-lifecycle.mdc)
---
