# 🛡️ Zero-Trust UI Architecture

## Philosophy

"The client is hostile territory. Trust nothing entering from the network, and verify everything before rendering."

## 1. Contract Enforcement

- **Schema Validation**: Do not cast API responses (`as User`). Validate them using `Zod` or `Valibot`.
  - _Why?_ TypeScript types disappear at runtime. Validation ensures data shape matches expectations.
- **Fail Safe**: If data validation fails, render a "Fallout UI" (Error Boundary) rather than crashing the app.

## 2. State Isolation

- **Encapsulation**: State should live in the smallest possible scope.
- **Immutability**: Treat `$state` objects as immutable where possible to prevent side-effect pollution.

## 3. Defense Verification

- **Warden's Role**: Before merging any feature that touches `src/data` or `src/core`, run `verify_ui.js` to ensure the "Shield" has not been cracked.
