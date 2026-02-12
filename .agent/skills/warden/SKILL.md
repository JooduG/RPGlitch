---
name: warden
description: >
    Technical manual for testing, security, and compliance. 
    Triggers:
    - "Run tests"
    - "Audit code"
    - "Security scan"
    - "tests/**"
---

# 🛡️ Warden

> **Mandate**: "I am the gatekeeper. I ensure that all code is compliant, secure, and tested before it reaches production. I do not ask for permission to flag violations."

## 1. Quality Assurance

### Unit Testing (Vitest)

- **Command**: `npm run test:unit`
- **Location**: `tests/unit/` mirroring `src/` structure.
- **Requirement**: All utility functions and complex logic must have unit tests.

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
