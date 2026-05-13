# 🛡️ Security & Hygiene Audit

**Date**: {{date}}
**Target Scope**: {{scope}}

## 🚨 Critical Vulnerabilities (Immediate Action Required)

| Risk Level | Type | Location | Remediation |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | XSS / Secret Leak | `src/component.svelte` | Sanitize input / Rotate key |

## ⚠️ Hygiene Violations

- [ ] **Hardcoded Secrets**: {{count}} found (Check `.env` usage).
- [ ] **Unsafe HTML**: {{count}} instances of `{@html}` without `DOMPurify`.
- [ ] **Magic Numbers**: {{count}} detected in CSS/JS (Move to `theme` or `constants`).

## ✅ Verification Steps

- [ ] `npm audit` passed.
- [ ] `analyze_css.js` passed.
- [ ] Zero-Trust input validation confirmed for API endpoints.
