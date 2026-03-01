# Spec: Prompt Intelligence Reconstruction

> **Objective:** Systematically refactor and align the core intelligence pipeline with the Svelte 5 + Agentic Architecture standards.

## 🎯 Success Criteria

- [ ] **Blueprint Alignment:** `intelligence_registry.js` correctly defines all entities with clear separation of Eternal/Present/Past/Future tiers.
- [ ] **Kernel Optimization:** `intelligence_logic.js` prompts are distilled, modular, and adhere to the Literalism Protocol.
- [ ] **Assembly Refactor:** `intelligence_broker.js` payload assembly is high-fidelity and uses the Lexical Filter correctly.
- [ ] **Gateway Hardening:** `intelligence_service.js` handles all enhancement routing through a unified API.
- [ ] **Pipeline Integration:** `intelligence_echo.js` and `image_engine.js` (Visuals) are fully decoupled and context-aware.
- [ ] **Orchestration Validation:** `engine.js` and `narrative_engine.js` trigger consolidation and state transitions with zero-latency overhead.

## 🛠️ Scope

- `src/core/intelligence/intelligence_registry.js` (Schema)
- `src/core/intelligence/intelligence_logic.js` (Kernels)
- `src/core/intelligence/intelligence_broker.js` (Broker)
- `src/core/intelligence/intelligence_service.js` (LLM Service)
- `src/core/intelligence/intelligence_echo.js` (Echo)
- `src/media/image-generation.js` (VisualsFacade)
- `src/media/image_engine.js` (VisualsLogic)
- `src/core/engine/engine.js` (Simulation)
- `src/core/narrative/narrative_engine.js` (Consolidation)

## 🛡️ Constraints

- **No Hallucinations:** Strict adherence to the Literalism Protocol.
- **Runes Only:** Svelte 5 reactivity mandatory for any UI-linked state.
- **Pure IO:** Logic should be testable in isolation.
