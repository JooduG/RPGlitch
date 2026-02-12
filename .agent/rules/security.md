---
description: Critical security rules regarding DOM Purification, Event Injection, and State Validation.
---

# 🛡️ Security Rules

## 1. DOM Purification & Input Sanitization

- **Rule**: NEVER use `{@html ...}` with raw, unsanitized input.
- **Requirement**: specific `DOMPurify.sanitize()` or an equivalent robust sanitizer must be used immediately before rendering any HTML string.
- **Prohibited**: passing `user_content` directly to `{@html}`.
- **Context**: The client is hostile territory. Trust nothing entering from the network.

## 2. Event Injection & Handler Safety

- **Rule**: Do not execute strings as code (no `eval`, `new Function`, or `setTimeout` with string arguments).
- **Requirement**: Event handlers must be static functions or strictly typed closures.
- **Validation**: Ensure all event data payloads are validated against a schema before processing.

## 3. State Validation & Zero-Trust Data

- **Rule**: Never trust external data (API responses, URL params, localStorage) to match TypeScript interfaces at runtime.
- **Requirement**: Use **Zod** or **Valibot** to parse and validate all incoming data at the boundary.
- **Prohibited**: `as User` type assertions on network responses.
- **State Isolation**:
    - `$state` objects should be treated as immutable where possible.
    - SSR Session data must be vetted to ensure no cross-request leakage (do not store user data in global module scope).
    - Limit scope of state to the smallest necessary component or module.
