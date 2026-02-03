# 🎯 Spec: Control Panel Redesign (The Cockpit)

> **Slug:** `control-panel-redesign`
> **Type:** Feature (Aesthetic Overhaul)
> **Goal:** Create a "Kinetic Grid" (Bento) Control Panel that acts as a "System Wing"—neutral, standard, and mechanically satisfying.

## 1. Design Philosophy: The System Wing

unlike the Profile Card (which is _Entity-Specific_ and tinted by the user's soul/signature color), the Control Panel is **System Infrastructure**.

- **Aesthetic:** Matches `VisualWing.svelte` and `DevWing.svelte`.
- **Palette:** Neutral "Chalk" (`#222326`), Zinc Text. No Glass Borders. No Entity Tints.
- **Physics:** "Solid" feel. Not ethereal or refractive.

## 2. The Logic: Solid vs Fluid

The Bento Grid is divided into two dimensions:

1.  **The Solid (Global / Static):**
    - _Audio, Dev Mode, Stream Text, Auto-Scroll, Reset/Purge._
    - These occupy fixed slots in the grid (likely Top/Bottom rows).
2.  **The Fluid (Contextual):**
    - _Storymode:_ Focus, Reroll, Ghostwrite, Narrative Speed.
    - _Storyboard:_ Shuffle Layout, Card Density, Auto-Play.
    - These occupy the central "Action" slots and swap out kinetically.

## 3. The Layout: Kinetic Grid (Bento)

- **Structure:** CSS Grid (Masonry-like feel).
- **Motion:**
    - Entry: Slide-in + Scale-up (Like Wings opening).
    - Context Switch: Fluid fade/swap of central cells.
- **Cells:**
    - **Toggle Cell:** Simple On/Off (Audio).
    - **Action Cell:** Button-like (ghostwrite).
    - **Slider Cell:** (Narrative Speed).

## 4. Scaffolding

- `src/ui/organisms/control/Cockpit.svelte` (Host Container)
- `src/ui/organisms/control/KineticGrid.svelte` (The Grid Layout)
- `src/ui/organisms/control/cells/ToggleCell.svelte`
- `src/ui/organisms/control/cells/ActionCell.svelte`
