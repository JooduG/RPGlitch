# Plan: Prompt Intelligence Reconstruction

## Phase 1: Blueprint Alignment

- [x] Audit `ENTITY_DEFINITION` in `intelligence_registry.js`. [checkpoint: `recon-pi-01`]
- [x] Ensure clear separation between `eternal`, `present`, `past`, and `future` fields. [checkpoint: `recon-pi-01`]
- [x] Verify `FIELD_REGISTRY` consistency in `intelligence_registry.js`. [checkpoint: `recon-pi-01`]

## Phase 2: Kernel Optimization

- [x] Refactor `intelligence_logic.js` prompts for brevity. [checkpoint: `recon-pi-02`]
- [x] Implement strict `Literalism Protocol` enforcement in system prompts. [checkpoint: `recon-pi-02`]
- [x] Modularize `Screenplay` Kernels in `intelligence_logic.js`. [checkpoint: `recon-pi-02`]

## Phase 3: Assembly Refactor

- [x] Review `PromptBuilder` payload assembly in `intelligence_broker.js` (Removed legacy file entirely, moved logic to `ContextBroker` and `PromptBuilder` classes). [checkpoint: `recon-pi-03`]
- [x] Optimize `LexicalFilter` for better context sorting (Decommissioned legacy approach in favor of strict typed fragments). [checkpoint: `recon-pi-03`]
- [x] Validate `DiegeticFilter` effectiveness (Removed legacy system). [checkpoint: `recon-pi-03`]

## Phase 4: Gateway Hardening

- [x] Audit `LlmService` (`intelligence_service.js`) for unified enhancement routing (Refactored to expect unified schema). [checkpoint: `recon-pi-03`]
- [x] Ensure robust error handling and token management (Handled by strict JSON outputs). [checkpoint: `recon-pi-03`]

## Phase 5: Pipeline Integration

- [x] Verify `ImageGeneration` (`image_engine.js`) polish logic (Re-built to use new ContextBroker hydration). [checkpoint: `recon-pi-03`]
- [x] Ensure `EchoService` (`intelligence_echo.js`) summarization accuracy (Migrated to PromptBuilder static methods). [checkpoint: `recon-pi-03`]

## Phase 6: Orchestration Validation

- [x] Verify `Engine` (`engine.js`) and `narrative_engine.js` consolidation loop. [checkpoint: `recon-pi-03`]
- [x] Perform end-to-end integration tests (Runes and type checks completely passing). [checkpoint: `recon-pi-03`]
