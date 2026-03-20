# Design System: The Nordic Collection (RPGlitch)

## 1. Overview & Creative North Star
**Creative North Star: "The Silent Nordic Stage"**

This design system is inspired by the "Nordic Refac V2" collection. It is a local-first, premium RPG interface that values clarity, depth, and atmospheric calm over industrial chaos. The goal is to create a "Silent Stage"—a beautiful, minimalist theater for the user's narrative to unfold.

We prioritize **softened geometry**, **harmonious tonal shifts**, and **meaningful depth**. We avoid aggressive "glitch" aesthetics in favor of subtle, high-end digital refinements that make the interface feel alive and reactive without being oppressive.

---

## 2. Colors & Surface Architecture

The palette is derived strictly from the **Chalk Regime** tokens, focusing on a deep "Gunmetal" and "Frozen" baseline with "Chalk" data points.

### The Nordic Hierarchy
- **Primary Accent (`--color-frozen` / `--color-frisk`):** Used for navigation cues and significant narrative triggers.
- **Surface (`--color-gunmetal`):** The foundation. Use `surface-base` and `surface-sunken` for the main canvas.
- **The Chalk Point (`--color-chalk`):** Used for primary text and high-contrast icons to ensure absolute legibility.

### Surface Architecture
We create depth through **Shadows over Borders**. 
- **Soft Shadows:** Use `shadow-m` for standard cards and `shadow-l` for floating overlays.
- **Recessed Surfaces:** Use `surface-sunken` for content areas that should feel "embedded" into the interface.
- **Glassmorphism:** Use `blur-m` to `blur-xl` on secondary panels to maintain a sense of layered spatiality.

---

## 3. Typography: The Dual-Identity Scale

We use **Ubuntu** for personality and **Inter** for precision.

- **Ubuntu (Headers):** Used for display titles and entity names. It provides a rounded, technical yet friendly feel.
- **Inter (Metadata & Body):** Used for the bulk of the technical ledger. High legibility is the priority.
- **Monospace (Coordinates/IDs):** Use **JetBrains Mono** only for raw data strings or terminal logs.

---

## 4. Components & Ergonomics

### Trigger Modules (Buttons)
- **Visuals:** **Rounded & Tactile**. Use `border-radius-m` (0.5rem / 8px) for all primary buttons. This aligns with the "Nordic" ergonomics.
- **States:** 
  - **Hover**: Subtle vertical shift (`physics-btn-hover-y`) and a glow increase. 
  - **Active**: Slight scale compression (`physics-btn-active-scale`) to provide mechanical feedback.
- **Transitions:** Use the `Snappy Curve` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for all state changes.

### Entity Cards
- **Geometry**: Consistent `border-radius-m`. 
- **Separation**: Use `surface-raised` background to stand out from the `surface-base`. Use padding scale `spacing-m` (1rem) for internal consistency.

---

## 5. Do’s and Don’ts

### Do:
- **Prioritize Legibility:** High contrast (Chalk on Gunmetal) is the foundation of the user experience.
- **Use Soft Depth:** Lean on box-shadows and blurs rather than hard stroke lines.
- **Embrace the Silence:** Keep UI elements minimal. Only show what is needed for the current narrative moment.

### Don’t:
- **No Square Buttons:** 0px radius is strictly forbidden. We favor the "Nordic" smoothness.
- **No Aggressive Glitch:** While subtle "data flicker" animations are acceptable for transitions, the persistent UI should remain static and reliable.
- **No Hallucinated Colors:** Never use a color that is not a CSS variable in `tokens.css`.
