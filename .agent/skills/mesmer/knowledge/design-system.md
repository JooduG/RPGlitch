# 🎨 Mesmer Design System: The Chalk Regime

> **Philosophy**: "Neural Minimalism" — High-fidelity, atmospheric, utilizing light and shadow to guide the eye.
> **Jurisdiction**: `src/ui/**`, `src/theme/**`

## 1. 🌈 The Chalk Palette

We **prohibit** hex codes in components. Use semantic variables derived from the Chalk Regime.

| Token               | Value      | Role                                             |
| :------------------ | :--------- | :----------------------------------------------- |
| `--app-bg`          | `#222326`  | **Chalk**: Primary background surface.           |
| `--app-deep`        | `#000000`  | **The Void**: Deep shadows and voids.            |
| `--app-text`        | `#F4F4F5`  | **Zinc 100**: Primary readable text.             |
| `--app-muted`       | `#A1A1AA`  | **Zinc 400**: Secondary/Muted information.       |
| `--signature-color` | _Variable_ | **Aura**: The primary narrative accent.          |
| `--app-accent`      | _Variable_ | **Spark**: Secondary tinting for logic/feedback. |

## 2. 🌊 Motion (Kinetic Physics)

The interface is "Alive." Use **The Snappy Curve** for all transitions.

- **Curve**: `cubic-bezier(0.16, 1, 0.3, 1)`
- **Micro-interactions**: `scale(0.98)` on active/press.
- **Timing**:
    - `200ms`: Interactive (buttons, toggles).
    - `400ms`: Layout (panels, modals).

## 3. 🖋️ Typography & Dimensionality

- **Primary (Sans)**: `Inter` or `Ubuntu` (Bold `700/800` for headers).
- **Monospace**: `JetBrains Mono` or `Fira Code` (IDs, Chaos Seeds).
- **Glassmorphism**: `backdrop-filter: blur(12px)` + `rgba(255, 255, 255, 0.03)`.
- **Atmosphere**: Apply 2% grain texture to backgrounds (Stone/Analog feel).

## 4. 🧬 Component Architecture (Atomic Model)

To maintain the "Red Thread," all UI components must be classified:

- **Atoms** (`src/ui/atoms/`): Indivisible (Button, Icon, Badge).
- **Molecules** (`src/ui/molecules/`): Functional groups (InputBar, Card).
- **Organisms** (`src/ui/organisms/`): Complex sections (StorymodePanel, Lightbox).
- **Templates** (`src/ui/templates/`): Layout structures.

## 5. ⚡ Svelte 5 Implementation Protocols

All new components must adhere to **Rune Supremacy**.

- **State**: `let count = $state(0);`
- **Derived**: `let double = $derived(count * 2);`
- **Props**: `let { variant = 'default', children } = $props();`
- **Events**: Use callback props (e.g., `onclick`) instead of `createEventDispatcher`.
- **Snippets**: Use `{@render children()}` for slots.
