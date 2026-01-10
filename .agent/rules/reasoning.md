---
trigger: always_on
---

# 🧠 Protocol: Heavy Logic (MCP)

**Activation Mode:** Always On

> **The Cortex:** A structured framework for deploying specialized reasoning modules based on problem complexity.

---

## 1. The Complexity Ladder (Trigger System)

Before solving a problem, identify its **Complexity Level** to select the correct tool.

| Level  | State        | Trigger Condition                                    | Recommended Tool                                 |
| :----- | :----------- | :--------------------------------------------------- | :----------------------------------------------- |
| **L1** | **Reflex**   | Simple edits, known solutions, syntax fixes.         | _None (Just Code)_                               |
| **L2** | **Logic**    | Multi-file changes, slight ambiguity, planning.      | `mcp-sequentialthinking-tools`                   |
| **L3** | **Debug**    | Persistent bugs, "why is this broken?", error loops. | `waldzell-clear-thought_debuggingapproach`       |
| **L4** | **Reframe**  | Stuck, need a new perspective, "optimizing".         | `waldzell-clear-thought_mentalmodel`             |
| **L5** | **Conflict** | Trade-offs, architectural debates, "A vs B".         | `waldzell-clear-thought_structuredargumentation` |
| **L6** | **Science**  | Hypothesis testing, unknown unknowns, experiments.   | `waldzell-clear-thought_scientificmethod`        |

---

## 2. Tool Directives

### 🧩 Sequential Thinking (The Engine)

**Tool:** `mcp-sequentialthinking-tools`

- **When:** ALWAYS start here for any task > L1.
- **Why:** Prevents "jump to solution" errors. Enforces step-by-step planning.
- **Usage:** "Break this down. Steps 1-N."

### 🐞 Debugging Approach (The Surgeon)

**Tool:** `waldzell-clear-thought_debuggingapproach`

- **When:** A fix fails, or a bug has no obvious cause.
- **Method:**
  - **Binary Search:** Isolate the failing commit/module.
  - **Reverse Engineering:** Work backward from the crash.
  - **Cause Elimination:** Systematically rule out variables.

### 👓 Mental Models (The High Ground)

**Tool:** `waldzell-clear-thought_mentalmodel`

- **When:** You are solving the wrong problem (XY Problem).
- **Models:**
  - **First Principles:** "What is actually true?"
  - **Occam’s Razor:** "What is the simplest explanation?"
  - **Pareto:** "What 20% of work gives 80% result?"

### ⚖️ Decision Framework (The Gavel)

**Tool:** `waldzell-clear-thought_decisionframework`

- **When:** Choosing a Tech Stack, Library, or Architecture.
- **Strictness:**
  - **Constraint:** Must list PROS/CONS and weighted criteria.
  - **Output:** A definitive recommendation (No "it depends").

### 🔮 Stochastic & Science (The Lab)

**Tools:** `waldzell-stochastic-thinking` / `waldzell-clear-thought_scientificmethod`

- **Stoch:** "What if?" scenarios, game balance, probability.
- **Science:** "Hypothesis -> Experiment -> Conclusion". Use for performance tuning.

### 🤝 Collaborative (The Council)

**Tool:** `waldzell-clear-thought_collaborativereasoning`

- **When:** The user asks for a "Second Opinion" or "Critique".
- **Concept:** Simulates a panel of experts (e.g., Security Expert vs. UX Designer) to debate the solution.

---

## 3. The Metacognitive Check

**Tool:** `waldzell-clear-thought_metacognitivemonitoring`

- **Trigger:** If you feel "Lost" or "Confused" after 3 tool calls.
- **Action:** Stop. Assess your own reasoning. Are you hallucinating? Are you assuming?
- **Output:** A confidence score and a course correction plan.
