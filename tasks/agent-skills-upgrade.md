# Plan: Agent Skills Upgrade (The Rigor Update)

## Objective
Upgrade the local RPGlitch skills system by extracting the latest "agent rigor" and orchestration patterns from the `addyosmani/agent-skills` repository. This will improve how agents define success criteria, maintain codebase simplicity, design interfaces, coordinate parallel verification, and enforce global operating behaviors.

## Key Files & Context
- `.agent/skills/using-agent-skills/SKILL.md` (The Master Dispatcher)
- `.agent/skills/specification/SKILL.md`
- `.agent/skills/planning/SKILL.md`
- `.agent/skills/api-and-interface-design/SKILL.md` (New)
- `.agent/skills/quality/SKILL.md`
- `.agent/skills/governance/SKILL.md`
- `.agent/skills/delivery/SKILL.md`
- `.agent/skills/debugging-and-error-recovery/SKILL.md`

## Implementation Steps

### 1. Upgrade `using-agent-skills` (Global Agent Rigor)
- **Action**: Update `using-agent-skills/SKILL.md`.
- **Additions**:
  - Add **Core Operating Behaviors**: Surface Assumptions, Manage Confusion Actively, Push Back When Warranted (No yes-machining), Enforce Simplicity, Maintain Scope Discipline, and Verify. This sets the behavioral baseline for all sub-agents.

### 2. Upgrade `specification` (Discovery & Spec Rigor)
- **Action**: Update `specification/SKILL.md`.
- **Additions**:
  - **Success Criteria Reframing**: Force agents to translate vague requests into concrete, testable conditions (e.g., "Make it faster" -> "LCP < 2.5s").
  - Ensure the "Diverge -> Handshake -> Converge -> Spec" lifecycle remains central.

### 3. Upgrade `planning` (Implementation Discipline)
- **Action**: Update `planning/SKILL.md`.
- **Additions**:
  - **Rule 0: Simplicity First**: Forbid premature abstractions. Implement the naive, obviously-correct version first.
  - **Rule 0.5: Scope Discipline**: Touch only what the task requires. No "drive-by refactors".

### 4. Extract `api-and-interface-design` (Boundary Governance)
- **Action**: Create `.agent/skills/api-and-interface-design/SKILL.md` and clean up `governance/SKILL.md`.
- **Additions**:
  - Define **Hyrum's Law**: Every observable behavior is a contract.
  - **Contract-First Development**: Define types/interfaces before implementation.
  - **Boundary Validation**: Trust internal code, validate untrusted inputs at the edges.
- **Cleanup**: Remove interface-specific validation instructions from `governance` to keep it focused on ADRs and the Warden.

### 5. Upgrade `quality` (Simplification Framework)
- **Action**: Update `quality/SKILL.md`.
- **Additions**:
  - Integrate **Chesterton's Fence**: Understand why code exists before simplifying it.
  - Add specific Simplification Signals: Deep nesting, long functions, redundant flags.

### 6. Orchestration & Debugging Patterns
- **Action**: Update `delivery/SKILL.md` and `debugging-and-error-recovery/SKILL.md`.
- **Additions in `delivery`**: Formalize the `/ship` pattern (Parallel Fan-out with Merge) where delivery spawns parallel sub-agents (`code-reviewer`, `security-auditor`, `test-engineer`) for verification before finalizing. Note the difference from our `swarm` builder pattern.
- **Additions in `debugging`**: 
  - Add the **Stop-the-Line Rule** and the 6-step **Triage Checklist** (Reproduce, Localize, Reduce, Fix, Guard, Verify).
  - Document the "Competitive Hypothesis Debugging" pattern using Agent Teams to disprove competing theories for complex bugs.

## Verification & Testing
- Confirm all frontmatter (`name`, `description`) is correctly formatted across the modified and new skills.
- Verify that `GEMINI.md` still accurately reflects the updated skill ecosystem.
- Run `npm run audit` to ensure no Markdown linting or formatting errors were introduced in the `.agent/skills/` directory.