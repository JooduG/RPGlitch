# AI AGENT DIRECTIVE: RPGLITCH ENGINE REFACTOR

**MISSION:** Refactor `engine.css` into a high-performance "God File" using a strict **3-Tier Design Token Architecture**. Optimize for Svelte 5 (Runes) and a Nordic-Noir aesthetic.

---

## 🛠 CORE CONSTRAINTS

- **The Zero-Digit Rule:** Only Tier 1 Foundations may contain **absolute** numbers, hex codes, or units (px, rem, ms). Tiers 2 and 3 must reference variables for these. **Relative units** (%, vw, vh) are permitted in Tiers 2 and 3 if they define a responsive ratio, but magic integers should still be promoted to Tier 1 if shared.
- **The Eviction Policy:** If a variable is used in **only one** `.svelte` file, move it to that file's `<style>` block. `engine.css` is reserved for shared, universal truths.
- **Modern Color Syntax:** Remove all `-rgb` variables. Use **Relative Color Syntax** for all transparency: `rgb(from var(--hex) r g b / var(--opacity))`.
- **Explicit Over Abbreviated:** Favor descriptive names for clarity. Use `width` instead of `w`, and `padding` instead of `p`. Standard technical terms (e.g., `z-index`, `reflex`, `whisper`) are encouraged.
- **Property-First Sorting:** Sort variables by property category first, then by **Size Descendant** (Ascending: smallest/faintest to largest/heaviest).
- **Fluid Everything:** Use `clamp()` for any value that should scale with the viewport (Typography, Spacing, Widths). This eliminates the need for most media queries.

---

## 📐 THE 3-TIER NOMENCLATURE (THE BRAIN)

Follow this strict inheritance chain: `T1 (Foundation) -> T2 (Semantic) -> T3 (Shared Component)`.

### TIER 1: FOUNDATIONS (The Ruler)

**Format:** `--[prop]-[effect/value]` (e.g., `--spacing-1`, `--duration-reflex`)

- **Purpose:** Raw, atomic constants.
- **Atomic Grid:** All spacing must be a multiple of the 4px unit (`0.25rem`).
- **Atmospheric Scales (Sorted Ascending):**
  - **Radii:** `sharp` (4px), `subtle` (8px), `standard` (16px), `rounded` (32px), `pill` (9999px).
  - **Motion:** `reflex` (150ms), `fast` (250ms), `standard` (350ms), `slow` (500ms).
  - **Blur:** `whisper` (4px), `mist` (12px), `void` (40px).
  - **Presence (Opacity):** `ghost` (0.08), `muted` (0.3), `heavy` (0.6), `solid` (1.0).

### TIER 2: SEMANTICS (The Intent)

**Format:** `--[role]-[prop]` (e.g., `--card-padding`, `--overlay-z-index`)

- **Purpose:** Mapping foundations to a functional **Purpose**.
- **Signature Logic:** Implement a fallback hook for entity colors:
  `--signature-color: var(--signature-color, var(--color-frisk));`

### TIER 3: SHARED COMPONENTS (The Annex)

**Format:** `--[component]-[role]-[prop]` (e.g., `--tarot-card-width`, `--spacing-12`)

- **Purpose:** Specific metrics shared across **two or more** components.

---

## 🌐 THE FLUID 12-COLUMN SYSTEM

Implements a 12-column layout where each column width is fluid based on the viewport (`vw`) but capped at a high-fidelity maximum (`75rem`).

### TIER 1: FOUNDATIONS (The Ruler)

- **Grid Core:**
  - `--grid-columns: 12;`
  - `--grid-max-width: 75rem;`

### TIER 2: SEMANTICS (The Intent)

- **Grid Logic:**
  - `--grid-width: clamp(20rem, 100vw, var(--grid-max-width));`
  - `--grid-column: calc(var(--grid-width) / var(--grid-columns));`
  - _Note: Using `--grid-column` instead of "unit" clarifies that these are vertical strips. If a 2D grid is needed later, we can introduce `--grid-row`._

---

## 📋 THE COMPREHENSIVE SOTA EXAMPLE

```css
:root {
  /****************************************************************************
   * [TIER 1] FOUNDATIONS: THE RAW MATERIALS (Property-First | Ascending)
   ****************************************************************************/

  /* Colors */
  --color-chalk: #222326;
  --color-gunmetal: #363840;
  --color-frozen: #555d66;
  --color-frisk: #f2f7fa;
  --color-white: #f7f9fc;

  /* Spacing (4px Multipliers - Ascending) */
  --spacing-unit: 0.25rem;
  --spacing-1: calc(var(--spacing-unit) * 1); /* 4px */
  --spacing-2: calc(var(--spacing-unit) * 2); /* 8px */
  --spacing-4: calc(var(--spacing-unit) * 4); /* 16px */
  --spacing-8: calc(var(--spacing-unit) * 8); /* 32px */
  --spacing-12: calc(var(--spacing-unit) * 12); /* 48px */

  /* Radii (Ascending) */
  --radius-sharp: var(--spacing-1); /* 4px */
  --radius-subtle: var(--spacing-2); /* 8px */
  --radius-standard: var(--spacing-4); /* 16px */
  --radius-rounded: var(--spacing-8); /* 32px */
  --radius-pill: 9999px;

  /* Presence / Opacity (Ascending) */
  --opacity-ghost: 0.08;
  --opacity-muted: 0.3;
  --opacity-heavy: 0.6;
  --opacity-solid: 1;

  /* Atmospheric Depth / Blur (Ascending) */
  --blur-whisper: blur(var(--spacing-1));
  --blur-mist: blur(var(--spacing-3));
  --blur-void: blur(var(--spacing-10));

  /* Motion Duration (Ascending) */
  --duration-reflex: 150ms;
  --duration-fast: 250ms;
  --duration-standard: 350ms;
  --duration-slow: 500ms;
  --duration-atmospheric: 1200ms;

  /* Z-Index Layers (Ascending) */
  --z-deep: -1;
  --z-floor: 0;
  --z-surface: 10;
  --z-overlay: 100;
  --z-modal: 1000;
  --z-max: 9999;

  /* Grid Foundation */
  --grid-columns: 12;
  --grid-max-width: 75rem;

  /* Transform & Effect Values */
  --scale-lift: 1.02;
  --brightness-glow: 1.2;

  /****************************************************************************
   * [TIER 2] SEMANTICS: THE AI GUARDRAILS
   ****************************************************************************/

  /* Fonts */
  --font-color-base: var(--color-frisk);
  --font-color-muted: var(--color-frozen);
  --signature-color: var(--signature-color, var(--font-color-base));

  /* Glass */
  --glass-sunken-color: var(--color-gunmetal);
  --glass-sunken-blur: var(--blur-whisper);
  --glass-sunken-opacity: var(--opacity-muted);

  /* Spacing */
  --card-padding: var(--spacing-4);

  /* Z-Index Semantic Mapping */
  --z-surface: var(--z-surface);
  --z-modal: var(--z-modal);

  /* Interaction Motion Mapping */
  --kinetic-hover-scale: scale(var(--scale-lift));
  --kinetic-hover-brightness: brightness(var(--brightness-glow));

  /* Grid System (The Proportional Heart) */
  --grid-width: clamp(20rem, 100vw, var(--grid-max-width));
  --grid-column: calc(var(--grid-width) / var(--grid-columns));

  /****************************************************************************
   * [TIER 3] SHARED COMPONENTS
   ****************************************************************************/

  /* 
   * Component-specific metrics shared across multiple files.
   * Note: These are Tier 3 because they define "What it is" (a library card) 
   * rather than "What it does" (a semantic role).
   */
  --avatar-medium-size: var(--spacing-12);
  --library-card-width: clamp(10rem, 16vw, 20rem);
  --spacing-12: var(--spacing-12);
}

/****************************************************************************
 * [SECTION 4] BASE STYLES & UTILITIES
 ****************************************************************************/

.interactable {
  cursor: pointer;
  transition:
    transform var(--duration-fast) ease,
    filter var(--duration-fast) ease;
}

.interactable:hover {
  transform: var(--kinetic-hover-scale);
  filter: var(--kinetic-hover-brightness);
}

.glass-sunken {
  background: rgb(from var(--glass-sunken-color) r g b / var(--glass-sunken-opacity));
  backdrop-filter: var(--glass-sunken-blur);
}
```

---

## 🧪 UTILITY LOGIC INTEGRATION (THE BRIDGE)

Utilities must consume tokens to ensure the "Red Thread" of logic remains unbroken between CSS and JavaScript.

### [fit-text.js]

- **Logic:** Calculates `fontSize` based on container width while respecting T1/T2 boundaries.
- **Tokens:**
  - `minSize`: Must be derived from `--font-size-tiny`.
  - `lineHeight`: Must be derived from `--line-height-tight`.
- **Implementation:** Always use `getComputedStyle(document.documentElement).getPropertyValue('--var-name')` to sync with CSS.

### [kinetic.js]

- **Logic:** Orchestrates high-fidelity WAAPI animations.
- **Tokens:**
  - `duration`: All durations must map to T1 `--duration-*` scales.
  - `easing`: All timing functions must map to T1 `--ease-*` bezier tokens.
- **Reflex:** Kinetic physics should "feel" consistent with the atmospheric durations in T1.

---

## 🚦 AGENT SAFETY PROTOCOL

1. **The Zero-Digit Rule:** If a value isn't on the Tier 1 Ruler, **add it to the Ruler first.**
2. **Inheritance Check:** Tiers 2/3 must reference Tiers 1/2. **Never skip a tier.**
3. **Property-First Autocomplete:** Always name variables so that the property (padding, radius, color) allows for grouped searching in the IDE.
4. **No Hallucinations:** If a design requires a metric not in `engine.css`, **halt and ask for a new foundation token.**
