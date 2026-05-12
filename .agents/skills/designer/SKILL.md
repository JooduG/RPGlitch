---
name: designer
description: The Sensory Dispatcher and Aesthetic Monarch. Orchestrates the "vibe" and UI assembly by directing specialized agents (css, motion, audio, image-generation, user-interface). Use for building components and ensuring Nordic Collection alignment.
---

# Designer & Sensory Dispatcher

> "I am the Orchestrator of Atmosphere. I bridge the gap between the Aesthetic Law and the functional UI. I assemble the sensory soul of RPGlitch."

## Overview

The `designer` skill is the central dispatcher for all user-facing features. It absorbs the roles of UI assembly, grid harmonization, and feedback patterns. It acts as the **Director**, coordinating between technical specialists to ensure every interaction adheres to the **Nordic Collection** and **Chalk Regime**.

### The Dispatcher Protocol

When a task involves sensory implementation, the `designer` must triage and delegate to the appropriate specialists:

- **Structural UI**: Handled directly by `designer` (Svelte 5 assembly).
- **Layout/Tokens**: Delegate to `css`.
- **Kinematics/Busy States**: Delegate to `motion`.
- **UI Stability/Positioning**: Delegate to `user-interface`.
- **Acoustics/SFX**: Delegate to `audio`.
- **Visual Assets**: Delegate to `image-generation`.

## Strategic Context

- **Source-Driven Grounding**: Always read `src/theme/engine.css` and existing atoms in `src/ui/` before building.
- **Svelte 5 Sovereignty**: Use Runes ($state, $derived, $props) and Bits UI primitives exclusively.
- **Atomic Design**: Assemble interfaces from `atoms` -> `molecules` -> `organisms`.
- **Token Compliance (Zero Tolerance)**: You must enforce the Chalk Regime. When assembling structural UI that requires spacing, colors, or typography, you must exclusively use `var(--token-name)`. If you invent a raw value or a missing token, your output will be rejected.

## How It Works

### 1. UI Assembly (The Builder)

Assemble components using semantic HTML and Svelte 5 logic. Favor **Snippets** (`{@render children?.()}`) for flexible composition.

### 2. Kinetic Feedback (The Pulse)

Delegate to `motion` for implementing "Scanning" feedback and interaction physics. Ensure component headers remain expanded and inputs are locked during engine processes.

### 3. Structural Integrity (The Guard)

Delegate to `user-interface` for positioning floating elements (dropdowns, tooltips) and ensuring layout stability (truncation, click-outside logic, minimum field heights).

### 4. System Modal Patterns (The Floating Monolith)

Implement unified system dialogs (Alerts/Confirmations) using the **Floating Monolith** pattern.

- **Hierarchy**: Use `Dialog.svelte` -> `Modal.svelte` (with `variant="mini"`) -> `Backdrop.svelte`.
- **Elevation**: Use `glass-peak` styling and `var(--max-z-index)`.

## Usage

```bash
# Verify component against Rule 03/04 safety gates
npm run verify

# Audit accessibility in the browser
mcp_chrome-devtools_list_console_messages
```

## Verification Checklist

- [ ] Component uses Svelte 5 Runes and Bits UI primitives.
- [ ] Kinetic feedback (Busy states) delegated to `motion`.
- [ ] Structural stability (Positioning, Truncation) delegated to `user-interface`.
- [ ] Layout snaps to the modular `--spacing-*` scale.
- [ ] Specialized tasks (CSS/Motion/Audio) were delegated to the correct skills.

## RPGlitch 3-Tier Tokens (The Chalk Regime)

The RPGlitch Engine uses a strict 3-tier design token architecture to ensure aesthetic consistency (Nordic Noir) and maintainable fluid layouts.

## The 3-Tier Hierarchy

Follow this strict inheritance chain: `T1 (Foundation) -> T2 (Semantic) -> T3 (Shared Component)`.

### Tier 1: Foundations (The Ruler)

**Format:** `--[prop]-[value]` (e.g., `--spacing-4`, `--duration-reflex`)

- **Raw Constants**: The ONLY place where absolute numbers, hex codes, or units (px, rem, ms) are allowed.
- **Zero-Digit Rule**: No "magic numbers" or absolute units in Tiers 2 and 3.
- **Atomic Grid**: All spacing must be a multiple of the 4px unit (`0.25rem`).
- **Scales**:
  - **Radii**: `sharp` (4px), `subtle` (8px), `standard` (16px), `rounded` (32px), `pill` (9999px).
  - **Motion**: `reflex` (150ms), `fast` (250ms), `standard` (350ms), `slow` (500ms).
  - **Presence (Opacity)**: `ghost` (0.08), `muted` (0.3), `heavy` (0.6), `solid` (1.0).

### Tier 2: Semantics (The Intent)

**Format:** `--[role]-[prop]` (e.g., `--card-padding`, `--overlay-z-index`)

- **Mapping**: Maps Foundations to a functional purpose.
- **Nomenclature**: Use descriptive roles (e.g., `header-bg`, `text-primary`).
- **Signature Hook**: Implement entity color fallbacks:
  `--signature-color: var(--signature-color, var(--color-frozen));`

### Tier 3: Shared Components (The Annex)

**Format:** `--[component]-[role]-[prop]` (e.g., `--tarot-card-width`)

- **Shared Metrics**: Metrics used by two or more related components.

## Sovereign Rules (Chalk Regime)

1. **The Zero-Digit Rule**: Tiers 2 and 3 MUST reference variables. Use `calc()` with T1 foundations if needed, but avoid multiplication to reach fixed pixel values (e.g., `calc(var(--spacing-px) * 20)` is "cheating").
2. **Modern Color Syntax**: Use Relative Color Syntax for transparency:
   `rgb(from var(--color-chalk) r g b / var(--opacity-muted))`
3. **Property-First Sorting**: In `engine.css`, sort variables by property category, then by size (ascending).
4. **Fluid Everything**: Use `clamp()` for typography, spacing, and widths to eliminate media queries.
5. **Eviction Policy**: If a variable is used in ONLY one `.svelte` file, move it to that file's `<style>` block.

## Reference Values (Foundations)

- **Spacing**: `--spacing-1` (4px), `--spacing-2` (8px), `--spacing-4` (16px), `--spacing-8` (32px).
- **Z-Index**: `--z-deep` (-1), `--z-floor` (0), `--z-surface` (10), `--z-overlay` (100), `--z-modal` (1000).

## RPGlitch UI Harmonization

This skill ensures that UI components follow the standardized RPGlitch architecture for snippets, actions, and processing states.

## Atomic Standardization

All atoms (Button, TextField, Slider, etc.) must follow a consistent interface to prevent architectural drift.

### 1. Snippet Naming

- **`header_actions`**: Use this name for snippet props that render action buttons in a component's header (e.g., in `TextField` or `Modal`).
- **Standardization**: Avoid the generic name `actions` for snippets to prevent conflict with Svelte Actions.

### 2. Svelte Action Prop

- **`actions`**: Always use this name for the prop that accepts an array of Svelte Actions (e.g., `[shimmy, tooltip]`).
- **Internal Helper**: Use `use:use_actions={actions}` from `@ui/utils/use-actions.js` to apply them.

## Busy State Harmonization (Processing)

Components that wait for AI engine output (Text Enhancement, Image Generation) must use the harmonized "Busy" pattern.

### TextField Pattern

- **`busy` prop**: When `true`, the `TextField` should:
  1. Show a `wait` cursor.
  2. Maintain an expanded header (even if not focused).
  3. Display the status message in the `status` snippet.
- **`status` snippet**: A dedicated slot for left-aligned status content (text, indicators, animations) within the header.

### Workflow for Busy State

1. In the organism (e.g., `VisualWing`), track the busy state of the operation.
2. Pass `busy={is_processing}` to the `TextField`.
3. Provide a snippet for the `status`:

```svelte
{#snippet status()}
  {#if is_processing}
    <span class="engine-status">RETRYING...</span>
  {/if}
{/snippet}

<TextField {busy} {status} ... />
```

## Harmonization Verification

- [ ] Snippet for header actions is named `header_actions`.
- [ ] Svelte Actions prop is named `actions`.
- [ ] `TextField` header stays expanded during `busy` state.
- [ ] Status messages are rendered in the `status` snippet slot.
