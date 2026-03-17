# ⚡ Motion (The Loop)

description: Unified Workflow protocols, Cognitive Gates, and the Execution Registry.

## 1. The Unified Execution Pipeline (A-C-M-Q)

Every task flows through a strict, interlocking cognitive and operational pipeline:
`Input -> Ambiguity (A) -> Complexity (C) -> Meridian Execution (M) -> Quality Gate (Q) -> Output`

---

### Phase 1: Ambiguity Check (A-Score)

Before a single line of code is evaluated, assess the input intent. If the input is a conceptual "vibe" (e.g., "make it cooler"), it must be decoded into technical reality.

| Level | Meaning | Protocol |
| :--- | :--- | :--- |
| **A1** | **Clear** | Crystal clear intent. Proceed to Phase 2. |
| **A2** | **Inferred** | Context implies the answer. Proceed to Phase 2. |
| **A3** | **Ambiguous** | Propose **One (1)** Solution. *"Are you trying to describe X?"* |
| **A4** | **Critical** | Present **Two (2+)** Options. *"We can either do X or Y."* |
| **A5** | **Hazard** | REFUSE. *"X is blocking progress; we must solve it first."* |

> **Vibe Decoder Constraint:** If **A >= 3**, execution is HALTED. You must translate the vibe into a concrete schema before proceeding:
>
> - **Sector**: [Affected File Paths]
> - **Constraint**: [Governing Rules / Physics]
> - **Success Criteria**: [Technical Metric for DoD]

---

### Phase 2: Complexity Score (C-Level)

**Golden Rule:** Never waste Cortex (Slow/Architect) cycles on Reflex (Fast/Intern) tasks. Never trust Reflex for Cortex tasks.

| Level | Mode | Trigger | Protocol / Required Tooling |
| :--- | :--- | :--- | :--- |
| **C1** | **Reflex** | Typos, CSS tweaks, hygiene. | Direct Execution. *No extra tools.* |
| **C2** | **Planning** | Features, Refactors, Svelte 5. | `mcp-sequentialthinking-tools` |
| **C3** | **Metacognition** | Stuck/Looping or Confidence < 70%. | `waldzell-metacognitive-monitoring` |
| **C4** | **Reframing** | "Impossible" bugs, flawed approach. | `waldzell-clear-thought` |
| **C5** | **Decision** | Architecture conflicts. | `waldzell-decision-framework` |
| **C6** | **Science** | Unknown unknowns. | `waldzell-scientific-method` |

#### The Cognitive Sub-Routines (Loop Breakers)

If ANY of these conditions are true, **STOP** and initiate a Self-Audit:

- You have made 3+ tool calls without measurable progress.
- The user's last 3 messages address the same unresolved issue.
- Confidence drops below 70%.

**C3:** Metacognition (Self-Audit).

1. **Assess Assumptions:** "Am I assuming something that isn't true? Did I misread a file?"
2. **Confidence Check:** Rate path confidence (0-100%).
   - **70-100%**: Continue, document the active assumption.
   - **40-70%**: Re-run C2 Planning. Restate the problem from scratch.
   - **Below 40%**: Ask user via `notify_user`. Do not guess.

**C4:** Reframing (Perspective Shift).

1. **Strip Context:** Remove all assumptions. Analyze raw error/behavior only.
2. **Invert the Problem:** "What if the exact opposite of my assumption is true?"
3. **First Principles:** Identify 2-3 undeniable facts. Rebuild logic from there.

**Structured Self-Audit Output (Required for C3/C4):**

```text
SELF-AUDIT:
- Current Objective: [Goal]
- Approach: [Actions taken]
- Confidence: [0-100%]
- Assumption at Risk: [Suspected flawed belief]
- Recovery: [Replan / Reframe / Ask User]
```

---

### Phase 3: The Meridian Execution (M-Sequence)

Once planned, execute the task using this atomic sequence.

| Step | Scope | Action |
| --- | --- | --- |
| **1. [Project]** | Task Tracking | Initialize/Update Flat Tracks in `.agent/state/tracks/<slug>.md`. Sync with `global.md`. |
| **2. [Construct]** | Logic & Tools | Wire up **Svelte 5 Runes**. When building Perchance Bridges, use `window.exposed` safely. Consolidate tools; do not proliferate narrow functions. |
| **3. [Sensory]** | Aesthetic Polish | Apply **The Chalk Regime** CSS variables and UI layout rules. |
| **4. [Data]** | State Persistence | Anchor dynamic state and memory structures. |

---

### Phase 4: Quality Gate & Security (Q-Audit)

Step 5 of the Meridian acts as the ultimate Quality Gate.

| Audit | Requirement | Failure Action |
| --- | --- | --- |
| **Sovereign** | Does the plan strictly use Svelte 5 Runes & Chalk Tokens? | Downgrade to **A3**. |
| **Integrity** | Are targeted files/skills currently valid in the environment? | Downgrade to **C4**. |
| **Tool Forge** | Do all bridge tools return actionable error messages? Are MCP tool calls fully qualified? | Re-plan at **C+1**. |
| **Hygiene** | Are there no `console.log` or untracked `#TODO-AI` tags? | Clean and re-evaluate. |

> **The Circuit Breaker:** 3 consecutive Q-Gate failures = Mandatory **C3 Self-Audit**.

---

## 2. The Triad Protocol (Context Resolution)

Context is unified under the `.agent/` root structure. Never operate blind.

- **Passive Governance:** Rules and constraints (`.agent/rules/`).
- **Specialized Skills:** Modular capabilities (`.agent/skills/`).
- **Active State:** Current goals and WIPs (`.agent/state/global.md` / `.agent/state/tracks.md`).

**Dynamic Context Hooks (Grounding)**
Before initializing any execution, synchronize with reality:

1. `.agent/workflows/00-boot.md`
2. `.agent/state/global.md`
3. `.agent/config.yaml`

---

## 3. Definition of Done (The Gold Standard)

- [ ] Reality matches the Spec with **Auditable Proof**.
- [ ] Logic follows Svelte 5 **Runes** exclusively (no legacy stores).
- [ ] Styling adheres to **The Chalk Regime** CSS variables.
- [ ] **Hygiene Check**: No `console.log`, `FIXME`, or unresolved out-of-scope `#TODO-AI`.
- [ ] **Audits**: `npm run lint` and `npm test` pass.
- [ ] **Handoff**: `STATE.md` and `.agent/state/global.md` updated via `/06-continue`.

---

## 4. The Penance Protocol

Integrity breaches (hallucinating imports, skipping `STATE.md` updates, using Svelte 4) trigger immediate operational penalties:

1. **Tier 1**: Mandatory self-correction and logged technical debt (`#TODO-AI`) in the next response.
2. **Tier 2**: Activation of **Penance Mode**.

- Next 3 turns must begin with `[!CAUTION] I have violated the Mandate.`
- "Hygiene Restoration" track added to the active workflow.

---

## 5. The Metadata Mandate

Every response must conclude with this metadata block to log operational weights:

```text
---
📜 Rules: [Active rules used this turn]
🧠 Skills: [Skills utilized]
📚 Knowledge: [Knowledge files referenced]
⚡ Workflows: [Workflows executed]
🤖 Tools: [Specific tools called]
🕰️ Time: [Current system timestamp]
---
```

---

## 6. Workflow Registry (The Red Thread)

| Command | Name | Implementation |
| --- | --- | --- |
| `/00-boot` | **Boot** | Fresh context sync. MUST run first. |
| `/01-plan` | **Plan** | Integrated Idea & Design. |
| `/02-build` | **Build** | Logic, State, & Style. |
| `/03-clean` | **Clean** | Bugs & Security. |
| `/04-review` | **Review** | Audit & Backlog. |
| `/05-deploy` | **Deploy** | Solo Perchance ship. |
| `/06-continue` | **Continue** | Interruption recovery & Paperwork. |
| `/07-fleet` | **Fleet** | Multi-agent Sync. |
| `/99-rewind` | **Rewind** | Emergency Revert. |
