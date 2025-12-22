---
description: Automated pipeline. Syncs config, Lints, Tests, Builds apps, Verifies artifacts, and generates Copy-Paste instructions for Perchance deployment.
---

# 🚀 Deployment Workflow

This workflow automates the build, test, and verification pipeline for Perchance deployment.

## 1. Quality Assurance (The Gatekeepers)

Before generating artifacts, we must ensure the codebase is healthy.

1. **Sync Configuration:**
   - Command:
     // turbo
     `npm run sync`
   - _Goal:_ Ensure all configs and ignore files are up to date.
2. **Lint & Fix:**
   - Command:
     // turbo
     `npm run lint:fix`
   - _Goal:_ Auto-fix styling and JS issues.
3. **Test Suite:**
   - Command:
     // turbo
     `npm run test`
   - _Goal:_ Verify logic integrity.
   - **CRITICAL:** If tests fail, **STOP IMMEDIATELY**. Report the failure and do not proceed to build.

## 2. The Build Process

We compile the Source (`apps/*/html/`) into the Artifact (`apps/*/`).

1. **Execute Build:**
   - Command:
     // turbo
     `npm run build:apps`
   - _Goal:_ Runs `esbuild` + `sass`, bundles JS (IIFE), and inlines assets.
2. **Verify Artifacts:**
   - **Action:** Check the file statistics (size and timestamp) of:
     - `apps/rpglitch/RPGlitch.html`
     - `apps/imageglitch/imageglitch.html`
   - **Check:** Ensure files are > 0 bytes and modified within the last minute.

## 3. The Deployment Handoff

Antigravity cannot paste into the browser, so we prepare the user for the "Manual Bridge".

1. **Analyze Changes:**
   - Read `apps/rpglitch/RPGlitch-left-panel.txt`.
   - _Action:_ Briefly summarize any _new_ plugin imports or list structure changes since the last session.
2. **Instructions:**
   - Output the following final message:
     > **✅ Build Successful & Verified.**
     >
     > **1. Left Panel (Engine):** Copy content from `apps/rpglitch/RPGlitch-left-panel.txt` to the **Lists** panel.
     > **2. Right Panel (Stage):** Copy content from `apps/rpglitch/RPGlitch.html` to the **HTML** panel.
     >
     > _Don't forget to save and refresh!_
