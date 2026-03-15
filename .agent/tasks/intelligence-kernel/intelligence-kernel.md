# TRACK: Intelligence Kernel

## The Spec

Refine and integrate the core intelligence components (`ContextBroker`, `PromptBuilder`, `VectorEngine`) into a cohesive simulation loop. Ensure high-fidelity context hydration and precise prompt synthesis.

## Active Plan

- [x] Analyze `entity_fragments.js` and the `ENTITY_CATALOG` structure.
- [x] Document `VectorEngine.js` scoring and formatting logic.
- [x] Create integration test/harness for `ContextBroker` -> `PromptBuilder` flow.
- [x] Refine `SYSTEM_PROMPTS` in `PromptBuilder.js` for "Simulation" mode.
- [x] Implement `IntelligenceKernel.js` to bridge the kernel with the Narrative Director.
- [x] Verify Svelte 5 Rune compliance in all kernel modules. (Verified: Logic is pure IO or uses runtime $state)
