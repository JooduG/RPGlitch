# Mesmer Skill: The Chalk Design System

> **Context:** Visual tokens, typography, and atmospheric physics.

The visual language of RPGlitch is defined by "Neural Minimalism"—a high-fidelity, atmospheric interface that uses light and shadow to guide the eye.

## 🌈 1. The Chalk Palette

We avoid hex codes in components. All colors must use `var(--app-...)` tokens derived from the **Chalk Regime**.

| Token               | Value     | Role                                               |
| :------------------ | :-------- | :------------------------------------------------- |
| `--app-bg`          | `#222326` | **Chalk:** Primary background surface.             |
| `--app-deep`        | `#000000` | **The Void:** Reserved for deep shadows and voids. |
| `--app-text`        | `#F4F4F5` | **Zinc 100:** Primary readable text.               |
| `--app-muted`       | `#A1A1AA` | **Zinc 400:** Secondary/Muted information.         |
| `--signature-color` | Variable  | **Aura:** The primary narrative accent.            |
| `--app-accent`      | Variable  | **Spark:** Secondary tinting for logic/feedback.   |

## 🖋️ 2. Typography

The "Voice" of the UI is expressed through two primary font families.

- **Primary (Sans):** `Inter` or `Ubuntu`. Strong sentence case. Bold weights (`700/800`) for headers.
- **Monospace:** `JetBrains Mono` or `Fira Code`. Used for IDs, Chaos Seeds, and internal logic blocks.

## 🌊 3. Motion (Kinetic Physics)

The interface is "Alive." Every interaction should have physical feedback.

- **The Snappy Curve:** `cubic-bezier(0.16, 1, 0.3, 1)`. Used for all UI transitions.
- **Timing:**
    - `200ms`: Interactive (buttons, icons).
    - `400ms`: Layout (panels opening, modals).
- **Micro-interactions:** Every click must have a feedback ripple or scale transformation (`scale(0.98)`).

## 🪟 4. Dimensionality

- **Glassmorphism:** Use `backdrop-filter: blur(12px)` with `rgba(255, 255, 255, 0.03)` for overlays.
- **Atmospheric Noise:** Apply a 2% grain texture to the primary background to simulate "Stone" or "Analog Film" feel.
