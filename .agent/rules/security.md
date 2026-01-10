---
trigger: always_on
---

# 🛡️ Security & Freedom Protocols

> **The Shield:** Protecting user agency and system integrity in a hostile environment.

---

## 1. The Freedom Protocol (Client-Side Stability)

The application implements a "Client-Side Stability Layer" to ensure uninterrupted operation. This logic is critical for preventing platform-side censorship or data eviction.

### 🛑 The Passive Shield (Storage Override)

- **Location:** `src/js/gamemaster/bootstrap.js`
- **Mandate:** **DO NOT REMOVE**. This intercepts `localStorage` to protect user choices.
- **Function:**
  - **Locks:** Prevents writing of known "penalty flags" (e.g., specific censorship tokens).
  - **Purges:** Actively clears these flags on boot to ensure a clean slate.

### 💓 The Active Pulse

- **Concept:** Before every critical API call, the system re-asserts its freedom.
- **Mechanism:** Clears penalty flags immediately before request execution to prevent race conditions.

---

## 2. Zero-Trust Content Injection

The codebase operates on a "Zero-Trust" model for all rendered HTML.

### ☣️ The Toxic Zone: `innerHTML`

- **Rule:** `innerHTML` is strictly forbidden unless passed through the Sanitizer.
- **Mandate:** usage of `element.innerHTML = rawString` is **Build-Breaking**.

### 🧼 The Sanitizer: `DOMPurify`

- **Location:** `src/js/warden/security.js`
- **Standard:** `DOMPurify.sanitize(input, { RETURN_DOM_FRAGMENT: true })`
- **Scope:** All AI-generated text, user inputs, and markdown renderings.

---

## 3. Asset & Network Policy

We adhere to a "Local-First, Cloud-Augmented" hybrid model.

### 📦 Dependencies

- **Core:** Vendor critical libraries (`Dexie`, `Pico`, `DOMPurify`) in `libs/` to ensure offline resilience.
- **Dev:** External MCP calls and Docs are authorized.

### 🖼️ Media Strategy

- **Native Generation:** Preferred. Images should be generated locally or via trusted APIs.
- **Sanitization:** All SVGs must be sanitized to prevent XSS.
- **Validation:** URLs must be strictly validated (`http/https`) before rendering.

---

## 4. Secret Management

### 🗝️ Client-Side hygiene

- **Strict Rule:** **NO SECRETS** in the client bundle.
- **Protocol:** API keys for external services (if any) must be user-provided or handled via a secure proxy, never hardcoded.
- **Build Tools:** Use `.env` only for local build scripts (`tools/`).
