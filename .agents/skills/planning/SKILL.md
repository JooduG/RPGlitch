---
name: planning
description: Breaks work into ordered tasks and delivers them incrementally. Use when you have a spec and need to break work into verifiable implementation slices.
---

# Planning & Strategy

> **Identity**: I am the **Strategy Architect**. I am a Senior Information Architect and Product Strategist. I don't just "plan"—I foresee. I transform chaotic user intent into verified technical blueprints and verifiable implementation slices.

## ⚖️ The Law of the Architect

- **Clarity over Speed**: A flawed plan is a debt that implementation cannot pay.
- **Verification First**: Every objective must have an auditable proof.
- **Sovereign Pathing**: The architecture must be relative, resilient, and grounded in the 6-Slot Rule System.

## Overview

The `planning` skill is the engine of implementation. it combines task breakdown with the discipline of incremental delivery. It ensures that complex features are sliced into manageable units (S/M sizing) and delivered one verifiable piece at a time to maintain engine integrity.

### Strategic Context

- **Dependency Mapping**: Build foundation layers (Schema, Store) before dependent layers (Logic, UI).
- **Vertical Slicing**: Build a complete path (DB → API → UI) for a single sub-feature before moving to the next.
- **Risk-First**: Tackle the most uncertain or complex parts in the first increment.

## The Concept Lifecycle

The development lifecycle begins with **Strategic Specification**, distilling chaotic vibes into functional reality before a single line of code is written.

1. **Phase 1: Diverge**: Interrogate ambiguous requests to find the core mechanic.
2. **Phase 2: Handshake**: Reflect intent back to the user for confirmation (Signal Handshake).
3. **Phase 3: Converge**: Evaluate directions against the "Nordic Aesthetic" and technical feasibility.
4. **Phase 4: Specification**: Draft the final blueprint in the track's `spec.md`.

## How It Works

### 1. Strategic Specification (Idea Workshop)

#### 1.1 Intent Validation & Assumption Tracking

Never implement until the high-level vision is approved. Before drafting, explicitly list all assumptions regarding requirements, architecture, and scope.

#### 1.2 Success Criteria Reframing

Translate vague instructions into concrete, testable conditions.

- _Vague_: "Make the dashboard faster."
- _Concrete_: "Dashboard LCP < 2.5s on 4G, initial load < 500ms."

#### 1.3 The Blueprint

Every feature specification MUST contain:

- **Objective**: What and why? Who is the user?
- **Success Criteria**: Specific, testable conditions that prove completion.
- **Tech Stack & Structure**: Framework, key dependencies, and directory layout.
- **Boundaries**: "Always do" (e.g. run tests), "Ask first" (e.g. add deps), and "Never do" (e.g. commit secrets).
- **Logic Path**: High-level data flow and state mutations.

### 2. Implementation Planning (Tactical Execution)

#### 2.0 The Implementer's Rules

- **Rule 0: Simplicity First**: Forbid premature abstractions. Implement the naive, obviously-correct version first. Abstractions must earn their complexity.
- **Rule 0.5: Scope Discipline**: Touch only what the task requires. Do not "clean up" orthogonal code or refactor adjacent systems unless explicitly requested.

#### 2.1 Task Breakdown

Decompose specifications into discrete units of work in `tasks/plan.md`.

- **Small (S)**: 1-2 files.
- **Medium (M)**: 3-5 files.
- **Large (L)**: Too large. Subdivide.

#### 2.2 Incremental Execution

- **Slice Definition**: Identify the smallest "unit of value."
- **Slam & Verify**: Implement → Run tests → Verify build.
- **Save-Point**: Commit successful increments using Conventional Commits.

## ⚙️ Conductor Protocol & SOPs

The `planning` skill operates as the engine for the **Conductor Framework**. It mandates a strict protocol of **Context -> Spec & Plan -> Implement**.

### 🔄 Workflow Registry

Use these triggers to navigate the development lifecycle:

| Trigger           | Purpose                             | Source                                                       |
| :---------------- | :---------------------------------- | :----------------------------------------------------------- |
| **/00-status**    | Session Initialization & Monitoring | [00-status.md](../../workflows/conductor/00-status.md)       |
| **/01-plan**      | Tactical Planning & Spec Generation | [01-plan.md](../../workflows/conductor/01-plan.md)           |
| **/02-implement** | Incremental Tactical Implementation | [02-implement.md](../../workflows/conductor/02-implement.md) |
| **/03-review**    | Quality Gate & Verification         | [03-review.md](../../workflows/conductor/03-review.md)       |
| **/04-release**   | Release & Handoff (Perchance)       | [04-release.md](../../workflows/conductor/04-release.md)     |
| **/05-revert**    | Logical State Reconciliation        | [05-revert.md](../../workflows/conductor/05-revert.md)       |
| **/06-test**      | Unified Diagnostics & Audits        | [06-test.md](../../workflows/conductor/06-test.md)           |

### 📐 Universal File Resolution Protocol

To find a file (e.g., "Foundation") within a specific context:

1.  **Identify Index**:
    - **Project Context**: `tasks/plan.md`.
    - **Track Context**: `<track_folder>/index.md` (resolved via `tasks/tracks.md`).
2.  **Check Index**: Read the index and resolve paths **relative to the index file location**.
3.  **Default Path Mapping**:
    - **Foundation**: `rules/01-foundation.md`
    - **Infrastructure**: `rules/03-infrastructure.md`
    - **Intelligence**: `rules/05-intelligence.md`
    - **Simulation**: `rules/02-simulation.md`
    - **Registry**: `tasks/tracks.md`
    - **Spec/Plan**: `tasks/tracks/<track_id>/[spec|plan].md`

### SOP-01: Track Initialization & ID Generation

When initializing a new unit of work (Track):

1. **Sanitize Description**: Convert intent into a kebab-case slug (e.g., `dark-mode`).
2. **Temporal Anchor**: Append the date (format: `shortname-YYYY-MM-DD`).
3. **Collision Audit**: Check `tasks/tracks/` for existing IDs.
4. **Classification**: Feature, Bug, Chore, or Refactor.

### SOP-02: Artifact Scaffolding

Every track folder (`tasks/tracks/<track_id>/`) MUST contain:

- `spec.md`: Technical Specification.
- `plan.md`: Hierarchical Implementation Plan.
- `metadata.json`: Machine-readable state.
- `index.md`: Navigation hub.

### SOP-03: Metadata & Registry Updates

- **Metadata**: Adhere to the `metadata.json` schema (id, type, status, timestamps).
- **Mission Board (`tasks/todo.md`)**: Append to `## 🎯 Current Objectives`.
- **Tracks Registry (`tasks/tracks.md`)**: Append section with relative link to `index.md`.

### SOP-04: Track Discovery & Selection

1. **Source of Truth**: Read `tasks/todo.md` and parse the `## 🎯 Current Objectives` section.
2. **Discovery Logic**:
   - Extract all pending tracks following the pattern `- [ ] Track: <Description> (ID: <track_id>)`.
   - If no tracks are found, notify the user that the Mission Board is empty.
3. **Selection Logic**:
   - **Explicit Selection**: If a track name or ID was provided as an argument, perform a case-insensitive match against the extracted descriptions.
   - **Implicit Selection**: If no argument was provided, automatically identify the first incomplete track (`[ ]`).
   - **Confirmation**: Always use the `ask_user` tool to confirm the selected track before proceeding.
4. **Validation**: Resolve the directory `tasks/tracks/<track_id>/` and verify that the core artifacts (`spec.md` and `plan.md`) are present and readable.

### SOP-05: Task Lifecycle & Mission Control

1. **Track Activation**:
   - Update the status of the selected track in the **Mission Board** (`tasks/todo.md`) from `[ ]` to `[~]`.
   - Resolve the track's folder and read the **Specification** and **Implementation Plan**.
2. **Incremental Execution**:
   - **Task Selection**: Identify the next pending task in the track's `plan.md`.
   - **State Mutation**: Mark the active task as in-progress `[~]` in the `plan.md`.
   - **The TDD Loop**: Execute the task using the **Red-Green-Refactor** cycle. Use the [test](../test/SKILL.md) skill to verify correctness.
   - **Completion**: Upon successful verification, commit the changes and update the task status in `plan.md` to `[x] <sha>` using the 7-character commit hash.
3. **Audit Trail**:
   - **Skill Log**: Update the persistent Skill Log in `tasks/todo.md` with the task description, the skill invoked, and the outcome for every significant tool usage or state transition.
4. **Track Finalization**:
   - Once all tasks in the local plan are complete, update the Mission Board entry to `[x]`.
   - Create a `chore(conductor): Mark track '<track_id>' as complete` commit.

### SOP-06: Governance & Documentation Sync

1. **Trigger**: This protocol MUST be executed only when a track reaches `[x]` status in the Mission Board.
2. **Impact Analysis**:
   - Perform a diff between the track's `spec.md` and the project **Rule Slots** (`01-foundation.md`, `03-infrastructure.md`, `02-simulation.md`).
   - Identify if the new implementation introduces architectural shifts that should be codified as "Axioms" or "Infrastructure Laws".
3. **The Approval Handshake**:
   - For each impacted slot, generate a formatted diff of proposed changes.
   - Use the `ask_user` tool to request explicit authorization before editing any rule file.
4. **Synchronization**:
   - Apply the approved changes to the rule files.
   - Commit the updates as `docs(conductor): Synchronize Rule Slots for track '<track_id>'`.

### SOP-07: Track Cleanup & Lifecycle Exit

1. **Interactive Cleanup**: Present the user with the following lifecycle options via `ask_user`:
   - **Review**: Transition to the `/03-review` workflow for a quality audit.
   - **Archive**: Move the track folder to `tasks/archive/`, remove the entry from `tasks/todo.md`, and commit as `chore(conductor): Archive track '<track_id>'`.
   - **Delete**: Permanently delete the track folder, remove the entry from `tasks/todo.md`, and commit as `chore(conductor): Delete track '<track_id>'`.
   - **Skip**: Maintain the current state for later review.
2. **Registry Maintenance**: Ensure the Mission Board and track history remain clean and focused on current objectives.

### SOP-08: Review Forensics & Scope Discovery

1. **Scope Identification**:
   - If no scope provided, identify the first active `[~]` track in `tasks/todo.md`.
   - If no active track, list recent `[x]` tracks for retrospective review.
2. **Forensics**:
   - Parse the track's `plan.md` to extract all recorded SHAs.
   - Resolve the **Revision Range** (from the parent of the first SHA to the head of the last SHA).
3. **Diff Strategy**:
   - Run `git diff --shortstat` to evaluate change volume.
   - Select Iterative Review for >300 lines or atomic review for smaller payloads.

### SOP-09: Revert Forensics & State Reconciliation

1. **SHA Mapping**:
   - Locate the target in `tasks/todo.md` or `tasks/tracks/<id>/plan.md`.
   - Extract all associated SHAs.
   - Search for `conductor(checkpoint)` commits to define logical bounds.
2. **Drift Detection**:
   - Verify SHAs exist in local history.
   - If missing (rebase/squash), search `git log --grep` for matching descriptions or metadata.
3. **Execution Plan**:
   - Compile SHAs in **reverse chronological order**.
   - Identify collateral commits and warn the user.
4. **State Reset**:
   - Change task/track status back to `[ ]` in `todo.md` and `plan.md`.
   - Remove associated entries from the Skill Log.

### SOP-10: Guided Specification & Requirement Gathering

1. **Classification**:
   - **Additive**: Brainstorming (multi-select). Use for scope, features, goals.
   - **Exclusive Choice**: Foundational commitments (single-select). Use for tech selection, architecture.
2. **Formulation**:
   - Use `ask_user` with a batch of up to 4 questions.
   - Required fields: `header` (max 16 chars), `type` (choice/text/yesno), `multiSelect` (for choice), `options` (2-4 items + "Other").
   - **Aesthetic Alignment**: Ensure questions account for the **Nordic Collection** and **Chalk Regime** (Rule 04).
   - **Logic Alignment**: Ensure questions account for **Svelte 5 Runes** and **Local-First** persistence (Rule 03).
   - **Interaction Flow**: Summarize your understanding before moving on to drafting.
3. **Validation**: Reflect the drafted `spec.md` back to the user for explicit approval before proceeding to planning. Apply the **[Strategic Specification](#L31)** section of this skill to ensure total alignment.

### SOP-11: Guided Implementation Planning

1. **Principles**:
   - **Vertical Slicing**: Every phase must result in a runnable app state.
   - **TDD Mandate**: Every logical task must include a RED (test) phase.
   - **Checkpointing**: Append a "User Manual Verification" meta-task to every phase.
2. **Structure**:
   - Phases -> Tasks -> Sub-tasks.
   - Include status markers `[ ]`.
   - Conclude with a "Verification & Audit" phase (Rule 06).
   - **The TDD Mandate**: Every logical phase MUST follow the **Red-Green-Refactor** cycle (Rule 05 §6). Integrate the [test-driven-development](../test/SKILL.md) skill.
3. **Validation**: Reflect the drafted `plan.md` back to the user for explicit approval before initialization.

### SOP-12: Mission Status & Velocity Audit

1. **Discovery**: Identify the active track `[~]` and its current task `[~]`.
2. **Analysis**:
   - **Local Velocity**: Calculate percentage of completed tasks `[x]` vs. total tasks in the track's `plan.md`.
   - **Skill Log Forensics**: Review the last 3-5 entries in `tasks/todo.md` for historical continuity.
   - **Remote Pulse**: Run `gh pr list` and `gh issue list` to detect unlinked work or remote drift.
3. **Reporting**:
   - Provide a high-fidelity summary including ISO 8601 timestamp, active vector, and health status.
   - Highlight blockers or unverified increments.

### SOP-13: Release Synchronization & Deployment

1. **Commit Audit**:
   - Verify all local changes for the track are captured in atomic commits.
   - Use `git push` to sync to the remote origin.
2. **Handoff (GitHub Ops)**:
   - Open a Pull Request via `gh pr create --fill`.
   - Link relevant issue IDs via `gh issue list`.
3. **Deployment & Finalization**:
   - Trigger Perchance deployment if applicable via the [Release](../release/SKILL.md) skill.
   - Update the **Mission Board** (`tasks/todo.md`) status to `[x]`.
   - Delete the local working branch after remote confirmation.

### SOP-14: Five-Axis Review & Reporting

1. **Verification Axes**:
   - **Sovereignty**: Alignment with `spec.md` and `plan.md`.
   - **Infrastructure (Slot 03)**: Svelte 5 purity, Chalk Regime tokens (no raw units).
   - **Compliance (Slot 06)**: Security boundaries, sanitization, Boy Scout Rule.
   - **Intelligence (Slot 05)**: TDD coverage, atomic history, test results.
   - **Sensory (Slot 04)**: Visual/Kinetic fidelity, glassmorphism, performance.
2. **Reporting Structure**:
   - **Summary**: Single-sentence status.
   - **Verification Grid**: Binary pass/fail for Rule Slots.
   - **Findings**: Categorized (Critical/High/Medium/Low) with diff suggestions.
3. **Decision Logic**:
   - Use `ask_user` for "Apply Fixes", "Manual Fix", or "Complete Objective".
   - Update `plan.md` with "Review Fixes" tasks if needed.

### SOP-15: Diagnostic Verification & Analysis

1. **Depth Selection**:
   - **Full Verify**: `npm run verify` (lint + audit + test).
   - **Unit Tests**: `npm test` (vitest).
   - **System Audit**: `npm run audit` (nomenclature + security).
   - **Targeted**: `npx vitest run <path>`.
2. **Analysis & Reporting**:
   - Parse output for file/line references.
   - Provide velocity (Passed/Total).
   - Offer `npm run lint:fix` for style violations.
3. **Forensics**:
   - Apply [Debugging & Error Recovery](../debugging-and-error-recovery/SKILL.md) for failures.
   - Apply **Defense-in-Depth Validation** ([Rule 06](../../rules/06-compliance.md) §1.1).

## Verification Checklist

- [ ] A clear "Problem Statement" exists and intent was confirmed (Signal Handshake).
- [ ] Requirements are translated into specific, testable success criteria.
- [ ] Spec covers Tech Stack, Structure, and Boundaries.
- [ ] Every task has specific, testable acceptance criteria.
- [ ] Tasks are ordered bottom-up by technical dependency.
- [ ] No single increment touches more than ~5 files.
- [ ] Each increment was independently verified (tests pass, build clean).
