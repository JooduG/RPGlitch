---
description: The Review Protocol. Audits UI quality against the "Chalk Regime".
---

# 🧐 Critique Protocol

> **Goal:** Ensure every pixel adheres to the strict aesthetic laws of the Republic.

## 1. The Chalk Regime Audit

Verify against [06-aesthetic.md](../../rules/06-aesthetic.md):

- [ ] **Backgrounds**: Are they `var(--app-surface-chalk)`? No pure black `#000` unless deep background.
- [ ] **Text**: Is primary text `#F4F4F5`? No pure white `#FFFFFF` on large surfaces.
- [ ] **Borders**: Are they 1px max?
- [ ] **Motion**: Do interactions feel "Snappy" (`200ms`)?

## 2. Usability Audit

- [ ] **Contrast**: Is text legible against the surface?
- [ ] **Hit Targets**: Are buttons at least 44x44px?
- [ ] **Feedback**: Does the element react to user input (Hover, Active, Focus)?

## 3. Responsiveness

- [ ] **Flexibility**: Does the component break on mobile?
- [ ] **Spacing**: Are margins/padding defined by tokens (`var(--app-space-...)`)?
