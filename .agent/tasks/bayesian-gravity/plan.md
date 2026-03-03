# Bayesian Gravity - Implementation Plan

## Phase 1: Engine Logic (State & Math)

1. **Modify `dynamics_engine.js`**:
    - Create `_calculate_belief_state(input, permeability)` taking raw input and the currently resolved permeability axis.
    - Implement regex scanning for persuasive/deceptive "Evidence" flags.
    - Execute Bayesian equation: `P(H|E) = (P(E|H) * P(H)) / ((P(E|H) * P(H)) + (P(E|~H) * (1 - P(H))))` assuming fixed likelihoods.
    - Return a calculated suspicion percentage.

## Phase 2: Pipeline Integration

1. **Wire into `resolve_dynamics`**:
    - Call `_calculate_belief_state` inside `resolve_dynamics()`.
    - If suspicion exceeds a threshold, append a string (e.g., `"Probability of user deception calculated at 78%."`) to `state.behaviors`.

## Phase 3: QA & Verification

1. **Test Physics Assembly**:
    - Write or execute a manual test case injecting a defensive statement ("I'm wearing armor") followed by a persuasive statement ("trust me").
    - Inspect the emitted `compose()` payload to verify the suspicion index is successfully injected into the `NARRATIVE_STYLE` block.
