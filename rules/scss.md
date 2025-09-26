# SCSS Best Practices

**RULE:** This guide defines the rules, patterns, and best practices for writing SCSS in this project. The goal is to create CSS that is modular, maintainable, and scalable.

---

## 1. Architecture & File Structure

**RULE:** This project uses a simplified version of the 7-1 pattern for its SCSS structure within `apps/rpglitch/scss/`.

* **DIRECTIVE:** `index.scss` MUST be the main manifest file. It MUST NOT contain CSS rules itself. It MUST use `@import` to assemble all other partials.
* **DIRECTIVE:** `_placeholders.scss` MUST contain placeholder selectors (e.g., `%flex-center`) for common, reusable patterns.
* **DIRECTIVE:** Component-specific styles (e.g., `storyboard.scss`) MUST be kept in their own files.

---

## 2. SCSS Best Practices

### Nesting

**RULE:** Nesting is powerful but dangerous.

* **DIRECTIVE:** DO NOT nest more than 3 levels deep.
* **DIRECTIVE:** AVOID over-nesting as it leads to overly specific CSS selectors.

### Variables

**RULE:** Use SCSS variables (`$variable-name`) for all repeated values (colors, fonts, spacing units).

* **DIRECTIVE:** Use variables for easy theme updates and consistency.

### Mixins

**RULE:** Use mixins (`@mixin`) for reusable blocks of styles (e.g., vendor prefixes, complex properties like flexbox centering).

### Extends

**RULE:** Use `@extend` with placeholder selectors (`%`) to share common properties between selectors without duplicating code.

* **DIRECTIVE:** Use for structural or behavioral styles.

---

## 3. Relationship with CSS Frameworks

**RULE:** This project DOES NOT use large, all-encompassing CSS frameworks (e.g., Bootstrap, Foundation).

* **DIRECTIVE:** Favor a custom, lightweight approach for performance, control, and simplicity.
* **DIRECTIVE:** Use `pico.css` as a base for simple styling and classless semantic HTML. Extend it with custom SCSS.

---

## 4. Debugging SCSS

**RULE:** Utilize debugging features for SCSS.

* **DIRECTIVE:** The build process SHOULD always generate CSS source maps.
* **DIRECTIVE:** Use the `@debug` directive to print variable values during compilation for troubleshooting.

---

## 5. Atomic CSS Principles

**RULE:** Embrace atomic CSS for low-level utility styling.

* **DIRECTIVE:** Each class SHOULD have single responsibility (e.g., `d-flex` for `display: flex;`).
* **DIRECTIVE:** AVOID overriding utility classes. Compose them instead.
* **DIRECTIVE:** Class names SHOULD be intuitive and predictable (e.g., `p-1` for padding).
* **DIRECTIVE:** Use a hybrid approach: custom SCSS for components, atomic CSS for utilities.
