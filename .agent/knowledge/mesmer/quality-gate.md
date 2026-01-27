# 🛡️ Mesmer: The Quality Gate

> **Directive:** All UI must past this gate before being merged into the "Reality" (Master Branch).

## 1. Visual Integrity (The Look)

- [ ] **No Emojis**: Use SVG icons (Lucide/Heroicons) or custom symbols.
- [ ] **Soft Depth**: Does it use atmospheric blur and elevation? No flat backgrounds.
- [ ] **Color Harmony**: Are colors derived from the [Signature Palette](../../DESIGN.md)?
- [ ] **Typography**: Ubuntu for Headings, Inter for Body. No defaults.

## 2. Dynamic Resonance (The Feed)

- [ ] **Smooth States**: Apply elastic transforms on hover.
- [ ] **Pulse Effects**: Critical indicators must have subtle breath/pulse animations.
- [ ] **Contrast**: Verify 4.5:1 ratio for all body text.

## 3. Structural Excellence (The Body)

- [ ] **Runes Only**: Svelte 5 logic throughout.
- [ ] **Responsive**: Test at 375px (Mobile) and 1440px (Desktop).
- [ ] **Layout Shifts**: No "pop-in" or layout jumping during theme changes.

---

## 🛠️ Audit Command

```bash
/review-design
```
