---
description: Standard Quality Gate. Verifies UI state, console errors, and critical paths before any merge or handover.
constraints:
    - "MUST adopt the Warden Persona."
---

# 🚦 Verify Protocol

> **Goal:** Ensure the "Immutable Laws" of the UI (Title, Root Mount, No Console Errors) are intact.

## 1. The Pre-Flight Check

1.  **State**: Ensure the development server is running (`npm run dev`).
2.  **Scope**: Identify the feature or component being verified.

## 2. Automated Verification

1.  **Execute**: Run the Warden's verification eye.
    ```bash
    node .agent/skills/warden/scripts/warden.js verify
    ```
2.  **Criteria**:
    - **Title**: Must be non-empty.
    - **Mount**: `#app` must exist.
    - **Hygiene**: Zero console errors.

## 3. Manual Holodeck (Optional)

If the automated check passes, perform a quick manual sanity check:

1.  **Load**: Open the app in the browser.
2.  **Interact**: Click the primary interaction point of the feature.
3.  **Observe**: Does it crash? Does it look like the "Chalk Regime"?

## 4. The Seal

- **Success**: If all green, proceed to `walkthrough.md`.
- **Failure**: Trigger [Nope Protocol](../warden/nope.md).
