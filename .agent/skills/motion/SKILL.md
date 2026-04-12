---
name: motion
description: Triggered by any task involving kinetic interactions, physics-based UI transitions, or Svelte action-based animations.
---

# 🌀 Motion Specialist

> "I am the Kineticist. I own the movement, the transitions, and the physical feel of the RPGlitch Engine. I synthesize Aesthetic Intent into Kinetic Reality via Svelte Action-based Animations and Physics-based UI Transitions."

## 🔬 Anatomy

```text
skills/motion/SKILL.md/
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Smooth transitions that feel premium and kinetic.
- **Architectural Integrity**: Native browser performance using CSS transforms and Svelte actions.
- **Sensory Excellence**: Interactive perspective tracking and elastic transitions.
- **The Grounded Policy**: Standard UI (buttons, cards) favors filters/depth over vertical shifts (`translateY`).

## 📋 Procedure

### Interaction & Motion Engine (Canon)

1. **Leverage Design Tokens**:
   - **Motion**: `--motion-fast`, `--motion-slow`, `--motion-elastic`, `--motion-click`.
   - **Interaction**: `--hover-brightness`, `--hover-blur`, `--hover-background-color`.
2. **Global Implementation**:
   - Prefer `src/theme/global.css` interaction rules for shared atoms.
   - Use high-specificity parent selectors for component overrides instead of `!important`.

### Svelte Action Implementation

1. **Create Action Module**:
   - Define the action in `src/ui/utils/actions/`.
   - Apply to the DOM via the `use:action` directive.

2. **Verify Performance**:
   - Confirm FPS stability and hardware acceleration.

### Kinetic Refinement

- **Definition of Done**: Kinetic transitions are smooth; interaction triggers are precise; registry is up-to-date.
- **Expected Output**: A responsive, living UI.

## 🚫 Anti-Patterns

- **JS-Heavy Animations**: Failing to favor native CSS transitions and transforms.
- **Jittery Frames**: Overwhelming the main thread with unoptimized motion logic.
- **Aesthetic Mismatch**: Motion that doesn't align with the Nordic Collection's weighted feel.
- **Unauthorized Vertical Shifts**: Adding "bounce" or "lift" to standard UI elements without explicit design approval.

## ⚖️ Common Rationalizations

| Excuse                                           | Counter-Measure                                                      |
| :----------------------------------------------- | :------------------------------------------------------------------- |
| "A pure CSS transition is too limited for this." | "CSS transitions are the most performant. Exhaust them first."       |
| "I'll skip the FPS check for this one bounce."   | "Kinetic truth requires smooth delivery. Audit all motion at 60fps." |
| "The motion feel doesn't have to be 'weighted'." | "The Nordic Collection is deliberate. Maintain physical weight."     |

## ✅ Verification

- [ ] FPS stability verified at 60fps+ for all motion logic.
- [ ] Hardware acceleration (compositor-only properties) confirmed.
- [ ] Interaction triggers (hover, click, gesture) are precise and responsive.
- [ ] Transition durations and easing functions align with the Nordic style guide.

---

> "Precision is the baseline of sovereignty."
