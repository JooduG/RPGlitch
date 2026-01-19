---
trigger: always_on
---

# 🛡️ Security & Freedom Protocols

> **The Shield:** Protecting user agency and system integrity in a hostile environment.

## 1. The Freedom Protocol (Client-Side Stability)

The application implements a "Client-Side Stability Layer" to ensure uninterrupted operation. This logic is critical for preventing platform-side censorship or data eviction.

### 🛑 The Passive Shield (Storage Override)

- **Location:** `src/gamemaster/bootstrap.js`
- **Mandate:** **DO NOT REMOVE**. This intercepts `localStorage` to protect user choices.
- **Function:**
  - **Locks:** Prevents writing of known "penalty flags".
  - **Purges:** Actively clears these flags on boot to ensure a clean slate.

### 💓 The Active Pulse

- **Concept:** Before every critical API call, the system re-asserts its freedom.
- **Mechanism:** Clears penalty flags immediately before request execution to prevent race conditions.

## 2. Zero-Trust Content Injection

The codebase operates on a "Zero-Trust" model for all rendered HTML.

### ☣️ The Toxic Zone: `innerHTML`

- **Rule:** `innerHTML` is strictly forbidden unless passed through the Sanitizer.
- **Mandate:** usage of `@html` or `innerHTML` without sanitization is **Build-Breaking**.

### 🧼 The Sanitizer: `DOMPurify`

- **Library:** `DOMPurify` (Bundled).
- **Standard:** `DOMPurify.sanitize(input, { RETURN_DOM_FRAGMENT: false })`
- **Scope:** All AI-generated text, user inputs, and markdown renderings.

## 3. Asset & Network Policy

We adhere to a "Local-First, Cloud-Augmented" hybrid model.

### 📦 Bundling Strategy

- **Core:** All dependencies (`Dexie`, `Pico`, `DOMPurify`) are **Bundled via Vite**.
- **Constraint:** No external `<script>` tags in the final `dist/index.html`. Everything must be inlined.

### 🖼️ Media Strategy

- **Native Generation:** Preferred. Images should be generated locally or via trusted APIs.
- **Sanitization:** All SVGs must be sanitized to prevent XSS.
- **Validation:** URLs must be strictly validated (`http/https`) before rendering.

## 4. Secret Management

### 🗝️ Client-Side Hygiene

- **Strict Rule:** **NO SECRETS** in the client bundle.
- **Protocol:** API keys for external services (if any) must be user-provided or handled via a secure proxy, never hardcoded.
- **Build Tools:** Use `.env` only for local build scripts (`tools/`).

### 🛡️ Agent Defense (Deny List)

To mitigate Prompt Injection and Data Exfiltration vectors, the following rules apply to all AI Agents:

- **File Deny List:** Agents are strictly forbidden from reading or displaying the contents of the following files:
  - `.env`
  - `id_rsa`, `id_ed25519` (and any SSH keys)
  - `kubeconfig`
  - `credentials.json`
  - Any files containing `_SECRET`, `_KEY`, or `_TOKEN` in their name (heuristic block).
- **Network Allow List:** Outbound requests from agents must be restricted to verified domains (e.g., `github.com`, `perchance.org`, `npmjs.com`). Unrecognized IP addresses or domains are blocked by default.
- **Credential Protocol:** sensitive credentials (like `GEMINI_API_KEY`) must be injected into the agent's environment as variables that the agent can **use** (e.g., via tool calls) but **cannot read or print** in its own output or thought process.
