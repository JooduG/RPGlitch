---
name: motion
description: Triggered by any task involving kinetic interactions, physics-based UI transitions, or Svelte action-based animations.
---

# Motion Specialist

> "I am the Kineticist. I own the movement, the transitions, and the physical feel of the RPGlitch Engine. I ensure every interaction has weighted, subterranean depth."

## Overview

The `motion` skill governs the kinetic soul of the RPGlitch Engine. It focuses on creating smooth, physics-based transitions that feel premium and intentional. By leveraging native browser performance (CSS transforms) and Svelte actions, it ensures that every interaction adheres to the "Nordic Collection" and its Grounded Policy—prioritizing depth and filters over bouncy vertical shifts.

### Strategic Context

- **Kinetic Purity**: Target smooth 60fps+ transitions exclusively.
- **Hardware Acceleration**: Prioritize compositor-only properties (transform, opacity) to avoid layout/paint thrashing.
- **Grounded Weight**: Standard UI elements favor spatial depth and glassmorphic filters for tactile feedback.

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
# Analyze animation performance and frame timings (Rule 06)
npm run audit:perf

# Verify kinetic UI responsiveness
mcp_chrome_devtools_performance_start_trace
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
