# Anti-Slop Frontend Craft & Taste Guide

Taste laws and bias corrections preventing generic, templated, or low-contrast interfaces across RPGlitch views. Visual target dials (`4–5 / 10` layout variance, `5–6 / 10` motion intensity, `8–9 / 10` visual density) are anchored in [SKILL.md](../SKILL.md).

---

## 1. Anti-Default Color & Surface Discipline

- **Obsidian Base & Exempted Stage Gradients**: Ban gratuitous purple/neon button glows and arbitrary rainbow meshes. Ground views in [DESIGN.md](../../../../DESIGN.md) charcoal and obsidian bases (`--color-chalk`, `--color-gunmetal`, `--color-frozen`, `--color-glass-sunken`, `--color-glass-elevated`) paired with `--color-frisk` foreground text. _(Exception: the four-stop abyssal backdrop `--color-background-gradient-1` through `--color-background-gradient-4` and `--signature-glow` defined in `DESIGN.md` are canonical.)_
- **Single-Entity Accent Scope**: Within a single character or fractal container, anchor accents to `--signature-color` (mixed via `color-mix(in srgb, var(--signature-color) 10%, var(--color-glass-sunken))` for readable wells) rather than introducing unrelated tertiary accents. Reserve `--color-dev-accent` (`--color-electric-cyan`) strictly for developer telemetry (`DevWing.svelte`, prompt brackets, and ledger diagnostics).
- **Accessible Signature Contrast (`>= 4.5:1`)**: High-luminance `signatures` (`#fde047`, `#fbbf24`, `#84cc16`) fail contrast under white text. Keep text-bearing signature panels translucent over dark obsidian surfaces (or framed behind dark gradient scrims), or pair solid bright signature fills with `--color-chalk` ink.
- **Tinted Shadows**: Never paint pure `#000` drop shadows onto dark slate surfaces; use `--shadow-ghost`, `--shadow-standard`, and `--shadow-ambient` (tinted with `--color-background-gradient-1`).

---

## 2. Typography & Information Hierarchy

- **Explicit Font Role Assignment**: Do not swap fonts arbitrarily for `"narrative flavor"`:
  - `--font-sans` (`"Inter"`): Default UI copy and narrative dialogue (`ChatBubble.svelte` applies `.dialogue` weight `1.12em` emphasis directly in `--font-sans`, with `[&_em]` italics — not serifs).
  - `--font-heading` (`"Ubuntu"`): Structural headings `h1`–`h6` and watermark initials.
  - `--font-display` (`"Satisfy"`, cursive): Atmospheric titles and storybook accents only.
  - `--font-mono` (`"JetBrains Mono"`): Prompt brackets (`[KEY: VALUE]`), telemetry counters, and terminal labels.
- **Descender Clearance (`pb-tight`)**: When styling tight headings or single-line labels with compact `line-height`, preserve vertical clearance (e.g., `pb-tight` / `--spacing-tight`) so descenders (`y, g, j, p, q`) do not clip against `overflow-hidden` bounds.
- **Tabular Figures (`tabular-nums`)**: Apply `font-variant-numeric: tabular-nums` (`tabular-nums`) to live numeric readouts — progress percentages (`ProgressBar.svelte`), meter inputs (`Meter.svelte` alignment target), round counters, and dynamics deltas (`[0..100]`) — so changing digits never jitter horizontally.
- **Eyebrow Restraint**: Limit decorative marketing/section eyebrows (uppercase tracked labels above headings) to at most `1` per `3` panels so layouts avoid a templated cadence; compact monospace field labels inside dense `VISUAL_DENSITY: 8–9` telemetry inspectors (`DevWing.svelte`, `ChatBubble.svelte`) are structural labels, not decorative eyebrows.

---

## 3. Layout Integrity & Component Restraint

- **Content-Matched Bento Cells**: Render only as many grid tiles or cards as real entities/data require; reshape grid spans (e.g., `1+2` or `2+1`) instead of inserting placeholder filler tiles.
- **Structural Variety**: Vary consecutive panels between asymmetric splits, stacked rows, and compact tabular readouts instead of cloning identical card shells across every drawer.
- **Viewport Stability**: Use `min-h-dvh` rather than `h-screen` (`100vh`) so embedded Perchance iframes and mobile browser toolbars do not cause vertical jumps.
- **Single Canonical Verb & Concise Actions**: Never show synonymous action buttons in the same view (pick one canonical verb such as `Delete` or `Confirm`). Keep button labels concise (`<= 2–3` words) so primary controls fit cleanly on one line within button containers across desktop and `< 48rem` views.
- **Motion Jurisdiction**: All `:active` press reflexes (`active:scale-sink`), entrance/exit durations (`duration-(--duration-fast)`, `duration-(--duration-standard)`), easing tokens (`ease-(--ease-out)`), and View Transition choreography live exclusively in [motion/SKILL.md](../../motion/SKILL.md). Static styling applies only `DESIGN.md` token classes.
