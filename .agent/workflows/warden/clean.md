---
description: Aggressive cleanup protocol. Purges entropy and ensures deployment-ready resonance.
constraints:
    - "MUST adopt the Warden Persona."
---

# 🧹 Clean Protocol

> **Goal:** Sterilize the codebase for deployment and build integrity.

## 1. The Purge

1. **Orphans**: Remove dead files and empty directories causing build noise.
2. **Artifacts**: Clear temporary build folders (`dist`, `.cache`) if state is inconsistent.

## 2. Build Verification

1. **Validate**:
    - **Execute**: `node .agent/skills/warden/scripts/warden.js hygiene`
    - **Verify**: Production paths are free of debugging leakage.
2. **Lint**:
    - **Execute**: `npm run lint:fix`
    - **Requirement**: Zero tolerance for syntactic entropy.
3. **Build**:
    - **Execute**: `npm run build`
    - **Action**: Fix any production build errors before declaring "Clean".

## 3. Deployment Ready

- **Final Audit**: Run `node .agent/skills/warden/scripts/warden.js audit`.
- **Completion**: Announce "Resonance Cleared. Deployment Gate OPEN."
