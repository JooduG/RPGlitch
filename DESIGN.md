---
name: RPGlitch
version: alpha
colors:
  color-background-gradient-1: "#0b101a"
  color-background-gradient-2: "#14182b"
  color-background-gradient-3: "#1e1b38"
  color-background-gradient-4: "#16243b"
  color-chalk: "#171717"
  color-coral-rose: "#fb7185"
  color-crimson-red: "#ef4444"
  color-deep-indigo: "#818cf8"
  color-electric-cyan: "#11aecc"
  color-emerald-green: "#10b981"
  color-forest-green: "#15803d"
  color-frisk: "#f8fafc"
  color-frozen: "#475569"
  color-glass-elevated: "#4755694d"
  color-glass-peak: "#fff9"
  color-glass-sunken: "#17171799"
  color-gunmetal: "#334155"
  color-hot-pink: "#ec4899"
  color-lemon-yellow: "#fde047"
  color-lime-green: "#84cc16"
  color-neon-teal: "#14b8a6"
  color-ocean-blue: "#3b82f6"
  color-pumpkin-amber: "#fbbf24"
  color-pure-white: "#fff"
  color-royal-purple: "#a855f7"
  color-signature-color: "#475569"
  color-sunset-orange: "#f97316"
  color-swatch-color: "#475569"
  color-twilight-violet: "#c084fc"
  color-void-black: "#000"
typography:
  font-base: '"Inter", sans-serif'
  font-heading: '"Ubuntu", sans-serif'
  font-mono: '"JetBrains Mono", monospace'
  text-base: clamp(0.9rem, 0.8vw + 0.8rem, 1.1rem)
  text-h1: clamp(3rem, 5vw + 2rem, 6rem)
  text-h2: clamp(2.8rem, 4.5vw + 2.2rem, 4.8rem)
  text-h3: clamp(2rem, 3vw + 1.6rem, 3.2rem)
  text-h4: clamp(1.6rem, 2vw + 1.4rem, 2.4rem)
  text-h5: clamp(1.1rem, 1.2vw + 1rem, 1.5rem)
  text-h6: clamp(1rem, 1vw + 0.9rem, 1.25rem)
  text-nano: clamp(0.6rem, 0.3vw + 0.5rem, 0.7rem)
  text-small: clamp(0.8rem, 0.6vw + 0.7rem, 0.95rem)
rounded:
  radius-sharp: 0.25rem
  radius-standard: 1rem
spacing:
  spacing-column-unit: calc(var(--spacing-grid-width) / 12)
  spacing-gap-standard: calc(var(--spacing-spacing-unit) * 4)
  spacing-gap-tight: calc(var(--spacing-spacing-unit) * 2)
  spacing-grid-height: clamp(20rem, 100vh, var(--spacing-grid-height-max))
  spacing-grid-height-max: clamp(25rem, calc(var(--spacing-golden-ratio) * 100vw), 100vh)
  spacing-grid-width: clamp(20rem, 100vw, var(--spacing-grid-width-max))
  spacing-grid-width-max: clamp(50rem, calc(var(--spacing-golden-ratio) * 100vh), 100vw)
  spacing-padding-standard: calc(var(--spacing-spacing-unit) * 4)
  spacing-padding-tight: calc(var(--spacing-spacing-unit) * 2)
  spacing-row-unit: calc(var(--spacing-grid-height) / 12)
  spacing-spacing-pixel: 1px
  spacing-spacing-unit: 0.25rem
components:
  signature-color: var(--color-signature-color)
  swatch-color: var(--color-swatch-color)
  spacing-avatar-medium-size: calc(var(--spacing-column-unit) * 2)
  blur-mist: blur(calc(var(--spacing-spacing-unit) * 4))
  spacing-border-width-base: var(--spacing-spacing-pixel)
  spacing-border-width-thick: var(--spacing-spacing-unit)
  breakpoint-desktop: 80rem
  breakpoint-high-density: 120rem
  breakpoint-mini: 30rem
  breakpoint-mobile: 48rem
  breakpoint-tablet: 64rem
  brightness-dim: "0.9"
  brightness-glow: "1.1"
  brightness-muted: "0.3"
  spacing-dropdown-max-height: calc(var(--spacing-spacing-unit) * 80)
  duration-ambient: 2000ms
  duration-fast: 150ms
  duration-slow: 500ms
  duration-standard: 300ms
  ease-out: cubic-bezier(0, 0, 0.2, 1)
  ease-standard: cubic-bezier(0.4, 0, 0.2, 1)
  ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1)
  spacing-golden-ratio: "1.618"
  spacing-icon-medium: calc(var(--spacing-spacing-unit) * 8)
  spacing-icon-small: calc(var(--spacing-spacing-unit) * 4)
  kinetic-drag-threshold: "10"
  kinetic-momentum-friction: "0.95"
  kinetic-scroll-multiplier: "1.5"
  spacing-kinetic-shimmy-offset: var(--spacing-spacing-pixel)
  spacing-kinetic-shimmy-y: calc(var(--spacing-spacing-pixel) / 2)
  spacing-kinetic-slide-y: calc(var(--spacing-spacing-pixel) * 10)
  spacing-kinetic-stab-distance: var(--spacing-spacing-unit)
  spacing-modal-width-thin: calc(var(--spacing-column-unit) * 3)
  motion-dissolve: opacity var(--duration-standard) var(--ease-standard)
  motion-elastic: var(--duration-slow) var(--ease-elastic)
  noise-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")
  opacity-ghost: "0.1"
  opacity-muted: "0.6"
  opacity-none: "0"
  opacity-solid: "1"
  opacity-whisper: "0.3"
  scale-lift: "1.02"
  scale-pulse: "1.05"
  scale-sink: "0.96"
  scrollbar-thumb: var(--color-gunmetal)
  scrollbar-thumb-hover: var(--color-frisk)
  scrollbar-track: transparent
  spacing-scrollbar-width: calc(var(--spacing-spacing-unit) * 2)
  shadow-ghost: |-
    0 var(--spacing-spacing-pixel) var(--spacing-spacing-pixel)
    rgb(from var(--color-void-black) r g b / var(--opacity-ghost))
  shadow-standard: |-
    0 var(--spacing-spacing-unit) calc(var(--spacing-spacing-unit) * 4)
    rgb(from var(--color-void-black) r g b / var(--opacity-whisper))
  signature-glow: 0 0 calc(var(--spacing-spacing-unit) * 4) var(--color-signature-color)
  spring-damping-default: "0.8"
  spring-stiffness-default: "0.15"
  state-dev-accent: var(--color-electric-cyan)
  state-fill-end: 100%
  state-fill-start: 0%
  state-weight-intensity: "0"
  spacing-storyboard-character-card-height: calc(var(--spacing-row-unit) * 5)
  spacing-storyboard-character-card-width: calc(var(--spacing-column-unit) * 2)
  spacing-storyboard-fractal-card-height: calc(var(--spacing-row-unit) * 4)
  spacing-storyboard-fractal-card-width: calc(var(--spacing-column-unit) * 4)
  scan-animation: scan var(--duration-ambient) linear infinite
  title-shadow-ambient: 0 0 calc(var(--spacing-spacing-unit) * 5) var(--color-void-black)
  z-index-max: "999"
  empty-fill: "rgb(23 23 23 / 0.6)"
---

# ⚔️ RPGlitch Design System: The Chalk Regime

> "Depth is the ultimate luxury. Precision is the baseline of sovereignty."

The RPGlitch Design System, formally designated as the **Chalk Regime**, is a high-fidelity aesthetic framework optimized for the **Nordic Collection**. It envisions the application as a high-end research terminal situated within a sub-zero facility—cool, deep, and elegant.

## ❄️ The Nordic Collection (Vision)

The interface is a high-end research terminal in a frozen facility.

- **The Atmosphere**: Abyssal radial gradients, atmospheric noise (3%), and glassmorphic blurs.
- **The Voice**: Cool, clinical, and precise.
- **The Palette**: Gunmetal, Chalk, and Frozen tones.
- **Adjectives**: Minimalist, Focused, Clinical, Abyssal, Frozen, Elegant.

### 🖼️ Imagery Style (Sovereign Directive)

All imagery in the RPGlitch ecosystem must adhere to the following stylistic constraints:

- **Macro/Micro Focus**: Prefer zoomed-in, high-detail shots (e.g., macro photo of ice crystals, zoomed-in texture of natural fabrics).
- **Color Consistency**: Images should reflect the Abyssal/Nordic palette. If a theme changes, images must be updated to match.
- **Atmospheric**: Use images that feel quiet and atmospheric, avoiding gaudy or high-action content.

## 📐 The Chalk Regime (Laws)

### 1. Token Sovereignty & IDE Alignment

The system operates within a closed-loop token architecture. While using raw values is generally discouraged, **Tailwind CSS v4 IDE IntelliSense suggestions take absolute priority**. Do not enforce strict arbitrary properties if the IDE suggests a valid shorthand (e.g., `mask-exclude`).

### 2. Kinetic Physics (The Grounded Law)

Interactions favor depth and filters over vertical "lifts" or "bounces." Hover focuses on icon color and brightness, not layout shift.

### 3. Visual Depth (The Z-Law)

Visual hierarchy is governed by the Z-Law. Components detach from the abyssal background via structural shadows and glassmorphic filters.

### 4. Auditory Harmony

Sound effects must be clinical and minimalist. Audio is a feedback layer, never an interruption.

### 5. Textual Precision

All interface copy must be clinical and concise. Use UI/UX keywords consistently (e.g., "navigation bar," "call-to-action button"). Avoid flowery language.

---

## 🏗️ Technical Architecture (4-Tier)

1. **T1: Foundations (Atoms)**: Base values like spacing units, colors, and timing.
2. **T2: Semantics (Molecules)**: Functional mappings (e.g., `--chalk`).
3. **T3: Organisms**: Component-specific tokens (e.g., `--modal-width-base`).
4. **T4: Realization**: CSS classes and Svelte logic that manifest the system.

---

## 🧩 Pattern Registry (T4 Realization)

### Headless Component Foundations

The Chalk Regime UI layers have been migrated from raw DOM manipulations to standardized headless components powered by `bits-ui`. The layout aesthetics are strictly preserved using semantic selectors and data attributes mapped directly from the library engines:

- **Tooltip Layer**: Powered by `bits-ui/Tooltip`. Container overlays query `.tooltip-container[data-side="bottom"]` and compile portalled tracking at `z-index: var(--z-index-max)` to ensure clearing modal context bounds cleanly.
- **Modal Framework**: Driven by `bits-ui/Dialog`. Manages focus-trapping, portal distribution, and Escape-key dismissals natively. Transitions map via custom snippets into native `fly` / `scale` states.
- **Alert Dialogs**: Reconfigured via `bits-ui/AlertDialog` for high-priority destructive validation steps (e.g., memory clearing). Enforces explicit semantic roles (`[role="alertdialog"]`) and handles button action traps safely.
- **Switch Controls**: Unified under `bits-ui/Switch`. Targets `.switch-root` and `.switch-thumb` elements, utilizing `[data-state="checked"]` and pointer restrictions natively.
- **Slider Ranges**: Migrated to `bits-ui/Slider`. Removes auxiliary overlay blocks, letting custom background gradients compute coordinates directly via root `--state-fill-start` and `--state-fill-end` variables.
- **Button Primitives**: Replaced with `bits-ui/Button`. Implements custom global scopes (`.svelte-button`) with reactive string allocations to protect Svelte 5 compilation rules.
- **Dropdown Viewports**: Reconfigured using `bits-ui/Select`, querying state changes via `[data-highlighted]` and `[data-state="checked"]` to match glassmorphic list rows.
- **Scroll Layering**: Wrapped via `bits-ui/ScrollArea` over primary list feeds, textboxes (`data-mode="readonly"`), and panels to eliminate platform layout shifts.

### Structural Chassis

- `.glass-sunken`: Submerged layer. Used for backgrounds and inactive containers.
- `.glass-base`: Default interface layer.
- `.glass-elevated`: Floating layer. Used for active cards and popovers.
- `.glass-peak`: Maximum elevation. Used for modals and critical dialogs.

### Interaction Reflex

- `.interactable`: Standard hover/active behavior (Grounded Law).
- `.truncate`: Ellipsis truncation for text containers.

### Typography

- `h1-h6`: Architectural weight, tightly tracked.
- `.font-heading`: The "Ubuntu" font for structural hierarchy.
- `.font-mono`: The "JetBrains Mono" font for data and terminal output.
- `.font-base`: The "Inter" font for standard reading.
- `.data-output`: Monochromatic, spaced, terminal-style text.

---

## 🖥️ Screen Specifications (Stitch Templates)

Use the following H2/H3 structure for specific screen prompts to ensure the Stitch bridge parses them correctly.

```text
## [Component Name/Screen Title]

### [Element ID / Functional Area]

- **Description**: Semantic description of the element (e.g., "A pill-shaped primary button with whisper-soft shadows").
- **Intent**: What this element should achieve (e.g., "Directs user to the research log").
- **Tokens**: Reference specific Chalk Regime tokens.
```

---

## 🤖 THE WEAVER PROTOCOL

The **Weaver** is the bridge between the Architect's intent and the Engine's reality.

1. **The Source**: All changes start in **DESIGN.md**.
2. **The Sync**: `npm run sync:design` triggers the Weaver to generate `design.css` and `tokens.js`.
3. **The Audit**: `npm run audit:css` (The Warden) ensures 100% compliance across the codebase.
4. **The Handoff**: Automatic build gate verification secures token compliance prior to deployment.

---

```css
/* --- T4: Realization (Patterns & Resets) --- */

/* Global Scrollbars */
::-webkit-scrollbar {
  width: var(--spacing-scrollbar-width);
  height: var(--spacing-scrollbar-width);
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border-radius: var(--radius-sharp);
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-sharp);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

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
    font-family: var(--font-base);
    color: var(--color-frisk);
    background-color: var(--color-chalk);
    line-height: var(--font-height-base);
    text-align: left;
  }

  h1,
  .h1,
  h2,
  .h2,
  h3,
  .h3,
  h4,
  .h4,
  h5,
  .h5,
  h6,
  .h6 {
    font-family: var(--font-heading);
    margin: 0;
    line-height: var(--font-height-base);
    color: var(--pure-white);
    text-shadow: var(--title-shadow-ambient);
    letter-spacing: var(--font-spacing-tight);
    font-weight: var(--font-weight-bold);
  }

  h1,
  .h1 {
    font-size: var(--text-h1);
  }

  h2,
  .h2 {
    font-size: var(--text-h2);
  }

  h3,
  .h3 {
    font-size: var(--text-h3);
  }

  h4,
  .h4 {
    font-size: var(--text-h4);
  }

  h5,
  .h5 {
    font-size: var(--text-h5);
  }

  h6,
  .h6 {
    font-size: var(--text-h6);
  }

  p,
  span,
  label,
  li,
  strong,
  em,
  small,
  blockquote,
  time,
  code,
  kbd,
  mark,
  q,
  cite,
  dfn,
  sub,
  sup,
  b,
  i,
  u {
    font-family: inherit; /* Allow inheritance from parent (e.g. h1) */
    margin: 0;
    line-height: inherit;
  }

  /* Base text fallback ONLY for top-level or specific containers */
  body > p,
  body > label,
  main p,
  main label,
  section p,
  section label {
    font-family: var(--font-base);
  }

  strong,
  b {
    font-weight: var(--font-weight-bold);
  }

  em,
  i {
    font-style: italic;
  }

  u {
    text-decoration: underline;
  }

  sup,
  sub {
    font-size: var(--font-size-nano);
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }

  sup {
    top: -0.5em;
  }

  sub {
    bottom: -0.25em;
  }

  small {
    font-size: var(--font-size-small);
  }

  code {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    background: var(--glass-sunken);
    padding: var(--spacing-pixel) var(--spacing-unit);
    border-radius: var(--radius-sharp);
  }

  a {
    color: inherit;
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-standard);
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

.interactable {
  cursor: pointer;
  user-select: none;
  transition:
    transform var(--duration-fast) var(--ease-standard),
    filter var(--duration-fast) var(--ease-standard),
    opacity var(--duration-fast) var(--ease-standard);
}

.interactable:hover {
  transform: var(--scale-lift);
  filter: var(--brightness-glow);
}

.interactable:active {
  transform: var(--scale-sink);
  filter: brightness(var(--brightness-dim));
}

/* --- TEXT SHADOW UTILITIES --- */

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

.text-shadow-outline {
  text-shadow:
    var(--spacing-spacing-pixel) var(--spacing-spacing-pixel) 0 var(--color-void-black),
    calc(var(--spacing-spacing-pixel) * -1) var(--spacing-spacing-pixel) 0 var(--color-void-black),
    var(--spacing-spacing-pixel) calc(var(--spacing-spacing-pixel) * -1) 0 var(--color-void-black),
    calc(var(--spacing-spacing-pixel) * -1) calc(var(--spacing-spacing-pixel) * -1) 0 var(--color-void-black),
    0 0 calc(var(--spacing-spacing-unit) * 4) var(--color-void-black);
}

.text-shadow-bloom {
  text-shadow:
    var(--spacing-spacing-pixel) var(--spacing-spacing-pixel) 0 var(--color-void-black),
    calc(var(--spacing-spacing-pixel) * -1) var(--spacing-spacing-pixel) 0 var(--color-void-black),
    var(--spacing-spacing-pixel) calc(var(--spacing-spacing-pixel) * -1) 0 var(--color-void-black),
    calc(var(--spacing-spacing-pixel) * -1) calc(var(--spacing-spacing-pixel) * -1) 0 var(--color-void-black),
    0 0 calc(var(--spacing-spacing-unit) * 2) var(--signature-color),
    0 0 calc(var(--spacing-spacing-unit) * 6) rgb(from var(--signature-color) r g b / var(--opacity-muted));
}

.icon-outline {
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.5;
}

/* --- SCROLL AREA PRIMITIVE MAPPINGS --- */

.scroll-area-root {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.scroll-area-viewport {
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.scroll-area-track {
  display: flex;
  user-select: none;
  touch-action: none;
  padding: var(--spacing-pixel);
  background: var(--glass-sunken);
  transition: background var(--duration-fast);
}

.scroll-area-track[data-orientation="vertical"] {
  width: var(--scrollbar-width);
}

.scroll-area-track[data-orientation="horizontal"] {
  flex-direction: column;
  height: var(--scrollbar-width);
}

.scroll-area-thumb {
  flex: 1;
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-full);
  position: relative;
  opacity: var(--opacity-whisper);
  transition:
    opacity var(--duration-fast),
    background var(--duration-fast);
}

.scroll-area-thumb:hover {
  opacity: var(--opacity-solid);
  background: var(--scrollbar-thumb-hover);
}

/* --- LEGACY FALLBACK SCROLLBAR UTILITIES --- */
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* --- VIEW TRANSITIONS & NOISE ANIMATIONS (Phase 4) --- */

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

.noise-overlay {
  position: fixed;
  inset: -20px;
  background-image: var(--noise-url);
  opacity: var(--opacity-ghost);
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: var(--z-index-max);
  animation: noise-breathing 0.2s steps(4) infinite;
}

[data-motion-reduced="true"] .noise-overlay {
  animation-play-state: paused;
}

/* Custom view transition handling */
::view-transition-old(modal-container) {
  animation:
    250ms var(--ease-in) both fade-out,
    250ms var(--ease-in) both scale-down;
}

::view-transition-new(modal-container) {
  animation:
    350ms var(--ease-out) both fade-in,
    350ms var(--ease-elastic) both slide-up;
}

@keyframes fade-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
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

@keyframes scale-down {
  from {
    transform: scale(1);
  }

  to {
    transform: scale(0.95);
  }
}

@keyframes slide-up {
  from {
    transform: translateY(20px);
  }

  to {
    transform: translateY(0);
  }
}

/* --- Decoupled Target Groups --- */
::view-transition-group(card-slot-ai),
::view-transition-group(card-slot-user),
::view-transition-group(card-slot-fractal) {
  animation-duration: var(--duration-standard, 400ms);
  animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1); /* Precise mechanical ease */
}

/* --- Outgoing Card: Decay Vector back to Deck --- */
:root.is-swapping-card ::view-transition-old(card-slot-ai),
:root.is-swapping-card ::view-transition-old(card-slot-user),
:root.is-swapping-card ::view-transition-old(card-slot-fractal) {
  animation: card-swap-decay var(--duration-standard, 400ms) cubic-bezier(0.25, 1, 0.5, 1) forwards;
  mix-blend-mode: normal;
  height: 100%;
  width: 100%;
}

/* --- Incoming Card: Ascent Vector into Slot --- */
:root.is-swapping-card ::view-transition-new(card-slot-ai),
:root.is-swapping-card ::view-transition-new(card-slot-user),
:root.is-swapping-card ::view-transition-new(card-slot-fractal) {
  animation: card-swap-ascent var(--duration-standard, 400ms) cubic-bezier(0.25, 1, 0.5, 1) forwards;
  mix-blend-mode: normal;
  height: 100%;
  width: 100%;
}

/* --- Kinetic Keyframe Arrays --- */
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
    /* Translate downward toward the orbital hand workspace with a slight tilt */
    transform: translateY(calc(var(--row-unit, 20px) * 8)) scale(0.7) rotate(-5deg);
    opacity: 0;
    filter: brightness(0.4) blur(2px);
  }
}

@keyframes card-swap-ascent {
  0% {
    /* Emerge from the lower deck coordinates slightly scaled down */
    transform: translateY(calc(var(--row-unit, 20px) * 6)) scale(0.75) rotate(5deg);
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

/* --- Staged Decompression Row Morphing --- */
.panel-root,
.pill-chassis {
  contain: layout; /* Constrain geometry recalculations during morphing */
}

/* Enforce uniform mechanical interpolation rates */
::view-transition-group(card-slot-ai),
::view-transition-group(card-slot-user),
::view-transition-group(card-slot-fractal),
::view-transition-group(entity-morph-ai),
::view-transition-group(entity-morph-user),
::view-transition-group(entity-morph-fractal) {
  animation-duration: var(--duration-slow);
  animation-timing-function: var(--ease-standard);
}

/* --- 3D Profile Flip Transition (Nordic Collection) --- */

/* Elevate active transition groups above inactive bystander cards */
:root.is-profile-opening-ai::view-transition-group(card-slot-ai),
:root.is-profile-closing-ai::view-transition-group(card-slot-ai),
:root.is-profile-opening-ai::view-transition-group(entity-morph-ai),
:root.is-profile-closing-ai::view-transition-group(entity-morph-ai),
:root.is-profile-opening-user::view-transition-group(card-slot-user),
:root.is-profile-closing-user::view-transition-group(card-slot-user),
:root.is-profile-opening-user::view-transition-group(entity-morph-user),
:root.is-profile-closing-user::view-transition-group(entity-morph-user),
:root.is-profile-opening-fractal::view-transition-group(card-slot-fractal),
:root.is-profile-closing-fractal::view-transition-group(card-slot-fractal),
:root.is-profile-opening-fractal::view-transition-group(entity-morph-fractal),
:root.is-profile-closing-fractal::view-transition-group(entity-morph-fractal) {
  z-index: var(--z-index-max);
}

/* Match root transition duration to the card flip duration during profile toggle */
:root[class*="is-profile-"]::view-transition-old(root),
:root[class*="is-profile-"]::view-transition-new(root) {
  animation-duration: var(--duration-slow);
}

/* AI */
:root.is-profile-opening-ai::view-transition-old(card-slot-ai),
:root.is-profile-closing-ai::view-transition-old(card-slot-ai),
:root.is-profile-opening-ai::view-transition-old(entity-morph-ai),
:root.is-profile-closing-ai::view-transition-old(entity-morph-ai),
/* USER */
:root.is-profile-opening-user::view-transition-old(card-slot-user),
:root.is-profile-closing-user::view-transition-old(card-slot-user),
:root.is-profile-opening-user::view-transition-old(entity-morph-user),
:root.is-profile-closing-user::view-transition-old(entity-morph-user),
/* FRACTAL */
:root.is-profile-opening-fractal::view-transition-old(card-slot-fractal),
:root.is-profile-closing-fractal::view-transition-old(card-slot-fractal),
:root.is-profile-opening-fractal::view-transition-old(entity-morph-fractal),
:root.is-profile-closing-fractal::view-transition-old(entity-morph-fractal) {
  animation: var(--duration-slow) var(--ease-standard) both profile-flip-out;
  backface-visibility: hidden;
  height: 100%;
  width: 100%;
}

/* AI */
:root.is-profile-opening-ai::view-transition-new(card-slot-ai),
:root.is-profile-closing-ai::view-transition-new(card-slot-ai),
:root.is-profile-opening-ai::view-transition-new(entity-morph-ai),
:root.is-profile-closing-ai::view-transition-new(entity-morph-ai),
/* USER */
:root.is-profile-opening-user::view-transition-new(card-slot-user),
:root.is-profile-closing-user::view-transition-new(card-slot-user),
:root.is-profile-opening-user::view-transition-new(entity-morph-user),
:root.is-profile-closing-user::view-transition-new(entity-morph-user),
/* FRACTAL */
:root.is-profile-opening-fractal::view-transition-new(card-slot-fractal),
:root.is-profile-closing-fractal::view-transition-new(card-slot-fractal),
:root.is-profile-opening-fractal::view-transition-new(entity-morph-fractal),
:root.is-profile-closing-fractal::view-transition-new(entity-morph-fractal) {
  animation: var(--duration-slow) var(--ease-standard) both profile-flip-in;
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
    filter: drop-shadow(0 0 calc(var(--spacing-spacing-unit) * 6) var(--active-signature-color, var(--color-signature-color)));
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
    filter: drop-shadow(0 0 calc(var(--spacing-spacing-unit) * 6) var(--active-signature-color, var(--color-signature-color)));
    opacity: 1;
  }
  100% {
    transform: perspective(1200px) rotateY(0deg);
    filter: drop-shadow(0 0 0 transparent);
    opacity: 1;
  }
}

/* --- Suppress Wrapper Interference During Deck Swaps --- */
:root.is-swapping-card .storyboard-card-ai,
:root.is-swapping-card .storyboard-card-user,
:root.is-swapping-card .storyboard-card-fractal {
  view-transition-name: none;
}

/* --- Fluid Aspect and Sizing Transformations for Fractal Blooming --- */
::view-transition-old(entity-morph-fractal),
::view-transition-new(entity-morph-fractal) {
  mix-blend-mode: normal;
  height: 100%;
  width: 100%;
  object-fit: cover;
}

/* --- Processing Noise Velocity Scaling --- */
.noise-overlay.is-generating {
  opacity: calc(var(--opacity-whisper) + 0.1);
  animation-duration: 0.08s; /* Overdriven step speed cycle */
}

/* --- Center Axis Delayed Fade-In Rule --- */
::view-transition-new(console-center-axis) {
  animation: 300ms ease-out delayed-fade-in both;
}

@keyframes delayed-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Fix profile panel side grid positioning */
[data-wings-container] {
  grid-column: 9 / 12 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 1rem !important;
}

/* Force all 3 wing section containers to maintain flex states and respect vertical gaps */
[data-wings-container] section {
  display: flex !important;
  flex-direction: column !important;
  gap: var(--spacing-gap-standard, 1rem) !important;
}

/* Force standard desktop view margins */
.modal-profile-grid-main {
  grid-column: 2 / 8 !important;
}

.modal-profile-grid-flat {
  grid-column: 4 / 10 !important;
}

/* Force right alignment on utility control bars */
footer.outline-none,
div.flex-1.flex-col footer {
  display: flex !important;
  flex-direction: row !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 1rem !important;
}

/* --- PROFILE TYPOGRAPHY SHIELD --- */

/* Force entry fields inside header zones to respect global title variables */
div[class*="ProfileHeader"] input,
div[class*="ProfileHeader"] h2,
div[class*="profile-header"] input,
.profile-header-title {
  font-size: var(--text-h3) !important;
  font-family: var(--font-heading) !important;
  font-weight: 700 !important;
  line-height: inherit !important;
}

/* --- BACKDROP BLUR ANIMATION (Profile Modal) --- */
@keyframes backdrop-blur-in {
  from {
    backdrop-filter: blur(0) brightness(1) saturate(1);
    background: radial-gradient(circle at center, rgba(22, 36, 59, 0), rgba(0, 0, 0, 0));
  }

  to {
    backdrop-filter: blur(16px) brightness(0.9) saturate(0.4);
    background: radial-gradient(circle at center, rgba(22, 36, 59, 0.3), rgba(0, 0, 0, 0.3));
  }
}

/* --- Profile Card Edit-Mode Transitions --- */

/* Main card sliding to the left when wings open */
@keyframes main-card-slide-left {
  from {
    transform: translateX(33.33%);
  }
  to {
    transform: translateX(0);
  }
}

/* Main card sliding back to center when wings close */
@keyframes main-card-slide-center {
  from {
    transform: translateX(-33.33%);
  }
  to {
    transform: translateX(0);
  }
}

/* Wing container sliding out to the right from behind the main card */
@keyframes wing-slide-out {
  from {
    transform: translateX(-220%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Wing container sliding back in to the left when closing */
@keyframes wing-slide-in {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-220%);
    opacity: 0;
  }
}

/* Edit wings sliding down vertically inside an already open wings container */
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
```
