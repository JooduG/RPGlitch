# Plan: Prompt Intelligence Reconstruction

## Phase 1: Blueprint Alignment

- [x] Audit `ENTITY_SCHEMA` in `schema.js`. [checkpoint: `ed9d0265`]
- [x] Ensure clear separation between `eternal`, `past`, and `temporal` fields. [checkpoint: `ed9d0265`]
- [x] Verify `FIELD_REGISTRY` consistency. [checkpoint: `ed9d0265`]

## Phase 2: Kernel Optimization

- [ ] Refactor `context.js` prompts for brevity.
- [ ] Implement strict `Literalism Protocol` enforcement in system prompts.
- [ ] Modularize `Screenplay` Kernels.

## Phase 3: Assembly Refactor

- [ ] Review `ContextBroker` payload assembly in `broker.js`.
- [ ] Optimize `LexicalFilter` for better context sorting.
- [ ] Validate `DiegeticFilter` effectiveness.

## Phase 4: Gateway Hardening

- [ ] Audit `LlmService` (service.js) for unified enhancement routing.
- [ ] Ensure robust error handling and token management.

## Phase 5: Pipeline Integration

- [ ] Verify `VisualsService` (image-generation.js) polish logic.
- [ ] Ensure `EchoService` (echo.js) summarization accuracy.

## Phase 6: Orchestration Validation

- [ ] Verify `Engine` (engine.js) consolidation loop.
- [ ] Perform end-to-end integration tests.
