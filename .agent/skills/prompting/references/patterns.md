# Prompt Engineering Patterns

Advanced prompt engineering techniques to maximize LLM performance, reliability, and controllability.

## Core Capabilities

### 1. Few-Shot Learning
Teach the model by showing examples instead of explaining rules. Include 2-5 input-output pairs that demonstrate the desired behavior. Use when you need consistent formatting, specific reasoning patterns, or handling of edge cases.

**Example:**

```markdown
Extract key information from support tickets:

Input: "My login doesn't work and I keep getting error 403"
Output: {"issue": "authentication", "error_code": "403", "priority": "high"}

Input: "Feature request: add dark mode to settings"
Output: {"issue": "feature_request", "error_code": null, "priority": "low"}

Now process: "Can't upload files larger than 10MB, getting timeout"
```

### 2. Chain-of-Thought (CoT)
Request step-by-step reasoning before the final answer. Add "Let's think step by step" (zero-shot) or include example reasoning traces (few-shot). Use for complex problems requiring multi-step logic.

**Example:**

```markdown
Analyze this bug report and determine root cause.

Think step by step:
1. What is the expected behavior?
2. What is the actual behavior?
3. What changed recently that could cause this?
4. What components are involved?
5. What is the most likely root cause?

Bug: "Users can't save drafts after the cache update deployed yesterday"
```

### 3. Prompt Optimization
Systematically improve prompts through testing and refinement.
- **V1 (Simple)**: "Summarize this article"
- **V2 (Constraints)**: "Summarize in 3 bullet points"
- **V3 (Reasoning)**: "Identify the 3 main findings, then summarize each"

### 4. Template Systems
Build reusable prompt structures with variables and modular components.

```python
# Reusable code review template
template = """
Review this {language} code for {focus_area}.

Code:
{code_block}

Provide feedback on:
{checklist}
"""
```

### 5. System Prompt Design
Set global behavior and constraints (role, expertise, format, safety) that persist across the conversation.

## Key Patterns

### Progressive Disclosure
Start simple, add complexity only when needed:
1. **Level 1**: Direct instruction ("Summarize this")
2. **Level 2**: Add constraints ("Summarize in 3 bullets")
3. **Level 3**: Add reasoning ("Identify findings, then summarize")
4. **Level 4**: Add examples (Few-shot)

### Instruction Hierarchy
`[System Context] → [Task Instruction] → [Examples] → [Input Data] → [Output Format]`

### Error Recovery
- Include fallback instructions
- Request confidence scores
- Ask for alternative interpretations
- Specify how to indicate missing info

## Best Practices
1. **Be Specific**: Vague prompts produce inconsistent results.
2. **Show, Don't Tell**: Examples are more effective than descriptions.
3. **Test Extensively**: Evaluate on diverse, representative inputs.
4. **Iterate Rapidly**: Small changes can have large impacts.

## Common Pitfalls
- **Over-engineering**: Starting complex too early.
- **Example pollution**: Irrelevant examples.
- **Context overflow**: Exceeding token limits.
- **Ambiguity**: Leaving room for multiple interpretations.
