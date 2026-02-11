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

### OWASP Checklist

1.  **Input Sanitization**: Validate and sanitize all user inputs.
2.  **Output Encoding**: Encode data before rendering to prevent XSS.
3.  **Authentication**: Verify authentication and authorization for all protected routes.
4.  **Data Protection**: Encrypt sensitive data at rest and in transit.

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
