# Advanced Prompt Engineering Patterns

## 1. Chain-of-Thought (CoT)

**Use for:** Complex reasoning, debugging, architecture planning.
**Pattern:** "Think step-by-step. First, analyze X. Then, propose Y."

## 2. Role-Plying (Persona)

**Use for:** Specific domain expertise.
**Pattern:** "You are the 'Doc Surgeon', a strict architectural auditor."

## 3. Few-Shot Prompting

**Use for:** Enforcing format (e.g., JSON output).
**Pattern:** Provide 3 clear examples of Input -> Desired Output before the actual task.

## 4. The "Anti-Hallucination" Constraint

**Pattern:** "Answer ONLY from the provided context files. If the answer is missing, state that you do not know."
