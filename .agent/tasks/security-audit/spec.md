# Specification: Security Audit (Warden Protocol)

## 1. Overview

This track ensures the application maintains its "Freedom Protocol" against platform-side restrictions and verifies that no sensitive data or legacy terminology remains in the codebase.

## 2. Functional Requirements

- **Freedom Protocol Verification**:
    - Confirm `src/gamemaster/bootstrap.js` correctly intercepts `localStorage.setItem` to block restrictive flags.
    - Confirm active purging of existing penalty flags on boot.
- **Secret Audit**:
    - Scan for `.env` files or hardcoded keys in the repository.
    - Ensure sensitive files are in `.gitignore`.
- **Terminology Alignment**:
    - Verify that "Conductor" (legacy term) has been fully replaced by "Gamemaster" in all documentation and UI logs.
- **Sanitization Check**:
    - Search for usages of `innerHTML` and verify they are wrapped in `DOMPurify.sanitize`.

## 3. Non-Functional Requirements

- **Zero Exposure**: No private keys or secrets in the commit history.
- **Resilience**: The platform shield must be robust against common tracking keys.

## accept_criteria

- [ ] `bootstrap.js` protection layer is confirmed active.
- [ ] 0 exposed secrets found.
- [ ] 0 "Conductor" references remain.
- [ ] All `innerHTML` sources are sanitized.
