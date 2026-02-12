---
description: Deployment Protocol
---

# 🚀 Ship Protocol

**Trigger:** "Deploy", "Ship it", "Release", or `npm run deploy`.

## Phase 1: The Gatekeeper (@Auditor)

1.  **Verify:** Run `npm test` in the terminal.
    - **CRITICAL:** If `npm test` fails (exit code 1), the workflow **MUST ABORT IMMEDIATELY**. Do not proceed to the build phase. No deployment allowed.

## Phase 2: The Build (@Builder)

1.  **Execute:** Run `npm run build`.

## Phase 3: The Log (@Architect)

1.  **Track:** Update `.agent/tasks/tracks.md`.
    - Add a bullet point under `## ✅ Done`:
        - `[x] 🚀 Deployed: [YYYY-MM-DD HH:MM]`
