---
description: The Quality Gate. Audits work and commits to the permanent record.
---

# 04-review (The Quality Gate)

> **Goal:** Audit, Checkpoint, and Handoff. The "Permanent Record" and the "Handover Baton".

## 1. Triggers

- **Feature Complete**: "I'm done", "It works".
- **Major Milestone**: Before a risky change.
- **Slash Command**: `/04-review`

## 2. Brain (Context Injection)

- **Tracks**: `.agent/tasks/tracks.md`
- **Plan**: `.agent/tasks/<slug>.md` (Flat — Spec + Plan combined)
- **Spec**: Embedded in `.agent/tasks/<slug>.md`
- **Diff**: `git status` / `git diff`

## 3. Procedures

### Phase 1: The Audit (Two-Stage Gate)

> **EVIDENCE MANDATE:** No completion claims without fresh verification evidence. Read the terminal output before proceeding.

1.  **Stage 1: Spec Compliance Review**:
    - Read `spec.md`.
    - Does the code fulfill ALL requirements?
    - **Crucial:** Are there _extra_ features that were not requested? (If yes, revert them. Spec compliance is exact).
2.  **Stage 2: Code Quality Review**:
    - Ensure strict Svelte 5 Rune usage.
    - Check for magic numbers, optimal architecture, and naming conventions.
3.  **Test Verification**: Run the generic test suite. **Mandatory:** Read the full output. Proceed only with evidence of 0 failures.
4.  **Hygiene Check**: Run `/03-clean` (Phase 3).
5.  **Manual Verification Plan**: Do not just ask "did we verify the UI?". You MUST draft a step-by-step manual verification script for the user (e.g., "1. Run `npm run dev`, 2. Go to `/profile`, 3. Confirm X is visible"). Present this to the user and **WAIT** for their explicit approval.

### Phase 2: The Commit (Checkpoint)

1.  **Stage**: `git add .`
2.  **Commit**: `gamemaster(checkpoint): <Track> - <Summary>`.
3.  **High-Fidelity Git Notes**: Construct an **Auditable Verification Report** containing the automated test command used, the manual verification steps provided, and the user's explicit confirmation. Attach it to the commit via `git notes add -m "<report_content>" <commit_hash>`.

### Phase 3: The Registry (Update & Sync)

1.  **Update Plan**: Mark items `[x] [checkpoint: <sha>]`.
2.  **Update Tracks**: Update global status in `.agent/tasks/tracks.md`. **Mandatory**: Use the "Track Block" format.
3.  **Global Documentation Synchronization**: If the track is 100% complete, cross-reference the finished `spec.md` against `.agent/knowledge/atlas/03-architecture.md` and `01-vision.md`. If core systems or paradigms changed, propose a diff to the user to keep the Atlas synchronized. Wait for approval before editing.
4.  **Interactive Track Cleanup**: If the track is 100% complete, do NOT automatically archive the folder. Prompt the user: "Track is
   complete. Do you want to **Review**, **Archive**, **Delete**, or **Skip**?".
       - If archiving, prepend a `## Post-Mortem` section to the top of the track file summarizing what was built, what failed, and why.
       - Move the file to `.agent/archive/tasks/`.
       - This file is now **Secondary Knowledge** and should only be retrieved if future agents require historical context.

### Phase 4: The Handoff (The Baton Protocol)

> **MANDATE:** No session may end without a synchronized state hub.

1.  **Sync Global State**: Update `.agent/state/global.md` with current "Mission Board" status and new engine rules.
2.  **Sync Tracks**: Ensure `.agent/state/tracks.md` reflects checkpoint status.
3.  **Forge Payload**: Write the next agent's instructions into `.agent/state/next-prompt.md`.
4.  **Verification**: Confirm baton files are valid and readable.
5.  **Final Signal**: End session with clear summary and next steps.

## 4. Anti-Patterns

- **Ghost Commits**: Committing without updating the Plan.
- **Broken Saves**: Committing code that doesn't compile.
- **Vague Messages**: "WIP". Use descriptive summaries.
- **Hallucinated Success**: Claiming "tests pass" without explicitly running the test command and reading the output.
- **Scope Creep**: Approving code that adds "bonus" features not strictly defined in the spec.
- **Auto-Archiving**: Sweeping completed tracks into the archive folder without asking the user how they want to handle cleanup.

## 5. Tools

- `run_command` (git, tests)
- `write_to_file` (update markdown)
- `waldzell-metacognitive-monitoring` (Audit)
