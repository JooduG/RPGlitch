# 🎯 Spec: Gamemaster Workflow Alignment

> **Goal:** Synchronize `gamemaster` workflows with `SKILL.md` v2.1.0 capabilities.

## 1. Context

The `gamemaster` skill defines specific tools (`sync.js`, `scaffold_state.py`) and protocols (Singleton State) that should be explicitly referenced in the procedural workflows.

## 2. Scope

- **`01-setup.md`**: Verify `setup_state.json` validity.
- **`03-implement.md`**: Add explicit step to use `scaffold_state.py` when creating new state stores.
- **`04-status.md`**: Integrate `sync.js` for automated status reporting if applicable.

## 3. Alignment Matrix

| Workflow       | current                | Target                                                   |
| :------------- | :--------------------- | :------------------------------------------------------- |
| `03-implement` | Generic "Execute" step | Explicit "Scaffold State" step using `scaffold_state.py` |
| `04-status`    | Manual inspection      | Automated `sync.js` calls                                |

## 4. Success Criteria

- [ ] `03-implement.md` references `scaffold_state.py`.
- [ ] `04-status.md` references `sync.js` or `gamemaster.js` CLI.
