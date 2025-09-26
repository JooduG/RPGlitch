# HTML Best Practices

**RULE:** Write clean, semantic, and accessible HTML. Use `_hyperscript` for simple, declarative interactions. Use dedicated JavaScript for complex logic.

---

## 1. Valid Document Structure

**RULE:** Every HTML file MUST be a valid document.

* **DIRECTIVE:** Start file with `<!DOCTYPE html>`.
* **DIRECTIVE:** `<html>` element MUST have a `lang` attribute (e.g., `<html lang="en">`).
* **DIRECTIVE:** `<head>` MUST contain `<meta charset="UTF-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, and a descriptive `<title>`.

---

## 2. Semantic Elements for Meaning

**RULE:** Use HTML5 semantic elements to describe content structure. AVOID using `<div>` for everything.

* **DIRECTIVE:** Use `<main>` for primary, unique page content (only one per page).
* **DIRECTIVE:** Use `<nav>` for major navigation blocks.
* **DIRECTIVE:** Use `<header>` and `<footer>` for top/bottom sections of a page or article.
* **DIRECTIVE:** Use `<article>` for self-contained content (e.g., a single entity card).
* **DIRECTIVE:** Use `<section>` to group related content.
* **DIRECTIVE:** Use `<aside>` for supplementary content.

---

## 3. Accessibility Directives

**RULE:** Web accessibility (a11y) is a non-negotiable requirement.

* **DIRECTIVE:** All `<img>` tags MUST have an `alt` attribute. Use `alt=""` for decorative images. Describe image content for informative images.
* **DIRECTIVE:** Use `<button>` for actions (e.g., form submission). Use `<a>` for navigation. DO NOT mix their purposes.
* **DIRECTIVE:** All `<input>` elements MUST be associated with a `<label>` element.

---

## 4. Hyperscript Usage Directives

**RULE:** Use `_hyperscript` for simple, declarative UI interactions. For complex logic, use a dedicated JavaScript file (refer to `js-guide.md`).

* **DIRECTIVE:** `_hyperscript` is included from `/build/local_libs/` and uses the `_` attribute.
* **DIRECTIVE:** Use `on click` for click triggers.
* **DIRECTIVE:** Use `toggle` to toggle classes.
* **DIRECTIVE:** Use `call` to invoke global JavaScript functions.

### When to Use Hyperscript

**DIRECTIVE:** Use `_hyperscript` for:

* Toggling classes (showing/hiding, active states).
* Simple function calls (single, predefined JS function without complex data).
* Adding/removing elements directly.

### When NOT to Use Hyperscript

**DIRECTIVE:** Move logic to a dedicated `.js` file when:

* Logic is complex (multiple steps, conditionals, loops).
* State management is required (reading/writing to application state, e.g., Dexie database).
* Dynamic data needs to be passed to functions.
* The `_` attribute script is long (more than a single, simple command).
