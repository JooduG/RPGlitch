# 🌀 Walkthrough: Terminology Refactor (World -> Fractal)

I have completed the comprehensive terminology refactor, standardizing the codebase to use **"Fractal"** instead of "World" across all layers (UI, Logic, and Intelligence).

## Changes Made

### 🕰️ Core Engine & Security

- **Physics Engine**: Renamed `worldState` to `fractalState` in `PhysicsEngine.evaluate`.
- **Warden**: Updated `Warden.process` to accept `fractalState`.
- **Chrono**: Updated comments and JSDoc to reflect the "Fractal State" context.

### 🧠 Intelligence & Prompts

- **Context Broker**:
    - Renamed `pullWorld()` to `pullFractal()`.
    - Updated system prompt markers: `[WORLD_LAYER]` is now `[FRACTAL_LAYER]`.
    - Updated fallback titles to "Unknown Fractal".
- **Prose Templates**: Fixed scene headers to display `Fractal: ${name}`.

### 🛠️ UI & Data

- **Dynamic Titles**: Changed "The World of..." to "The Fractal of..." in the Storyboard header.
- **Diagnostic Telemetry**: Updated the Debug Panel to label environment logs as `FRACTAL` (green).
- **Narrative Lore**: Updated character bios and future vectors to use "fractals" (e.g., "frontier fractals") for thematic consistency.

## What was tested

- **Logic Integrity**: Verified that `PhysicsEngine.evaluate` still correctly processes locks and anchors using the renamed parameters.
- **Prompt Assembly**: Monitored `ContextBroker.assemble` output to ensure the AI receives the correct `[FRACTAL_LAYER]` injection.
- **UI Presentation**: Confirmed the Dynamic Title shifts correctly in the lobby.

> [!NOTE]
> The Tarot card **"The World (XXI)"** remains untouched in `tarot.json` to preserve the original Arcana naming convention and flavor integrity.

---

**Terminology Refactor Status**: ✅ **100% Purged**
