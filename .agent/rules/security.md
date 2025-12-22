---
trigger: always_on
---

# 🛡️ Security & Freedom Protocols

## 1. Zero-Trust Content Injection

- **Rule:** `innerHTML` is **DANGEROUS**.
- **Mandate:** `DOMPurify.sanitize(input)` is REQUIRED for all user/AI content.

## 2. The Freedom Protocol (Client-Side Stability)

- **Location:** `apps/*/js/index.js`
- **Mandate:** **DO NOT REMOVE** the `localStorage` overrides. This protects user data from platform eviction.

## 3. Asset & Network Policy (Updated)

- **Hybrid Model:** We prefer "Local First", but "Vibe Coding" requires cloud assets.
- **Images:**
  - **Native Gen:** Allowed. Save to `src/assets/generated/`.
  - **External (Pollinations):** Allowed if Native fails.
- **Libraries:**
  - **Core:** Continue to vendor critical libs (Dexie, Pico) in `build/local_libs/` where possible to ensure offline resilience.
  - **Dev:** External MCP calls (Context7, Docs) are fully authorized.

## 4. Secret Management

- **Strict Rule:** No server-side secrets in the client-side bundle. Use `.env` only for local build tools.
