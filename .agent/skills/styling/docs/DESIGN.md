# Design System: RPGlitch

**Project ID:** Local Codebase

## 1. Visual Theme & Atmosphere

The RPGlitch interface embodies a **"Chalk Regime"** aesthetic—a local-first, glassmorphic UI characterized by strict adherence to "The Nordic Collection" token system. The atmosphere is **immersive and diegetic**, minimizing noise and maximizing sensory depth through subtle shadows and deliberate restraint.

## 2. Color Palette & Roles

### The Nordic Collection (Foundational Palette)

- **Chalk** (`var(--chalk)`, #222326) - Base background canvas for maximum contrast.
- **Gunmetal** (`var(--gunmetal)`, #363840) - Secondary background and structural shading.
- **Frozen** (`var(--frozen)`, #555d66) - Intermediate surfaces and accents.
- **Frisk** (`var(--frisk)`, #8a9399) - Muted text and disabled states.

### Signature Highlights (Action & Status)

- **Cyan** (`var(--signature-cyan)`, #11aecc) & **Teal** (`var(--signature-teal)`, #14b8a6) - Primary interactive elements and positive progression.
- **Red** (`var(--signature-red)`, #ef4444) & **Rose** (`var(--signature-rose)`, #fb7185) - Critical alerts, destructive actions, and hazard states.
- **Amber** (`var(--signature-amber)`, #fbbf24) & **Yellow** (`var(--signature-yellow)`, #fde047) - Warnings and intermediate states.
- **Violet** (`var(--signature-violet)`, #c084fc) & **Purple** (`var(--signature-purple)`, #a855f7) - Magical, specialized, or narrative highlights.

### Surfaces & Depth

- **Surface Overlay** (`var(--surface-overlay)`, rgba(0 0 0 / 0.5)) - Overlays and modal backdrops.
- **Surface Sunken** (`var(--surface-sunken)`, rgba(0 0 0 / 0.6)) - Inputs, wells, and recessed containers.

## 3. Typography Rules

**Primary Font Family:** "Inter" (Sans)
**Display/Heading Font:** "Ubuntu"
**Monospace:** "JetBrains Mono"

### Hierarchy

- **Base Font Color:** Pure White (`var(--font-color)`, #fff)
- **Muted Font Color:** Frisk (`var(--font-muted)`, #8a9399)
- **Line Height:** 1.5 for base text ensuring readability, 1.2 for headings.
- **Scaling:** Uses a robust T-shirt sizing scale from `xxs` (0.5rem) to `xxxxxl` (3.5rem).

## 4. Component Stylings

- **Containers/Surfaces:** Extensively uses glassmorphism and the Chalk Regime. Borders are swapped for soft shadows and blurs (`blur-m` to `blur-xl`). Backgrounds utilize `bg-grad` stops built from the Nordic palette.
- **Shadows:** Ranging from `shadow-s` to `shadow-l`, utilizing varied opacities of pure black to create depth layering over the Chalk and Gunmetal base. `shadow-font` is used for text legibility against complex backgrounds.
- **Interaction Physics:** Animations and transitions utilize standard elastic easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) with subtle vertical lifts on hover (`physics-hover-y: -0.25rem`) and scale-down on active (`physics-btn-active-scale: 0.95`).

## 5. Layout Principles

- **Grid & Whitespace:** Standard T-shirt sizing (`xxs` to `xxxl`) is applied rigorously. The base spacing unit relies on relative rem values to scale gracefully.
- **Corner Radii:** Components follow strict radius tokens, defaulting to `border-radius-m` (0.5rem) for non-pill surfaces, balancing sharpness with modern accessibility.
- **Z-Index Layering:** Strict enforcement of Z-layers natively handled via variables (`z-base`, `z-ui`, up to `z-toast` at 10000) ensuring deterministic overlap for modals, drawers, and active UI elements.
