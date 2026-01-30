# Plan: Structural Audit of Agent Core

> **Goal:** Reorganize `.agent/` for maximum clarity, token efficiency, and architectural compliance.

## Phase 1: Mapping & Intelligence Audit
- [x] **Task: Deep Crawl of .agent/**
    - [x] List all files in `.agent/knowledge/`, `.agent/rules/`, and `.agent/workflows/`.
    - [x] Identify files with "mixed concerns" (e.g., Knowledge that contains Rules).
- [x] **Task: Structural Classification**
    - [x] Categorize every file as `Passive Knowledge`, `Invariable Rule`, or `Procedural Workflow`.
    - [x] Map files to potential `skills/` directories for encapsulation.

## Phase 2: Knowledge & Skill Restructuring
- [x] **Task: Logic Pillar Migration**
    - [x] Move `.agent/knowledge/logic/*` content to `.agent/skills/cortex/` or `.agent/rules/` if applicable.
    - [x] **Quality Gate**: Verify no broken relative links in migrated markdown.
- [x] **Task: System & Tech Knowledge Refactor**
    - [x] Audit `.agent/knowledge/system/` and `.agent/knowledge/tech/`.
    - [x] Encapsulate pillar-specific knowledge within the corresponding `skills/` folders.

## Phase 3: Rules vs. Workflows Alignment
- [x] **Task: Procedure Extraction**
    - [x] Identify "How-To" guides in `.agent/rules/` and move them to `.agent/workflows/`.
    - [x] **Quality Gate**: Ensure Workflows remain exclusively user-activated sequences.
- [x] **Task: Constraint Hardening**
    - [x] Consolidate all non-negotiable mandates into the `01-07` core rules.
    - [x] Remove overlapping or conflicting rules discovered during Phase 1.

## Phase 4: Token Efficiency & Consolidation
- [x] **Task: Atomic File Refactoring**
    - [x] Split large multi-topic files into smaller, focused `.md` files (e.g., `principles.md` -> `reasoning.md`, `choices.md`, etc.).
    - [x] **Quality Gate**: Confirm the agent can still retrieve the split context via index files.
- [x] **Task: Duplicate Purge**
    - [x] Merge redundant information across the OS.
    - [x] Delete orphaned or legacy docs identified in Phase 1.

## Phase 5: Gap Analysis & Final Verification
- [x] **Task: Capability Audit**
    - [x] Identify gaps in the **Skill Matrix** or **Workflow Registry**.
    - [x] Create skeleton files for any missing essential protocols.
- [x] **Task: Resonance Test**
    - [x] Perform a full `01-setup` loop to verify system integrity.
    - [x] Announce: "Structural Audit Complete. System Resonance Optimal."