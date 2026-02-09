# Task: Investigate "Recursive Engine"

## Context

The user encountered the label "Recursive Engine" in the Dev Wing and expressed confusion ("wtf? I've never instructed you to do 'autonomous simulation'?").

## Objectives

1.  **Audit**: Determine what logic triggers `char.simulation.mode`.
2.  **Origin**: Trace where this feature came from (was it a hallucination or a legacy feature?).
3.  **Decision**: Propose whether to kill it, rename it, or document it properly.

## References

- `src/ui/organisms/profile/DevWing.svelte`
- `src/gamemaster/chrono.svelte.js` (Likely location of the logic loop)
