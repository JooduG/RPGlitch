---
name: 04-review
description: Reviews and stuff.
risk: low
source: AI
date_added: 2024-03-29
---

# [/04-review](./04-review.md) - Quality Review & Feedback Loop

## Objectives: Review

- Audit the implementation against the original plan.
- Ensure code quality and adherence to all Sovereign Rules.

## Context-Injection: Verification Strategy

- [Foundation](../rules/01-foundation.md)
- [Compliance](../rules/06-compliance.md)
- [SWARM](../skills/SWARM/)

## Capabilities: Peer Review

- **Manual Audit**: Codebase walking and pattern matching.
- **Automated Audit**: [Warden Audit Engine](../skills/warden/)

## Procedure

### Phase 1: Logic Verification (Step 6: Completion)

1. **Reality Matching**: Confirm that the implementation matches the approved Spec (Step 6). Verify all file paths and line numbers.
2. **Reproduction Test**: If a bug was fixed, verify that the reproduction case no longer triggers the fault.

### Phase 2: Aesthetic Audit (Step 6: Performance)

1. **Nordic Check**: Ensure all UI elements use the Nordic palette and correct border-radii (Rule 04).
2. **Reactivity Check**: Confirm Svelte 5 Runes are used correctly without legacy patterns.

### Phase 3: The Echo (Step 8: Handoff)

1. **Walkthrough**: Create a walkthrough artifact summarizing all changes and testing results. Include media markers for UI updates.
2. **Persistence**: Update the [Log Book](../orchestration/operation-logs.md) and [Mission Board](../orchestration/strategy-board.md) to close the loop.

## Anti-Patterns

- **Surface Review**: Reviewing only the UI without auditing the underlying logic.
- **Spec Drift**: Approving changes that deviate from the plan without technical justification.
- **Silent Feedback**: Failing to document issues discovered during the review phase.
