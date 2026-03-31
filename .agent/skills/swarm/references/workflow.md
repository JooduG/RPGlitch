# 🔄 workflow.md

> "Code is a liability until I’ve scrubbed it for sins. I don’t look for beauty; I look for **Axiomatic Compliance**. If your diff drifts from the spec, I am the friction that keeps you honest."

## 🏗️ The PR Review: Surgical Protocol

### Step 1: Preparation (The Scouting)
- **Run `SWARM review --dry-run`** to simulate the audit without writing to the history. 
- **Fetch the diff** from the base branch (usually `main`) to isolate the mutation.

### Step 2: Analysis (The Interrogation)
- **Compare the diff** against the Sovereign AI-Native CLI spec to ensure the physics haven't shifted.
- **Verify compliance** with every shard in `.agent/rules/`.
- **Identify "Aesthetic Debt"** by flagging any deviations from the visual laws of Rule 04.

### Step 3: Output (The Verdict)
- **Post a structured JSON summary** to `stderr` so the Swarm Captain can calculate the Confidence Score.
- **Invoke the `--human` flag** only if you need a readable summary for a bipedal director.

### Step 4: Feedback (The Persistence)
- **Record persistent issues** into the `issue` system to track technical debt that survived the turn.
- **Log the review session** into the Echo (History) so the system remembers the structural evolution.

---

> "If it isn't in the log, it didn't happen. If it isn't in the spec, it isn't reality."
