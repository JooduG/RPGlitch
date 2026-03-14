---
description: Deployment Protocol. Safe dispatch to production.
---

# 05-deploy (The Launch)

> **Goal:** Deliver the payload. Safe, tested, and deployed to Perchance.

## 1. Triggers

- **User Request**: "Deploy", "Ship it".
- **Milestone Reached**: Feature complete and Reviewed.
- **Slash Command**: `/05-deploy`

## 2. Brain (Context Injection)

- **Package**: `package.json`
- **Output**: `dist/`
- **Left Panel**: `src/RPGlitch-left-panel.txt`
- **Deploy Script**: `.agent/skills/devops/scripts/deploy_perchance.js`

## 3. Procedures

### Phase 1: Pre-Flight

1.  **Audit**: Ensure `/04-review` was run.
2.  **Build**: `npm run build`.
    - **Result**: Must be error-free. **Evidence Gate:** You must read the fresh terminal output to confirm 0 compilation errors.
    - **Size**: Explicitly verify the final bundle size constraints (< 350KB) from the build output. No estimations allowed.

### Phase 2: Ignition (Perchance Deployment)

1.  **Run**: `npm run deploy:perchance`.
    - The script launches a headed Chromium browser using a persistent auth context (`.playwright-auth/`).
    - On first run, the user must log in and solve the Cloudflare captcha. Subsequent runs reuse the saved session.
    - The script:
        1. Navigates to `https://perchance.org/rpglitch#edit`.
        2. Waits for the CodeMirror 6 editors to load (`window.modelTextEditor`, `window.outputTemplateEditor`).
        3. Injects `src/RPGlitch-left-panel.txt` into the Left Panel via `EditorView.dispatch()`.
        4. Injects `dist/index.html` into the Right Panel (HTML editor) via `EditorView.dispatch()`.
        5. Saves via `app.saveGenerator()`.
        6. Waits for `window.perchanceSaveState === 'saved'`.
    - **Confirmation Gate**: The script asks for user confirmation before pushing content.
    - **Fallback**: If automation fails, content is copied to clipboard for manual paste.
2.  **Verify**: The script reports final state (content lengths, save status).
3.  **Smoke Test**: Open `https://perchance.org/rpglitch` and confirm the UI renders correctly.

### Phase 3: Log

1.  **Update Tracks**: Add `[x] 🚀 Deployed: <Date>`.
2.  **Tag**: `git tag v<version>`.

## 4. Anti-Patterns

- **YOLO Deploy**: Shipping without building locally first.
- **Friday Deploy**: Deploying at 5pm on Friday.
- **Blind Deploy**: Not checking the live site.
- **Premature Celebration**: Claiming the deployment was successful just because the script ran, without verifying the live production environment.
- **Stale Session**: If the `.playwright-auth/` session expires, re-login is needed. The script handles this automatically with a 2-minute captcha window.

## 5. Tools

- `run_command` (Build/Deploy)
- `deploy_perchance.js` (Playwright automation)

## 6. Architecture Reference

| Panel            | Source File                   | Perchance Editor               | JS Global                     |
| :--------------- | :---------------------------- | :----------------------------- | :---------------------------- |
| **Left** (Logic) | `src/RPGlitch-left-panel.txt` | `#mainModelTextEditorCtn`      | `window.modelTextEditor`      |
| **Right** (HTML) | `dist/index.html`             | `#mainOutputTemplateEditorCtn` | `window.outputTemplateEditor` |
| **Save**         | —                             | `app.saveGenerator()`          | `window.perchanceSaveState`   |
