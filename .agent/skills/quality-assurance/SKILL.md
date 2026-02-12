---
name: Quality Assurance
description: Technical manual for testing and security protocols
---

# Quality Assurance Protocols

## Testing Standards

### Unit Testing (Vitest)

- **Command**: `npm run test:unit`
- **Location**: `tests/unit/` mirroring `src/` structure.
- **Framework**: Vitest
- **Requirement**: All utility functions and complex logic must have unit tests.

### End-to-End Testing (Playwright)

- **Command**: `npm run test:e2e`
- **Location**: `tests/e2e/`
- **Framework**: Playwright
- **Requirement**: Critical user flows must be covered by E2E tests.

## Security Protocols

### Security Rules Checklist

1.  **Rule Enforcement**: All code must comply with [`.agent/rules/security.md`](file:///c:/Users/johng/Documents/GitHub/default/.agent/rules/security.md).
2.  **DOM Purification**: Verify that `{@html ...}` is never used without sanitization.
3.  **Event Safety**: Ensure no event handlers use string evaluation.
4.  **State Validation**: Confirm all external data uses Zod/Valibot schemas before usage.

### Svelte-Specific Security

- **`{@html ...}` Usage**:
    - **Strictly Forbidden** without explicit sanitization.
    - **Must Use**: `DOMPurify` or equivalent library to sanitize HTML content before rendering.
    - **Flag**: Any raw `{@html ...}` usage must be flagged as a critical security vulnerability.

## Code Review Checklist

- [ ] Follows `00-global-standards.md`?
- [ ] No console logs or debug code?
- [ ] Types are strictly defined (no `any`)?
- [ ] Tests pass?
- [ ] No hardcoded secrets?
