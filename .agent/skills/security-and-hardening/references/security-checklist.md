# Security Checklist: The Sovereign Audit

Quick reference for simulation engine security. Use alongside the `security-and-hardening` skill.

## 🔬 Table of Contents

- [Pre-Commit Checks (The Janitor Phase)](#pre-commit-checks-the-janitor-phase)
- [Input & Narrative Integrity](#input--narrative-integrity)
- [Access Control & Permission Runes](#access-control--permission-runes)
- [Data Protection (Dexie.js)](#data-protection-dexiejs)
- [Build & Distribution (Perchance Logic)](#build--distribution-perchance-logic)
- [Dependency & Lifecycle Security](#dependency--lifecycle-security)
- [Simulation Error Handling](#simulation-error-handling)
- [OWASP Top 10: Simulation Context](#owasp-top-10-simulation-context)

---

## Pre-Commit Checks (The Janitor Phase)

- [ ] **No Secrets**: Zero passwords, API keys, or tokens in source code.
- [ ] **Git Hygiene**: `.gitignore` covers local environment state.
- [ ] **Nomenclature**: All files and folders follow the Rule 05 kebab-case standard.
- [ ] **Janitor Protocol**: `bash .agent/skills/security-and-hardening/scripts/janitor.js` returns green.

---

## Input & Narrative Integrity

- [ ] **Sanitization Boundary**: Every `{@html}` render in Svelte 5 is wrapped in `DOMPurify.sanitize()`.
- [ ] **Schema Validation**: All payloads entering the engine from the UI or Kernel are validated via Zod.
- [ ] **Prop Validation**: All Svelte components use `$props` with explicit typing or runtime guards.
- [ ] **Narrative Grounding**: Behavioral X-Ray confirms zero out-of-character (/OOC) leakage in AI turns.

---

## Access Control & Permission Runes

- [ ] **Rune Integrity**: Global engine runes ($state) are not directly bound to raw user inputs.
- [ ] **Permission Gates**: Every state-mutating operation checks if the active entity has simulation authority.
- [ ] **Persona Isolation**: The narrator/AI turns cannot bypass user-defined lock states.
- [ ] **UI Locking**: The engine state correctly toggles `ui_locked` during high-intensity kernel generation.

---

## Data Protection (Dexie.js)

- [ ] **Query Safety**: Dexie.js calls use parameterized keys (no manual string concatenation for indexes).
- [ ] **Memory Isolation**: Fresh, isolated database instances used during Proving Grounds (Vitest) tests.
- [ ] **PII Disposal**: Sensitive persona metadata is cleared upon simulation swap.
- [ ] **Storage Safety**: No reliance on `localStorage` for engine-critical state.

---

## Build & Distribution (Perchance Logic)

- [ ] **ESM Purity**: All external modules imported via verified `esm.sh` CDN links.
- [ ] **CSS Sovereignty**: No third-party remote CSS; all styles are local to the Nordic Regime.
- [ ] **Manifest Safety**: Simulation manifest follows the Zero-Trust configuration.

---

## Dependency & Lifecycle Security

- [ ] **npm audit**: `npm audit` shows zero critical or high vulnerabilities.
- [ ] **Lifecycle Guards**: Zero `$state` mutations inside `$effect` loops without conditional exits.
- [ ] **Rune Leakage**: Internal component runes are not leaked to global scope via `window`.

---

## Simulation Error Handling

Never expose engine internals to the user persona.

```javascript
// 🟢 GOOD: Sovereign Error Handing
if (engine_failure) {
  triggerFallout('simulation-desync'); 
  logger.critical("Engine Failure", { trace: err.stack });
}

// 🔴 NEVER: Exposing internals to UI
renderHTML(`<div>Error: ${err.message} <pre>${err.stack}</pre></div>`);
```

---

## OWASP Top 10: Simulation Context

| # | Vulnerability | Sovereign Prevention |
|:--- |:--- |:--- |
| **1** | **Broken Access Control** | Permission-aware Runes gated by round-state. |
| **2** | **Cryptographic Failures** | Secure token handling for Intelligence Kernel keys. |
| **3** | **Injection** | 100% `DOMPurify` mandate for all dynamic HTML rendering. |
| **4** | **Insecure Design** | Spec-driven development (Rule 01) before coding. |
| **5** | **Security Misconfiguration** | Zero-Trust Svelte manifest and ESM-only imports. |
| **6** | **Vulnerable Components** | Mandatory `npm audit` on every release checkpoint. |
| **7** | **Auth Failures** | Strict entity-persona parity in IndexedDB lookups. |
| **8** | **Data Integrity Failures** | Blockchain-style 'Echo' (History) verification. |
| **9** | **Logging Failures** | Forensic logging of all critical engine state shifts. |
| **10** | **SSRF** | Strict allowlist for Intelligence Kernel API endpoints. |

## ✅ Final Safety Gate

- [ ] zero "SQL", "Prisma", or "Express" leakage in current blueprint.
- [ ] All character corruption (``) remediated.
- [ ] Behavioral X-Ray confirms system integrity.
