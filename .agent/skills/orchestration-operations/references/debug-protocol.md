# 🛡️ Debug Protocol (Warden)

This protocol is triggered for **High-Risk** or persistent failures. It enforces a scientific approach to troubleshooting to prevent regression and cognitive drift.

---

## 🚀 1. Symptom & Environment

### **Raw Observation**
- **Error Message**: [Exact string or stack trace]
- **Behavior**: [What happened vs what was expected]
- **Context**: [Active Round/Turn, Entity state, UI component]

### **Reactive State (Runes)**
Compare the current `$state` values against the physical laws defined in Rule 03.
- `current_state`: [JSON or summary]
- `expected_state`: [JSON or summary]

---

## 🧪 2. Hypothesis Triage

Rank suspected causes by likelihood and impact.

| Rank | Hypothesis | Evidence For | Difficulty to Test |
| :--- | :--- | :--- | :--- |
| 1 | [Most Likely] | [Code snippet/Logic flaw] | [High/Mid/Low] |
| 2 | [Alternative] | [Edge case/Race condition] | [High/Mid/Low] |

---

## 🛠️ 3. Reproduction & Isolation

### **Minimal Reproduction Case**
- **Steps**:
    1. [Step 1]
    2. [Step 2]
- **Tool**: [Vitest / Playwright / Script]

---

## 🏁 4. Resolution & Post-Mortem

### **The Fix**
- **Changes**: [Link to files/diffs]
- **Verification**: [Command/Test output]

### **The Echo (Learning)**
- **What went wrong?**: [Root cause analysis]
- **Prevention**: [Update to `project-management/insights.md` or a new Rule]
- **Warden Sweep**: Run `metacognitiveMonitoring` to ensure the fix doesn't violate existing physics.

---

> "Logic is the only immunity."
