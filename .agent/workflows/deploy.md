---
description: Automated pipeline. Syncs config, builds the Monolith, verifies artifacts, and generates Copy-Paste instructions.
---

# 🚀 Deployment Workflow

> **Goal:** Build the Single File Monolith (`RPGlitch.html`) and prepare for Perchance upload.

## Phase 1: Pre-Flight Checks

1. **Sync Configuration:**

   ```bash
   // turbo
   npm run sync
   ```

2. **Validate Integrity:**
   - Ensure no "Toxic" `innerHTML` or missing "Freedom Protocol" locks.

   ```bash
   // turbo
   npm run validate
   ```

   - **CRITICAL:** If validation fails, **ABORT**.

## Phase 2: The Build

1. **Compile Monolith:**

   ```bash
   // turbo
   npm run build
   ```

   - _Note:_ This runs `esbuild` to stick everything into `dist/`.

2. **Verify Artifacts:**
   - Check `dist/RPGlitch.html` exists and is > 0 bytes.

## Phase 3: The Handoff

Antigravity cannot access the browser, so you serve the bridge.

1. **Generate Instructions:**
   - Output the following box:

   > **✅ Build Complete.**
   >
   > **1. Left Panel (Engine):** Copy `src/RPGlitch-left-panel.txt` -> **Perchance Lists Panel**.
   > **2. Right Panel (Stage):** Copy `dist/RPGlitch.html` -> **Perchance HTML Panel**.
   >
   > _"If it looks real, it is real."_
