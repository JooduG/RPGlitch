# PLAN: Intelligence Kernel Refinement & Hygiene

The Intelligence Kernel is functional but requires nomenclature alignment (Two-Realm Standard) and strict type resolution to clear `svelte-check` diagnostics permanently. This plan executes a system-wide rename and strict parameter passing.

## Track: Nomenclature & Hygiene

- [ ] Rename `intelligence_service.js` to `LlmService.js`.
- [ ] Rename `vector_engine.js` to `VectorEngine.js`.
- [ ] Update all internal imports in `@core/intelligence/**`.
- [ ] Audit `LlmService.generate` JSDoc to accurately reflect payload expectations.
- [ ] Refactor `IntelligenceService.executeTurn` to pass parameters in a way that satisfies `svelte-check`.

## Track: Verification & Stability

- [ ] Update `IntelligenceService.test.js` to import from `LlmService.js`.
- [ ] Ensure `vi.mocked` is used consistently across all intelligence tests.
- [ ] Run `npm run verify` to confirm 0 errors.

## Track: The Goal

- [ ] Successful `npm run deploy` (verification + build + perchance).
