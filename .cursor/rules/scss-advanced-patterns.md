---
description: Advanced SCSS patterns and modern features including color spaces, module system, selector functions, and performance optimization techniques.
tags: "scss", "sass", "css", "styling", "advanced"
globs: **/*.scss,**/*.sass,**/*.css
---

# SCSS Advanced Patterns and Modern Features

## Modern Color Spaces and Functions

### New Color Spaces (CSS Color Level 4)

```scss
// Modern color spaces with better perceptual uniformity
$pink: oklch(64% 0.196 353deg); // Perceptually uniform
$blue: oklch(64% 0.196 253deg); // Consistent lightness/chroma

// Lab and LCH color spaces
$lab-color: lab(50% 20 30);
$lch-color: lch(50% 30 45deg);

// HWB color space
$hwb-color: hwb(120deg 20% 10%);
```

### Modern Color Functions

```scss
@use "sass:color";

// Channel access (replaces deprecated red(), green(), blue())
$red-channel: color.channel($color, "red", rgb);
$green-channel: color.channel($color, "green", rgb);
$blue-channel: color.channel($color, "blue", rgb);

// Color adjustments with explicit color spaces
$brand: hsl(0 100% 25.1%);
$hsl-lightness: color.scale($brand, $lightness: 25%);
$oklch-lightness: color.scale($brand, $lightness: 25%, $space: oklch);

// Color transformations
$inverted: color.invert($color);
$grayscale: color.grayscale($color);
$complement: color.complement($color);

// Gamut mapping
$mapped: color.to-gamut($color, hsl, $method: local-minde);
```

### Deprecated Functions to Avoid

```scss
// ❌ DEPRECATED - Use color.adjust() instead
lighten($color, 10%);
darken($color, 10%);
saturate($color, 10%);
desaturate($color, 10%);
opacify($color, 0.1);
transparentize($color, 0.1);
fade-in($color, 0.1);
fade-out($color, 0.1);

// ✅ MODERN APPROACH
color.adjust($color, $lightness: 10%);
color.adjust($color, $lightness: -10%);
color.adjust($color, $saturation: 10%);
color.adjust($color, $saturation: -10%);
color.adjust($color, $alpha: 0.1);
color.adjust($color, $alpha: -0.1);
```

## Module System Best Practices

### Modern Module Usage

```scss
// ✅ Use @use instead of @import
@use "sass:color";
@use "sass:math";
@use "sass:map";
@use "sass:list";
@use "sass:string";
@use "sass:meta";
@use "sass:selector";

// Namespace usage
$adjusted: color.adjust($primary, $lightness: 10%);
$rounded: math.round($value);
$keys: map.keys($data);
```

### Library Configuration Pattern

```scss
// _variables.scss
$paragraph-margin-bottom: 1rem !default;
$primary-color: #007bff !default;

// _reboot.scss
@use "variables" as *;

p {
  margin-bottom: $paragraph-margin-bottom;
  color: $primary-color;
}

// bootstrap.scss (entry point)
@forward "variables";
@use "reboot";

// User's stylesheet
@use "bootstrap" with (
  $paragraph-margin-bottom: 1.2rem,
  $primary-color: #0056b3
);
```

## Advanced Selector Patterns

### Modern Selector Functions

```scss
@use "sass:selector";

// Nesting selectors
$nested: selector.nest(".parent", ".child");
// Result: .parent .child

// Appending selectors
$appended: selector.append(".btn", ":hover");
// Result: .btn:hover

// Replacing selectors
$replaced: selector.replace(".old", ".new");
// Result: .new

// Unifying selectors
$unified: selector.unify(".a", ".b");
// Result: .a.b

// Extending selectors
$extended: selector.extend(".base", ".extendee", ".extender");
```

### Complex Selector Manipulation

```scss
// Modern selector parsing and manipulation
$parsed: selector.parse(".btn.btn-primary:hover");
$simple: selector.simple-selectors(".btn.btn-primary");
$is-superselector: selector.is-superselector(".btn", ".btn.btn-primary");
```

## Advanced Math and Calculations

### Modern Math Functions

```scss
@use "sass:math";

// Mathematical operations
$percentage: math.percentage(0.5); // 50%
$rounded: math.round(3.7); // 4
$ceiled: math.ceil(3.2); // 4
$floored: math.floor(3.8); // 3
$absolute: math.abs(-5); // 5
$minimum: math.min(1, 2, 3); // 1
$maximum: math.max(1, 2, 3); // 3
$random: math.random(); // Random number 0-1

// Unit operations
$unit: math.unit(10px); // "px"
$is-unitless: math.is-unitless(10); // true
$compatible: math.compatible(10px, 20px); // true
```

### CSS calc() Integration

```scss
// Modern calc() support
$width: 100px;
$calc-result: calc($width / 2);

// Slash separator for CSS Grid
.grid-item {
  grid-row: 1 / 3;
  grid-column: 1 / 4;
}
```

## Advanced List and Map Operations

### Modern List Functions

```scss
@use "sass:list";

// List operations
$length: list.length($items);
$nth: list.nth($items, 2);
$set-nth: list.set-nth($items, 2, "new-value");
$join: list.join($list1, $list2);
$append: list.append($list, "new-item");
$zip: list.zip($list1, $list2);
$index: list.index($list, "item");
$separator: list.separator($list);
```

### Advanced Map Operations

```scss
@use "sass:map";

// Map operations
$get: map.get($data, "key");
$merge: map.merge($map1, $map2);
$remove: map.remove($map, "key");
$keys: map.keys($map);
$values: map.values($map);
$has-key: map.has-key($map, "key");

// Nested map operations
$nested-get: map.get($map, "level1", "level2");
$nested-set: map.set($map, "level1", "level2", "value");
```

## Meta-Programming and Reflection

### Feature Detection

```scss
@use "sass:meta";

// Check feature availability
$feature-exists: meta.feature-exists("global-variable-shadowing");

// Variable and function existence
$var-exists: meta.variable-exists("my-variable");
$global-var-exists: meta.global-variable-exists("global-var");
$function-exists: meta.function-exists("my-function");
$mixin-exists: meta.mixin-exists("my-mixin");

// Type checking
$type: meta.type-of($value);

// Function reflection
$function: meta.get-function("my-function");
$result: meta.call($function, $arg1, $arg2);

// Content detection
$has-content: meta.content-exists();
```

### Advanced Inspection

```scss
// Debug and inspection
$inspected: meta.inspect($value);

// Keywords handling
@mixin my-mixin($positional, $keyword: default) {
  $keywords: meta.keywords($args);
  // Process keyword arguments
}
```

## Modern String Operations

### String Functions

```scss
@use "sass:string";

// String manipulation
$length: string.length("hello"); // 5
$slice: string.slice("hello world", 0, 5); // "hello"
$index: string.index("hello world", "world"); // 7
$insert: string.insert("hello", " world", 5); // "hello world"

// Case conversion
$upper: string.to-upper-case("hello"); // "HELLO"
$lower: string.to-lower-case("HELLO"); // "hello"

// Unique ID generation
$unique: string.unique-id(); // "u123456"
```

## Performance and Best Practices

> **Note**: For comprehensive debugging and troubleshooting, see [SCSS Debugging](./scss-debugging.mdc).

### Compilation Optimization

```scss
// Use @use for better performance
// @use loads modules once and caches them
@use "variables" as vars;

// Avoid @import in modern Sass
// @import loads files multiple times if used elsewhere
```

### Memory Management

```scss
// Use maps for large datasets
$theme: (
  "primary": #007bff,
  "secondary": #6c757d,
  "success": #28a745,
  "danger": #dc3545
);

// Use lists for ordered data
$breakpoints: (xs, sm, md, lg, xl);
```

### Advanced Debugging Techniques

```scss
// Advanced debugging with meta functions
@debug "Variable value: #{$variable}";
@warn "This is a warning message";
@error "This is an error message";

// Feature detection for progressive enhancement
@if meta.feature-exists("modern-color-spaces") {
  $color: oklch(50% 0.2 45deg);
} @else {
  $color: hsl(45deg 50% 50%);
}

// Advanced inspection
$inspected: meta.inspect($value);
```

## Modern CSS Integration

> **Note**: For comprehensive modern CSS principles, layout systems, and framework integration, see [SCSS Modern CSS & Frameworks](./scss-modern-css-frameworks.mdc).

### CSS Custom Properties Integration

```scss
// Dynamic CSS custom properties with SCSS
:root {
  --primary-color: #{$primary-color};
  --spacing-unit: #{$spacing-unit};
}

.component {
  color: var(--primary-color);
  margin: calc(var(--spacing-unit) * 2);
}
```

### SCSS-Specific Modern Features

```scss
// SCSS-specific grid generation
@mixin responsive-grid($columns: 3, $min-width: 200px) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax($min-width, 1fr));
  gap: 1rem;
}

.grid {
  @include responsive-grid(3, 200px);
}

// SCSS-specific flexbox utilities
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
```

## Migration Guide

### From Legacy to Modern

```scss
// ❌ Legacy approach
@import "variables";
$color: lighten($primary, 10%);
$list: join($list1, $list2);

// ✅ Modern approach
@use "variables" as vars;
$color: color.adjust(vars.$primary, $lightness: 10%);
$list: list.join($list1, $list2);
```

### Backward Compatibility

```scss
// Check for feature support
@if meta.feature-exists("modern-color-spaces") {
  // Use modern color spaces
  $color: oklch(50% 0.2 45deg);
} @else {
  // Fallback to legacy colors
  $color: hsl(45deg 50% 50%);
}
```

## Related Rules

- [SCSS Modern CSS & Frameworks](./scss-modern-css-frameworks.mdc) - Modern CSS principles and framework integration
- [SCSS Debugging](./scss-debugging.mdc) - Troubleshooting and debugging SCSS issues
- [Perchance Build & Deployment](./perchance-build-deployment.mdc) - Build and deployment for Perchance projects
- [Perchance Development Lifecycle](./perchance-development-lifecycle.mdc) - Planning and iteration steps

---

This documentation reflects the latest Sass features and best practices, ensuring your SCSS code is modern, maintainable, and performant.
