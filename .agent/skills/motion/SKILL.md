---
name: motion
description: >
    Manages kinetic interactions, physics-based UI, and complex transitions.
    Triggers:
    - "Add tilt effect"
    - "Fix animation"
    - "Kinetic scroll"
    - "src/ui/utils/actions/**"
---

# 🌀 Motion

> **Mandate**: "I orchestrate the rhythm of the interface. I ensure every transformation is fluid, every interaction has weight, and the digital world responds with physical intuition."

## 1. Scope & Ownership

- **Primary Domain**: `src/ui/utils/actions/`
- **Key Assets**:
    - `Spring`/`Tween`: Use Svelte 5 classes for value-based motion (replaces `tweened`/`spring` stores).
    - `tilt.js`: Physics-based hover orientation.
    - `kinetic.js`: Inertial scrolling and momentum.
    - `portal.js`: DOM node teleportation.
    - `fitText.js`: Dynamic typography scaling.

## 2. Core Protocols

1.  **Sticking to the Curve**:
    - All transitions and animations must use `var(--curve-snappy)` unless physics-calculated.
    - Avoid `linear` or standard `ease-in-out` for UI elements.
2.  **Perceptual Weight**:
    - Elements moving onto the screen should feel heavier (longer duration) than elements leaving.
3.  **Action Encapsulation**:
    - Motion logic should reside in Svelte _Actions_ to keep components lean.

## 3. Reference Files

- [tilt.js](file:///c:/Users/johng/Documents/GitHub/default/src/ui/utils/actions/tilt.js)
- [kinetic.js](file:///c:/Users/johng/Documents/GitHub/default/src/ui/utils/actions/kinetic.js)
- [portal.js](file:///c:/Users/johng/Documents/GitHub/default/src/ui/utils/actions/portal.js)
- [fitText.js](file:///c:/Users/johng/Documents/GitHub/default/src/ui/utils/actions/fitText.js)

## 4. Troubleshooting Triggers

- **"Animation stuttering"**: Ensure heavy computations are offloaded from the main thread or use `requestAnimationFrame`.
- **"Portal breaking context"**: Verify event bubbling through portals in Svelte.
