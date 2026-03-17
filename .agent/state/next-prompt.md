# Handoff: Dynamics Engine Refinement

The **Sovereign Temporal Refactor** is complete. All entity hydration now follows the `fragments.eternal.physical` (nested JSON) / `<ETERNAL_PHYSICAL>` (flat XML) logic.

## Next Step
Resuming the **Dynamics Engine** track.
- **Objective**: Implement personality-weighted Bayesian priors in `DynamicsEngine.js`.
- **Context**: Focus on `Personality-weighted Bayesian priors for character-specific skepticism` (Backlog #312).
- **Architecture**: The `ContextBroker` already passes `raw.dynamics` into the `IntelligencePayload` for physics calculation. Use this.

## Files
- `src/core/intelligence/DynamicsEngine.js`
- `src/core/intelligence/IntelligenceKernel.js`

Relay active.
