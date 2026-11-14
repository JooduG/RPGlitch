---
name: RPGlitch
version: alpha
colors:
  color-adrenaline-pink: "#ec4899"
  color-background-gradient-1: "#0b101a"
  color-background-gradient-2: "#14182b"
  color-background-gradient-3: "#1e1b38"
  color-background-gradient-4: "#16243b"
  color-chalk: "#171717"
  color-crimson-red: "#ef4444"
  color-deep-indigo: "#818cf8"
  color-dev-accent: "{colors.color-electric-cyan}"
  color-electric-cyan: "#11aecc"
  color-emerald-green: "#10b981"
  color-forest-green: "#15803d"
  color-frisk: "#f8fafc"
  color-frozen: "#475569"
  color-glass-elevated: "#4755694d"
  color-glass-peak: "#fff9"
  color-glass-sunken: "#17171799"
  color-gunmetal: "#334155"
  color-lemon-yellow: "#fde047"
  color-proud-purple: "#a855f7"
  color-pumpkin-amber: "#fbbf24"
  color-pure-white: "#fff"
  color-rusty-orange: "#f97316"
  color-scientific-teal: "#14b8a6"
  color-soft-rose: "#fb7185"
  color-space-blue: "#3b82f6"
  color-toxic-green: "#84cc16"
  color-twilight-violet: "#c084fc"
  color-void-black: "#000"
  empty-fill: "rgb(23 23 23 / 0.6)"
  signature-color: "{colors.color-frozen}"
signatures:
  - color-adrenaline-pink
  - color-crimson-red
  - color-deep-indigo
  - color-electric-cyan
  - color-emerald-green
  - color-forest-green
  - color-lemon-yellow
  - color-proud-purple
  - color-pumpkin-amber
  - color-rusty-orange
  - color-scientific-teal
  - color-soft-rose
  - color-space-blue
  - color-toxic-green
  - color-twilight-violet
typography:
  font-display:
    fontFamily: '"Satisfy", cursive'
  font-heading:
    fontFamily: '"Ubuntu", sans-serif'
  font-mono:
    fontFamily: '"JetBrains Mono", monospace'
  font-sans:
    fontFamily: '"Inter", sans-serif'
rounded:
  radius-sharp: "{spacing.spacing-unit}"
  radius-standard: "{spacing.spacing-standard}"
spacing:
  spacing-character-card-height: calc(var(--spacing-row-unit) * 5)
  spacing-character-card-width: calc(var(--spacing-column-unit) * 2)
  spacing-column-unit: calc(var(--spacing-grid-width) / 12)
  spacing-fractal-card-height: calc(var(--spacing-row-unit) * 4)
  spacing-fractal-card-width: calc(var(--spacing-column-unit) * 4)
  spacing-grid-height: clamp(20rem, 100dvh, var(--spacing-grid-height-max))
  spacing-grid-height-max: clamp(25rem, calc(1.618 * 100vw), 100dvh)
  spacing-grid-width: clamp(20rem, 100vw, var(--spacing-grid-width-max))
  spacing-grid-width-max: clamp(50rem, calc(1.618 * 100dvh), 100vw)
  spacing-icon-medium: calc(var(--spacing-unit) * 8)
  spacing-icon-small: calc(var(--spacing-unit) * 4)
  spacing-kinetic-shimmy-offset: "{spacing.spacing-pixel}"
  spacing-kinetic-shimmy-y: calc(var(--spacing-pixel) / 2)
  spacing-kinetic-stab-distance: "{spacing.spacing-unit}"
  spacing-pixel: 1px
  spacing-row-unit: calc(var(--spacing-grid-height) / 12)
  spacing-standard: 1rem
  spacing-tight: 0.5rem
  spacing-unit: 0.25rem
theme:
  blur-mist: blur(calc(var(--spacing-unit) * 4))
  brightness-dim: "0.9"
  brightness-glow: "1.1"
  brightness-muted: "0.3"
  duration-ambient: 2000ms
  duration-fast: 150ms
  duration-slow: 500ms
  duration-standard: 300ms
  ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)
  ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
  ease-out: cubic-bezier(0.23, 1, 0.32, 1)
  motion-dissolve: opacity var(--duration-fast) var(--ease-out)
  motion-elastic: var(--duration-standard) var(--ease-drawer)
  noise-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")
  opacity-ghost: "0.1"
  opacity-muted: "0.6"
  opacity-none: "0"
  opacity-solid: "1"
  opacity-whisper: "0.3"
  scale-lift: "1.02"
  scale-pulse: "1.05"
  scale-sink: "0.97"
  shadow-ambient: 0 0 calc(var(--spacing-unit) * 5) var(--color-background-gradient-1)
  shadow-ghost: 0 var(--spacing-pixel) var(--spacing-pixel) rgb(from var(--color-background-gradient-1) r g b / var(--opacity-ghost))
  shadow-standard: 0 var(--spacing-unit) calc(var(--spacing-unit) * 4) rgb(from var(--color-background-gradient-1) r g b / var(--opacity-whisper))
  signature-glow: 0 0 calc(var(--spacing-unit) * 4) var(--signature-color, var(--color-frozen))
  spring-damping-default: "0.8"
  spring-stiffness-default: "0.15"
  state-fill-end: 100%
  state-fill-start: 0%
  state-weight-intensity: "0"
  z-index-max: "999"
  z-index-modal: "999"
  z-index-popover: "9999"
  z-index-tooltip: "99999"
---

# RPGlitch Design System

> "Depth is the ultimate luxury. Precision is the baseline of sovereignty."

This specification is the single source of truth for the RPGlitch visual token system and base stylesheets. YAML frontmatter conforms to the `@google/design.md` specification and compiles into Tailwind CSS v4 tokens ([src/media/design.css](src/media/design.css)) and the JavaScript token bridge ([src/media/tokens.js](src/media/tokens.js)).

## Overview

The interface is modeled as a subterranean Nordic research terminal — cool, deep, clinical, and restrained.

- **Atmosphere**: Abyssal four-stop backgrounds (`--color-background-gradient-1` through `--color-background-gradient-4`), subtle film grain calibrated to 10% opacity (`--opacity-ghost` with `--noise-url`), and diffused glassmorphic surfaces (`--blur-mist`).
- **Imagery Direction**: Prefer macro/micro natural textures (ice crystals, mineral grain, fabric weave), low-saturation palettes harmonized with the active signature color, and atmospheric stillness over high-action composition.
- **4-Tier Architecture**: T1 Foundations (units, timings, palette hexes) → T2 Semantics (`colors`, `rounded`, `spacing`) → T3 Organisms (`spacing-character-*`, `spacing-fractal-*`) → T4 Realization (Tailwind utilities and custom `@utility` / `@layer base` rules compiled below).

## Colors

- **Core Neutrals & Surfaces**: `--color-chalk` (`#171717`, near-black charcoal surface), `--color-gunmetal` (`#334155`), `--color-frozen` (`#475569`), `--color-frisk` (`#f8fafc`, primary foreground text), `--color-pure-white` (`#fff`), `--color-void-black` (`#000`), and translucency wells `--color-glass-sunken`, `--color-glass-elevated`, `--color-glass-peak`, `--empty-fill`.
- **Developer Telemetry**: `--color-dev-accent` aliases `--color-electric-cyan` (`#11aecc`) for prompt brackets, vector diagnostics, and active engine telemetry.
- **Entity Signatures**: The `signatures` list designates 15 vibrant accent tokens compiled into `SIGNATURE_COLORS`. Components resolve `--signature-color` dynamically per entity, falling back to `--color-frozen`.

## Typography

- **Body & Interface (`--font-sans`)**: `"Inter", sans-serif` — neutral legibility for dialogue, forms, and long-form reading.
- **Structural Headings (`--font-heading`)**: `"Ubuntu", sans-serif` — tightly tracked hierarchy across `h1`–`h6`.
- **Display & Narrative Script (`--font-display`)**: `"Satisfy", cursive` — reserved for atmospheric titles and storybook accents.
- **Telemetry & Brackets (`--font-mono`)**: `"JetBrains Mono", monospace` — monospaced precision for prompt brackets, token counters, and ledger diffs.

```css
@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: var(--font-sans);
    color: var(--color-frisk);
    background-color: var(--color-chalk);
    line-height: 1.5;
    text-align: left;
  }

  .skip-link {
    position: fixed;
    top: calc(var(--spacing-unit) * -20);
    left: var(--spacing-standard);
    z-index: var(--z-index-tooltip);
    padding: var(--spacing-tight) var(--spacing-standard);
    border-radius: var(--radius-sharp);
    background-color: var(--color-chalk);
    color: var(--color-frisk);
    font-family: var(--font-mono);
    transition: top var(--duration-fast) var(--ease-out);
  }

  .skip-link:focus-visible {
    top: var(--spacing-standard);
    outline: var(--spacing-pixel) solid var(--color-pure-white);
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-heading);
    margin: 0;
    line-height: 1.5;
    color: var(--color-pure-white);
    text-shadow: var(--shadow-ambient);
    letter-spacing: -0.01em;
    font-weight: 700;
  }

  h1 {
    font-size: clamp(3rem, 5vw + 2rem, 6rem);
  }

  h2 {
    font-size: clamp(2.8rem, 4.5vw + 2.2rem, 4.8rem);
  }

  h3 {
    font-size: clamp(2rem, 3vw + 1.6rem, 3.2rem);
  }

  h4 {
    font-size: clamp(1.6rem, 2vw + 1.4rem, 2.4rem);
  }

  h5 {
    font-size: clamp(1.1rem, 1.2vw + 1rem, 1.5rem);
  }

  h6 {
    font-size: clamp(1rem, 1vw + 0.9rem, 1.25rem);
  }

  small {
    font-size: clamp(0.8rem, 0.6vw + 0.7rem, 0.95rem);
  }

  code {
    font-family: var(--font-mono);
    font-size: clamp(0.8rem, 0.6vw + 0.7rem, 0.95rem);
    background: var(--color-glass-sunken);
    padding: var(--spacing-pixel) var(--spacing-unit);
    border-radius: var(--radius-sharp);
  }

  a {
    color: inherit;
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-out);
  }

  button,
  input,
  optgroup,
  select,
  textarea {
    font-family: inherit;
    font-size: 100%;
    line-height: inherit;
    margin: 0;
    color: inherit;
  }

  button {
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
  }
}
```

## Layout & Spacing

- **12x12 Golden Ratio Stage Grid**: Stage geometry derives from `spacing-grid-width` / `spacing-grid-height` constrained by a `1.618` golden aspect ratio, subdividing cleanly into `--spacing-column-unit` and `--spacing-row-unit` for entity (`2x5`) and fractal (`4x4`) cards.
- **Rhythm Scale**: Base quantum `--spacing-unit` (`0.25rem`), `--spacing-tight` (`0.5rem`), and `--spacing-standard` (`1rem`), paired with `--spacing-pixel` (`1px`) for hairline separators.
- **Scroll Contract**: Root `html, body` sets `overflow: hidden` to lock the fixed viewport stage; scrolling regions opt into `ScrollArea` or `overflow-y-auto`.
- **Host Isolation Bridge**: Perchance host pages inject unlayered `normalize.css v3` rules that force `display: block` on HTML5 landmark tags. The unlayered zero-specificity `:where(...)` rules below restore Tailwind `flex`, `inline-flex`, `grid`, and `hidden` utilities without resorting to `!important` overrides.

```css
/* Unlayered normalize.css v3 HTML5 landmark override bridge */
:where(article, aside, details, figcaption, figure, footer, header, main, nav, section).flex {
  display: flex;
}

:where(article, aside, details, figcaption, figure, footer, header, main, nav, section).inline-flex {
  display: inline-flex;
}

:where(article, aside, details, figcaption, figure, footer, header, main, nav, section).grid {
  display: grid;
}

:where(article, aside, details, figcaption, figure, footer, header, main, nav, section).hidden {
  display: none;
}

/* Global scrollbars */
::-webkit-scrollbar {
  width: calc(var(--spacing-unit) * 2);
  height: calc(var(--spacing-unit) * 2);
}

::-webkit-scrollbar-track {
  background: transparent;
  border-radius: var(--radius-sharp);
}

::-webkit-scrollbar-thumb {
  background: var(--color-gunmetal);
  border-radius: var(--radius-sharp);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-frisk);
}

/* Touch capability & pointer gating */
@media (hover: none), (pointer: coarse) {
  button:hover,
  [role="button"]:hover,
  a:hover {
    transform: none !important;
    filter: none !important;
  }
}

/* Expand opt-in interactive targets to 44px minimum on coarse-pointer devices */
@media (pointer: coarse) {
  .touch-target-coarse {
    min-width: 44px !important;
    min-height: 44px !important;
    padding: 0.75rem !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
```

## Elevation & Depth

- **Tinted Abyssal Shadows**: `--shadow-ghost`, `--shadow-standard`, and `--shadow-ambient` tint drop-shadows with `--color-background-gradient-1` (`#0b101a`) rather than pure `#000` so surfaces merge naturally into the slate stage.
- **Z-Index Hierarchy**: Stage panels sit below explicit overlay tiers: `--z-index-modal` (`999`, mirrored by legacy `--z-index-max`), `--z-index-popover` (`9999`), and `--z-index-tooltip` (`99999`).
- **Backdrop Filtration**: Glass panels pair `--color-glass-sunken` / `--color-glass-elevated` with `--blur-mist` (`1rem`).

## Shapes

- **Border Radii**: `--radius-sharp` (`--spacing-unit`, `0.25rem`) for micro controls, badges, code pills, and terminal boxes; `--radius-standard` (`--spacing-standard`, `1rem`) for modal shells, inputs, and entity cards.
- **Masked Gradient Hairlines**: Active panels and inputs use `@utility mask-border-solid` (XOR CSS masking) rather than opaque inner fills so translucency stays unbroken across stacked backgrounds.

## Components

Interactive UI primitives (headless `bits-ui` wrappers, buttons, dialogs, dropdowns, sliders, fields, and badges) are documented authoritatively in [src/ui/primitives/README.md](src/ui/primitives/README.md).

Active T4 utilities compiled from this specification:

- `@utility mask-border-solid`: XOR gradient mask utility for 1px illuminated borders on `::before` pseudo-elements.
- `@utility glass-input`: Full-width glassmorphic field wrapper with signature-tinted hover/focus border glow and translucent well.
- `@utility terminal-box`: Monospaced console container styled with `--color-glass-sunken`, `--blur-mist`, `--radius-sharp`, and `--color-electric-cyan` borders.
- `@utility message--prologue` / `@utility prologue-awaiting-flight`: Opacity staging utilities for storyboard-to-storymode prologue card flight landing.

Two-tier motion discipline governs animations:

- **Tier 1 (UI Controls, < 300ms)**: Discrete interactions (buttons, toggles, menus, dialogs) stay under 300ms using `--ease-out` / `--ease-in-out` and `--scale-sink` (`0.97`).
- **Tier 2 (Macro Card Choreography, 300ms–500ms)**: Spatial card flights, storyboard hand fan lifts (`--scale-lift`), and 3D profile flips use damped `--ease-drawer` / `--ease-out` curves — never bouncy spring overshoot.

```css
/* --- T4: Realization (Interactive Utilities & Motion) --- */

@utility mask-border-solid {
  /* stylelint-disable property-no-vendor-prefix */
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  /* stylelint-enable property-no-vendor-prefix */
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
}

@utility message--prologue {
  transition: opacity 650ms var(--ease-out);
}

@utility prologue-awaiting-flight {
  opacity: 0;
}

@utility glass-input {
  position: relative;
  display: flex;
  width: 100%;
  border-radius: var(--radius-standard);
  border-color: transparent;
  background-color: color-mix(in srgb, var(--signature-color, var(--color-frozen)) 4%, var(--color-glass-sunken));
  transition-property: border-color, box-shadow, background;
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-out);

  &::before {
    @apply mask-border-solid;

    pointer-events: none;
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: var(--spacing-pixel);
    opacity: var(--opacity-whisper);
    transition: var(--motion-dissolve);
    content: "";
    background: linear-gradient(to bottom, color-mix(in srgb, transparent, var(--signature-color, var(--color-frozen)) 40%), transparent 40%);
  }

  &:focus-within,
  &[data-expanded="true"] {
    border-color: transparent;
    background-color: color-mix(in srgb, var(--signature-color, var(--color-frozen)) 8%, var(--color-glass-sunken));

    &::before {
      opacity: var(--opacity-solid);
      background: linear-gradient(
        to bottom,
        var(--signature-color, var(--color-frozen)),
        color-mix(in srgb, var(--signature-color, var(--color-frozen)), transparent 60%) 30%,
        transparent 80%
      );
    }
  }
}

@utility terminal-box {
  display: flex;
  width: 100%;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-sharp);
  border: var(--spacing-pixel) solid color-mix(in srgb, var(--color-electric-cyan) 20%, transparent);
  background-color: var(--color-glass-sunken);
  text-align: left;
  font-family: var(--font-mono);
  backdrop-filter: var(--blur-mist);
  transition-property: border-color, box-shadow;
  transition-duration: var(--duration-standard);
  transition-timing-function: var(--ease-out);
}

/* --- Active Keyframes --- */

@keyframes noise-breathing {
  0%,
  100% {
    transform: translate(0, 0);
  }

  10% {
    transform: translate(-0.5%, -0.5%);
  }

  20% {
    transform: translate(-1%, 0.5%);
  }

  30% {
    transform: translate(0.5%, -1%);
  }

  40% {
    transform: translate(-0.5%, 1.5%);
  }

  50% {
    transform: translate(-1%, 0.5%);
  }

  60% {
    transform: translate(1.5%, -0.5%);
  }

  70% {
    transform: translate(0.5%, 1%);
  }

  80% {
    transform: translate(-0.5%, 0.5%);
  }

  90% {
    transform: translate(1%, -1%);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes wing-item-slide-down {
  from {
    transform: translateY(-15px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes undo-countdown-shrink {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}

/* --- View Transitions (Card Slots, Fractal Backdrop & Console) --- */

::view-transition-group(card-slot-ai),
::view-transition-group(card-slot-user),
::view-transition-group(card-slot-fractal),
::view-transition-group(entity-morph-fractal),
::view-transition-group(unified-console) {
  animation-duration: var(--duration-slow);
  animation-timing-function: var(--ease-drawer);
}

::view-transition-group(card-slot-ai),
::view-transition-group(card-slot-user),
::view-transition-group(card-slot-fractal) {
  border-radius: var(--radius-standard) !important;
  overflow: hidden !important;
}

::view-transition-old(card-slot-ai),
::view-transition-old(card-slot-user),
::view-transition-old(card-slot-fractal),
::view-transition-old(unified-console) {
  animation: none;
  opacity: 0;
  mix-blend-mode: normal !important;
}

::view-transition-new(card-slot-ai),
::view-transition-new(card-slot-user),
::view-transition-new(card-slot-fractal),
::view-transition-new(unified-console) {
  animation: none;
  opacity: 1;
  mix-blend-mode: normal !important;
  height: 100% !important;
  width: 100% !important;
}

/* Card-swap transitions inside storyboard slots */
:root.is-swapping-card ::view-transition-group(card-slot-ai),
:root.is-swapping-card ::view-transition-group(card-slot-user),
:root.is-swapping-card ::view-transition-group(card-slot-fractal) {
  animation-duration: var(--duration-standard);
  animation-timing-function: var(--ease-out);
}

:root.is-swapping-card ::view-transition-old(card-slot-ai),
:root.is-swapping-card ::view-transition-old(card-slot-user),
:root.is-swapping-card ::view-transition-old(card-slot-fractal) {
  animation: card-swap-decay var(--duration-standard) var(--ease-out) forwards;
  mix-blend-mode: normal;
  height: 100%;
  width: 100%;
}

:root.is-swapping-card ::view-transition-new(card-slot-ai),
:root.is-swapping-card ::view-transition-new(card-slot-user),
:root.is-swapping-card ::view-transition-new(card-slot-fractal) {
  animation: card-swap-ascent var(--duration-standard) var(--ease-out) forwards;
  mix-blend-mode: normal;
  height: 100%;
  width: 100%;
}

@keyframes card-swap-decay {
  0% {
    transform: translateY(0) scale(1) rotate(0deg);
    opacity: 1;
    filter: brightness(1);
  }

  40% {
    filter: brightness(0.8);
  }

  100% {
    transform: translateY(calc(var(--spacing-row-unit, 20px) * 8)) scale(0.7) rotate(-5deg);
    opacity: 0;
    filter: brightness(0.4) blur(2px);
  }
}

@keyframes card-swap-ascent {
  0% {
    transform: translateY(calc(var(--spacing-row-unit, 20px) * 6)) scale(0.75) rotate(5deg);
    opacity: 0;
    filter: brightness(1.5) blur(4px);
  }

  50% {
    opacity: 1;
    filter: blur(0);
  }

  100% {
    transform: translateY(0) scale(1) rotate(0deg);
    opacity: 1;
    filter: brightness(1);
  }
}

/* Suppress conflicting layout/opacity transitions during view transitions */
:root.is-switching-view *,
:root.is-switching-view *::before,
:root.is-switching-view *::after,
:root[class*="is-profile-"] *,
:root[class*="is-profile-"] *::before,
:root[class*="is-profile-"] *::after,
:root.is-swapping-card *,
:root.is-swapping-card *::before,
:root.is-swapping-card *::after,
html:active-view-transition *,
html:active-view-transition *::before,
html:active-view-transition *::after {
  transition: none !important;
  animation-duration: 0s !important;
}

/* --- 3D Profile Flip Transition --- */

:root.is-profile-opening-ai::view-transition-group(card-slot-ai),
:root.is-profile-closing-ai::view-transition-group(card-slot-ai),
:root.is-profile-opening-user::view-transition-group(card-slot-user),
:root.is-profile-closing-user::view-transition-group(card-slot-user),
:root.is-profile-opening-fractal::view-transition-group(card-slot-fractal),
:root.is-profile-closing-fractal::view-transition-group(card-slot-fractal),
:root.is-profile-opening-fractal::view-transition-group(entity-morph-fractal),
:root.is-profile-closing-fractal::view-transition-group(entity-morph-fractal) {
  z-index: var(--z-index-max);
}

:root[class*="is-profile-"]::view-transition-old(root),
:root[class*="is-profile-"]::view-transition-new(root) {
  animation-duration: var(--duration-slow);
}

:root.is-profile-opening-ai::view-transition-old(card-slot-ai),
:root.is-profile-closing-ai::view-transition-old(card-slot-ai),
:root.is-profile-opening-user::view-transition-old(card-slot-user),
:root.is-profile-closing-user::view-transition-old(card-slot-user),
:root.is-profile-opening-fractal::view-transition-old(card-slot-fractal),
:root.is-profile-closing-fractal::view-transition-old(card-slot-fractal),
:root.is-profile-opening-fractal::view-transition-old(entity-morph-fractal),
:root.is-profile-closing-fractal::view-transition-old(entity-morph-fractal) {
  animation: var(--duration-slow) var(--ease-drawer) both profile-flip-out;
  backface-visibility: hidden;
  height: 100%;
  width: 100%;
}

:root.is-profile-opening-ai::view-transition-new(card-slot-ai),
:root.is-profile-closing-ai::view-transition-new(card-slot-ai),
:root.is-profile-opening-user::view-transition-new(card-slot-user),
:root.is-profile-closing-user::view-transition-new(card-slot-user),
:root.is-profile-opening-fractal::view-transition-new(card-slot-fractal),
:root.is-profile-closing-fractal::view-transition-new(card-slot-fractal),
:root.is-profile-opening-fractal::view-transition-new(entity-morph-fractal),
:root.is-profile-closing-fractal::view-transition-new(entity-morph-fractal) {
  animation: var(--duration-slow) var(--ease-drawer) both profile-flip-in;
  backface-visibility: hidden;
  height: 100%;
  width: 100%;
}

@keyframes profile-flip-out {
  0% {
    transform: perspective(1200px) rotateY(0deg);
    filter: drop-shadow(0 0 0 transparent);
    opacity: 1;
  }

  49.9% {
    transform: perspective(1200px) rotateY(90deg);
    filter: drop-shadow(0 0 calc(var(--spacing-unit) * 6) var(--color-frozen));
    opacity: 1;
  }

  50%,
  100% {
    transform: perspective(1200px) rotateY(90deg);
    filter: none;
    opacity: 0;
  }
}

@keyframes profile-flip-in {
  0%,
  50% {
    transform: perspective(1200px) rotateY(-90deg);
    filter: none;
    opacity: 0;
  }

  50.1% {
    transform: perspective(1200px) rotateY(-90deg);
    filter: drop-shadow(0 0 calc(var(--spacing-unit) * 6) var(--color-frozen));
    opacity: 1;
  }

  100% {
    transform: perspective(1200px) rotateY(0deg);
    filter: drop-shadow(0 0 0 transparent);
    opacity: 1;
  }
}

::view-transition-old(entity-morph-fractal),
::view-transition-new(entity-morph-fractal) {
  mix-blend-mode: normal;
  height: 100%;
  width: 100%;
  object-fit: cover;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Do's and Don'ts

- **Do**: Reference tokens defined in frontmatter (or Tailwind utilities compiled from them) instead of hardcoded colors, shadows, or radii.
- **Do**: Preserve depth hierarchy through tinted `--shadow-*` tokens, XOR masked borders, and glassmorphic translucency.
- **Do**: Keep interactive control transitions under 300ms using `--ease-out` / `--ease-in-out` and `--scale-sink` (`0.97`).
- **Don't**: Use `ease-in` on UI transitions or bouncy springs on interactive controls.
- **Don't**: Paint pure `#000` shadows for elevation drops; use `--color-background-gradient-1` tinted shadows so depth blends into the midnight palette.
- **Don't**: Mix `view-transition-name` with Svelte transition directives (`transition:`, `in:`, `out:`) on the same DOM node.
- **Don't**: Edit generated outputs (`src/media/design.css`, `src/media/tokens.js`, `src/data/definitions/signature-colors.js`) by hand; always edit `DESIGN.md` and run `npm run sync:css`.
