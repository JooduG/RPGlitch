---
name: spec-driven-development
description: Creates specs before coding. Use when starting a new project, feature, or significant change and no specification exists yet. Use when requirements are unclear, ambiguous, or only exist as a vague idea.
---

# Spec-Driven Development

> "Code without a spec is guessing. Write a structured specification to define what we're building, why, and how we'll know it's done."

## Overview

The `spec-driven-development` skill is the foundation of structural integrity in the RPGlitch Engine. It ensures that every significant change is documented as a shared source of truth between the agent and the user. By defining objectives, tech stacks, and success criteria before writing code, we prevent architectural drift and ensure that the final implementation exactly matches the user's intent.

### Strategic Context

- **Intent Alignment**: Use specs to surface and validate assumptions early.
- **Success Mapping**: Translate vague requirements (e.g., "faster turn") into testable criteria (e.g., "LCP < 2.5s").
- **Gated Workflow**: Never implement until the spec, plan, and tasks are approved.

## When to Use

- **Positive Triggers**: Starting a new project/feature, making architectural decisions, or when requirements take more than 30 minutes to implement or touch multiple modules.
- **Conflict Triggers**: When a user's request is ambiguous or high-risk (Level 3 - Strategy Role).
- **EXCLUSIONS**: Do not use for single-line fixes, typos, or unambiguous self-contained tweaks.

## How It Works

1. **Specify**: Draft the high-level vision and ask clarifying questions. Surface all assumptions immediately.
2. **Plan**: Generate a technical implementation strategy based on the approved spec.
3. **Tasks**: Break the plan into discrete, implementable tasks in `tasks/plan.md`.
4. **Implement**: Execute tasks sequentially using `incremental-implementation` and `test-driven-development`.

### Spec Template

Every major feature must have a spec file (e.g., `SPEC.md` or a feature-specific doc) containing:

- **Objective**: What and why?
- **Tech Stack**: Dependencies and versions (Rule 03).
- **Commands**: Full build/test/lint commands.
- **Project Structure**: Where new files live.
- **Boundaries**: "Always do", "Ask first", and "Never do" rules.
- **Success Criteria**: Testable conditions that prove completion.

## Usage

```bash
# Initialize a new feature spec
write_to_file TargetFile="docs/specs/magic-system.md" ...

# Create the implementation plan based on the spec
# (Followed by /plan workflow)
```

## Present Results

Present the finalized spec and plan for user approval.

- **Evidence**: A link to the spec document and a summary of the success criteria.
- **Validation**: Demonstrate that all user requirements and constraints are addressed.

## Common Rationalizations

| Agent Excuse                           | The Reality                                                                           |
| :------------------------------------- | :------------------------------------------------------------------------------------ |
| "This is simple, I don't need a spec." | Even simple tasks need acceptance criteria to avoid guessing.                         |
| "I'll write the spec after I code it." | That's documentation, not specification. Specs force clarity _before_ implementation. |
| "The spec will slow us down."          | 15 minutes of specification prevents 5 hours of unverified refactoring.               |

## Red Flags

- **Silent Assumptions**: Implementing features based on unvalidated guesses about intent.
- **Spec-Implementation Drift**: Building things not mentioned in the approved spec.
- **Vague Criteria**: Success criteria like "it works well" instead of testable metrics (e.g., "< 100ms latency").

## Troubleshooting

- **Scope Creep**: If the spec grows beyond the original intent, break it into multiple tiered sub-specs.
- **Decision Paralysis**: If a technical choice is blocked, document the trade-offs and ask for a user tie-breaker.

## Verification

- [ ] The spec covers all core areas (Objective, Tech, Structure, Style, Tests, Boundaries).
- [ ] Requirements are translated into specific, testable success criteria.
- [ ] No implementation work has started without an approved spec and plan.
- [ ] **Hard Evidence Recorded**: A finalized `SPEC.md` or feature plan in the repository.
