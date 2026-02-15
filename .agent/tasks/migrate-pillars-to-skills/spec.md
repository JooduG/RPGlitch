# Spec: Pillar-to-Skill Migration

## 1. Vision

RPGlitch is moving away from human-centric "personas" (GameMaster, Artificer, etc.) towards a system-centric **Skill Matrix** (Engine, UI, Data, etc.). This ensures the agent is viewed as a high-fidelity orchestrator rather than a collection of characters.

## 2. Mapping Table

| Old Persona (Legacy) | New Skill Channel (Modern) | Icon | Responsibility |
| :------------------- | :------------------------- | :--- | :------------- |
| **GameMaster**       | **Engine**                 | 🕹️   | Logic & Core   |
| **Artificer**        | **UI**                     | 🛠️   | Structure      |
| **Mesmer**           | **Polish**                 | 🎭   | Visuals/Audio  |
| **Scholar**          | **Data**                   | 📚   | Persistence    |
| **Warden**           | **Security**               | 🛡️   | Safety/Rules   |

## 3. Scope of Work

- **Code Comments**: Update all file headers and internal comments.
- **Logs & Errors**: Update prefixes like `[Warden]` to `[Security]`.
- **Constants**: Rename the `GameMaster` facade in `src/core/engine/engine.js` to `Engine`.
- **Documentation**: Update `.agent/rules/` and `.agent/knowledge/` to reflect the change.

## 4. Acceptance Criteria

- [ ] No occurrences of "GameMaster", "Artificer", "Mesmer", "Scholar", or "Warden" (as system roles) remain in the active codebase.
- [ ] Application bootstraps and runs without errors.
- [ ] All unit tests pass.
- [ ] Documentation is consistent with the Skill Matrix in `agent-architecture.md`.
