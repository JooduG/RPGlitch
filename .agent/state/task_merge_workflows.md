# TASK: Workflow Rewiring & Housekeeping

## The Spec

Update all workflows in `.agent/workflows/` to ensure they are synchronized with the "Sovereign Core" v4.0 architecture, current rule pillars (01-04), and actual directory structures.

### Acceptance Criteria

- [ ] All workflows have consistent YAML frontmatter (`name`, `description`).
- [ ] Path references are corrected:
    - `.agent/tasks/` -> `.agent/state/tracks/`
    - `tasks.md` -> `tracks.md`
- [ ] Rule references are corrected to point to `01-04` pillars.
- [ ] Obsolete rule references (05-09) are remapped to active counterparts.
- [ ] Tool references match currently available MCP tools (Reflect: `sequentialthinking`, `waldzell-clear-thought`).
- [ ] "Diegetic" nicknames applied (e.g., 00-Ignition, 01-Blueprint, etc.).

---

## Active Plan

- [x] **Phase 1: Entry & Logic (The Head)**
    - [x] Audit `00-boot`, `01-plan`, `02-execute`.
    - [x] Update `00-boot.md`.
    - [x] Update `01-plan.md`.
    - [x] Update `02-execute.md`.
- [x] **Phase 2: Repair & Quality (The Heart)**
    - [x] Update `03-clean.md`.
    - [x] Update `04-review.md`.
    - [x] Update `06-continue.md`.
- [x] **Phase 3: Dispatch & specialized (The Limbs)**
    - [x] Update `05-deploy.md`.
    - [x] Update `05-triage.md`.
    - [x] Update `07-github-dispatch.md`.
    - [x] Update `08-stitch-loop.md`.
    - [x] Update `10-bug-fix.md`.
    - [x] Update `11-security-scan.md`.
    - [x] Update `12-fleet-commander.md`.
- [x] **Phase 4: Emergency (The Ejector)**
    - [x] Update `99-reset.md`.
- [x] **Phase 5: Bidirectional Integrity (The Sync)**
    - [x] Update `02-motion.md` Workflow Registry.
    - [x] Audit `AGENTS.md` and `GEMINI.md` for consistent command/path references.
    - [x] Final "Both Ways" verification (Grep for stragglers).
- [x] **Phase 6: Final Verification**
    - [x] Verify all cross-references between workflows are valid.
