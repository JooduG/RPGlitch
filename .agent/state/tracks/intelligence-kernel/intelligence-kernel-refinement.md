# PLAN: Intelligence Kernel Refinement & Hygiene

The Intelligence Kernel is functional but requires nomenclature alignment (Two-Realm Standard) and strict type resolution to clear `svelte-check` diagnostics permanently. This plan executes a system-wide rename and strict parameter passing.

## Track: Nomenclature & Hygiene

- [x] Rename `IntelligenceService.js` to `IntelligenceKernel.js`.
- [x] Ensure `LlmService.js` is correctly isolated.
- [x] Rename `vector_engine.js` to `VectorEngine.js`.
- [x] Update all internal imports in `@core/intelligence/**`.
- [x] Audit `LlmService.generate` JSDoc to accurately reflect payload expectations.
- [x] Refactor `IntelligenceKernel.executeTurn` to pass parameters in a way that satisfies `svelte-check`.

## Track: Verification & Stability

- [x] Update `IntelligenceKernel.test.js` to import and test the kernel.
- [x] Ensure `vi.mocked` is used consistently across all intelligence tests.
- [x] Run `npm run verify` to confirm 0 errors.

## Track: The Goal

- [ ] Successful `npm run deploy` (verification + build + perchance).
