# MISSION PLAN: Architectural Pivot [034]

**Goal**: Transition the project's meta-structure from the legacy fragmented orchestration model to the new "Master Workflow" model (/spec, /plan, /build).

## Technical Scoping

### 1. File Structure Migration
- **Root Sovereignty**: Move active state from `.agent/orchestration/` to `tasks/`.
- **Primary Kernel**: Establish `SPEC.md` as the technical source of truth.
- **Cleanup**: Delete the `.agent/orchestration/` directory and its children.

### 2. Logic Consolidation
- **Unified Skill**: Create `orchestration/SKILL.md` that defines the procedures for /spec, /plan, and /build.
- **Rule Alignment**: Update Rule 05 (Intelligence) to point to the new workflow heartbeat.

---

## Deployment Track

- [x] **Beat 01**: Initialize `SPEC.md` and `tasks/todo.md`.
- [x] **Beat 02**: Scaffold `tasks/plan.md` (this file).
- [x] **Beat 03**: Create consolidated `orchestration` skill blueprint.
- [x] **Beat 04**: Delete legacy skill folders and orchestration state.
- [x] **Beat 05**: Synchronize Rule 05 definitions.
- [x] **Beat 06**: Final verification audit.
