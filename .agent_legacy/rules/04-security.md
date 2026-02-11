---
trigger: always_on
---

# 🛡️ 04: Security & Freedom Protocols (The Shield)

> **The Shield:** Protecting user agency and system integrity in a hostile environment.

## 1. The Freedom Protocol (Client-Side Stability)

### 🛑 The Passive Shield (Storage Override)

- **Mandate:** **DO NOT REMOVE** the protection layer in [bootstrap.js](../../src/core/session/bootstrap.js).
- **Function:** Intercepts storage calls to block "penalty flags" and purges them on boot.

## 2. Zero-Trust Content Injection

- **Rule:** `innerHTML` is strictly forbidden unless passed through the Sanitizer.
- **Sanitizer**: Use `DOMPurify.sanitize(input, { RETURN_DOM_FRAGMENT: false })`.

## 3. Defense-in-Depth (Protocol)

**Validate at EVERY layer data passes through.**

- **Layer 1 (Entry)**: Reject obviously invalid input at API boundary.
- **Layer 2 (Business)**: Ensure data makes sense for this operation.
- **Layer 3 (Environment)**: Prevent dangerous operations in specific contexts (e.g., git init in source).
- **Layer 4 (Debug)**: Capture context (stack traces) for forensics.

## 5. Secret Management

- **Rule:** **NO SECRETS** in the client bundle.
- **Deny List**: NEVER read or display `.env`, SSH keys, or files with `_SECRET`, `_KEY`, or `_TOKEN`.

## 6. Dependency Integrity

- **Rule**: "Trust but Verify".
- **Tool**: `npm audit`.
- **Protocol**:
    1. Before adding: Research the package for maintenance status and known issues.
    2. After adding: Run `npm audit` to check for vulnerabilities.

---

**Next:** Security requires a clean environment. See [05: Hygiene](./05-hygiene.md).
