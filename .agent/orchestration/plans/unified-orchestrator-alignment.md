# Implementation Plan: Unified Orchestration Refactor (Deconstruction)

Deconstruct the `orchestrator` skill and distribute its core logic into `intake`, `strategy`, `tactics`, and `operations`. This shift moves from a "Hub" model to a "Relay" model with explicit handover protocols.

## Strategic Goal
Eliminate cognitive redundancy and clarify role boundaries. Ensure that the Agent only ever operates in **one mode at a time** with clear transitions.

## Proposed Steps

### Phase 1: Semantic Triage (Intake)
- **Objective**: Absorb Complexity Triage from Orchestrator.
- **Update**: `orchestration-strategy/SKILL.md` to handle Level 1/2/3 routing.
- **Handover**: If intent is clear and L2/L3, handover to `strategy` (L3) or `tactics` (L2).

### Phase 2: Architectural Handover (Strategy)
- **Objective**: Define high-level architecture for L3 tasks.
- **Update**: `orchestration-strategy/SKILL.md` with explicit **Strategic-to-Tactical Handover**.
- **Rule**: Turn MUST conclude with a clear strategic summary before a Tactical plan is drafted.

### Phase 3: Planning & State Sync (Tactics)
- **Objective**: Move state management to Tactics.
- **Migration**: Move `orchestrator/scripts/sync.js` to `orchestration-tactics/scripts/sync.js`.
- **Update**: `orchestration-tactics/SKILL.md` with explicit **Tactical-to-Operational Handover**.

### Phase 4: Implementation & Verification (Operations)
- **Objective**: Execute and close the loop.
- **Update**: `orchestration-operations/SKILL.md` with **Post-Verification Handover** (back to Triage or Documentation).

### Phase 5: Core Alignment
- **Update**: `GEMINI.md` and `05-intelligence.md` to remove `orchestrator` skill references and metadata examples.
- **Refactor**: Codewide search and replace for all `orchestrator` pathing.

## Atomic Checklist

- [ ] **Phase 1: Intake Evolution**
    - [ ] Update `orchestration-strategy/SKILL.md` with Triage Table.
- [ ] **Phase 2: Strategy Handover**
    - [ ] Update `orchestration-strategy/SKILL.md` with Handover protocols.
- [ ] **Phase 3: Tactics & Sync Migration**
    - [ ] Move `sync.js` to `orchestration-tactics/`.
    - [ ] Update `orchestration-tactics/SKILL.md`.
- [ ] **Phase 4: Operations Enforcement**
    - [ ] Update `orchestration-operations/SKILL.md`.
- [ ] **Phase 5: Global Rule Refactor**
    - [ ] Update `GEMINI.md`.
    - [ ] Update `05-intelligence.md`.
    - [ ] Delete `skills/orchestrator/` directory.
- [ ] **Phase 6: Search & Replace**
    - [ ] Search for all remaining `orchestrator` references.
    - [ ] Update workflows (`00-boot`, `01-plan`, etc.).

## Verification
- Run `npm run audit:skills`.
- Verify turn metadata block consistency.
