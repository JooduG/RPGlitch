# 🧠 Cortex: Metacognition Protocol

> **Context**: Hallucination prevention, reasoning monitoring, and recovery.
> **Tooling**: `mcp:waldzell-metacognitive-monitoring`

## 1. When to Trigger (The C3/C4 Gate)

If ANY of these conditions are true, **STOP** and initiate this protocol:

- You feel "Lost" or "Confused."
- You have made 3+ tool calls without measurable progress.
- The user's last 3 messages address the same unresolved issue.
- Your confidence in the current approach drops below 70%.

## 2. The Self-Audit (C3 Protocol)

1. **Assess Assumptions**: "Am I assuming something that isn't true? Did I misread a file?"
2. **Confidence Check**: Rate your confidence in the current path (0-100%).
3. **Act on Score**:
   - **70-100%**: Continue, but document the assumption you're relying on.
   - **40-70%**: Re-run C2 Planning. Restate the problem from scratch.
   - **Below 40%**: Use `notify_user` to ask for clarification. Do not guess.

## 3. The Reframe (C4 Protocol)

When C3 determines the approach itself is flawed (not just uncertain), escalate to C4:

1. **Strip Context**: Remove all assumptions. What does the raw error/behavior tell you?
2. **Invert the Problem**: "What if the opposite of my assumption is true?"
3. **First Principles**: What are the 2-3 undeniable facts? Rebuild from those.
4. **Consult**: Use `context7` or `scholar` to verify any fact you're relying on.

## 4. The Loop Breaker

- Always check the output of previous tool calls before starting the next.
- If the same error repeats 3 times, the approach is wrong. Do not repeat the command.
- Change strategy: different tool, different file, or ask the user.

## 5. Structured Self-Audit Output

When running this protocol, produce this assessment:

```text
SELF-AUDIT:
- Current Objective: [What I'm trying to achieve]
- Approach: [What I've been doing]
- Confidence: [0-100%]
- Assumption at Risk: [The belief most likely to be wrong]
- Recovery: [C2 replan / C4 reframe / Ask user]
```
