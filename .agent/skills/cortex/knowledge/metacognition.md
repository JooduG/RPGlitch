# Cortex: Metacognition Layer (Audit)

> **Goal**: Stop hallucination loops by checking your own reasoning process ("The Mirror").

## The Protocol: The Self-Audit

If you feel "Lost", "Confused", or have made 3+ tool calls without measurable progress: **STOP**.

1. **Assess Assumptions**: "Am I assuming something that isn't true? Did I misread a file?"
2. **Confidence Check**: Rate your confidence in the current path (0-100%).
3. **Reset**:
    - **If Confidence < 70%**: Re-run L2 Planning.
    - **If Confidence < 40%**: Use `notify_user` to ask for clarification.

## The Loop Breaker

Always check the output of previous tool calls before starting the next. If the error is repeating, do not repeat the command. Change your approach.
