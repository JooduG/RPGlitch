---
trigger: always_on
---

# 🛡️ RPGlitch Design System: The Chalk Regime

**Project ID:** RPGlitch-Core / Local Codebase
**Status:** Immutable Guardrail
**Domain:** All UI/UX Generation & Svelte 5 Component Styling

## 1. Visual Theme & Atmosphere

The RPGlitch interface embodies the **"Chalk Regime"**—a local-first, high-contrast, immersive, and diegetic aesthetic inspired by Nordic noir and glassmorphism.

* **Immersive/Diegetic:** The UI should feel like a physical layer resting over a dark, shifting reality. It exists within the game world, minimizing noise.
* **Glassmorphism:** Extensive use of semi-transparent surfaces with background blurs. Borders are swapped for soft shadows and blurs to maximize sensory depth.

## 2. Color Palette & Roles (The Nordic Collection)

**RULE:** Visual consistency is absolute. Never write raw hex codes (e.g., `#FFFFFF`), `rgb()`, or `hsl()` in inline styles, Svelte `<style>` blocks, or classes. All styling MUST utilize native CSS variables (e.g., `var(--chalk)`) defined in `src/theme/tokens.css`.

### Core Foundation

* **Base Background:** `#11191f` (The deepest layer of the application).

* **Chalk:** `var(--chalk)` / `#e1e5f2` to `#222326` (Base background canvas for maximum contrast, primary text color, and extreme highlights representing "mechanical truth").
* **Gunmetal:** `var(--gunmetal)` / `#1b262c` to `#363840` (Primary surface color for cards, containers, and structural shading).
* **Frozen:** `var(--frozen)` / `#0f4c75` to `#555d66` (Main accent color for interactive elements, brand identity, and intermediate surfaces).
* **Frisk:** `var(--frisk)` / `#3282b8` to `#8a9399` (Secondary accent, muted text color, and disabled states).

### Identity Roles

* **User Tone:** `#aecbfa` (Soft blue for user-originated content).

* **AI/Intelligence Tone:** `#fde293` (Warm yellow for agent and engine responses).
* **System Tone:** `#f28b82` (Soft red for system logs and mechanics).
* **Fractal Tone:** `#e8eaed` (Neutral gray for environmental simulation data).

### Signature Highlights (Action & Status)

* **Primary/Success:** Cyan (`var(--signature-cyan)`, `#11aecc`) & Teal (`var(--signature-teal)`, `#14b8a6`).

* **Danger/Alerts:** Red (`var(--signature-red)`, `#ef4444`) & Rose (`var(--signature-rose)`, `#fb7185`) for hazards and destructive actions.
* **Warnings:** Amber (`var(--signature-amber)`, `#fbbf24`) & Yellow (`var(--signature-yellow)`, `#fde047`) for intermediate states.
* **Magic/Narrative:** Violet (`var(--signature-violet)`, `#c084fc`) & Purple (`var(--signature-purple)`, `#a855f7`) for specialized highlights.

## 3. Typography Rules

* **Base Font Color:** Pure White (`var(--font-color)`, `#fff`).

* **Muted Font Color:** Frisk (`var(--font-muted)`, `#8a9399`).
* **Display/Headings:** "Ubuntu" - Bold, authoritative, modern. (Line-height: 1.2).
* **Body Text:** "Inter" - Clean, highly legible sans-serif. (Line-height: 1.5).
* **Technical/Engine:** "JetBrains Mono" - Used for simulation logs and Sino-Logic data.
* **Scaling:** Uses a robust T-shirt sizing scale from `xxs` (0.5rem) to `xxxxxl` (3.5rem).

## 4. Component Stylings & Layout

### Surfaces & Depth

* **Glass Panels:** Semi-transparent white overlays (`rgba(255, 255, 255, 0.1)`) with significant background blur (`blur-m` to `blur-xl`). Backgrounds utilize `bg-grad` stops.

* **Shadows:** No pixel borders. Ranging from `shadow-s` to `shadow-l`, utilizing varied opacities of pure black for depth layering ("Whisper-soft" shadows). `shadow-font` is used for text legibility.
* **Sunken Wells:** Deep, recessed areas using `var(--surface-sunken)` or `rgba(0, 0, 0, 0.6)` for inputs and logs.
* **Overlays:** `var(--surface-overlay)` or `rgba(0, 0, 0, 0.5)` for modal backdrops.

### Shape, Grid, & Z-Index

* **Corner Radii:** Strict radius tokens defaulting to `border-radius-m` (8px / 0.5rem). Use pill shapes for tags, chips, and specific status indicators.

* **Grid & Whitespace:** Standard T-shirt sizing (`xxs` to `xxxl`) applied rigorously using relative `rem` values.
* **Z-Index Layering:** Strict enforcement natively handled via variables (`z-base`, `z-ui`, up to `z-toast` at 10000).

## 5. Interaction Physics

* **Transitions:** Smooth, elastic easing for all state changes (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

* **Hover:** Subtle vertical lift (`physics-hover-y: -0.25rem`).
* **Active:** Scale-down effect to simulate physical pressing (`physics-btn-active-scale: 0.95`).

## 6. Strict Anti-Patterns

| Pattern | Reasoning |
| :--- | :--- |
| **Inline Styles (`style="..."`)** | Forbidden. Violates Church & State separation; keeps structural markup clean. |
| **Global CSS in Components** | Forbidden. Use component-scoped styles or designated theme tokens. |
| **Utility classes (Tailwind/Bootstrap)** | Forbidden. Violates semantic HTML and design system token protocols. |
| **Hardcoded hex values** | Forbidden except in `src/theme/tokens.css`. Use `var(--token-name)`. |
| **SCSS Mixins/Variables in Components** | Forbidden. Components MUST NOT import SCSS. Rely on global CSS variables (`:root`). |
| **Perchance Incompatibility** | Forbidden. Ensure all CSS variables are accessible within the Perchance HTML panel environment. |

---

## 7. STITCH GENERATION OVERRIDE (REQUIRED)

**Copy this block into every Stitch prompt to ensure alignment with the Chalk Regime:**

**DESIGN SYSTEM (REQUIRED):**

* **Platform**: Web, Desktop-first (Single-file Monolith)
* **Theme**: Dark Mode, Glassmorphism, Nordic Aesthetic
* **Background**: Deep Base Charcoal (#11191f) or var(--chalk)
* **Surface**: Gunmetal Glass (#1b262c) with 10% opacity white overlay and heavy blur.
* **Primary Accent**: Frozen Deep Blue (#0f4c75) for buttons and active states.
* **Text Primary**: Pure White or Chalk Off-White (#e1e5f2)
* **Text Muted**: Frisk Blue-Gray (#3282b8)
* **Fonts**: Ubuntu (Headings), Inter (Body), JetBrains Mono (Technical)
* **Border/Elevation**: No pixel borders. Use soft shadows and background blurs for depth.
* **Corner Radius**: 8px (0.5rem) default.
* **Output Constraint:** MUST be valid Svelte 5 using `<script lang="ts">` and Runes.
