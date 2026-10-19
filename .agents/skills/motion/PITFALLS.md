# Failure Traps & Empirical Pitfalls for Motion

Authored in the Triadic Entry Format (`Trigger` / `Wrong Behavior` / `Correct Behavior`). Consult this file before designing, auditing, or refactoring animations and kinetic interactions.

---

## 1. Animating High-Frequency / Keyboard Actions

- **Trigger**: Adding open/close or enter/exit animations to command palettes, hotkey dialogs, turn submissions, or frequent list toggles.
- **Wrong Behavior**: Wrapping command palettes or rapid navigation elements in 200–300ms transitions, making the interface feel sluggish and unresponsive.
- **Correct Behavior**: Follow the Raycast Law. Actions triggered 100+ times/day receive **zero animation**. Zero entrance/exit transitions for keyboard-shortcut interactions.

---

## 2. Using `ease-in` on UI Transitions

- **Trigger**: Selecting an easing curve for element appearance, tooltip emergence, or interactive hover/active states.
- **Wrong Behavior**: Using `ease-in` or built-in slow acceleration curves. The animation starts slowly, delaying visual feedback exactly when the user is watching.
- **Correct Behavior**: Never use `ease-in` for UI. Entering and exiting elements use `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. Moving elements on screen use `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`.

---

## 3. Animating from `scale(0)`

- **Trigger**: Creating popovers, dropdowns, tooltips, or badge emergence animations.
- **Wrong Behavior**: Animating from `transform: scale(0)`. Nothing in the real world emerges from a microscopic point; it creates an exaggerated, cartoonish look.
- **Correct Behavior**: Animate from `transform: scale(0.95)` with `opacity: 0`. Subtle, physical scaling that feels grounded.

---

## 4. Centered Popovers vs. Origin-Aware Popovers

- **Trigger**: Displaying a popover, dropdown menu, or tooltip relative to an interactive trigger button.
- **Wrong Behavior**: Setting `transform-origin: center` so the menu scales out from its own midpoint.
- **Correct Behavior**: Set `transform-origin: var(--transform-origin)` so the element scales directly from its trigger. Modals are exempt (modals stay centered).

---

## 5. Compositor Violations (`transition: all` & Layout Properties)

- **Trigger**: Animating accordion reveals, button resizing, or drawer expansion.
- **Wrong Behavior**: Animating `height`, `width`, `top`, `left`, `margin`, or using `transition: all`. Causes layout thrashing and Cumulative Layout Shift (CLS).
- **Correct Behavior**: Animate GPU/compositor properties exclusively (`transform`, `opacity`). Never use `transition: all`. If height collapse is required, use CSS grid `grid-template-rows: 0fr -> 1fr` with inner `min-h-0` overflow clipping.

---

## 6. Mixing View Transitions with Svelte Transition Directives

- **Trigger**: Creating solid-state page or modal transitions in Svelte 5.
- **Wrong Behavior**: Attaching both `view-transition-name: card` and Svelte directives (`transition:fly` or `in:fade`) to the same DOM element.
- **Correct Behavior**: Complete separation of concerns. Never mix `view-transition-name` with Svelte transition directives. Use `document.startViewTransition` with `flushSync` for macro morphing.

---

## 7. Missing Reduced Motion & Fine Pointer Gating

- **Trigger**: Adding hover effects or kinetic feedback to interactive controls.
- **Wrong Behavior**: Applying `:hover` transforms globally without pointer media queries, or ignoring `prefers-reduced-motion`.
- **Correct Behavior**: Gate hover animations behind `@media (hover: hover) and (pointer: fine)` to protect touch screens. Respect `prefers-reduced-motion: reduce` by preserving color/opacity feedback while neutralizing translation/scale movement.
