---
description: Security Audit. Verifies the Freedom Protocol, Anti-Censorship layers, and Zero-Trust sanitization.
---

# 🛡️ Integrity Audit

> **Goal:** Verify that specific "Immutable Laws" of the architecture are intact.

## 1. Freedom Protocol Check

- **Target:** [bootstrap.js](../../../../src/gamemaster/bootstrap.js)
- **Rule:** Ensure `localStorage` overrides are present and active.
- **Fail:** If missing, **STOP** and restore immediately.

## 2. Sanitization Scan (Zero-Trust)

- **Target:** All `.js` / `.svelte` files.
- **Rule:** `innerHTML =` or `@html` MUST be wrapped in `DOMPurify.sanitize(...)`.
- **Fail:** Any raw assignment is a **Critical Vulnerability**.

## 3. Package Audit (Sentinel)

- **Target**: `package.json`
- **Tool**: `mcp:npm-sentinel:npmVulnerabilities`
- **Rule**: Zero critical/high vulnerabilities allowed.
- **Fail**: If vulnerable, auto-fix or reject.

## 4. Report

- Output:
    > **🛡️ Security Status:**
    >
    > - Freedom Protocol: [✅ OK]
    > - Freedom Protocol: [✅ OK]
    > - Sanitization: [✅ OK]
    > - Packages: [✅ OK]
