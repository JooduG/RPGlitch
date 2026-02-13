---
name: security
description: The Shield. Enforces Zero-Trust security, strict hygiene (no console.log), and rune safety.
---

# 🛡️ Skill: Security (The Shield)

> **Tool Interface**: A rigorous security auditor that enforces Zero-Trust principles, code hygiene, and reactivity safety.

## 1. Triggers

- **Audit**: "Audit security", "Run security check", "Check for vulnerabilities".
- **Secrets**: "Check for secrets", "Scan for API keys".
- **Sanitization**: "Sanitize input", "Check XSS vulnerability".
- **Review**: "Pre-commit check", "Review for safety".
- **Consultation**: "Is this code secure?", "Check these dependencies".
- **Context Priming**: "Context: [Security]"

## 2. Rules

### 🔒 Zero-Trust

- **Treat all user input as hostile.** Never trust data from the client, URL parameters, or external APIs without validation/sanitization.
- **Principle of Least Privilege.** Components and functions should only have access to the data they strictly need.

### 🧹 Hygiene

- **No `console.log` in production.** Use structured logging or remove debug statements before merging.
- **No secrets in client bundles.** API keys, tokens, and credentials must never appear in client-side code (`src/`).
- **Strict Dependencies.** Regularly audit `package.json` for vulnerabilities.

### ⚡ Rune Safety

- **Strict Side-Effects.** `$effect` should be used sparingly and carefully. Avoid state mutations inside `$derived`.
- **Reactive Ownership.** Ensure clear ownership of state mutations to prevent infinite loops and race conditions.

## 3. Capabilities

### 🛡️ The Shield

- **Secret Detection**:
    - Scans files for high-entropy strings (potential API keys, tokens).
    - Verifies `.env` files aregit-ignored and no secrets are leaked in code.
- **Dependency Auditing**:
    - Runs `npm audit` to identify known vulnerabilities in dependencies.
- **Input Sanitization**:
    - Enforces usage of `DOMPurify` (or equivalent) for any HTML injection.
    - Flags direct usage of `innerHTML` or `{@html ...}` without sanitization.
- **Code Hygiene**:
    - Detects `console.log`, `alert()`, and `debugger` statements.
    - Enforces `eslint-plugin-svelte` security rules.

## 4. Anti-Patterns

| Pattern                     | Mitigation                                                                       |
| :-------------------------- | :------------------------------------------------------------------------------- |
| **`innerHTML` / `{@html}`** | **Forbidden** without `DOMPurify.sanitize()`. potential XSS vector.              |
| **Secrets in Code**         | **Forbidden**. Use environment variables (`.env`) and server-side loading.       |
| **`console.log`**           | **Forbidden** in production code. Use a logger or remove.                        |
| **Unsafe `$effect`**        | **Avoid**. Side-effects in `$derived` or uncontrolled `$effect` can cause loops. |
| **Broad Permissions**       | **Avoid**. Don't expose entire objects when only a field is needed.              |

## 5. Tools

- **`scripts/security-scan.js`** (Proposed):
    - Automates the "Shield" checks: secrets, audit, and hygiene.
