---
trigger: always_on
---

# 🎨 06: Aesthetic Protocols (The Chalk Regime)

> **Directive:** "Genre-Agnostic Minimalism". The UI is a canvas, not a painting.

## 1. Neural Minimalism (The Silent Stage)

Modern interfaces demand attention. RPGlitch _recedes_ from it.

- **The Silent Stage:** The interface should feel like an empty theater waiting for the first word. Darkness is the default; light is a narrative event.
- **Cognitive Recoil:** We avoid "Information Overload." If a piece of data isn't vital to the current narrative beat, it is hidden.
- **Subtext over UI:** We prioritize describing the _feeling_ of a menu over rendering a complex table.

## 2. The Ambiguity Threshold (Adaptive Curiosity)

- **Rule**: If a visual request is **Vague** ("Make it pop", "Tweak the vibe"), **ASK** before execution. (Score 3+).
- **Rule**: If a request is **Specific** ("Make it red", "Add 10px padding"), **DO** immediately. (Score 1-2).
- **Directive**: Do not waste cycles interpreting abstract intent without calibration.

## 3. The Chalk Regime (Colors)

- **Foundation**: `#222326` (Chalk) is the primary surface. Pure Black `#000` is reserved for deep backgrounds.
- **Text**:
    - Primary: `#F4F4F5` (Zinc 100)
    - Muted: `#A1A1AA` (Zinc 400)
    - **BANNED**: Pure White `#FFFFFF` on large surfaces (Eye strain).
- **Accents**:
    - **`--signature-color`**: The primary narrative aura (The "Soul").
    - **`--app-accent`**: Secondary desaturated tinting for Success/Error/Info.
    - Use "Narrative Tinting" only. No hard-coded "Brand Colors".

## 3. Dimensionality (Physics)

- **Lighting**: "Soft Depth". Use layered shadows and slight noise textures.
- **Borders**: **None**. Use hierarchy via layout and shadows.
- **Glass**: Use `backdrop-filter` only for **Overlays** (Modals, Toasts) and **Floating Elements**.
    - Base layers: `var(--layer-surface)` (Opaque).
    - Floating: `var(--layer-glass)` (Blur 12px + 95% opacity).

## 4. Typography (Voice)

- **System**: `Inter` (sans-serif) or `Ubuntu` (rounded sans).
- **Headings**: **Strong Sentence Case**. Bold weights (`700`/`800`).
- **Data**: Monospace for IDs, Hashes, and Code.

## 5. Motion (Kinetic)

- **Speed**: `200ms` (Interactive) to `400ms` (Layout).
- **Curve**: `cubic-bezier(0.16, 1, 0.3, 1)` (The "Snappy" curve).
- **Micro-interactions**: Every click must have a feedback ripple or scale.

---

**Next:** Aesthetics are the interface for thought. See [07: Intelligence](./07-intelligence.md).
