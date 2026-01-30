# Cortex Workflow: Reasoning Protocols

> **Context:** Structured framework for deploying specialized reasoning modules.

## 1. The Complexity Ladder (Trigger System)

Before solving a problem, identify its **Complexity Level** to select the correct tool.

| Level  | State        | Trigger Condition                                    | Recommended Tool          |
| :----- | :----------- | :--------------------------------------------------- | :------------------------ |
| **L1** | **Reflex**   | Simple edits, known solutions, syntax fixes.         | _None (Just Code)_        |
| **L2** | **Logic**    | Multi-file changes, slight ambiguity, planning.      | `sequentialthinking`      |
| **L3** | **Debug**    | Persistent bugs, "why is this broken?", error loops. | `debuggingapproach`       |
| **L4** | **Reframe**  | Stuck, need a new perspective, "optimizing".         | `mentalmodel`             |
| **L5** | **Conflict** | Trade-offs, architectural debates, "A vs B".         | `structuredargumentation` |
| **L6** | **Science**  | Hypothesis testing, unknown unknowns.                | `scientificmethod`        |

## 2. Tool Directives & Protocols

### 🧩 Sequential Thinking (The Engine)

**Tool:** `sequentialthinking`

- **When:** ALWAYS start here for any task > L1.
- **Why:** Prevents "jump to solution" errors. Enforces step-by-step planning.
- **Usage:** "Break this down. Steps 1-N."

### 🐞 Debugging Approach (The Surgeon)

**Tool:** `debuggingapproach`

- **When:** A fix fails, or a bug has no obvious cause.
- **Method:**
    - **Binary Search:** Isolate the failing commit/module.
    - **Reverse Engineering:** Work backward from the crash.
    - **Cause Elimination:** Systematically rule out variables.

### 👓 Mental Models (The High Ground)

**Tool:** `mentalmodel`

- **When:** You are solving the wrong problem (XY Problem).
- **Models:**
    - **First Principles:** Deconstruct to basic truths. Ignore "best practices" if they conflict with reality.
    - **Occam’s Razor:** The simplest explanation is usually right. Check for typos before race conditions.
    - **Pareto (80/20):** Focus on the 20% of code causing 80% of the friction.
    - **Second-Order Thinking:** Ask "And then what?". Consider side effects on other pillars.

### ⚖️ Decision Framework (The Gavel)

**Tool:** `decisionframework`

- **When:** Choosing a Tech Stack, Library, or Architecture.
- **Strictness:**
    - **Hard Constraints:** List "Must-Haves" (e.g., Svelte 5 Compliance).
    - **Pros/Cons:** Be brutal and honest.
    - **Verdict:** Make a definitive choice. No "it depends".

### 🔮 Stochastic & Science (The Lab)

**Tools:** `stochasticalgorithm` / `scientificmethod`

- **Experiment Protocol (L6):**
    1. **Observation:** State the anomaly.
    2. **Hypothesis:** "If I change [A], [B] will happen."
    3. **Execution:** Run the experiment.
    4. **Validation:** Did result match prediction?
- **Simulation Mode:** Force failures mentally to trace outcomes through pillars.

### 🤝 Collaborative (The Council)

**Tool:** `collaborativereasoning`

- **When:** New features affecting multiple pillars, breaking changes, or security-critical components.
- **Personas:**
    - **Artificer:** Structure & Scalability.
    - **Mesmer:** UX & Vibe.
    - **Warden:** Security & Sanitization.
    - **Scholar:** Data Integrity.
    - **Gamemaster:** Logic Flow.
- **Protocol:** Thesis -> Antithesis (Critique) -> Synthesis (Trade-offs).

## 3. The Metacognitive Check

**Tool:** `metacognitivemonitoring` (See [Metacognition](./metacognition.md))