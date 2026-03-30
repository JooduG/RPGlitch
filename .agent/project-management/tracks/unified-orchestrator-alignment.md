# Implementation Plan: Unified Orchestrator Alignment

Align the core orchestration skills with the **Unified Orchestrator Mode** research to ensure seamless role transitions, consistent thinking approaches, and complexity-based routing as defined in `GEMINI.md` and `orchestrator-mode-setup.md`.

## Proposed Changes

### 1. `orchestrator/SKILL.md` (The Hub)
- **Automatic Role Selection**: Explicitly define Level 1, 2, and 3 routing.
- **Mental State**: "I'll automatically choose the right role and approach for this task."
- **Workflow Transitions**: Define the chain (e.g., Level 3: Strategic → Tactical → Operational).
- **Communication Protocols**: Add documentation commands (📚 memory, 📚 docs, 📚 guide).

### 2. `orchestration-strategy/SKILL.md` (The Architect)
- **Thinking Approach**:🤔 **Contemplative Thinking** (using `waldzell-clear-thought`).
- **Mental State**: "What's our overall approach and how can we optimize it?"
- **Activated On**: Level 3 tasks and system meta-reflection.

### 3. `orchestration-tactics/SKILL.md` (The Planner)
- **Thinking Approach**: 🧠 **Sequential Thinking** (using `mcp-sequentialthinking-tools`).
- **Mental State**: "How do we execute this strategy for this specific app?"
- **Activated On**: Level 2-3 tasks, feature planning, and design decisions.

### 4. `orchestration-operations/SKILL.md` (The Maker)
- **Thinking Approach**: ⚡ **Professional Coding** (concise, production-ready).
- **Mental State**: "Let's get this done!" (Elite implementation).
- **Activated On**: All levels (the final execution step).

## Atomic Checklist

- [ ] **Phase 1: orchestrator/SKILL.md Update**
    - [ ] Update version to 1.2.0.
    - [ ] Inject Complexity-Based Routing table.
    - [ ] Add Documentation Command protocols.
- [ ] **Phase 2: orchestration-strategy/SKILL.md Update**
    - [ ] Update version to 1.3.0.
    - [ ] Mandate 🤔 Contemplative Thinking approach.
    - [ ] Add Level 3 activation context.
- [ ] **Phase 3: orchestration-tactics/SKILL.md Update**
    - [ ] Update version to 1.1.0.
    - [ ] Mandate 🧠 Sequential Thinking approach.
    - [ ] Add Level 2-3 activation context.
- [ ] **Phase 4: orchestration-operations/SKILL.md Update**
    - [ ] Update version to 1.2.0.
    - [ ] Mandate ⚡ Professional Coding approach.
    - [ ] Align mental state with "Elite Implementation".
- [ ] **Phase 5: Final Validation**
    - [ ] Run `npm run verify` to ensure no lint regressions in skill files (though they are markdown).
    - [ ] Update Mission Board.

## Verification
- Every skill must have a defined **Thinking Approach** emoji and label.
- Every skill must have a clear **Mental State** quote.
- The `orchestrator` must act as the primary router between them.
