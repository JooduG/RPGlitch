---
description: Deployment Protocol
---

# 🚀 Ship Protocol

**Trigger:** "Deploy", "Ship it", "Release", or `npm run deploy`.

## Phase 1: The Gatekeeper (@Auditor)

1.  **Verify:** Run `npm run verify` in the terminal.
    - **CRITICAL:** If this command fails, the workflow **MUST STOP IMMEDIATELY**. Do not proceed to the build phase.

## Phase 2: The Build (@Builder)

1.  **Execute:** Run `npm run build`.

## Phase 3: The Log (@Architect)

1.  **Track:** Update `.agent/tasks/tracks.md`.
    - Add a bullet point under `## ✅ Done`:
        - `[x] 🚀 Deployed: [YYYY-MM-DD HH:MM]`
