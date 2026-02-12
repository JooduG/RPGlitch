# 🎨 Canon: Design System

> **Jurisdiction**: `src/ui/**`, `src/theme/**`
> **Purpose**: Strict reference for SCSS variables, typography, and motion physics.

## 1. Color Palette (The Chalk Regime)

**Rule**: No hex codes in components. Use semantic variables.

| Token               | Value      | Role                                             |
| :------------------ | :--------- | :----------------------------------------------- |
| `--app-bg`          | `#222326`  | **Chalk**: Primary background surface.           |
| `--app-deep`        | `#000000`  | **The Void**: Deep shadows and voids.            |
| `--app-text`        | `#F4F4F5`  | **Zinc 100**: Primary readable text.             |
| `--app-muted`       | `#A1A1AA`  | **Zinc 400**: Secondary/Muted information.       |
| `--signature-color` | _Variable_ | **Aura**: The primary narrative accent.          |
| `--app-accent`      | _Variable_ | **Spark**: Secondary tinting for logic/feedback. |

## 2. Typography

### Families

- **Primary (Sans)**: `Inter` or `Ubuntu`
    - Headers: Bold `700` / `800`
- **Monospace**: `JetBrains Mono` or `Fira Code`
    - Usage: IDs, Chaos Seeds, Data

### Hierarchy

- **Headings**: Strong Sentence Case.
- **Data**: Monospace.

## 3. Dimensionality & Atmosphere

### Physics

- **Lighting**: Soft Depth (Layered shadows).
- **Borders**: **None**. Hierarchy via layout and shadows.

### Glassmorphism

- **Structure**: `backdrop-filter: blur(12px)` + `rgba(255, 255, 255, 0.03)`
- **Usage**: Overlays (Modals, Toasts), Floating Elements.
- **Base Layers**: Opaque `var(--layer-surface)`.

### Texture

- **Grain**: 2% opacity on backgrounds (Stone/Analog feel).

## 4. Motion (Kinetic Physics)

### The Snappy Curve

- **Bezier**: `cubic-bezier(0.16, 1, 0.3, 1)`

### Timing

- **Interactive**: `200ms` (Buttons, toggles)
- **Layout**: `400ms` (Panels, modals)

### Micro-interactions

- **Active/Press**: `scale(0.98)`
