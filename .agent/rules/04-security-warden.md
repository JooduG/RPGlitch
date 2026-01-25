---
trigger: always_on
---

# 🛡️ 04: Security & Freedom Protocols

> **The Shield:** Protecting user agency and system integrity in a hostile environment.

## 1. The Freedom Protocol (Client-Side Stability)

The application implements layers of protection to ensure uninterrupted operation.

### 🛑 The Passive Shield (Storage Override)

- **Mandate:** **DO NOT REMOVE** the protection layer in `src/gamemaster/bootstrap.js`.
- **Function:** Intercepts storage calls to block "penalty flags" and purges them on boot.

### 💓 The Active Pulse

- Before critical API calls, the system explicitly clears local state of unauthorized trackers or penalty signals.

## 2. Zero-Trust Content Injection

The codebase operates on a "Zero-Trust" model for all rendered HTML.

### ☣️ The Toxic Zone: `innerHTML`

- **Rule:** `innerHTML` is strictly forbidden unless passed through the Sanitizer.
- **Mandate:** usage of `@html` or `innerHTML` without sanitization is **Build-Breaking**.

### 🧼 The Sanitizer: `DOMPurify`

- **Standard:** `DOMPurify.sanitize(input, { RETURN_DOM_FRAGMENT: false })`.
- **Scope:** All AI-generated text, user inputs, and markdown renderings.

## 3. Secret Management

- **Strict Rule:** **NO SECRETS** in the client bundle.
- **Protocol:** API keys must be user-provided or handled via secure proxy.
- **Agent Defense (Deny List):** Agents are strictly forbidden from reading or displaying `.env`, SSH keys, `credentials.json`, or any file containing `_SECRET`, `_KEY`, or `_TOKEN`.

## 4. Asset & Network Policy

- **Offline First:** No external `<script>` tags. All dependencies must be inlined via Vite.
- **URL Validation:** URLs must be strictly validated (`http/https`) before rendering.
- **Sanitization:** All SVGs must be sanitized to prevent XSS.
