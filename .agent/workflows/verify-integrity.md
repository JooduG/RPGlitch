---
description: Security Audit: Verifies the "Freedom Protocol" anti-censorship layer, scans for unsafe innerHTML usage, and validates build artifact integrity.
---

# 🛡️ Integrity & Security Audit

This workflow performs a deep scan of the codebase to verify critical security and stability layers.

**Trigger:** User says "Audit", "Security Check", "Verify Integrity", or "Check Safety".

## 1. The Freedom Protocol Check (Client-Side Stability)

We must ensure the platform cannot overwrite user preferences.

1. **Scan Target:** `apps/*/js/index.js`
2. **Verify Logic:**
   - Search for the specific IIFE that overrides `localStorage.setItem`.
   - _Pattern:_ `Storage.prototype.setItem = function` AND `okayToShowNSFWUntil`.
   - **CRITICAL:** If this logic is missing or commented out, **FLAG IT** immediately as a "Critical Stability Failure".

## 2. The DOMPurify Scan (XSS Prevention)

We operate on a Zero-Trust model for content injection.

1. **Scan Target:** All `.js` files in `apps/`.
2. **Verify Logic:**
   - Search for string `innerHTML =`.
   - _Constraint:_ Every instance of `innerHTML =` MUST be preceded by `DOMPurify.sanitize(`.
   - _Exception:_ Hardcoded string literals (e.g., `el.innerHTML = '<div></div>'`) are acceptable but discouraged.
   - **Action:** List any file and line number where dynamic variables are assigned to `innerHTML` without sanitization.

## 3. Artifact Validation

Ensure the build system isn't producing "Ghost Files".

1. **Execute Validation:**
   - Command:
     // turbo
     `npm run validate`
   - _Goal:_ Checks that build output files exist and have non-zero size.

## 4. Audit Report

Output a structured report:

> **🛡️ Security Audit Report**
>
> - **Freedom Protocol:** [✅ Active / ❌ MISSING]
> - **XSS Vulnerabilities:** [✅ None / ⚠️ Found at: ...]
> - **Build Integrity:** [✅ Valid / ❌ Invalid]
>
> _Recommendation:_ [Summary of next steps if issues found]
