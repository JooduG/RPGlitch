---
name: idea-refine
description: Handles the end-to-end Concept Lifecycle, from raw vibes (Research) to sharp, actionable specifications (Refinement).
---

# Idea Refine (Concept Lifecycle)

> "Every chaotic vibe is distilled into a sharp, functional reality before it touches the engine. Simplicity is the ultimate sophistication. We move from raw inspiration to actionable concepts in a single sovereign pipeline."

## Overview

The `idea-refine` skill is the RPGlitch Engine's central filter for product and architectural thinking. It manages the entire **Concept Lifecycle**, ensuring that we are building the _right_ thing before we worry about building it _right_.

### The Concept Lifecycle

1.  **Phase 0: Research (Legacy Incubation)**: Exploration of experimental or "non-canon" vibes and legacy mechanics. This phase captures inspirations that are too valuable to lose but not yet ready for the engine's physics.
2.  **Phase 1: Diverge (Signal Sweep)**: Interrogating ambiguous requests to find the **Core Mechanic**.
3.  **Phase 2: Handshake (The Mirror)**: Reflecting intent back to the user for confirmation.
4.  **Phase 3: Converge (Stress-Test)**: Evaluating directions against Value, Feasibility, and the "Nordic Aesthetic."
5.  **Phase 4: Crystallization (The Concept)**: Producing a final **Concept Document** (formerly Discovery Journal).

## When to Use

- **Research**: When digging into legacy or procedural entropy concepts.
- **Ambiguity**: When a request is vague or "vibey."
- **Conflict**: When two implementation paths need stress-testing.
- **Inspiration**: When looking for "non-canon" mechanics to solve engine roadblocks.
- **EXCLUSIONS**: Do not use for trivial bug fixes or CSS tweaks.

## How It Works

1.  **Research & Assets**: Experimental assets are stored in `assets/` without prefixes.
2.  **Inhibition**: Research findings are "non-canon" insights until they pass through the refinement pipeline.
3.  **Refinement Analysis**: Evaluate concepts against the core RPGlitch architecture.
4.  **Concept Documentation**: Finalize concepts to the localized `assets/` directory.

### Concept Schema

Final crystallization assets MUST contain:

- **Problem Statement**: One-sentence framing.
- **Recommended Direction**: The chosen path and rationale.
- **Key Assumptions**: What we are betting is true.
- **MVP Scope**: What's in vs. What's out.

## Usage

```bash
# Call the skill to begin an ideation session
# "Help me research legacy glitch mechanics"
# "Refine the local-first history concept"
```

## Present Results

Present the refined concept or research findings in a structured format.

- **Evidence**: Finalized Concept document saved to `.agent/skills/idea-refine/assets/`.
- **Validation**: Confirmation of user "Handshake" and alignment with Rule 02 (Simulation).

## Common Rationalizations

| Agent Excuse                        | The Reality                                          |
| :---------------------------------- | :--------------------------------------------------- |
| "I'll just list 20 variations."     | Quality over quantity.                               |
| "I should apply this research now." | Research stays in `assets/` until it passes Phase 4. |
| "This doesn't need a spec."         | Ambiguity leads to technical debt.                   |

## Red Flags

- **Logic Drift**: Treating research assets as current technical specifications.
- **Context Pollution**: Loading non-canon research into an active `/build` turn before refinement.
- **Missing "Not Doing"**: A plan that tries to do everything is a plan for failure.

## Troubleshooting

- **Access Issues**: Ensure you are using relative paths from the `.agent/` root.
- **Scope Creep**: If the concept starts growing, trigger the Converge phase immediately.

## Verification

- [ ] A clear "How Might We" statement exists.
- [ ] **Signal Handshake**: User confirmed intent before crystallization.
- [ ] **Hard Evidence Recorded**: A finalized **Concept** saved to `assets/`.
