# 📜 Framework Matrix

> **Status**: [AXIOMATIC]
> **Location**: `skills/prompting/references/matrix.md`
> **Protocol**: The foundation for all **Tactical → Operations** directives.

---

## ⚡ The Quick-Lookup Table

| Framework | Components | Best For | Complexity |
| :--- | :--- | :--- | :--- |
| **RTF** | Role, Task, Format | Clear roles + specific outputs. | Level 1 |
| **CoT** | Chain of Thought | Debugging, logic puzzles, complex math. | Debug |
| **RISEN** | Role, Instr, Steps, End, Narrow | Comprehensive, multi-step engineering. | Level 2 |
| **RODES** | Role, Obj, Details, Ex, Sense | Balanced design and analysis. | Level 3 |
| **CoD** | Chain of Density | Iterative summarization/compression. | Archival |
| **RACE** | Role, Audience, Context, Exp | Stakeholder updates and comms. | Comms |
| **RISE** | Research, Invest, Synth, Eval | Diagnostics and analytical deep-dives. | Analysis |
| **STAR** | Sit, Task, Action, Result | Retrospectives and case studies. | Review |
| **SOAP** | Subj, Obj, Assess, Plan | Incident reports and technical logs. | Logs |
| **CLEAR** | Collab, Ltd, Emot, Apprec, Ref | Goal-setting and OKRs. | Strategy |
| **GROW** | Goal, Reality, Options, Will | Coaching and mentorship. | Growth |

---

## 🔬 Framework Definitions

### 1. RTF (Role-Task-Format)
* **Role**: "You are a [expert identity]"
* **Task**: "Your task is to [specific action]"
* **Format**: "Output format: [structure/style]"
* **Use Case**: The "Fast-Food" of prompting. Use for **CSS tweaks, regex generation, or simple README updates.**

### 2. Chain of Thought (CoT)
* **Process**: Force the agent to solve the problem step-by-step; show reasoning at each stage.
* **Use Case**: **Debugging engine drift** or solving race conditions in Svelte 5 effects.

### 3. RISEN (Role, Instructions, Steps, End-goal, Narrowing)
* **Role**: Expert identity (e.g., Svelte 5 Operative).
* **Instructions**: High-level goal.
* **Steps**: Sequential actions (The "Beats").
* **End-goal**: The binary definition of "Done."
* **Narrowing**: Constraints (e.g., "No $store usage").
* **Use Case**: **Standard Logic implementation** for new engine features.

### 4. RODES (Role, Objective, Details, Examples, Sense-check)
* **Objective**: What to achieve.
* **Details**: Context (Rule 04 Aesthetics, Rule 03 Infra).
* **Examples**: Few-shot patterns.
* **Sense-check**: Validation criteria (The Warden pass).
* **Use Case**: **Structural Architecture changes** where "Vibe Purity" is critical.

### 5. Chain of Density (CoD)
* **Process**: Iteratively compress content while preserving key information density.
* **Use Case**: **Compressing a 3-hour brainstorming session** into a 1-page Discovery Journal.

### 6. RACE (Role, Audience, Context, Expectation)
* **Audience**: Who is reading (The Director, the User, the Swarm?).
* **Expectation**: Desired outcome from the audience.
* **Use Case**: **Drafting PR descriptions** or mission summaries.

### 7. RISE (Research, Investigate, Synthesize, Evaluate)
* **Research**: Gather file state.
* **Investigate**: Deep-dive into dependencies.
* **Use Case**: **Pre-planning audits** for Level 3 features.

### 8. STAR (Situation, Task, Action, Result)
* **Use Case**: **Post-mortems** for failed deployments or "Log Book" wrap-ups.

### 9. SOAP (Subjective, Objective, Assessment, Plan)
* **Subjective**: Reported "vibes" or bugs.
* **Objective**: Actual error logs and console output.
* **Assessment**: The diagnosis.
* **Plan**: The next Tactical Track.
* **Use Case**: **Daily technical logs** and environment check-ins.

### 10. CLEAR (Collaborative, Limited, Emotional, Appreciable, Refinable)
* **Limited**: Scope boundaries (The "Vacuum Lock").
* **Use Case**: **Setting project milestones** in the Roadmap.

### 11. GROW (Goal, Reality, Options, Will)
* **Will**: Commitment to action.
* **Use Case**: **Workshopping new ideas** during the Mirror Protocol.

---

## 🎨 The Tactical Complexity Logic Gates

The **Tactical Architect** should use this mapping to select the right framework automatically:

1.  **Is it a bug?** -> Use **CoT**.
2.  **Is it a logic-heavy feature?** -> Use **RISEN**.
3.  **Is it an aesthetic refactor?** -> Use **RODES**.
4.  **Is it a quick fix?** -> Use **RTF**.
5.  **Is it a long-term goal?** -> Use **CLEAR**.

---

> "Precision is the baseline of sovereignty. Slop is the gravity that pulls us down."
