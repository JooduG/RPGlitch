# Design System Specification: High-Contrast Glitch RPG

## 1. Overview & Creative North Star

### Creative North Star: "The Fractured Terminal"

This design system rejects the "clean" and "friendly" tropes of modern SaaS in favor of a visceral, high-fidelity digital decay. It is built to feel like a high-end military terminal that is being actively bypassed or corrupted. We achieve this through **Intentional Asymmetry**, where modular blocks don't always align perfectly, and **Tactile Digitalism**, using scan-lines and pixel-grid overlays to give the screen a physical, CRT-like depth.

The system moves beyond standard cyberpunk by avoiding "neon-on-black" cliches; instead, it utilizes high-contrast tonal shifts and chromatic aberration to create a sense of vibrating energy. It is brutal, precise, and unapologetically digital.

---

## 2. Colors & Surface Architecture

The palette is rooted in a deep charcoal void, punctuated by aggressive, "glowing" accents.

### The Color Logic

- **Background (`#131314`)**: The absolute void. All UI begins here.
- **Primary (`#ffffff`)**: Used for high-priority information and "blinding" clarity.
- **Secondary (`#ffabf3`) / Tertiary (`#a8f928`)**: Our "Glitch" accents. Magenta (`secondary`) represents system warnings or high-energy actions; Lime (`tertiary`) represents data streams and organic system health.

### The "No-Line" & "Anti-Border" Rule

Traditional 1px solid borders are strictly prohibited. Sectioning must be achieved through:

1.  **Background Shifts**: Use `surface-container-low` vs. `surface-container-high` to create modularity.
2.  **Pixelated Fills**: Instead of a line, use a 2px-wide tiled "dot" pattern or a dithered gradient to separate sections.
3.  **Optical Gaps**: Use the Spacing Scale (specifically `8` or `10`) to create "dead zones" between modules, allowing the `background` color to act as the divider.

### Surface Hierarchy & Layering

Treat the UI as a stack of hardware modules.

- **Base Level**: `surface` (`#131314`).
- **Nesting**: Place `surface-container-lowest` elements within a `surface-container-high` block to create a "recessed" screen effect.
- **Glassmorphism**: For floating HUD elements, use `surface-variant` at 60% opacity with a `20px` backdrop-blur. This mimics the look of a physical glass display overlaying a terminal.

---

## 3. Typography: The Dual-Protocol Scale

We use a "Dual-Protocol" approach: `Space Grotesk` handles all tactical and high-level data, but its implementation varies by role to simulate different terminal outputs.

- **Display & Headlines (The "Broadcast" Layer)**:
    - Use `display-lg` (3.5rem) and `headline-lg` (2rem).
    - **Treatment**: All-caps, tracked out by `0.1em`. These should feel like system-wide alerts. Use `secondary` or `tertiary` colors for maximum impact.
- **Titles & Labels (The "Interface" Layer)**:
    - Use `title-md` (1.125rem).
    - **Treatment**: Bold, high-contrast (`on_surface`).
- **Body & Monospace (The "Data" Layer)**:
    - While the system uses `Space Grotesk`, for "Data" components, apply `font-feature-settings: "tnum", "onum", "lnum", "pnum"` to simulate a monospaced, technical feel.
    - **Body-sm**: Used for flavor text and terminal logs.

---

## 4. Elevation, Depth & Distortion

In this design system, "Elevation" is not about soft shadows—it is about **Signal Strength**.

- **Tonal Layering**: Depth is achieved by "stacking." A `surface-container-highest` card doesn't just sit on the background; it "vibrates" against it.
- **Chromatic Aberration (The Hover State)**: Floating elements or interactive cards do not use drop shadows. Instead, on hover, apply a subtle `text-shadow` or `box-shadow` offset:
    - `2px 0px #00fbfb` (Cyan) and `-2px 0px #ffabf3` (Magenta).
- **The "Ghost Border"**: If a container requires definition, use `outline-variant` (`#3a4a49`) at 15% opacity, but only on two sides (e.g., Left and Bottom) to create an asymmetric "bracket" look.
- **Scan-line Overlay**: Apply a global `::after` pseudo-element to the body with a repeating linear gradient of 2px transparent and 1px `on_background` at 3% opacity.

---

## 5. Components

### Buttons: "The Trigger Modules"

- **Primary**: Solid `primary_container` (`#00fbfb`) background, `on_primary` text. No rounded corners (`0px`).
- **States**: On hover, the button should "glitch" (shift 2px left/right rapidly) and swap colors to `secondary_container` (`#fe00fe`).
- **Tertiary**: Transparent background, `primary` text, with a `px` width left-border only.

### Inputs & Text Areas

- **Styling**: `surface-container-lowest` background.
- **Active State**: The bottom border "activates" by turning into a 2px `primary_fixed` line that extends from the center outward. Use a blinking underscore cursor `_` instead of a standard bar.

### Cards & Lists: "The Modular Blocks"

- **Forbid Dividers**: Use `spacing.10` (2.25rem) to separate list items.
- **Structure**: Each card should feel like a standalone piece of hardware. Use `surface-container-high` for the card body and a "header strip" of `surface-container-highest` to house the title.

### Specialized Component: "The Distortion Loader"

- A progress bar using the `tertiary_container` (`#a8f928`). The bar shouldn't fill smoothly; it should jump in "chunks" of 5-10%, mimicking a stuttering data transfer.

---

## 6. Do's and Don'ts

### Do

- **Embrace Asymmetry**: Align a header to the left, but place its supporting data on a slightly offset grid to the right.
- **Use "Data-Density"**: Pack labels (`label-sm`) near values to simulate a complex RPG HUD.
- **High Contrast**: Ensure text is either stark white (`primary`) or high-vibrancy neon against the dark background.

### Don't

- **No Rounded Corners**: Every `border-radius` token is set to `0px`. Roundness kills the terminal aesthetic.
- **No Soft Shadows**: Avoid standard Gaussian blurs. If you need "glow," use a sharp, multi-layered `drop-shadow` with 0 blur.
- **No Centered Layouts**: Standard centered "marketing" layouts feel too safe. Stick to "Left-Heavy" or "Exploded" modular layouts.
- **No 1px Dividers**: Never use a grey line to separate content. Use a change in surface color or a significant vertical gap.

---

## 7. Spacing & Grid

The grid is a **Block System**.

- Use the `Spacing Scale` strictly.
- Content should be grouped in `16` (3.5rem) or `24` (5.5rem) blocks.
- Small UI elements (like chips or labels) use `2` (0.4rem) padding to maintain a "tight," technical feel.
