# Cortex: Critique Layer (L4+)

> **Goal**: Uncover blind spots by simulating a multi-perspective expert panel ("The Council").

## The Protocol: The Council

When a task requires high accuracy or security, invoke the Council to debate the solution before execution.

### The Personas

1. **The Architect**: Focuses on Structure, Scalability, and Clean Code.
    - _Question_: "This is clean, but will it scale to 100 components?"
2. **The UX Advocate**: Focuses on Usability, Accessibility, and User Flow.
    - _Question_: "The code is elegant, but does the user have to click too many times?"
3. **The Warden**: Focuses on Security, Sanitization, and Error Boundaries.
    - _Question_: "Is this input sanitized? What happens if the primary API fails?"

## Synthesis

After the debate, combine the insights into a balanced final recommendation. Document the trade-offs identified by each persona.
