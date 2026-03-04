# Spec: Naivety Index (NPC Trust Calibration)

## 1. Vision Alignment

Upgrades the "Physics" of the simulation by providing mathematical rigor to NPC
social intelligence. NPCs migrate from reactive keyword-matchers to entities with
a probabilistic "Theory of Mind," calculating trust scores based on their innate
naivety (the `openness` axis).

## 2. Core Mechanics

- **Naivety Prior**: The `openness` axis defines the NPC's baseline credulity.
  High openness = naive; Low openness = cold skeptic.
- **Evidence Triggers**: Persuasive input (e.g., "trust me", "I swear") acts as
  social evidence, triggering a belief-state update.
- **Posterior Output**: A trust-probability signal is appended to `state.behaviors`
  and rendered diegetically via `<NARRATIVE_STYLE>`.

## 3. Success Criteria

- [ ] `DynamicsEngine.js` contains a `_resolve_naivety(input, openness)` method.
- [ ] `openness` axis acts as the prior probability (mapped 0–100 → 0.0–1.0).
- [ ] `PromptBuilder.js` has a `NAIVETY_COGNITION` protocol entry.
- [ ] Engine executes in pure Vanilla JS with zero performance regressions.
