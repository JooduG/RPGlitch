# Track: Remove Bayesian Naivety Mechanic

## Goal

Purge the Bayesian suspicion "Naivety" logic while merging its triggers into the `VULNERABILITY` somatic reflex. Keep the `openness` axis intact.

## Success Criteria

- [ ] Bayesian `_resolve_naivety` and its call loop removed from `DynamicsEngine.js`.
- [ ] `NAIVETY` triggers merged into `VULNERABILITY`.
- [ ] `openness` axis remains functional and named correctly.
- [ ] `npm run test` passes.

## Atomic Checklist

- [ ] [ENGINE] Merge `NAIVETY` triggers into `VULNERABILITY` in `DynamicsEngine.js`.
- [ ] [ENGINE] Delete `_resolve_naivety` and its integration in `resolve_dynamics`.
- [ ] [ENGINE] Clean up signal prompts and comments.
- [ ] [TEST] Refactor `DynamicsEngine.test.js`.
- [ ] [VERIFY] Run tests and confirm behavior via DevWing.
