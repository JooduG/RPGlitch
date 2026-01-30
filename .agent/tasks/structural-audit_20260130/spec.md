# Specification: Structural Audit of Agent Core

## 1. Overview
This track focuses on auditing and reorganizing the `.agent/` directory to ensure optimal logical separation between "Knowledge" (passive data), "Rules" (constraints), "Skills" (capabilities), and "Workflows" (procedures). The goal is to eliminate ambiguity and enforce a strict single source of truth for agent behavior.

## 2. Functional Requirements
*   **Audit .agent/knowledge/**:
    *   Review `logic/`, `system/`, and `vision/` subdirectories.
    *   Identify content that describes *how* to do things (operational) vs. *what* things are (informational).
    *   Move operational logic to `skills/` or `workflows/` as appropriate.
*   **Audit .agent/rules/ vs .agent/workflows/**:
    *   Ensure `rules/` contains only static constraints and mandates (e.g., "Do not use innerHTML").
    *   Ensure `workflows/` contains only procedural steps (e.g., "How to deploy").
    *   **Crucial Distinction**: Verify that `workflows/` are exclusively user-activated sequences, distinguishing them from automated or reactive `skills/`.
    *   Move misplaced content to the correct location.
*   **Skill Encapsulation**:
    *   Migrate relevant "Knowledge" or "Rules" into specific `skills/` directories (e.g., `skills/cortex/`) if they strictly pertain to that skill's domain, fostering self-contained units.
*   **Token Efficiency Optimization**:
    *   Refactor large, mixed-concern files into smaller, focused files to reduce context window usage when only specific information is needed.
*   **Consolidation**:
    *   Identify and merge redundant files found across `rules/` and `knowledge/`.
*   **Gap Analysis**:
    *   Proactively identify missing skills or workflows during the audit and create them if necessary to fill functional gaps.

## 3. Non-Functional Requirements
*   **Architecture Compliance**: All changes must adhere to the definitions in `.agent/rules/02-architecture.md`.
*   **Documentation Standards**: Updated files must follow the project's markdown formatting and header standards.
*   **Zero Regression**: The agent's ability to boot and execute existing workflows must not be impaired during the restructure.

## 4. Acceptance Criteria
*   [ ] A comprehensive audit report or log of moved/modified files is generated.
*   [ ] `knowledge/` contains only passive data/facts.
*   [ ] `rules/` contains only invariant constraints.
*   [ ] `workflows/` contains only user-activated procedural steps.
*   [ ] `skills/` directories are more self-contained, holding their specific logic/rules where applicable.
*   [ ] Redundant files are merged or deleted.
*   [ ] Any identified gaps in skills or workflows are addressed with new file creation.
*   [ ] The file structure reflects the "Single Source of Truth" principle.

## 5. Out of Scope
*   Rewriting the actual logic code within `src/` (this is a documentation/config restructure).