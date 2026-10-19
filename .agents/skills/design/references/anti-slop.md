---
name: anti-slop
description: Sovereign anti-slop design and frontend taste guidelines for RPGlitch. Covers anti-default color calibration, typography discipline, layout variance, bento grid integrity, and interactive feedback.
---

# Anti-Slop Frontend Craft & Taste Guide

A distilled set of taste laws and bias corrections designed to prevent AI-generated interfaces from looking generic, templated, or lifeless.

---

## 1. The Three Dials Baseline

All layout, motion, and visual density decisions in RPGlitch are governed by the Three Dials configuration:

- **`DESIGN_VARIANCE: 4-5`** (Controlled Clinical Geometry): Clean structural alignments with intentional grid contrast for biometric monitors and narrative feeds.
- **`MOTION_INTENSITY: 5-6`** (Responsive Kinetic Telemetry): Snappy, physics-grounded transitions with spring dampening; zero theatrical delays on high-frequency turns.
- **`VISUAL_DENSITY: 8-9`** (Subterranean Research Terminal): High-information cockpit layout with dense somatic metrics, multiline prompt bracket inspectors, and fixed-width tabular figures.

---

## 2. Anti-Default Discipline (Breaking LLM Clichés)

### A. The Lila Rule & Color Calibration

- **Ban on AI Purple / Blue Glows**: No automatic purple button glows, no random neon mesh gradients. Use neutral terminal bases (charcoal, deep slate, obsidian) with high-contrast singular accents (electric cyan, amber warning, signal red).
- **Single Accent Lock**: Once an accent hue is established for an entity or view, it governs that entire context. Never introduce a random third accent color in secondary controls.
- **Tinted Shadows**: Never use pure-black drop shadows on tinted backgrounds; tint the shadow color to the surface beneath it.

### B. Typography Discipline

- **Serif Discipline**: Never default to serifs merely because a context is described as "creative" or "narrative." Sans-serif display (clean, modern, technical) is the default anchor. Serifs are reserved exclusively for stylized character dialogue quotes or formal lore passages.
- **Descender Clearance (`leading-[1.1]` + `pb-1`)**: When using display headlines with tight tracking and line-height, descender letters (`y, g, j, p, q`) will clip against overflow boundaries. Always reserve bottom clearance (`pb-1` or `leading-[1.1]`).
- **Tabular Figures**: Always use `font-variant-numeric: tabular-nums` for timers, health bars, coordinate displays, round counters, and numeric meters to prevent visual jitter during updates.

### C. Layout & Grid Integrity

- **Eyebrow Restraint**: An "eyebrow" is the small uppercase wide-tracking label sitting above a section title (e.g. `SYSTEM TELEMETRY`, `ACTIVE RECALL`). **Rule: Max 1 eyebrow per 3 panels or sections.** Overusing eyebrows produces a robotic, templated cadence. When in doubt, drop the eyebrow—the content already categorizes itself.
- **Bento Grid Cell Count Rule**: A bento grid or card cluster must have _exactly_ as many cells as there is real content. Never paste an empty tile or fake filler container to balance a grid. Re-shape the grid (e.g. 1+2 split or 2+1 layout).
- **Layout Repetition Ban**: Avoid repeating the exact same layout structure across consecutive sections or drawer panels. Vary between asymmetric splits, vertical stacks, and compact tabular rows.
- **Viewport Stability**: Never use `h-screen` for full-height views. Always use `min-h-[100dvh]` to prevent layout jumping caused by mobile address bars.

---

## 3. Component & Interaction Craft

### A. Tactile Press Feedback

- Every pressable control (buttons, cards, toggle switches, pills) must provide instant tactile feedback on `:active`.
- Apply `transform: scale(0.97)` with `transition: transform 160ms ease-out`. This reassures the user that the system immediately heard their gesture.

### B. Never Animate from Scale(0)

- Nothing in physical reality appears out of nothingness. Elements animating in from `scale(0)` look like cartoon pops.
- Start entrances from `scale(0.95)` to `scale(0.97)` combined with an opacity fade. This imparts physical weight and substance.

### C. Asymmetric Transition Timing

- **Entrances (250–300ms, `ease-out`)**: Give the user a brief, readable spatial hint of where an overlay or drawer came from.
- **Exits (150–160ms, `ease-out`)**: Fast and crisp. Dismissals must never linger or block the user's next action.

### D. Single Intent per Action

- Never duplicate action intent labels across the same view (e.g., "Start Story", "Begin Adventure", "Launch Narrative"). Pick ONE precise, canonical verb per action and use it consistently.
- Button text must fit on a single line at all standard desktop widths. If a button wraps to multiple lines, the label is too wordy or the container is improperly constrained.
