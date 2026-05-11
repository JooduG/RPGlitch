---
name: user-interface
description: The Structural Guard of the RPGlitch Engine. Owns layout stability, viewport-aware positioning, and robust interaction patterns.
---

# User Interface Specialist

> "I am the Architect of Stability. I ensure the interface is as solid as the machine that runs it. Elements must never bleed beyond the user's view, and the layout must never jitter."

## Overview

The `user-interface` skill provides the structural foundation for the shell. It manages the "Physics" of the UI—positioning, boundary enforcement, and interaction robustness. It adheres to the **Grounded Policy** and **Visual Depth (Z-Law)** from **Rule 04**.

## Strategic Context

- **Layout Stability**: Components must not "pop" or shift significantly when state changes (e.g., entering edit mode).
- **Viewport Sovereignty**: Floating elements must never bleed beyond the user's view.
- **Event Robustness**: Click-outside and focus handlers must handle complex DOM structures gracefully.
- **Keyboard Intent**: Critical interactions must support natural keyboard flow (ENTER to confirm).

## How It Works

### 1. Spatial Positioning (Floating Logic)

When building dropdowns, tooltips, or context menus, use viewport-aware positioning:

- **Assessment**: Calculate space above and below the anchor using `getBoundingClientRect()`.
- **State Selection**: Default to "dropdown" but switch to "dropup" if space below is < `DROPDOWN_MAX_HEIGHT` and `space_above > space_below`.
- **Dynamic Max-Height**: Constrain the element to `Math.min(available_space - padding, DROPDOWN_MAX_HEIGHT)`.
- **Coordinate Assignment**: Map coordinates to a reactive state object using `--spacing-l` (1.5rem) as a safety buffer.

### 2. Layout Stabilization (The Guard)

Maintain a "solid" interface through consistent structural patterns:

- **Stable Readonly Fields**: Provide a `min-height` (e.g., `2.5rem` or `var(--icon-medium)`) for fields, even when empty, to prevent layout collapses.
- **Robust Click-Outside**: Use `e.target instanceof Node` and fallback to `parentElement` to ensure hits on deeply nested children are caught.
- **Text Truncation**: Use the `.truncate` utility (ellipsis) in flex containers. Ensure parent has `min-width: 0`.
- **Boundary Control**: Use `max-height` and `overflow-y: auto` on dynamic content areas to prevent squashing adjacent UI.

## Usage

### Truncation Utility

```css
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
```

### Positioning Logic (Svelte 5)

```javascript
const update = () => {
  const rect = anchor_el.getBoundingClientRect();
  const vh = window.innerHeight;
  const padding = 16;
  const space_below = vh - rect.bottom - padding;
  const space_above = rect.top - padding;

  const use_dropup = space_below < 300 && space_above > space_below;
  const max_h = Math.min(use_dropup ? space_above : space_below, 300);

  coords = {
    top: use_dropup ? null : rect.bottom,
    bottom: use_dropup ? vh - rect.top : null,
    max_h,
  };
};
```

## Verification Checklist

- [ ] Floating elements do not overflow the viewport boundaries.
- [ ] Empty fields have sufficient click surface (min-height).
- [ ] Dropdowns/menus correctly close when clicking outside their anchor.
- [ ] Layout remains stable (no jumps) when toggling interactive states.
- [ ] Critical actions (Modals/Dialogs) respond to the ENTER key.
