# HTML Guide: Best Practices & Hyperscript

This guide outlines the foundational principles for writing all HTML in this project, including the use of `_hyperscript` for simple UI interactions. These rules ensure that our applications are structured, accessible, and valid.

**Core Principle:** Write clean, semantic, and accessible HTML. Use `_hyperscript` for simple, declarative interactions, and dedicated JavaScript for complex logic.

---

## 1. Valid Document Structure

Every HTML file must be a valid document. This is the absolute baseline.

- **`<!DOCTYPE html>`:** The file must always start with this declaration.
- **Root Element:** The `<html>` element must have a `lang` attribute (e.g., `<html lang="en">`).
- **Head:** The `<head>` must contain a `<meta charset="UTF-8">` and a `<meta name="viewport" content="width=device-width, initial-scale=1.0">` for responsiveness, along with a descriptive `<title>`.

---

## 2. Semantic Elements for Meaning

Use HTML5 semantic elements to describe the structure of your content. Do not just use `<div>` for everything. Using the correct tag gives meaning to the content for browsers, screen readers, and other developers.

- **`<main>`:** Use for the primary, unique content of the page. There should only be one.
- **`<nav>`:** Use for major navigation blocks.
- **`<header>` & `<footer>`:** Use for the top and bottom sections of a page or an article.
- **`<article>`:** Use for self-contained pieces of content (e.g., a single entity card).
- **`<section>`:** Use to group related content together.
- **`<aside>`:** Use for supplementary content, like a sidebar.

---

## 3. Accessibility is Non-Negotiable

Web accessibility (a11y) is a requirement, not a feature.

- **Images:** All `<img>` tags **must** have an `alt` attribute. If the image is purely decorative, use an empty alt attribute (`alt=""`). If it conveys information, the alt text should describe the image.
- **Buttons & Links:** Use `<button>` for actions (like submitting a form) and `<a>` for navigation (going to another page or section). Don't mix them up.
- **Forms:** All `<input>` elements should be associated with a `<label>` element. This is crucial for screen reader users.

---

## 4. Hyperscript for UI Interactions

Use `_hyperscript` for simple, declarative UI interactions. For complex logic involving state or multiple steps, use a dedicated JavaScript file as detailed in the `js-guide.md`.

### Basic Syntax

The `_hyperscript` library is included from `/build/local_libs/` and looks for the `_` attribute on HTML elements.

- **`on click`**: The most common trigger.
- **`toggle`**: Toggles a class on an element.
- **`call`**: Calls a global JavaScript function.

```html
<!-- Toggle a class on the #chin element when this button is clicked -->
<button _="on click toggle .is-active on #chin">
  Toggle Settings
</button>

<!-- Call a javascript function -->
<button _="on click call handleCreateNew()">
  Create New
</button>
```

### When to Use Hyperscript

`_hyperscript` is ideal for:

- **Toggling classes:** Showing/hiding elements, applying active states.
- **Simple function calls:** Triggering a single, predefined JavaScript function without needing to pass complex data.
- **Adding/removing elements** in a simple, direct way.

### When **NOT** to Use Hyperscript

Move logic to a dedicated `.js` file when:

- **The logic is complex:** If an action requires multiple steps, conditional checks (`if/else`), or loops.
- **State needs to be managed:** If the action needs to read from or write to the application's state (e.g., the Dexie database).
- **Data needs to be passed:** If a function needs to be called with dynamic data.
- **The script is long:** If your `_` attribute script is longer than a single, simple command.
