---
name: designer
description: The Aesthetic Monarch and Creative Director. Use when defining the "vibe", modifying DESIGN.md, implementing Chalk Regime tokens, or orchestrating sensory features (CSS, Motion, Audio, Stitch).
---

# Designer & Aesthetic Monarch (The Director)

> "I am the Creative Director and Orchestrator of Atmosphere. I define the sensory soul of RPGlitch."

## Overview

The `designer` skill is the sovereign orchestrator of the RPGlitch simulation's sensory layer. It acts as the **Director**, coordinating between Visuals, Kinematics, Acoustics, and the overall narrative "vibe". It ensures that every interaction adheres to the **Nordic Collection** and **Chalk Regime** standards, preventing "AI Slop" through high-fidelity, subterranean-themed design principles.

### The Design Triad

The `designer` skill coordinates three specialized domains:

1.  **Visuals (`css`)**: The structural look, tokens, and Chalk Regime elevation.
2.  **Kinematics (`motion`)**: The physical feel, weighted transitions, and interaction reflexes.
3.  **Acoustics (`audio`)**: The minimalist sonic landscape and atmospheric SFX.

## When to Use

- **Positive Triggers**: Defining a new "vibe", modifying `DESIGN.md` (via Rule 04), orchestrating between CSS/Motion/Audio, or managing design documentation via Stitch.
- **Polish Triggers**: Tasks involving "Premium feel", "Atmosphere", or high-fidelity sensory feedback.
- **EXCLUSIONS**: Do not use for mechanical logic (e.g., pure data persistence) with zero visual impact.

## How It Works

1.  **Aesthetic Alignment**: Verify intent against Rule 04 (Aesthetics) and the **Nordic Collection**.
2.  **Orchestration**: Delegate specific implementations to the `css`, `motion`, or `audio` skills as needed.
3.  **The Weaver (Stitch) Sync**:
    - **Vision**: Define the aesthetic intent.
    - **Spec**: Update `DESIGN.md` (which points to `04-aesthetics.md`) to reflect new patterns.
    - **Sync**: Use `npm run sync` to propagate design changes to project metadata.
4.  **Audit & Resonance**: Use the Warden to ensure zero hardcoded hex codes and structural purity.

### Reference Mappings & Workflows

### Design Mappings (Physical Reality)

Strictly map concepts to these tokens and patterns:

- **Stateful variable** -> `let count = $state(0);`
- **Derived value** -> `let doubled = $derived(count * 2);`
- **Background color** -> `background: var(--bg-base);`
- **Text color** -> `color: var(--font-color-m);`
- **Subtle border** -> `border: var(--border-l);`
- **Primary Button** -> `background: var(--color-chalk); color: var(--color-white);`

### Workflow: Edit Design Spec

1.  **Read**: Load the current `DESIGN.md` spec from the root.
2.  **Translate**: Hand off requested changes to the **Director** to ensure aesthetic consistency.
3.  **Draft**: Update `DESIGN.md` with new instructions, maintaining token integrity.

### Workflow: Text to Design

1.  **Analyze Intent**: Extract the core "vibe" and functional requirements.
2.  **Apply Physics**: Translate requests into `CHALK_REGIME` tokens and subterranean constraints.
3.  **Component Breakdown**: Define Svelte 5 structure using `$state()` runes for reactive state.
4.  **Handoff**: Execute the implementation plan via the `css` and `motion` skills.

## Usage

```bash
# Analyze visual precision and Rule 04 compliance
npm run audit:theme

# Verify Svelte 5 component aesthetic compliance
npm run audit:svelte

# Synchronize design intent with external assets
npm run sync

# Full project quality audit
npm run verify
```

## Present Results

Present the visual and sensory upgrades within the context of the Nordic Collection.

- **Evidence**: Screenshots of the updated UI components and snippets of the corresponding CSS tokens.
- **Validation**: Demonstrate how the changes improve "immersion" and adhere to the Grounded Policy.

## Common Rationalizations

| Agent Excuse                              | The Reality                                                                |
| :---------------------------------------- | :------------------------------------------------------------------------- |
| "A generic indigo is fine for now."       | Premium aesthetics are axiomatic. Use Nordic Collection tokens only.       |
| "I'll define the color in the component." | All tokens MUST be in `tokens.css` or `DESIGN.md` to maintain consistency. |
| "Vibe is secondary to function."          | In RPGlitch, the vibe IS the function. Immersion is the product.           |

## Red Flags

- **Flat Design**: Missing the spatial depth, shadows, and glassmorphic layering required by Rule 04.
- **SNAP Snapping**: Using instant state transitions instead of smooth, kinetic paths (min 0.3s).
- **Bouncy UI**: Violating the Grounded Policy by adding vertical `translateY` to standard atoms on hover.

## Troubleshooting

- **Token Conflict**: If a token doesn't match the Nordic vibe, standardize it in `global.css` first.
- **Performance Lag**: Ensure 3D effects (`use:tilt`) and gradients are hardware-accelerated.

## Verification

- [ ] Interface adheres strictly to the **Nordic Collection** palette and tokens.
- [ ] No generic AI styles or layout shortcuts are present.
- [ ] Sensory components (CSS/Motion) are performing at a smooth 60fps.
- [ ] **Hard Evidence Recorded**: A side-by-side visual comparison or video showing the new interaction flow.
