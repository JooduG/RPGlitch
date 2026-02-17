---
name: quality-assurance
version: 1.0.0
description: >
    Technical manual for testing, security, and compliance.
    Triggers:
    - "Run tests"
    - "Audit code"
    - "Security scan"
    - "scripts/**"
    - "Context: [Quality Assurance]"
---

# 🛡️ Quality Assurance

> **Standard**: Ensures all logic is compliant, secure, and verified before merging.

## 1. Quality Assurance

### Unit Testing (Vitest Browser Mode)

- **Command**: `npm run test:unit`
- **Location**: `scripts/` (Flattened).
- **Requirement**: Must use `vitest-browser-svelte` for true Rune reactivity. JSDOM is deprecated for Svelte 5.
- **State**: Use `flushSync()` when testing external `.svelte.ts` state.

### End-to-End Testing (Playwright)

- **Command**: `npm run test:e2e`
- **Location**: `tests/e2e/`
- **Requirement**: Critical user flows must be covered by E2E tests.

## 2. Security Protocols

1.  **DOM Purification**: Verify that `{@html ...}` is never used without sanitization. Use `DOMPurify`.
2.  **Event Safety**: Ensure no event handlers use string evaluation.
3.  **State Validation**: Confirm all external data uses Zod/Valibot schemas.

## 3. Compliance Audit

### Runes Compliance (Critical)

- **Forbidden**: `export let`, `$:`, `createEventDispatcher`.
- **Requirement**: Must use Svelte 5 Runes.

### Styling Hygiene (Critical)

- **Forbidden**: Inline styles (`style="..."`), Hex colors in components.
- **Requirement**: Use SCSS and Design Tokens (`var(--color-...)`).

## 4. Remediation

If **CRITICAL ERRORS** are found during an audit:

1. List violations with line numbers.
2. Immediately refactor to the compliant pattern.
3. Build fails until resolved.

## 5. Anti-Patterns

| Pattern                                   | Mitigation                                                                      |
| :---------------------------------------- | :------------------------------------------------------------------------------ |
| **JSDOM for Svelte 5 tests**              | **Deprecated**. Use `vitest-browser-svelte` for true Rune reactivity.           |
| **Skipping `flushSync()` in state tests** | **Forbidden**. External `.svelte.ts` state requires `flushSync()` to propagate. |
| **Marking `[x]` without PASS**            | **Forbidden**. Scholar Gate: no task is done without verified test output.      |
| **Inline styles in test fixtures**        | **Avoid**. Test fixtures must follow the same SCSS/token rules as production.   |
