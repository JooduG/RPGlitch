# 📝 Plan: Gamemaster Workflow Alignment

## User Review Required

> [!NOTE]
> Process update only. No code changes.

## Proposed Changes

### Phase 1: Implementation Protocol (`03-implement.md`)

- **[MODIFY]** `workflows/gamemaster/03-implement.md`:
    - Add specific sub-step in "Execution Loop" to use `node .agent/skills/gamemaster/scripts/scaffold_state.py` when creating new state.
    - Enforce "Singleton Pattern" check in Quality Gate.

### Phase 2: Status Protocol (`04-status.md`)

- **[MODIFY]** `workflows/gamemaster/04-status.md`:
    - Update "Reporting" section to use `node .agent/skills/gamemaster/scripts/gamemaster.js status` (if available) or `sync.js`.

### Phase 3: Setup Protocol (`01-setup.md`)

- **[MODIFY]** `workflows/gamemaster/01-setup.md`:
    - Ensure `bootstap.js` reference is accurate.

## Verification Plan

### Manual Verification

- **Doc Review**: Verify links and command paths.
- **Dry Run**: Execute the commands listed in the updated workflows to ensure they run.
