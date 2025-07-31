---
description: Comprehensive guide for debugging SCSS compilation errors, performance issues, and troubleshooting common problems in Sass/SCSS development.
tags: "scss", "sass", "debugging", "troubleshooting", "performance"
globs: **/*.scss,**/*.sass,**/*.css
---

# SCSS Debugging & Troubleshooting

## Scope

- Common SCSS compilation errors and solutions
- Debugging techniques for SCSS issues
- Performance optimization and troubleshooting
- Best practices for avoiding SCSS problems

---

## Common SCSS Errors

### **Compilation Errors**

#### **Variable Not Found**

```scss
// ❌ Error: Undefined variable $primary-color
.button {
  background-color: $primary-color;
}

// ✅ Solution: Define variable first
$primary-color: #007bff;
.button {
  background-color: $primary-color;
}
```

#### **Mixin Not Found**

```scss
// ❌ Error: Undefined mixin card-style
.card {
  @include card-style;
}

// ✅ Solution: Define mixin first
@mixin card-style {
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card {
  @include card-style;
}
```

#### **Import Path Issues**

```scss
// ❌ Error: File to import not found
@import "variables";

// ✅ Solution: Use correct path
@import "./variables";
// or
@import "abstracts/variables";
```

### **Syntax Errors**

#### **Missing Semicolons**

```scss
// ❌ Error: Missing semicolon
.button {
  background-color: #007bff
  color: white
}

// ✅ Solution: Add semicolons
.button {
  background-color: #007bff;
  color: white;
}
```

#### **Incorrect Nesting**

```scss
// ❌ Error: Invalid nesting
.card {
  .title {
    color: blue;
  }
  color: red; // This should be outside the nested selector
}

// ✅ Solution: Proper nesting
.card {
  color: red;
  
  .title {
    color: blue;
  }
}
```

#### **Invalid Selector Interpolation**

```scss
// ❌ Error: Invalid selector
$class-name: "button";
#{$class-name} {
  color: blue;
}

// ✅ Solution: Use proper interpolation
$class-name: "button";
.#{$class-name} {
  color: blue;
}
```

---

## Debugging Techniques

### **Source Maps**

Enable source maps for better debugging:

```scss
// In your build configuration
sass --source-map --style=expanded input.scss output.css
```

### **Debug Output**

Use `@debug` for debugging variables and values:

```scss
$primary-color: #007bff;
@debug "Primary color is: #{$primary-color}";

@mixin responsive($breakpoint) {
  @debug "Applying breakpoint: #{$breakpoint}";
  @media (min-width: $breakpoint) {
    @content;
  }
}
```

### **Warnings**

Use `@warn` for non-critical issues:

```scss
@mixin theme($theme-name) {
  $theme: map-get($themes, $theme-name);
  
  @if $theme {
    @each $key, $value in $theme {
      --#{$key}: #{$value};
    }
  } @else {
    @warn "Theme '#{$theme-name}' not found. Available themes: #{map-keys($themes)}";
  }
}
```

### **Error Handling**

Use `@error` for critical issues:

```scss
@function token($category, $key) {
  $value: map-get($design-tokens, $category);
  
  @if not $value {
    @error "Category '#{$category}' not found in design tokens";
  }
  
  $value: map-get($value, $key);
  
  @if not $value {
    @error "Key '#{$key}' not found in category '#{$category}'";
  }
  
  @return $value;
}
```

---

## Performance Issues

### **Deep Nesting**

```scss
// ❌ Problem: Deep nesting creates overly specific selectors
.card {
  .header {
    .title {
      .text {
        .link {
          color: blue;
        }
      }
    }
  }
}

// ✅ Solution: Flatten nesting
.card {
  .header-title-link {
    color: blue;
  }
}

// Or use BEM methodology
.card__header-title-link {
  color: blue;
}
```

> **Note**: For modern CSS architecture patterns and BEM methodology, see [SCSS Modern CSS & Frameworks](./scss-modern-css-frameworks.mdc).

### **Large Output Files**

```scss
// ❌ Problem: Unused styles in output
.unused-class {
  color: red;
}

// ✅ Solution: Remove unused styles
// Use tools like PurgeCSS to automatically remove unused styles
```

### **Inefficient Selectors**

```scss
// ❌ Problem: Inefficient selector generation
@each $color in (red, blue, green) {
  .button-#{$color} {
    background-color: $color;
  }
}

// ✅ Solution: Use more efficient approach
.button {
  &--red { background-color: red; }
  &--blue { background-color: blue; }
  &--green { background-color: green; }
}
```

---

## Common Patterns & Solutions

### **Circular Dependencies**

```scss
// ❌ Problem: Circular import
// _variables.scss
$primary-color: #007bff;
@import "mixins";

// _mixins.scss
@import "variables";
@mixin button-style {
  background-color: $primary-color;
}

// ✅ Solution: Separate concerns
// _variables.scss
$primary-color: #007bff;

// _mixins.scss
@import "variables";
@mixin button-style {
  background-color: $primary-color;
}

// main.scss
@import "variables";
@import "mixins";
```

### **Variable Scope Issues**

```scss
// ❌ Problem: Variable scope confusion
$color: red;

.button {
  $color: blue; // This shadows the global variable
  background-color: $color;
}

.other-element {
  background-color: $color; // This uses the global red
}

// ✅ Solution: Use clear naming
$global-color: red;

.button {
  $button-color: blue;
  background-color: $button-color;
}

.other-element {
  background-color: $global-color;
}
```

### **Map Access Issues**

```scss
// ❌ Problem: Incorrect map access
$colors: (
  primary: #007bff,
  secondary: #6c757d
);

.button {
  background-color: $colors[primary]; // Wrong syntax
}

// ✅ Solution: Use map-get function
$colors: (
  primary: #007bff,
  secondary: #6c757d
);

.button {
  background-color: map-get($colors, primary);
}
```

---

## Build Process Issues

### **Compilation Failures**

Common build issues and solutions:

```bash
# ❌ Problem: Missing dependencies
sass input.scss output.css
# Error: File to import not found

# ✅ Solution: Check file paths and dependencies
sass --load-path=./node_modules input.scss output.css
```

### **Output File Issues**

```bash
# ❌ Problem: Large output files
# Check for unused imports or styles

# ✅ Solution: Use optimization flags
sass --style=compressed input.scss output.css
```

### **Source Map Issues**

```bash
# ❌ Problem: Source maps not working
# Check if source maps are enabled

# ✅ Solution: Enable source maps
sass --source-map --style=expanded input.scss output.css
```

---

## Testing & Validation

### **SCSS Linting**

Use SCSS linting tools to catch issues early:

```bash
# Install sass-lint or stylelint
npm install -g sass-lint

# Run linting
sass-lint -v -q
```

### **Compilation Testing**

Test compilation regularly:

```bash
# Test compilation without output
sass --check input.scss

# Test with specific output format
sass --style=compressed input.scss output.css
```

### **Browser Testing**

Test compiled CSS in browsers:

- Check for CSS validation errors
- Test responsive breakpoints
- Verify cross-browser compatibility
- Check for performance issues

---

## Best Practices for Avoiding Issues

### **File Organization**

```mermaid
scss/
├── abstracts/
│   ├── _variables.scss
│   ├── _functions.scss
│   └── _mixins.scss
├── base/
│   ├── _reset.scss
│   └── _typography.scss
├── components/
│   ├── _buttons.scss
│   └── _cards.scss
└── main.scss
```

### **Naming Conventions**

- Use descriptive variable names: `$primary-color`, not `$pc`
- Use consistent naming: `$spacing-unit`, `$border-radius`
- Use BEM methodology for components: `.card__title--large`

### **Import Order**

```scss
// 1. Variables and functions
@import "abstracts/variables";
@import "abstracts/functions";

// 2. Mixins
@import "abstracts/mixins";

// 3. Base styles
@import "base/reset";
@import "base/typography";

// 4. Components
@import "components/buttons";
@import "components/cards";

// 5. Layout
@import "layout/header";
@import "layout/footer";
```

### **Documentation**

Document complex SCSS:

```scss
/**
 * Button component mixin
 * @param {string} $variant - Button variant (primary, secondary, danger)
 * @param {string} $size - Button size (sm, md, lg)
 */
@mixin button($variant: 'primary', $size: 'md') {
  // Implementation
}
```

---

## Related Rules

- [SCSS Modern CSS & Frameworks](./scss-modern-css-frameworks.mdc) - Modern CSS principles and framework integration
- [SCSS Advanced Patterns](./scss-advanced-patterns.mdc) - Advanced SCSS features and meta-programming
- [Perchance Build & Deployment](./perchance-build-deployment.mdc) - Build and deployment for Perchance projects
- [Perchance Development Lifecycle](./perchance-development-lifecycle.mdc) - Planning and iteration steps

---

## References

- [Sass Documentation](https://sass-lang.com/documentation)
- [Sass Guidelines](https://sass-guidelin.es/)
- [Sass Debugging](https://sass-lang.com/documentation/at-rules/debug/)
- [Stylelint](https://stylelint.io/)
