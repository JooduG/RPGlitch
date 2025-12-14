---
trigger: always_on
---

# 🛡️ Security & Safety Protocols

This document defines the **Mandatory Security Standards** for the JooduG monorepo.

## 1. Zero-Trust Content Injection

* **Rule:** `innerHTML` is **DANGEROUS** by default.
* **Mandate:** You MUST use `DOMPurify.sanitize()` for any string containing user input, AI generation, or external data before assigning it to `innerHTML`.
  * ❌ *Forbidden:* `el.innerHTML = aiResponse;`
  * ✅ *Required:* `el.innerHTML = DOMPurify.sanitize(aiResponse);`
* **Preference:** Use `textContent` or `document.createElement()` whenever formatting is not required.

## 2. The Freedom Protocol (Client-Side Stability)

Our applications run on a platform with strict content filters. We implement a **Client-Side Stability Layer** to prevent service interruptions.

* **Location:** `apps/*/js/index.js` (The IIFE at the top).
* **Mandate:** **DO NOT REMOVE or "FIX"** the code that overrides `localStorage.setItem` for specific flags (e.g., `okayToShowNSFWUntil`).
* **Reason:** This is a feature, not a bug. It prevents the platform from locking the user out of their own local data.

## 3. Dependency Security

* **Vendored Only:** We do not use CDNs. All libraries (Dexie, Pico, etc.) must be located in `build/local_libs/` and inlined during the build.
* **Reason:** Guarantees offline functionality ("Local First") and prevents supply chain attacks via CDN replacement.

## 4. Secret Management

* **No Hardcoded Secrets:** Never commit API keys, passwords, or tokens to git.
* **Development:** Use `.env` files (gitignored).
* **Production:** Perchance apps are client-side only; do not embed server-side secrets in the JS bundle.
