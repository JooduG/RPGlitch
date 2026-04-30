---
name: motion
description: Triggered by any task involving kinetic interactions, physics-based UI transitions, or Svelte action-based animations.
---

# Motion Specialist

> "I am the Kineticist. I own the movement and transitions. I am a technical specialist orchestrated by the Designer."

## Overview

The `motion` skill is the technical implementation layer for kinetic physics. It follows the laws of the **Sensory Constitution (Rule 04)** and is directed by the **Designer**.

### Strategic Context

- **Source-Driven Grounding**: Always read existing actions in `src/ui/utils/actions/` before implementing new physics.
- **Kinetic Purity**: Target smooth 60fps+ transitions exclusively.
- **Hardware Acceleration**: Prioritize compositor-only properties (transform, opacity).

## When to Use

- **Positive Triggers**: Implementing hover effects, page/story transitions, interactive perspective tracking (`use:tilt`), or elastic UI behaviors.
- **Animation Refinement**: Tuning easing functions and durations for consistent engine "weight".
- **EXCLUSIONS**: Do not use for core state logic or layout definition; use `simulation` or `css` instead.

## How It Works

1. **Leverage Design Tokens**: Utilize `--motion-l`, `--motion-elastic`, and interaction tokens from `tokens.css`.
2. **Svelte Action Implementation**: Define refined motion logic in `src/ui/utils/actions/` and apply via `use:action`.
3. **Compositor Optimization**: Ensure all animations bypass the heavy lifting of the rendering pipeline.
4. **Kinetic Audit**: Verify FPS stability and responsiveness of interaction triggers in the browser.

### The Interaction Engine

Standard UI atoms (buttons, cards, pills) use a centralized interaction engine. All motion must respect the weighted, subterranean aesthetic—avoiding "floating" or "bouncing" unless explicitly specified for a unique narrative moment.

## Usage

```bash
# Verify Rule 04 compliance and Grounded Policy (no translateY on hover)
npm run audit:theme

# Audit animation performance and Svelte 5 component health
npm run audit:perf

# Verify kinetic UI responsiveness via unit tests
npm run audit:logic src/ui/utils/actions/
```

## Present Results

Present the updated motion logic and visual demonstrations of the transitions.

- **Evidence**: Screen recordings or browser performance traces showing clean frame timing.
- **Validation**: Performance profiles confirming zero frame drops during peak transitions.

## Common Rationalizations

| Agent Excuse                          | The Reality                                                                  |
| :------------------------------------ | :--------------------------------------------------------------------------- |
| "Pure CSS is too limited."            | CSS transitions are the most performant. Exhaust them before using JS logic. |
| "I'll skip the FPS check."            | Kinetic truth requires smooth delivery. Audit all motion at 60fps+.          |
| "It doesn't have to feel 'weighted'." | The Nordic Collection is deliberate. Maintain subterranean physical weight.  |

## Red Flags

- **JS-Heavy Animations**: Failing to favor native GPU-accelerated CSS properties.
- **Jittery Frames**: Overwhelming the main thread with unoptimized frame-by-frame rAF logic.
- **Authorized Vertical Shifts**: Adding "bounce" or "lift" to standard UI elements (violates Rule 04 Grounded Policy).

## Troubleshooting

- **Transition Lag**: Check for excessive blur filters or `will-change` misuse causing layer explosions.
- **Interrupt Conflicts**: Handle cases where a new transition starts before the previous one finishes (Reset/Cleanup).

## Verification

- [ ] FPS stability verified at 60fps+ for all motion logic via browser profiling.
- [ ] Hardware acceleration (compositor-only properties) confirmed in the styles.
- [ ] Interaction triggers (hover, click, gesture) are precise and responsive.
- [ ] **Hard Evidence Recorded**: A browser performance trace showing clean frame timing.
