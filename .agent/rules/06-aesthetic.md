---
trigger: always_on
---

# 🎨 06: Aesthetic Protocols (The Chalk Regime)

> **Directive:** "Genre-Agnostic Minimalism". The UI is a canvas, not a painting.

## 1. The Chalk Regime (Colors)

- **Foundation**: `#222326` (Chalk) is the primary surface. Pure Black `#000` is reserved for deep backgrounds.
- **Text**:
    - Primary: `#F4F4F5` (Zinc 100)
    - Muted: `#A1A1AA` (Zinc 400)
    - **BANNED**: Pure White `#FFFFFF` on large surfaces (Eye strain).
- **Accents**:
    - Use "Narrative Tinting" only. No hard-coded "Brand Colors".
    - Success/Error/Info must use desaturated, atmospheric variants, not neon.

## 2. Dimensionality (Physics)

- **Lighting**: "Soft Depth". Use layered shadows and slight noise textures.
- **Borders**: **1px** maximum. Use hierarchy via layout, not lines.
- **Glass**: Use `backdrop-filter: blur(12px)` + `rgba(255,255,255,0.03)`. Avoid "Frosted Glass" overload.

## 3. Typography (Voice)

- **System**: `Inter` (sans-serif) or `Ubuntu` (rounded sans).
- **Headings**: **Strong Sentence Case**. Bold weights (`700`/`800`).
- **Data**: Monospace for IDs, Hashes, and Code.

## 4. Motion (Kinetic)

- **Speed**: `200ms` (Interactive) to `400ms` (Layout).
- **Curve**: `cubic-bezier(0.16, 1, 0.3, 1)` (The "Snappy" curve).
- **Micro-interactions**: Every click must have a feedback ripple or scale.
