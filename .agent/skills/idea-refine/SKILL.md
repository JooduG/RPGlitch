---
name: idea-refine
description: Refines ideas iteratively. Refine ideas through structured divergent and convergent thinking. Use "idea-refine" or "ideate" to trigger.
---

# Idea Refine

> "Simplicity is the ultimate sophistication. Refine raw ideas into sharp, actionable concepts worth building."

## Overview

The `idea-refine` skill is an architectural and product-thinking framework designed to sharpen ambiguous requests into concrete implementations. It utilizes a three-phase loop (Diverge, Converge, Sharpen) to ensure that we are building the _right_ thing before we worry about building it _right_. This skill acts as the creative partner to the Engine's physical laws.

### Philosophy

- **User-Backwards**: Start with the experience, then work backwards to the technology.
- **Focus over Breadth**: Say no to 1,000 things to make the core 1 thing perfect.
- **Chesterton's Fence**: Understand existing patterns before refactoring or extending.
- **Beautiful Internals**: The logic you can't see should be as elegant as the UI you can.

## When to Use

- **Positive Triggers**: Ambiguous feature requests, "How would we...?" questions, or when designing a new narrative mechanic.
- **Conflict Triggers**: When two implementation directions seem equally valid and need stress-testing.
- **EXCLUSIONS**: Do not use for trivial tasks (CSS tweaks, bug fixes); proceed directly to implementation.

## How It Works

1. **Understand & Expand (Diverge)**: Restate the idea as a "How Might We" statement. Ask sharpening questions to define success.
2. **Evaluate & Converge**: Stress-test directions against Value, Feasibility, and Differentiation. Surface hidden assumptions.
3. **Sharpen & Ship**: Produce a concrete markdown one-pager summarizing the direction, assumptions, and MVP scope.

### Output Artifact

The final result is a markdown one-pager saved to `docs/ideas/` or the `artifacts/` directory, containing:

- **Problem Statement**: One-sentence framing.
- **Recommended Direction**: The chosen path and rationale.
- **Key Assumptions**: What we are betting is true.
- **MVP Scope**: What's in vs. What's out (The "Not Doing" list).

## Usage

```bash
# Call the skill to begin an ideation session
# "Help me refine the magic system"
# "Ideate on local-first persistent history"
```

## Present Results

Present the refined idea summary for review.

- **Evidence**: A link to the generated idea one-pager and a summary of the trade-offs made.
- **Validation**: Confirmation of the "Not Doing" list to ensure scope discipline.

## Common Rationalizations

| Agent Excuse                      | The Reality                                                         |
| :-------------------------------- | :------------------------------------------------------------------ |
| "I'll just list 20 variations."   | Quality over quantity. 5-8 well-considered ideas are more valuable. |
| "Users always want more options." | Choice is a cognitive load. Curate the single best path.            |
| "This doesn't need a spec."       | Ambiguity leads to technical debt. Refine before you slam.          |

## Red Flags

- **Yes-Machining**: Agreeing with a weak or complex idea instead of pushing back for simplicity.
- **Skipping Assumptions**: Proceeding to implementation with unvalidated bets.
- **Missing "Not Doing"**: A plan that tries to do everything is a plan for failure.

## Troubleshooting

- **Ideation Deadlock**: If the user is unsure, propose a minimal experiment (Spike) to gather data.
- **Scope Creep**: If the idea starts growing, trigger the Converge phase immediately to prune.

## Verification

- [ ] A clear "How Might We" problem statement exists.
- [ ] Target user and success criteria are explicitly defined.
- [ ] Hidden assumptions are surfaced with validation strategies.
- [ ] **Hard Evidence Recorded**: A finalized idea one-pager saved to the project documentation.
