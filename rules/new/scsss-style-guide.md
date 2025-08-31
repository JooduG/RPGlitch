# SCSS Style Guide

This guide defines the rules, patterns, and best practices for writing SCSS in this project. The goal is to create CSS that is modular, maintainable, and scalable.

---

## 1. Architecture & File Structure

This project uses a simplified version of the 7-1 pattern for its SCSS structure within `apps/rpglitch/scss/`:

- **`index.scss`:** This is the main manifest file. It should not contain any CSS rules itself, but instead uses `@import` to assemble all other partials into a single output stylesheet.
- **`_placeholders.scss`:** Contains placeholder selectors (e.g., `%flex-center`) for common, reusable patterns that don't add to CSS output unless extended.
- **Component-specific files:** Styles for major UI components (e.g., `storyboard.scss`) are kept in their own files.

---

## 2. SCSS Best Practices

### Nesting

- **Rule:** Nesting is powerful but dangerous. **Do not nest more than 3 levels deep.** Over-nesting leads to overly specific CSS selectors that are hard to override and tightly coupled to the HTML structure.

```scss
// Good
.profile-card {
  padding: 1rem;

  .card-title {
    font-size: 1.5rem;
  }
}

// Bad (Avoid this)
.profile-list {
  .profile-card {
    .card-header {
      .card-title { // Too deep!
        font-size: 1.5rem;
      }
    }
  }
}
```

### Variables

- **Rule:** Use SCSS variables (`$variable-name`) for all repeated values, especially colors, fonts, and spacing units. This allows for easy theme updates and maintains consistency.

```scss
// Variables
$primary-color: #333;
$base-font-size: 16px;

// Usage
body {
  color: $primary-color;
  font-size: $base-font-size;
}
```

### Mixins

- **Rule:** Use mixins (`@mixin`) for reusable blocks of styles, especially for vendor prefixes or complex properties like flexbox centering.

```scss
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.some-container {
  @include flex-center;
}
```

### Extends

- **Rule:** Use `@extend` with placeholder selectors (`%`) to share common properties between selectors without duplicating code in the final CSS output. This is ideal for structural or behavioral styles.

```scss
// Placeholder in _placeholders.scss
%button-base {
  padding: 0.5em 1em;
  border-radius: 4px;
}

// Usage in another file
.button-primary {
  @extend %button-base;
  background-color: blue;
}
```

---

## 3. Relationship with CSS Frameworks

This project **does not** use a large, all-encompassing CSS framework like Bootstrap or Foundation. Instead, it favors a custom, lightweight approach for the following reasons:

- **Performance:** Avoids shipping unused CSS, resulting in smaller file sizes.
- **Control:** Provides full control over the final CSS output and avoids fighting framework specificity.
- **Simplicity:** The current apps do not require the complexity of a full framework.

We do, however, use `pico.css` as a base for simple styling and classless semantic HTML, which can be extended with custom SCSS.

---

## 4. Debugging SCSS

- **Source Maps:** The build process should always generate CSS source maps. This allows you to see the original SCSS file and line number in your browser's developer tools, making it much easier to trace where a style is coming from.
- **The `debug` Directive:** For complex mixins or functions, use the `@debug` directive to print the value of a variable to the console during compilation. This is invaluable for troubleshooting logic.

```scss
@mixin calculate-width($columns) {
  $width: (100% / $columns);
  @debug "Column width is #{$width}";
  width: $width;
}
```
