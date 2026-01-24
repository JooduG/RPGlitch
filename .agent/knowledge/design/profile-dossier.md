# Design System: The Triptych Dossier

> **Status:** Implemented (v1.0)
> **Context:** Entity Profile View (`src/scholar/Profile.svelte`)

## 1. The Core Concept

The **Triptych Dossier** transforms the standard "Modal" pattern into an immersive, artifact-like experience. It represents an entity (Character, World, NPC) as a physical or magical document that "unfolds" to reveal deeper layers of control.

### The Metaphor

- **Closed State (Read-Only):** A sleek, high-fidelity presentation card. The user consumes the lore.
- **Open State (Edit Mode):** The "Wings" unfold. The artifact becomes a workbench.
    - **Left Wing (Creative):** Controls the soul (Visuals, Color, Vibes).
    - **Right Wing (System):** Controls the existence (UUID, Deletion, Metadata).

## 2. Visual Language

### 2.1 Glassmorphism & Depth

- **Blur:** The wings use `backdrop-filter: blur(10px)` to sit "above" the game world but "below" the main card.
- **Borders:** Thin, translucent borders (`var(--ui-glass-border)`) define the edges without feeling heavy.
- **Backgrounds:** `rgba(0, 0, 0, 0.4)` provides contrast against the possibly busy game background.

### 2.2 Dynamic Soul Colors

The UI feels alive because it bleeds the entity's **Signature Color** into the interface itself.

- **Technology:** `color-mix(in oklab, var(--signature-color) %, ...)`
- **Application:**
    - **Card Background:** 20% Signature + 60% Card Base.
    - **Form Fields:** 30% Signature + 50% Form Base.
    - **Headers:** 100% Signature Color.
- **Result:** A red dragon's profile feels hot and aggressive; a blue mage's profile feels cool and intellectual.

## 3. Interaction Design

### 3.1 The Unfolding

- **Trigger:** Clicking "Edit".
- **Animation:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (The "Overshoot" or "Spring" feel).
- **Behavior:**
    - The central card slides slightly to make room.
    - The wings expand from `width: 0` to `width: 25rem`.
    - Opacity fades in.
    - Blur removes itself from the wings as they focus.

### 3.2 Responsive Scaling

Because the full Triptych is massive (~100rem / 1600px), it behaves like a physical object that doesn't "squish." Instead, it **zooms out**.

- **< 1600px:** Scales to 0.85x.
- **< 1280px:** Scales to 0.7x.
- **Transform Origin:** Center.

## 4. Technical Architecture

- **Component:** `Profile.svelte`
- **State:** Svelte 5 Runes (`$state`, `$derived`).
- **Persistence:** `runtime.saveEntity()` (Generic UPSERT).
- **Config:** Fields defined in `src/scholar/config.js` for easy expansion.
