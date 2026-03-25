# DESIGN.md — The Chalk Regime (Nordic Refac V2)

> **Single Source of Truth**: The definitive visual physics, aesthetic standards, and user-facing nomenclature for RPGlitch.

## Overview

The interface abandons the gritty neon-glitch cliché in favor of **The Nordic Collection** — a cool, deep, and elegant visual language. It feels like a high-end research terminal located in a frozen, subterranean facility.

Core aesthetic pillars:

- **Abyssal Depth**: Backgrounds use deep, immersive radial gradients (`var(--bg-grad-1)` through `var(--bg-grad-4)`) starting from dark slate-blues bleeding into pure black.
- **Atmospheric Noise**: A persistent `3%` global noise overlay adds physical texture to the viewport, breaking up digital perfection.
- **Glass & Shadow**: Elements detach from the background via structural shadows and glassmorphic blurs, utilizing fluid, elastic physics for interactions.

## Colors

We rely on strict, named tokens rather than raw hex values in our components. You MUST use exactly these CSS variables.

### Brand Primitives

- **Chalk** (`var(--color-chalk)`): `#222326`. The primary high-contrast text and structural accent. Crisp, almost icy white.
- **Gunmetal** (`var(--color-gunmetal)` / `var(--bg-card)`): `#363840`. The core component background. Dense and non-intrusive.
- **Frozen** (`var(--color-frozen)`): `#555d66`. The primary application accent. Used for dominant interactive elements.
- **Frisk** (`var(--color-frisk)` / `var(--font-muted)`): `#8a9399`. The secondary application accent (muted text).
- **Base Primitives**: `var(--color-white)` (`#ffffff`) and `var(--color-black)` (`#000000`).

### Semantic System States

- **Success**: `var(--color-success)` (`#15803d`)
- **Warning**: `var(--color-warning)` (`#fbbf24`)
- **Danger**: `var(--color-danger)` (`#ef4444`)

### Signature Colors (Dynamic Identity)

Instead of hardcoded CSS classes (e.g., `.is-user`, `.is-ai`), entities possess a reactive `signature_color` (a hex code or token mapped in `src/theme/palette.svelte.js`). This value drives the UI dynamically.

1. **The Extended Palette**: The design system provides an extended spectrum of vivid identity tokens (`--color-red`, `--color-cyan`, `--color-emerald`, `--color-violet`, etc.) used exclusively for signature colors.
2. **Dynamic Injection**: Components consume the signature color by injecting it directly into the `style` attribute (e.g., `style="--signature-color: {entity.signature_color};"`), completely bypassing static stylesheet classes.
3. **RGB Passthrough**: Many components require `rgb(R G B / alpha)` formatting for background hues and glows. This is handled by passing `--signature-rgb: {signature_rgb}`.

### Surface Elevation

Elevation is achieved by progressively mixing `Gunmetal` with `Chalk` to lighten the surface as it lifts toward the user:

- `var(--surface-base)` (`#11191f`): The absolute structural floor.
- `var(--surface-sunken)`: Raw `var(--color-gunmetal)`.
- `var(--surface-raised)`: `gunmetal` + 6% `chalk`.
- `var(--surface-elevated)`: `gunmetal` + 12% `chalk`.
- `var(--surface-floating)`: `gunmetal` + 20% `chalk`.

## Typography

We use a strictly defined triad of fonts, scaled via an absolute T-shirt sizing scale (`var(--font-size-xxs)` through `var(--font-size-xxxxxl)`).

- **Headline Font** (`var(--font-heading)`): `Ubuntu`, sans-serif. Semantic `h1`–`h6`. Smooth, tech-forward, bold (`var(--font-bold)` 700).
- **Body Font** (`var(--font-sans)`): `Inter`, system-ui. The workhorse. Clean, readable, structurally sound. Normal (`var(--font-weight)` 400).
- **Label Font** (`var(--font-mono)`): `JetBrains Mono`, monospace. Raw statistics, inputs, `<kbd>`, system logs.
- **Base Line Height** (`var(--line-height-base)`): `1.5`
- **Heading Line Height** (`var(--line-height-heading)`): `1.2`
- **Default Text Color** (`var(--font-color)`): `var(--color-white)`
- **Muted Text Color** (`var(--font-muted)`): `var(--color-frisk)`

## Elevation

Shadows employ opacity scaling (`var(--opacity-xxs)` through `var(--opacity-full)`) using a pure black base.

- **Shallow**: `var(--shadow-s)` - 0.25rem blur.
- **Medium**: `var(--shadow-m)` - 1rem blur.
- **Deep** (Floating Cards): `var(--shadow-l)` - 2rem blur.
- **Extreme**: `var(--shadow-xl)` and `var(--shadow-xxl)`.
- **Glow**: `var(--shadow-glow)`
- **Text Masking**: `var(--shadow-text)` / `var(--shadow-font)`.

### Semantic Z-Index Architecture

- `var(--z-base)`: `10`
- `var(--z-chip)`: `20`
- `var(--z-ui)`: `50`
- `var(--z-overlay)`: `100`
- `var(--z-modal)`: `150`
- `var(--z-toast)`: `10000`

## Components

Unlike older harsh glitch aesthetics, the Nordic Refac relies on subtle border rounding to soften the interface:

- **Buttons & UI Modules**: Utilize `var(--border-radius-m)` (`0.5rem`). Must leverage `.material-interactive` for consistent physical behavior: elastic cubic-bezier transition, lift off background on hover (`translateY(var(--physics-hover-y))`), intensify drop shadow to `var(--shadow-l)`, and scale compression down to `var(--physics-btn-active-scale)` on active state.
- **Pills and Badges**: Utilize `var(--border-radius-full)` (`9999px`).
- **Kinetic Physics**: Svelte Action-driven Web Animations API primitives (`use:shimmy`, `use:pulse`, `use:spin`, `use:stab`) located in `src/ui/utils/actions/kinetic.js`. These are preferred over CSS animations for complex interactive gestures.
- **3D Tilt**: Interactive perspective cards utilize `use:tilt` (`src/ui/utils/actions/tilt.js`) to provide hardware-accelerated `rotateX`/`rotateY` 3D perspective tracking based on mouse position.
- **Background Vignette & Fractals**: Global `body` background is a radial gradient. Cinematic fractal overlay triggers a blurred image overtaking the sub-layer (`inset: 0`) with a sluggish ease transition.
- **Tooltips**: Native tooltip functionality is driven by the `[data-tooltip]` attribute. Spawns a stark, `var(--surface-void)` block with `var(--color-chalk)` accent arrows.
- **Transitions**: Standard timing is `var(--transition-fast)` (`0.2s`). Complex physics use `var(--transition-elastic)`.

### T-Shirt Spacing

Padding, margins, and gaps must strictly adhere to the modular scale:

- `var(--spacing-xxs)`: 0.25rem
- `var(--spacing-xs)`: 0.5rem
- `var(--spacing-s)`: 0.75rem
- `var(--spacing-m)`: 1rem
- `var(--spacing-l)`: 1.5rem
- `var(--spacing-xl)`: 2rem
- `var(--spacing-xxl)`: 3rem
- `var(--spacing-xxxl)`: 6rem

## Do's and Don'ts

- **Do** use strict named tokens (`var(--color-chalk)`, `var(--spacing-xl)`, `var(--shadow-m)`) rather than raw hex/pixels in custom components.
- **Do** leverage `.material-interactive`, `use:tilt`, and `use:shimmy` for dynamic physical interactions on all major actionable components.
- **Do** maintain the semantic typography split (Ubuntu for headings, Inter for body, JetBrains Mono for system data).
- **Don't** use standard hard glitch sharp edges; this regime favors soft glass and `var(--border-radius-m)`.
- **Don't** use raw hex colors. To prevent eye strain, avoid `#FFFFFF` and `#000000` directly; always route through `var(--color-white)` and `var(--color-black)`.
- **Don't** use soft Gaussian shadows lacking color context, or multiple saturated neons. Depth is achieved via tonal shifts (`var(--surface-raised)`) and structural blurs (`var(--shadow-m)`).
