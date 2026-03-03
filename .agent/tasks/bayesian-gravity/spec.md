# Bayesian Gravity (NPC Logic Upgrade) - Specification

## 1. Vision Alignment

This feature upgrades the "Physics" of the simulation by providing mathematical rigor to the Artificial Intelligence (NPCs). By implementing a Bayesian framework, we migrate NPCs from reactive keyword-matchers to entities with a "Theory of Mind," calculating probabilistic deception based on their character priors (Permeability).

## 2. Core Mechanics (The "What")

- **Priors `P(H)`**: The existing `permeability` axis defines the prior probability that an NPC trusts the user. Low permeability = Low baseline trust.
- **Evidence `P(E|H)`**: Specific input triggers (e.g., words like "promise", "swear", "truth") act as persuasive evidence.
- **Posterior `P(H|E)`**: When evidence is presented, the engine updates its belief state mathematically.
- **Manifestation**: The final calculated probability of deception (Suspicion) is injected into the LLM system prompt via the Narrative Style tag.

## 3. Success Criteria (Definition of Done)

- [ ] `dynamics_engine.js` contains a Bayesian calculator loop.
- [ ] 'Permeability' axis successfully acts as the mathematical Prior `P(H)`.
- [ ] `prompt_builder.js` receives the calculated Bayesian output in the `active_signals`.
- [ ] The engine executes these calculations purely in Vanilla JS without performance regressions.
