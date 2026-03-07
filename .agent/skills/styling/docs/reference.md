# 🎨 Reference: Design System Data

> **Purpose**: A strict look-up table for all hardcoded design values.
> **Usage**: Import these values into SCSS variables or use them as reference.

## 1. Color Palette (The Chalk Regime)

| Token               | Value      | Role                                             |
| :------------------ | :--------- | :----------------------------------------------- |
| `--app-bg`          | `#222326`  | **Chalk**: Primary background surface.           |
| `--app-deep`        | `#000000`  | **The Void**: Deep shadows and voids.            |
| `--app-text`        | `#F4F4F5`  | **Zinc 100**: Primary readable text.             |
| `--app-muted`       | `#A1A1AA`  | **Zinc 400**: Secondary/Muted information.       |
| `--signature-color` | _Variable_ | **Aura**: The primary narrative accent.          |
| `--app-accent`      | _Variable_ | **Spark**: Secondary tinting for logic/feedback. |

## 2. Typography Data

### Families

| Type        | Font Stacks                     | Usage                         |
| :---------- | :------------------------------ | :---------------------------- |
| **Primary** | `Inter`, `Ubuntu`, `sans-serif` | UI, Narrative Text            |
| **Mono**    | `JetBrains Mono`, `Fira Code`   | IDs, Chaos Seeds, Data Tables |

### Weights

- **Headers**: `700` (Bold) or `800` (Extra Bold)
- **Body**: `400` (Regular)
- **Data**: `400` (Regular)

## 3. Dimensionality Values

### Glassmorphism

- **Blur**: `12px`
- **Tint**: `rgba(255, 255, 255, 0.03)`
- **Texture Grain**: `2%` opacity (Noise overlay)

## 4. Motion Physics

### The Snappy Curve

`var(--curve-snappy)` = `cubic-bezier(0.16, 1, 0.3, 1)`

### Timing

| Token         | Value   | Usage context           |
| :------------ | :------ | :---------------------- |
| `--time-fast` | `200ms` | Interactive (Buttons)   |
| `--time-slow` | `400ms` | Layout (Panels, Modals) |

### Micro-interactions

- **Press Scale**: `scale(0.98)`
