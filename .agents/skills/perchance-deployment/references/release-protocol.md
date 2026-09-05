# Unified 5-Stage Release Protocol

> **Persona: The Release Engineer**  
> _"I orchestrate final deployment packaging, production stability verification, and remote synchronization with GitHub, certifying that only hardened, verified logic enters shared reality."_

---

## 1.0 The 5-Stage Release Protocol

```text
[Stage 1: Pre-Flight Verification] ➔ [Stage 2: Production Build & Asset Hardening] ➔ [Stage 3: Git Packaging & Semantic Tagging] ➔ [Stage 4: Remote Sync & Deployment] ➔ [Stage 5: Mission Board Reconciliation & Handoff]
```

---

### Stage 1: Pre-Flight Verification

Ensure the codebase meets all quality standards before any release actions:

1. **Environmental Health**:
   - Run `git status` to verify a clean working tree with zero untracked debris in the root.
   - Run `npm run test:hooks` to confirm all Antigravity behavioral lifecycle hooks pass contract verification.
2. **Quality & Compliance Suite**:
   - Run `npm run verify` to ensure zero ESLint errors, zero formatting diffs, zero type diagnostic warnings, and full test suite passes.
3. **Secret & Vulnerability Sweep**:
   - Confirm no `.env` credentials, high-entropy strings, or private API tokens exist in the changeset.

---

### Stage 2: Production Build & Asset Hardening

Verify that production build artifacts compile without errors:

1. **Production Bundle Compilation**:
   - Execute `npm run build` using the project distribution pipeline (e.g. `vite-plugin-singlefile`).
   - Confirm the build output produces a clean, self-contained artifact without missing assets.
2. **Asset & Memory Sanity**:
   - Verify bundle size metrics and ensure no unbounded caches exist in production paths.

---

### Stage 3: Git Packaging & Semantic Tagging

Package the release with clear, auditable git history:

1. **Commit History Audit**:
   - Inspect recent commits via `git log -n 5 --oneline`.
   - Verify all milestone commits follow semantic conventions (`track(implement): ...`, `track(review): ...`, `track(plan): ...`).
2. **Release Checkpoint Commit**:
   - If version bumps or build artifacts require committing:

     ```bash
     git commit -m "track(release): package milestone <version-or-track-name>"
     ```

3. **Semantic Tagging (When Applicable)**:
   - For versioned releases, tag the commit:

     ```bash
     git tag -a v<version> -m "Release v<version>"
     ```

---

### Stage 4: Remote Sync & Deployment

Synchronize local state with GitHub and trigger deployment:

1. **Direct Push or PR Flow**:
   - **Direct Branch Push**: If working directly on `main`:

     ```bash
     git push origin main --tags
     ```

   - **Feature Branch PR Flow**: If operating on a feature branch:

     ```bash
     git push -u origin <branch-name>
     gh pr create --title "<track-title>" --body "<summary-of-changes>"
     ```

2. **Platform-Specific Deployment Bridge**:
   - Execute the platform deployment command (e.g. `npm run deploy:auto`).
   - Confirm live operational availability after the automated deployment bridge reports success.

---

### Stage 5: Mission Board Reconciliation & Handoff

Reconcile the digital record in `tasks/PRESENT.md`:

1. **Mission Board Update**:
   - Confirm the active track has been archived to `archive/YYYY-MM/<date>-<track-name>.md`.
   - In `tasks/PRESENT.md`:
     - Update `### 🩺 System & Session Readiness` with the release timestamp and clean tree status.
     - Record an entry in `## 📜 Past` with release details, commit hash, and status `✅ Completed`.
2. **Release Summary Briefing**:
   - Present a concise release briefing:
     - **Release Target**: Version or Track ID.
     - **Git Commit / Tag**: 7-character commit SHA and semantic tag.
     - **Remote Sync Status**: Pushed to `origin/main` (or PR created).
     - **Production Status**: Build verified and deployed.
3. **Stop & Await Instructions**:
   - Stop and wait for user instructions before initiating new planning or implementation tracks.

---

## 2.0 Anti-Patterns (Release Failures)

- **Release and Forget**: Pushing or deploying without verifying production bundle output.
- **Dirty Tree Release**: Pushing uncommitted work, untracked root files, or unverified changes.
- **Bypassing the Gate**: Skipping `npm run verify` or hook tests to expedite a release.
- **Unlinked History**: Publishing a release without recording the completed milestone in `tasks/PRESENT.md`.
