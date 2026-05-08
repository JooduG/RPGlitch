# Mission Plan - Resolve Type & Lint Issues

This plan outlines the systematic resolution of TypeScript errors, ESLint warnings, and JSDoc mismatches identified across the RPGlitch codebase.

## 1. Research & Analysis (Complete)

- [x] Investigate `src/core/engine/chrono.svelte.js` for argument mismatches.
- [x] Analyze `src/core/intelligence/context-broker.js` for type mismatches and indexing issues.
- [x] Review `src/core/security.js` for JSDoc parameter mismatches.
- [x] Examine `src/state/app.svelte.js` for type assignment errors.
- [x] Check `src/ui/utils/field-path.js` for object indexing issues.
- [x] Identify unused variables in `.agents/skills/swarm/scripts/swarm-engine.js`.
- [x] Resolve `runtime.ai` and `runtime.fractal` null checks and indexing in `intelligence-kernel.js`.
- [x] Resolve `GenerationOptions` mismatches in `intelligence-kernel.js`.
- [x] Fix `CircuitBreaker` and `ExponentialBackoffRetryer` issues in `visual-engine.svelte.js` and `resilience.js`.
- [x] Update `types.d.ts` for plugin globals.

## 2. Implementation Strategy (Strict Typing) (Complete)

### 2.1 Core Logic & Security

- [x] **`src/core/security.js`**: Update `process` and `authorizeVisuals` function signatures.
- [x] **`src/core/engine/chrono.svelte.js`**: Verify `Shield.process` call.
- [x] **`src/core/engine/engine.js`**: Update `GenerationOptions` typedef.
- [x] **`src/media/resilience.js`**: Fix `CircuitBreaker.execute` JSDoc.

### 2.2 Intelligence & Data

- [x] **`src/core/intelligence/context-broker.js`**: Add defaults and guards.
- [x] **`src/state/runtime.svelte.js`**: Add `associated_ids` to `SimulationEntity`.
- [x] **`src/core/intelligence/intelligence-kernel.js`**: Fix dynamics indexing and `execute_turn` parameters.

### 2.3 UI & State

- [x] **`src/state/app.svelte.js`**: Narrow types and explicit `streaming` state.
- [x] **`src/ui/utils/field-path.js`**: Dynamic indexing casts.
- [x] **`src/media/visual-engine.svelte.js`**: Fix constructors, runtime paths, and unused vars.

### 2.4 Cleanup

- [x] **`.agents/skills/swarm/scripts/swarm-engine.js`**: Remove unused catch bindings.
- [x] **`types.d.ts`**: Add `pluginTextToImage` and `pluginUpload` to `Window`.

## 3. Verification & Quality Gate

- [ ] Run `npm run verify` (if available) or individual lint/type check commands.
- [ ] Verify each fix against the reported errors in the editor.
- [ ] Ensure ZERO regressions in engine logic or aesthetics (Chalk Regime).
