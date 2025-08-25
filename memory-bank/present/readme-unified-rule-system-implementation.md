<!-- path: present/readme-unified-rule-system-implementation.md -->

# README Unified Rule System — Implementation Plan (Present)

**Mission:** Execute the repository-wide README-frontmatter rule system with a **template-first, incremental** rollout. Incorporates the **Apps README shared-content migration** to centralize Perchance standards.

---

## 1) Outcomes

- A single, recognizable README structure across the repo (frontmatter + sections).
- Shared standards live in `apps/README.md`; app-specific details stay local.
- IDEs (Cursor, Windsurf, etc.) reliably ingest rules and contextual hints.

---

## 2) Phases & Status

### Phase 1 — Template & Pilot (**Complete**)

- Canonical README template (frontmatter + sections).
- Pilot applied to `apps/rpglitch/` (`html/`, `js/`, `scss/` subfolders).
- Rule categorization and “no duplication” policy validated.
- IDE recognition tested.

### Phase 2 — Repository Rollout (**In Progress**)

- Apply to `/apps/`, `/build/`, `/docs/`, `/memory-bank/`, and repository root.
- Evaluate `/apps/imageglitch/` for compatibility.
- Add build scripts (`sync:readme`) independent of `sync:rules`.

### Phase 3 — Integration & Cleanup (**Planned**)

- Update system docs to reference the new structure.
- Archive/redirect scattered, obsolete rule files.
- Final verification in IDEs and build pipeline.

---

## 3) Apps README Shared-Content Migration (Merged)

**Goal:** Move Perchance-wide standards out of `apps/rpglitch/README.md` into `apps/README.md` so other apps inherit a single source of truth.

- **Move**: Perchance constraints, build patterns, troubleshooting, plugin guidelines.
- **Keep local**: RPGlitch-specific orchestration notes, storyboard details, component inventories.
- **Validate**: No duplication post-move; links resolve; local READMEs reference shared sections.

---

## 4) Technical Notes

- **Frontmatter keys**: `title`, `scope`, `audience`, `status`, `lastUpdated`.
- **Required sections**: Overview, Guardrails, Structure, Build/Run, Conventions, Troubleshooting, Links.
- **Build scripts**:  
  - `sync:readme` — copy/refresh shared sections into app READMEs.  
  - `lint:readme` — validate frontmatter presence and section order.

---

## 5) Checkpoints (per folder migrated)

- IDE recognition in Cursor/Windsurf (spot-check rule visibility).
- Functionality unchanged; links and anchors valid.
- Shared sections deduplicated.
- Open task list ≤ 10 items.

---

## 6) Status Summary

- Phase 1 ✅ completed in `apps/rpglitch`.
- Phase 2 🔄 ongoing for `/apps`, `/build`, `/docs`, `/memory-bank`, root.
- Phase 3 ⏳ pending consolidation sign-off.

---

## 7) Acceptance Criteria

- All targeted folders contain a compliant README (template + required sections).
- `apps/README.md` is the single source for shared Perchance standards.
- `sync:readme` runs cleanly; no drift detected by `lint:readme`.
- IDEs reflect the updated structure in context panels.
