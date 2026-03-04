# Intelligence & Engine Architecture Reconstruction v2

## Objective

Deconstruct the 10 core intelligence and engine files to first principles, then synthesize a superior, unified architecture with cleaner module boundaries, reduced coupling, and evaluation of `.svelte.js` reactive modules where appropriate.

## Scope — 10 Source Files (1,993 LOC)

| File                      | Lines | Role                                  |
| :------------------------ | ----: | :------------------------------------ |
| `ContextBroker.js`        |   270 | State hydration → IntelligencePayload |
| `DynamicsEngine.js`       |   410 | NPC psychological physics             |
| `PromptBuilder.js`        |   390 | XML prompt synthesis                  |
| `intelligence_service.js` |   179 | LLM transport layer                   |
| `vector_engine.js`        |   192 | Temporal memory RAG                   |
| `intelligence_echo.js`    |    89 | Memory consolidation                  |
| `entity_fragments.js`     |   151 | Entity schema registry                |
| `engine.js`               |   222 | Orchestrator                          |
| `chrono.js`               |   102 | Turn controller                       |
| `config.js`               |   180 | Constants registry                    |

## Acceptance Criteria

1. All existing unit tests pass (`npm run test:unit`).
2. Every module has a single clear responsibility (SRP).
3. Circular or tangled import chains are eliminated.
4. Where a module manages reactive Svelte state (e.g. runtime integration), evaluate `.svelte.js` extension.
5. The `engine.js` orchestrator stays lean — no business logic, only coordination.
6. The plan preserves all external consumers (UI imports, media imports, state imports).
7. File naming follows project nomenclature: `PascalCase` for blueprints, `snake_case` for processes.
