---
description:
---

# Mesmer: Design Quality Gate

## Visual Quality Checklist

- [ ] No emojis used as icons (use SVG instead).
- [ ] All icons from consistent icon set (Heroicons/Lucide).
- [ ] Brand logos are correct (verified from Simple Icons).
- [ ] Hover states don't cause layout shift.
- [ ] Use theme colors directly (`bg-primary`) not `var()` wrapper.

## Interaction Checklist

- [ ] All clickable elements have `cursor-pointer`.
- [ ] Hover states provide clear visual feedback.
- [ ] Transitions are smooth (150-300ms).
- [ ] Focus states visible for keyboard navigation.

## Light/Dark Mode

- [ ] Light mode text has sufficient contrast (4.5:1 minimum).
- [ ] Glass/transparent elements visible in light mode.
- [ ] Borders visible in both modes.

## Layout & A11y

- [ ] Floating elements have proper spacing from edges.
- [ ] No content hidden behind fixed navbars.
- [ ] Responsive at 375px, 768px, 1024px, 1440px.
- [ ] All images have alt text; all inputs have labels.
